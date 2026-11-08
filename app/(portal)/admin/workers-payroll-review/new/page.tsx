import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import { saveEmployee } from "./actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ clientId?: string; year?: string; error?: string }> };

export default async function AddEmployeePage({ searchParams }: Props) {
  await requireRole(["admin"]);
  const { clientId, year, error } = await searchParams;
  if (!clientId || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(clientId)) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Supabase server configuration missing.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await db.from("users").select("id,full_name,role").eq("id", clientId).maybeSingle();
  const { data: companies, error: companiesError } = await db.from("companies").select("id,legal_name,trade_name").eq("client_id", clientId).order("legal_name");
  if (profileError || companiesError) throw new Error("Unable to load client companies.");
  if (!profile || profile.role !== "client") notFound();
  const back = `/admin/workers-payroll-review?clientId=${encodeURIComponent(clientId)}&year=${encodeURIComponent(year ?? String(new Date().getFullYear()))}`;

  return (
    <main className="mx-auto grid max-w-3xl gap-6">
      <div>
        <Link href={back} className="font-semibold text-blue-800 hover:underline">← Workers & Payments</Link>
        <h1 className="mt-4 text-3xl font-bold text-blue-950">Add Employee</h1>
        <p className="mt-2 text-slate-600">Client: {profile.full_name}. Choose the employer company below.</p>
      </div>
      {error ? <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">Employee could not be saved. Check the staging server terminal for the exact error.</p> : null}
      {(!companies || companies.length === 0) ? (
        <p className="rounded-lg border bg-white p-5">This client has no company yet. Add a company before registering an employee.</p>
      ) : (
        <form action={saveEmployee} className="grid gap-5 rounded-xl border bg-white p-6 shadow-sm md:grid-cols-2">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="year" value={year ?? String(new Date().getFullYear())} />
          <label className="grid gap-2 md:col-span-2"><span className="font-semibold">Employer Company *</span>
            <select name="company_id" required className="rounded-lg border p-3" defaultValue="">
              <option value="" disabled>Select the employer company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.trade_name || c.legal_name}</option>)}
            </select>
          </label>
          <label className="grid gap-2"><span className="font-semibold">Employee Full Name *</span><input name="worker_name" required maxLength={200} className="rounded-lg border p-3" /></label>
          <label className="grid gap-2"><span className="font-semibold">Email</span><input name="email" type="email" maxLength={254} className="rounded-lg border p-3" /></label>
          <label className="grid gap-2"><span className="font-semibold">Phone</span><input name="phone" type="tel" maxLength={50} className="rounded-lg border p-3" /></label>
          <label className="grid gap-2"><span className="font-semibold">Employment Type</span><select name="worker_type" className="rounded-lg border p-3"><option value="Employee">Employee / Payroll</option><option value="Subcontractor">Subcontractor</option></select></label>
          <label className="grid gap-2 md:col-span-2"><span className="font-semibold">Address</span><textarea name="address" rows={2} className="rounded-lg border p-3" /></label>
          <label className="grid gap-2 md:col-span-2"><span className="font-semibold">Notes (optional)</span><textarea name="notes" rows={3} className="rounded-lg border p-3" /></label>
          <p className="text-xs text-slate-500 md:col-span-2">Social Insurance Numbers are not collected on this basic registration page. Payroll setup and secure SIN handling must be implemented separately.</p>
          <div className="flex flex-wrap gap-3 md:col-span-2"><button type="submit" className="rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white">Save Employee</button><Link href={back} className="rounded-lg border px-6 py-3 font-semibold">Cancel</Link></div>
        </form>
      )}
    </main>
  );
}
