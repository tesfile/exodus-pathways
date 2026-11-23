"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

const idRe=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const dateRe=/^\d{4}-\d{2}-\d{2}$/;
type Line={
  workerId:string;regularHours:number;hourlyRate:number;overtimeHours:number;
  vacationPay:number;statHolidayPay:number;memo:string;paymentMethod:string;
};
const inRange=(n:number,limit:number)=>Number.isFinite(n)&&n>=0&&n<=limit;
function dateOk(value:string){
 return dateRe.test(value)&&!isNaN(Date.parse(value+"T00:00:00Z"))&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
}
export async function saveDraftPayroll(form:FormData) {
 await requireRole(["admin"]);
 const clientId=String(form.get("client_id")??"");
 const companyId=String(form.get("company_id")??"");
 const periodStart=String(form.get("period_start")??"");
 const periodEnd=String(form.get("period_end")??"");
 const payDate=String(form.get("pay_date")??"");
 const frequency=String(form.get("frequency")??"");
 const draftId=String(form.get("draft_id")??"");
 if(!idRe.test(clientId)||!idRe.test(companyId)||!dateOk(periodStart)||!dateOk(periodEnd)||!dateOk(payDate)||
   periodStart>periodEnd||payDate<periodEnd||!["weekly","biweekly","semimonthly","monthly"].includes(frequency)) throw new Error("Invalid payroll draft dates.");
 let lines:Line[];
 try {lines=JSON.parse(String(form.get("lines")??"[]")) as Line[];} catch {throw new Error("Malformed payroll draft.");}
 if(!Array.isArray(lines)||lines.length<1||lines.length>200||new Set(lines.map(l=>l.workerId)).size!==lines.length) throw new Error("Invalid payroll draft employees.");
 if(lines.some(l=>!l||typeof l!=="object"||!idRe.test(l.workerId)||![l.regularHours,l.hourlyRate,l.overtimeHours,l.vacationPay,l.statHolidayPay].every(Number.isFinite)||
    !inRange(l.regularHours,1000)||!inRange(l.hourlyRate,100000)||!inRange(l.overtimeHours,1000)||!inRange(l.vacationPay,1000000)||!inRange(l.statHolidayPay,1000000)||
    !["paper_cheque","manual_bank_transfer","external_direct_deposit"].includes(l.paymentMethod)||typeof l.memo!=="string"||l.memo.length>500)) throw new Error("Invalid draft pay entries.");
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key) throw new Error("Payroll server database is not configured.");
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:company,error:companyError}=await db.from("companies").select("id").eq("id",companyId).eq("client_id",clientId).maybeSingle();
 if(companyError||!company) throw new Error("Company not found.");
 const {data:workers,error:workersError}=await db.from("workers").select("id,worker_type").eq("client_id",clientId).eq("company_id",companyId).in("id",lines.length?lines.map(l=>l.workerId):["00000000-0000-0000-0000-000000000000"]);
 if(workersError||(workers??[]).length!==lines.length||(workers??[]).some(w=>!/employee/i.test(w.worker_type))) throw new Error("One or more employees do not belong to this company.");
 const {data:profiles,error:profilesError}=await db.from("kal_payroll_employee_profiles")
 .select("worker_id,employment_status,hire_date,termination_date,contract_end_date,pay_frequency,birth_date,pay_type,hourly_rate,salary_amount").eq("client_id",clientId).in("worker_id",lines.length?lines.map(l=>l.workerId):["00000000-0000-0000-0000-000000000000"]);
 if(profilesError) throw new Error("Employee pay profiles are unavailable.");
 const map=new Map((profiles??[]).map(p=>[p.worker_id,p]));
 for(const line of lines){
  const profile=map.get(line.workerId);
  if(!profile||profile.employment_status!=="Active"||
    profile.pay_frequency!==frequency||!profile.birth_date||
    (profile.pay_type==="hourly"&&!(Number(profile.hourly_rate)>0))||
    (profile.pay_type==="salary"&&!(Number(profile.salary_amount)>0))||
    profile.pay_type==="commission"||
    (profile.hire_date&&profile.hire_date>periodStart)||
    (profile.termination_date&&profile.termination_date<periodStart)||
    (profile.contract_end_date&&profile.contract_end_date<periodStart)) throw new Error("An employee has a different pay schedule or incomplete payroll setup. Review employee profiles before saving.");
 }
 const runQuery=db.from("kal_payroll_draft_runs").select("id,status,period_start,period_end,pay_date,frequency").eq("client_id",clientId).eq("company_id",companyId);
 const {data:existing,error:existingError}=await (draftId&&idRe.test(draftId)?runQuery.eq("id",draftId):runQuery.eq("period_start",periodStart).eq("period_end",periodEnd)).maybeSingle();
 if(existingError) throw new Error("Unable to read payroll draft.");
 if(existing && (existing.status!=="draft" || existing.period_start!==periodStart ||existing.period_end!==periodEnd ||existing.pay_date!==payDate ||existing.frequency!==frequency)) throw new Error("This payroll run is no longer editable or the dates differ from the saved schedule.");
 let runId=existing?.id;
 if(!runId){
  const {data:created,error:createError}=await db.from("kal_payroll_draft_runs").insert({
    client_id:clientId,company_id:companyId,period_start:periodStart,period_end:periodEnd,pay_date:payDate,frequency,
    status:"draft",auto_generated:false
  }).select("id").single();
  if(createError||!created) throw new Error("Unable to create payroll draft.");
  runId=created.id;
 }
 const {data:oldLines,error:oldError}=await db.from("kal_payroll_draft_lines").select("worker_id")
   .eq("run_id",runId).eq("client_id",clientId);
 if(oldError)throw new Error("Unable to read saved payroll entries.");
 const workerIds=new Set(lines.map(l=>l.workerId));
 const removed=(oldLines??[]).filter(l=>!workerIds.has(l.worker_id)).map(l=>l.worker_id);
 if(removed.length){
  const {error:deleteError}=await db.from("kal_payroll_draft_lines").delete().eq("run_id",runId).eq("client_id",clientId).in("worker_id",removed);
  if(deleteError)throw new Error("Unable to remove unchecked payroll entries.");
 }
 if(lines.length){
  const payload=lines.map(l=>({
    run_id:runId,client_id:clientId,worker_id:l.workerId,
    regular_hours:l.regularHours,hourly_rate:l.hourlyRate,overtime_hours:l.overtimeHours,
    vacation_pay:l.vacationPay,stat_holiday_pay:l.statHolidayPay,memo:l.memo.trim(),payment_method:l.paymentMethod,
    updated_at:new Date().toISOString()
  }));
  const {error:saveError}=await db.from("kal_payroll_draft_lines").upsert(payload,{onConflict:"run_id,worker_id"});
  if(saveError)throw new Error("Unable to save employee payroll draft lines.");
 }
 const destination="/admin/clients/"+encodeURIComponent(clientId)+"/payroll/run?companyId="+encodeURIComponent(companyId)+"&year="+payDate.slice(0,4)+"&draftId="+encodeURIComponent(runId);
 revalidatePath("/admin/clients/"+clientId+"/payroll/run");
 redirect(destination+"&saved=1");
}
