"use server";
import { revalidatePath } from "next/cache";
import { requireRole, createServerSupabaseClient } from "@/lib/supabase/server";

const types = ["asset","liability","equity","income","expense"];
export async function addAccount(form: FormData) {
 await requireRole(["admin"]);
 const clientId=String(form.get("clientId")||"");
 const choice=String(form.get("accountChoice")||"");
 const [type,code,...nameParts]=choice.split("|");
 const name=nameParts.join("|").trim();
 const validAccounts:Record<string,string[]> = {
  asset:["1000","1010","1100","1500","1510","1520","1530","1600"],
  liability:["2000","2100","2200","2300","2400"],
  equity:["3000","3100","3200"],
  income:["4000","4100","4200"],
  expense:["5000","5100","5200","5300","5400","5500","5600","5700","5800"]
 };
 if(!validAccounts[type]?.includes(code)) throw new Error("Choose a valid account from the list.");
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
