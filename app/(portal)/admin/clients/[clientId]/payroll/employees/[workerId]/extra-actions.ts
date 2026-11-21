"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const str = (form: FormData, key: string, max=200) => String(form.get(key) ?? "").trim().slice(0,max);
const validDate = (value:string) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(new Date(value+"T00:00:00Z").valueOf()) && new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value);

function database() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SECRET_KEY;
  if(!url || !key) throw new Error("Server payroll database configuration is missing.");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function context(form:FormData) {
  await requireRole(["admin"]);
  const clientId=str(form,"client_id",40), workerId=str(form,"worker_id",40), year=str(form,"year",4);
  if(!uuid.test(clientId) || !uuid.test(workerId)) throw new Error("Invalid payroll employee reference.");
  const db=database();
  const {data:worker,error}=await db.from("workers").select("id").eq("client_id",clientId).eq("id",workerId).ilike("worker_type","%employee%").maybeSingle();
  if(error || !worker) throw new Error("Employee does not belong to the selected client.");
  const base="/admin/clients/"+encodeURIComponent(clientId)+"/payroll/employees/"+encodeURIComponent(workerId)+"?year="+(/^20\d{2}$/.test(year)?year:new Date().getFullYear());
  return {db, clientId, workerId, base};
}
export async function saveTaxAndPayment(form:FormData) {
  const {db,clientId,workerId,base}=await context(form);
  const federal=str(form,"td1_federal_claim",20), provincial=str(form,"td1_provincial_claim",20), extra=str(form,"additional_income_tax",20);
  const method=str(form,"payment_method",30);
  const allowed=new Set(["paper_cheque","manual_bank_transfer","external_direct_deposit"]);
  if(!allowed.has(method)) redirect(base+"&error=invalid_payment#tax-withholdings");
  const amounts=[federal,provincial,extra].map(v=>v?Number(v):null);
  if(amounts.some(v=>v!==null && (!Number.isFinite(v)||v<0||v>1000000))) redirect(base+"&error=invalid_tax#tax-withholdings");
  const {data,error}=await db.from("kal_payroll_employee_profiles").update({
    td1_federal_claim:amounts[0],td1_provincial_claim:amounts[1],additional_income_tax:amounts[2]??0,
    cpp_exempt:form.get("cpp_exempt")==="on",ei_exempt:form.get("ei_exempt")==="on",
    payment_method:method,federal_income_tax_exempt:form.get("federal_income_tax_exempt")==="on",updated_at:new Date().toISOString()
  }).eq("client_id",clientId).eq("worker_id",workerId).select("worker_id").maybeSingle();
  if(error||!data) throw new Error("Unable to save employee tax and payment preferences.");
  revalidatePath(base.split("?")[0]);
  redirect(base+"&taxSaved=1#tax-withholdings");
}
const itemTypes:Record<string,Set<string>>={
 additional_pay:new Set(["stat_holiday","vacation","bonus","commission","overtime_adjustment","taxable_benefit","reimbursement","other_pay"]),
 deduction:new Set(["health_insurance","rrsp","union_dues","loan_repayment","garnishment","other_deduction"]),
 contribution:new Set(["employer_rrsp","health_benefit","pension","other_contribution"])
};
export async function addPayrollItem(form:FormData) {
  const {db,clientId,workerId,base}=await context(form);
  const kind=str(form,"kind",30), type=str(form,"item_type",40), name=str(form,"item_name",100);
  const calculation=str(form,"calculation",30), amount=Number(str(form,"amount",30));
  const effective=str(form,"effective_date",10), end=str(form,"end_date",10);
  if(!itemTypes[kind]?.has(type) || !["amount","percent"].includes(calculation) ||
     !name || !Number.isFinite(amount) || amount<0 || amount>1000000 ||
     (calculation==="percent" && amount>100) || !validDate(effective)||!validDate(end)||(effective&&end&&end<effective))
     redirect(base+"&error=invalid_item#payroll-items");
  const {error}=await db.from("kal_payroll_employee_items").insert({
    client_id:clientId,worker_id:workerId,kind,item_type:type,item_name:name,calculation,amount,
    effective_date:effective||null,end_date:end||null,active:true
  });
  if(error) throw new Error("Unable to save payroll item.");
  revalidatePath(base.split("?")[0]);
  redirect(base+"&itemSaved=1#payroll-items");
}
export async function togglePayrollItem(form:FormData) {
  const {db,clientId,workerId,base}=await context(form);
  const id=str(form,"item_id",40), active=str(form,"active",6)==="true";
  if(!uuid.test(id)) throw new Error("Invalid payroll item.");
  const {data,error}=await db.from("kal_payroll_employee_items")
     .update({active,updated_at:new Date().toISOString()})
     .eq("id",id).eq("worker_id",workerId).eq("client_id",clientId).select("id").maybeSingle();
  if(error||!data) throw new Error("Unable to change the payroll item.");
  revalidatePath(base.split("?")[0]);
  redirect(base+"&itemSaved=1#payroll-items");
}
