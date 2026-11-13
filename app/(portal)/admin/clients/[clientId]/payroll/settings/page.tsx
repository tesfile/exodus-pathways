import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import { saveCompanyPayrollSettings } from "./actions";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ companyId?: string; year?: string; saved?: string }>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm focus:border-emerald-700 focus:outline-none";
function Input({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold text-slate-800">{label}{children}</label>;
}

export default async function CompanyPayrollSettingsPage({ params, searchParams }: Props) {
  await requireRole(["admin"]);
  const { clientId } = await params;
  const query = await searchParams;
  if (!uuid.test(clientId)) notFound();
  const year = /^20\d{2}$/.test(query?.year ?? "") ? query!.year! : String(new Date().getFullYear());
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Payroll database configuration missing.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: companies, error: companyError } = await db.from("companies")
    .select("id,legal_name,trade_name").eq("client_id", clientId).order("legal_name");
  if (companyError) throw new Error("Unable to load payroll companies.");
  const selected = companies?.find(company => company.id === query?.companyId) ?? companies?.[0];
  const { data: settings, error } = selected
    ? await db.from("kal_company_payroll_settings").select("default_hours_per_day,default_days_per_week,default_pay_frequency,overtime_multiplier,vacation_percent")
      .eq("company_id", selected.id).eq("client_id", clientId).maybeSingle()
    : { data: null, error: null };
  if (error) throw new Error("Unable to read company payroll settings.");

  const back = `/admin/clients/${encodeURIComponent(clientId)}?year=${year}&tab=workers-payments`;
  return <main className="mx-auto grid max-w-4xl gap-6">
    <div>
      <Link href={back} className="text-sm font-bold text-emerald-700 hover:underline">← Back to Client Payroll</Link>
      <h1 className="mt-4 text-3xl font-black text-slate-900">Payroll settings</h1>
      <p className="mt-2 text-sm text-slate-600">Standard hours and payroll defaults belong to the selected employer company, not all KAL clients.</p>
    </div>
    {query?.saved === "1" && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Payroll settings saved for this company.</p>}
    {selected ? <>
      <form method="get" className="grid gap-2 rounded-xl border border-slate-200 bg-white p-5">
        <input type="hidden" name="year" value={year}/>
        <Input label="Employer company">
          <select name="companyId" defaultValue={selected.id} className={inputClass}>
            {companies?.map(company => <option key={company.id} value={company.id}>{company.trade_name || company.legal_name}</option>)}
          </select>
        </Input>
        <button type="submit" className="mt-2 w-fit rounded-lg border border-slate-300 px-5 py-2 text-sm font-bold">View company</button>
      </form>
      <form action={saveCompanyPayrollSettings} className="grid gap-5 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <input name="client_id" type="hidden" value={clientId}/>
        <input name="company_id" type="hidden" value={selected.id}/>
        <input name="year" type="hidden" value={year}/>
        <div className="sm:col-span-2">
          <h2 className="text-xl font-black text-slate-900">{selected.trade_name || selected.legal_name}</h2>
          <p className="mt-1 text-sm text-slate-600">Default working time: 8 hours per day, 5 days per week (40 hours per week).</p>
        </div>
        <Input label="Default hours per day">
          <input name="default_hours_per_day" required type="number" min="0.25" max="24" step="0.25" defaultValue={settings?.default_hours_per_day ?? 8} className={inputClass}/>
        </Input>
        <Input label="Default days per week">
          <input name="default_days_per_week" required type="number" min="1" max="7" step="1" defaultValue={settings?.default_days_per_week ?? 5} className={inputClass}/>
        </Input>
        <Input label="Default pay frequency">
          <select name="default_pay_frequency" defaultValue={settings?.default_pay_frequency ?? "biweekly"} className={inputClass}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="semimonthly">Twice a month</option>
            <option value="monthly">Monthly</option>
          </select>
        </Input>
        <Input label="Overtime multiplier (reference only)">
          <input name="overtime_multiplier" type="number" required step="0.25" min="1" max="4" defaultValue={settings?.overtime_multiplier ?? 1.5} className={inputClass}/>
        </Input>
        <Input label="Vacation pay percent (reference only)">
          <input name="vacation_percent" type="number" required step="0.01" min="0" max="30" defaultValue={settings?.vacation_percent ?? 4} className={inputClass}/>
        </Input>
        <p className="self-end text-xs text-slate-500">Overtime and vacation settings are reference values, not automatic legal entitlements. Review Alberta employment standards for each employee.</p>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button type="submit" className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">Save company settings</button>
          <Link href={`/admin/clients/${encodeURIComponent(clientId)}/payroll/run?companyId=${encodeURIComponent(selected.id)}&year=${year}`} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold">Open Run Payroll</Link>
        </div>
      </form>
    </> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm">This client does not have an employer company yet. Create the company before configuring payroll settings.</p>}
  </main>;
}
