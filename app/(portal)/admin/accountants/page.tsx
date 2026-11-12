import { revalidatePath } from "next/cache";
import { requireRole, createServerSupabaseClient } from "@/lib/supabase/server";

async function changeRole(formData: FormData) {
  "use server";
  await requireRole(["admin"]);
  const userId = String(formData.get("userId") ?? "");
  const makeAccountant = String(formData.get("action")) === "grant";
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new Error("Invalid user");
  const db = await createServerSupabaseClient();
  const { error } = await db.rpc("exodus_admin_set_accountant", { target_user_id: userId, make_accountant: makeAccountant });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/accountants");
}

export default async function AccountantsPage() {
  await requireRole(["admin"]);
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from("exodus_users").select("id,email,full_name,role").in("role",["client","accountant"]).order("full_name").limit(500);
  if (error) throw new Error(error.message);
  return <section className="grid gap-4"><h1 className="text-2xl font-bold">Accountant access</h1><p>Only administrators can grant or revoke Accountant access. Ask the accountant to create and verify their own login first, then select that account here.</p><div className="grid gap-3">{(data ?? []).map(u => <form key={u.id} action={changeRole} className="flex flex-wrap items-center justify-between gap-3 rounded border bg-white p-4"><span>{u.full_name} ({u.email}) — {u.role}</span><input type="hidden" name="userId" value={u.id}/><button className="rounded bg-blue-900 px-4 py-2 text-white" name="action" value={u.role === "accountant" ? "revoke" : "grant"}>{u.role === "accountant" ? "Revoke accountant" : "Make accountant"}</button></form>)}</div></section>;
}
