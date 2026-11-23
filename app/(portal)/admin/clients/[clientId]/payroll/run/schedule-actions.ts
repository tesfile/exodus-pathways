"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

const uuid=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const frequencies=new Set(["weekly","biweekly","semimonthly","monthly"]);

/**
 * Explicitly assign selected existing employees to the saved company schedule.
 * No birthdates, wages, historical pay, bank details or tax settings are changed.
 * This action is only reached after the administrator confirms the change in UI.
 */
export async function assignEmployeesToCompanySchedule(form:FormData){
 await requireRole(["admin"]);
 const clientId=String(form.get("client_id")??"");
 const companyId=String(form.get("company_id")??"");
 const year=String(form.get("year")??"2026");
 const raw=String(form.get("worker_ids")??"");
 if(!uuid.test(clientId)||!uuid.test(companyId)||!/^20\d{2}$/.test(year))
  throw new Error("Invalid payroll company selection.");
 let ids:unknown;
 try {ids=JSON.parse(raw);} catch {throw new Error("Invalid employee selection.");}
 if(!Array.isArray(ids)||ids.length<1||ids.length>100||
  ids.some(id=>typeof id!=="string"||!uuid.test(id))||
  new Set(ids).size!==ids.length)throw new Error("Invalid employees for schedule update.");
 const workerIds=ids as string[];
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY;
 if(!url||!secret)throw new Error("Payroll database is not configured.");
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const [{data:company,error:companyError},{data:settings,error:settingsError},{data:workers,error:workerError},
   {data:profiles,error:profileError}]=await Promise.all([
  db.from("companies").select("id").eq("client_id",clientId).eq("id",companyId).maybeSingle(),
  db.from("kal_company_payroll_settings")
   .select("default_pay_frequency,schedule_name,next_period_end,next_pay_date")
   .eq("client_id",clientId).eq("company_id",companyId).maybeSingle(),
  db.from("workers").select("id,worker_type").eq("client_id",clientId).eq("company_id",companyId).in("id",workerIds),
  db.from("kal_payroll_employee_profiles")
   .select("worker_id,employment_status").eq("client_id",clientId).in("worker_id",workerIds)
 ]);
 if(companyError||!company||settingsError||!settings||!frequencies.has(settings.default_pay_frequency))
  throw new Error("Save a company pay schedule before assigning employees.");
 if(workerError||(workers??[]).length!==workerIds.length||
  (workers??[]).some(worker=>!/employee/i.test(worker.worker_type)))
  throw new Error("One or more employees are not in this company.");
 if(profileError||(profiles??[]).length!==workerIds.length||
  (profiles??[]).some(profile=>profile.employment_status!=="Active"))
  throw new Error("Only active employees with an existing payroll profile can be moved to this schedule.");
 const {data:updated,error:updateError}=await db.from("kal_payroll_employee_profiles")
  .update({
   pay_frequency:settings.default_pay_frequency,
   schedule_name:settings.schedule_name??"Regular payroll",
   next_period_end:settings.next_period_end,
   next_pay_date:settings.next_pay_date
  })
  .eq("client_id",clientId).in("worker_id",workerIds)
  .select("worker_id");
 if(updateError||(updated??[]).length!==workerIds.length)
  throw new Error("Unable to update every employee pay schedule. Review employee profiles.");
 revalidatePath("/admin/clients/"+clientId+"/payroll/run");
 revalidatePath("/admin/clients/"+clientId+"/payroll");
 redirect("/admin/clients/"+encodeURIComponent(clientId)+"/payroll/run?companyId="+encodeURIComponent(companyId)+"&year="+year+"&scheduleUpdated=1");
}
