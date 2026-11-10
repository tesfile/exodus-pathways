"use server";
import { revalidatePath } from "next/cache";
import { requireRole, createServerSupabaseClient } from "@/lib/supabase/server";

const types = ["asset","liability","equity","income","expense"];
export async function addAccount(form: FormData) {
 await requireRole(["admin"]);
 const clientId=String(form.get("clientId")||"");
 const code=String(form.get("code")||"").trim();
 const name=String(form.get("name")||"").trim();
 const type=String(form.get("type")||"");
 if(!/^[0-9a-f-]{36}$/i.test(clientId)||!/^[A-Za-z0-9.-]{2,16}$/.test(code)||!name||name.length>120||!types.includes(type)) throw new Error("Check account code, name and type.");
 const db=await createServerSupabaseClient();
 const {data:client}=await db.from("users").select("id").eq("id",clientId).eq("role","client").maybeSingle();
 if(!client) throw new Error("Client not found");
 const {error}=await db.from("kal_accounts").insert({client_id:clientId,code,name,type});
 if(error) throw new Error(error.message);
 revalidatePath(`/admin/clients/${clientId}`);
}
export async function addOpenItem(form:FormData) {
 await requireRole(["admin"]);
 const clientId=String(form.get("clientId")||"");
 const kind=String(form.get("kind")||"");
 const party_name=String(form.get("party")||"").trim();
 const reference=String(form.get("reference")||"").trim();
 const issue_date=String(form.get("date")||"");
 const due_date=String(form.get("dueDate")||"")||null;
 const amount=Number(form.get("amount"));
 const tax_amount=Number(form.get("tax")||0);
 const party_address=String(form.get("address")||"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(clientId)||!["receivable","payable"].includes(kind)||!party_name||!reference||!/^\d{4}-\d{2}-\d{2}$/.test(issue_date)||!Number.isFinite(amount)||amount<=0||!Number.isFinite(tax_amount)||tax_amount<0)throw new Error("Complete invoice/bill details.");
 const db=await createServerSupabaseClient();
 const {data:client}=await db.from("users").select("id").eq("id",clientId).eq("role","client").maybeSingle();
 if(!client)throw new Error("Client not found");
 const {error}=await db.from("kal_open_items").insert({client_id:clientId,kind,party_name,party_address,reference,issue_date,due_date,amount,tax_amount,status:"draft"});
 if(error)throw new Error(error.message);
 revalidatePath(`/admin/clients/${clientId}`);
}
