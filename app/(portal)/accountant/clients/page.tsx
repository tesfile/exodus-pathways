import Link from "next/link";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

export default async function AccountantClientsPage() {
  await requireRole(["accountant"]);
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from("exodus_users").select("id,full_name,email").eq("role","client").order("full_name").limit(500);
  if (error) return <p>Unable to load clients: {error.message}</p>;
  return <section className="grid gap-4"><h1 className="text-2xl font-bold">Accounting clients</h1><Link href="/accountant" className="underline">Back</Link><ul className="grid gap-2">{(data ?? []).map(c => <li key={c.id} className="rounded border bg-white p-3">{c.full_name} — {c.email}</li>)}</ul></section>;
}
