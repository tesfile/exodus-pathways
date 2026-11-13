import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import { PayrollRunGrid, type RunPayrollEmployee } from "./payroll-run-grid";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ companyId?: string; year?: string }>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const numeric = (value: unknown, fallback = 0) => value === null || value === undefined ? fallback : Number(value);
export default async function RunPayrollPage({ params, searchParams }: Props) {
  await requireRole(["admin"]);
  const { clientId } = await params;
  const query = await searchParams;
  if (!uuid.test(clientId)) notFound();
  const year = /^20\d{2}$/.test(query?.year ?? "") ? Number(query!.year!) : new Date().getFullYear();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Payroll database is not configured.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: companies, error: companyError } = await db.from("companies")
    .select("id,legal_name,trade_name").eq("client_id", clientId).order("legal_name");
  if (companyError) throw new Error("Unable to load client companies.");
  const selected = companies?.find(c => c.id === query?.companyId) ?? companies?.[0];
  const back = `/admin/clients/${encodeURIComponent(clientId)}?year=${year}&tab=workers-payments`;
  if (!selected) return <main className="grid gap-5"><Link href={back} className="font-semibold text-emerald-700">← Back to Payroll</Link>
    <h1 className="text-2xl font-black">Run Payroll</h1><p>No company is configured for this client yet. Set up the employer company first.</p></main>;

  const [{ data: settings, error: settingsError }, { data: workers, error: workersError }, { data: profiles, error: profilesError }] = await Promise.all([
    db.from("kal_company_payroll_settings").select("default_hours_per_day,default_days_per_week,default_pay_frequency")
      .eq("company_id", selected.id).eq("client_id", clientId).maybeSingle(),
    db.from("workers").select("id,worker_name,worker_type,status")
      .eq("client_id", clientId).eq("company_id", selected.id).order("worker_name"),
    db.from("kal_payroll_employee_profiles").select("worker_id,pay_type,hourly_rate,salary_amount,default_hours_per_day,default_days_per_week,pay_frequency,employment_status")
      .eq("client_id", clientId)
  ]);
  if (settingsError || workersError || profilesError) throw new Error("Unable to load company payroll data.");

  const profileMap = new Map((profiles ?? []).map(profile => [profile.worker_id, profile]));
  const employees: RunPayrollEmployee[] = (workers ?? [])
    .filter(worker => /employee/i.test(worker.worker_type))
    .filter(worker => {
      const status = profileMap.get(worker.id)?.employment_status ?? worker.status;
      return !["Terminated", "Deceased", "Not on payroll", "Paid leave of absence", "Unpaid leave of absence"].includes(status);
    })
    .map(worker => {
      const profile = profileMap.get(worker.id);
      return {
        id: worker.id,
        name: worker.worker_name,
        payType: profile?.pay_type === "salary" ? "salary" : "hourly",
        hourlyRate: profile?.hourly_rate === null || profile?.hourly_rate === undefined ? null : numeric(profile.hourly_rate),
        salaryAmount: profile?.salary_amount === null || profile?.salary_amount === undefined ? null : numeric(profile.salary_amount),
        hoursPerDay: numeric(profile?.default_hours_per_day, numeric(settings?.default_hours_per_day, 8)),
        daysPerWeek: numeric(profile?.default_days_per_week, numeric(settings?.default_days_per_week, 5)),
        frequency: profile?.pay_frequency ?? settings?.default_pay_frequency ?? "biweekly",
        status: profile?.employment_status ?? worker.status
      };
    });
  return <main className="mx-auto grid max-w-7xl gap-5">
    <Link href={back} className="w-fit text-sm font-bold text-emerald-700 hover:underline">← Back to Client Payroll</Link>
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <input type="hidden" name="year" value={year}/>
      <label className="grid min-w-60 flex-1 gap-2 text-sm font-semibold text-slate-800">Employer company
        <select name="companyId" className="rounded-lg border border-slate-300 px-3 py-2" defaultValue={selected.id}>
          {companies?.map(c => <option key={c.id} value={c.id}>{c.trade_name || c.legal_name}</option>)}
        </select>
      </label>
      <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold">Select company</button>
    </form>
    <PayrollRunGrid clientId={clientId} companyId={selected.id} year={year}
      companyName={selected.trade_name || selected.legal_name}
      frequency={settings?.default_pay_frequency ?? "biweekly"}
      employees={employees}/>
  </main>;
}
