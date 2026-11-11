"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

export async function postClientBookkeepingEntry(form: FormData) {
  await requireRole(["admin"]);
  const clientId = String(form.get("clientId") || "");
  const sourceId = String(form.get("sourceId") || "");
  const kind = String(form.get("kind") || "");
  const settlement = String(form.get("settlement") || "");
  const year = Number(form.get("taxYear"));
  const gstVerified = form.get("gstVerified") === "yes";
  if (!/^[0-9a-f-]{36}$/i.test(clientId) || !/^[0-9a-f-]{36}$/i.test(sourceId) || !["income","expense"].includes(kind) || !["bank","cash","unpaid"].includes(settlement) || !Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("Invalid posting request.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Server-only accounting database key is not configured.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: client, error: clientError } = await db.from("users").select("id").eq("id",clientId).eq("role","client").maybeSingle();
  if (clientError || !client) throw new Error("Client not found.");
  const table = kind === "income" ? "income_entries" : "expense_entries";
  const { data: source, error: sourceError } = await db.from(table).select("id,tax_year,status").eq("id",sourceId).eq("client_id",clientId).eq("tax_year",year).maybeSingle();
  if (sourceError) throw new Error("Could not verify entry: " + sourceError.message);
  if (!source) throw new Error("Entry does not belong to this client and year.");
  if (source.status !== "draft") throw new Error("This entry has already been posted or is not a draft.");
  const { error } = await db.rpc("kal_post_bookkeeping_entry", {
    p_client:clientId,p_kind:kind,p_source:sourceId,p_settlement:settlement,p_gst_verified:gstVerified
  });
  if (error) throw new Error("Could not post entry: " + error.message);
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/clients/${clientId}?year=${year}&tab=bookkeeping&bookkeepingNotice=posted#bookkeeping-entry`);
}

async function authorizedDb(clientId: string) {
  await requireRole(["admin"]);
  if (!/^[0-9a-f-]{36}$/i.test(clientId)) throw new Error("Invalid client.");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY;
  if(!url||!secret) throw new Error("Accounting server credentials missing.");
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:client,error}=await db.from("users").select("id").eq("id",clientId).eq("role","client").maybeSingle();
  if(error||!client) throw new Error("Client not found.");
  return db;
}
export async function voidUnpostedBookkeepingEntry(form: FormData) {
  const clientId=String(form.get("clientId")||"");
  const sourceId=String(form.get("sourceId")||"");
  const kind=String(form.get("kind")||"");
  const year=Number(form.get("taxYear"));
  if(!/^[0-9a-f-]{36}$/i.test(sourceId)||!["income","expense"].includes(kind)||!Number.isInteger(year)) throw new Error("Invalid entry.");
  const db=await authorizedDb(clientId);
  const table=kind==="income"?"income_entries":"expense_entries";
  const {data:entry,error:checkError}=await db.from(table).select("id").eq("id",sourceId).eq("client_id",clientId).eq("tax_year",year).eq("status","draft").maybeSingle();
  if(checkError||!entry) throw new Error("Only an unposted entry belonging to this client can be removed.");
  const {error}=await db.rpc("kal_void_unposted_entry",{p_client:clientId,p_kind:kind,p_source:sourceId});
  if(error) throw new Error("Could not remove entry: "+error.message);
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/clients/${clientId}?tab=bookkeeping&year=${year}&bookkeepingNotice=voided#bookkeeping-posting`);
}
export async function postClientPayroll(form: FormData) {
  const clientId=String(form.get("clientId")||"");
  const paymentId=String(form.get("paymentId")||"");
  const year=Number(form.get("taxYear"));
  if(!/^[0-9a-f-]{36}$/i.test(paymentId)||!Number.isInteger(year)) throw new Error("Invalid payroll payment.");
  const db=await authorizedDb(clientId);
  const {data:payment,error:checkError}=await db.from("worker_payments").select("id").eq("id",paymentId).eq("client_id",clientId).eq("tax_year",year).eq("admin_classification","T4 Employee").maybeSingle();
  if(checkError||!payment) throw new Error("Payroll does not belong to this client and year.");
  const {error}=await db.rpc("kal_post_payroll",{p_client:clientId,p_payment:paymentId});
  if(error) throw new Error("Could not post payroll: "+error.message);
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/clients/${clientId}?tab=bookkeeping&year=${year}&bookkeepingNotice=payrollPosted#bookkeeping-posting`);
}
