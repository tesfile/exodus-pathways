import Link from "next/link";
import { requireRole } from "@/lib/supabase/server";

export default async function AccountantPage() {
  await requireRole(["accountant"]);
  return <section className="grid gap-5"><h1 className="text-3xl font-bold">KAL Accounting — Accountant</h1><p>Accountant access is active. Client accounting tools will appear here after their server actions pass the permission audit. You cannot assign roles or delete records.</p><Link className="underline" href="/accountant/clients">View clients</Link></section>;
}
