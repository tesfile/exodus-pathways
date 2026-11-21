"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i;

export async function saveChequeNumber(form:FormData){
 await requireRole(["admin"]);
 const clientId=String(form.get("client_id")??"");
 const paymentId=String(form.get("payment_id")??"");
 const number=String(form.get("cheque_number")??"").trim().slice(0,30);
 const year=String(form.get("year")??"");
 const companyId=String(form.get("company_id")??"");
 if(!uuid.test(clientId)||!uuid.test(paymentId)||!uuid.test(companyId)||!/^[\w/-]{0,30}$/.test(number)||!/^20\d{2}$/.test(year))
  throw new Error("Invalid cheque number or payroll reference.");
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw new Error("Payroll database is not configured.");
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.from("worker_payments")
  .update({cheque_number:number||null,updated_at:new Date().toISOString()})
  .eq("client_id",clientId).eq("company_id",companyId).eq("id",paymentId)
  .select("id").maybeSingle();
 if(error||!data)throw new Error("Could not save the cheque reference.");
 const base="/admin/clients/"+encodeURIComponent(clientId)+"/payroll/paycheques";
 revalidatePath(base);
 redirect(base+"?companyId="+encodeURIComponent(companyId)+"&year="+year+"&saved=1");
}
