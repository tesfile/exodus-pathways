import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import { PayrollRunGrid, type RunPayrollEmployee } from "./payroll-run-grid";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<{ companyId?: string; year?: string; draftId?: string; saved?: string; scheduleUpdated?: string }>;
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
  const back = `/admin/clients/${encodeURIComponent(clientId)}/payroll?year=${year}`;
  if (!selected) return <main className="grid gap-5"><Link href={back} className="font-semibold text-emerald-700">← Back to Payroll</Link>
    <h1 className="text-2xl font-black">Run Payroll</h1><p>No company is configured for this client yet. Set up the employer company first.</p></main>;

  const [{ data: settings, error: settingsError }, { data: workers, error: workersError }, { data: profiles, error: profilesError }, { data: draftRuns, error: draftsError }] = await Promise.all([
    db.from("kal_company_payroll_settings").select("default_hours_per_day,default_days_per_week,default_pay_frequency,schedule_name,next_period_end,next_pay_date,auto_prepare_enabled")
      .eq("company_id", selected.id).eq("client_id", clientId).maybeSingle(),
    db.from("workers").select("id,worker_name,worker_type,status")
      .eq("client_id", clientId).eq("company_id", selected.id).order("worker_name"),
    db.from("kal_payroll_employee_profiles").select("worker_id,pay_type,hourly_rate,salary_amount,default_hours_per_day,default_days_per_week,pay_frequency,employment_status,hire_date,termination_date,contract_end_date,auto_include,payment_method,vacation_percent,vacation_policy,overtime_multiplier")
      .eq("client_id", clientId),
    db.from("kal_payroll_draft_runs")
      .select("id,period_start,period_end,pay_date,frequency,status")
      .eq("client_id",clientId).eq("company_id",selected.id).gte("pay_date",`${year}-01-01`).lte("pay_date",`${year}-12-31`)
      .order("pay_date",{ascending:true}).limit(70)
  ]);
  if (settingsError || workersError || profilesError || draftsError) throw new Error("Unable to load company payroll data.");

  const profileMap = new Map((profiles ?? []).map(profile => [profile.worker_id, profile]));
  const today = new Date().toISOString().slice(0,10);
  const selectedDraft = draftRuns?.find(draft => draft.id === query?.draftId) ??
    (draftRuns ?? []).find(draft => draft.status === "draft" && draft.pay_date >= today) ??
    (draftRuns ?? []).find(draft => draft.status === "draft") ?? null;
  const scheduledPeriodEnd = settings?.next_period_end ?? settings?.next_pay_date ?? null;
  const currentPeriodStart = selectedDraft?.period_start ?? (scheduledPeriodEnd
    ? (() => {
      const d = new Date(String(scheduledPeriodEnd) + "T00:00:00Z");
      if (settings?.default_pay_frequency === "weekly") d.setUTCDate(d.getUTCDate()-6);
      else if (settings?.default_pay_frequency === "biweekly") d.setUTCDate(d.getUTCDate()-13);
      else if (settings?.default_pay_frequency === "semimonthly") d.setUTCDate(d.getUTCDate() <= 15 ? 1 : 16);
      else d.setUTCDate(1);
      return d.toISOString().slice(0,10);
    })() : "");
  const currentPeriodEnd = selectedDraft?.period_end ?? scheduledPeriodEnd ?? "";

  const employees: RunPayrollEmployee[] = (workers ?? [])
    .filter(worker => /employee/i.test(worker.worker_type))
    .filter(worker => {
      const profile = profileMap.get(worker.id);
      const status = profile?.employment_status ?? worker.status;
      return !["Terminated", "Deceased", "Not on payroll", "Paid leave of absence", "Unpaid leave of absence"].includes(status)
        && (!selectedDraft || profile?.auto_include !== false)
        && (!profile?.hire_date || !currentPeriodEnd || profile.hire_date <= currentPeriodEnd)
        && (!profile?.termination_date || !currentPeriodStart || profile.termination_date >= currentPeriodStart)
        && (!profile?.contract_end_date || !currentPeriodStart || profile.contract_end_date >= currentPeriodStart);
    })
    .map(worker => {
      const profile = profileMap.get(worker.id);
      return {
        id: worker.id,
        name: worker.worker_name,
        payType: profile?.pay_type === "commission" ? "commission" : profile?.pay_type === "salary" ? "salary" : "hourly",
        hourlyRate: profile?.hourly_rate === null || profile?.hourly_rate === undefined ? null : numeric(profile.hourly_rate),
        salaryAmount: profile?.salary_amount === null || profile?.salary_amount === undefined ? null : numeric(profile.salary_amount),
        hoursPerDay: numeric(profile?.default_hours_per_day, numeric(settings?.default_hours_per_day, 8)),
        daysPerWeek: numeric(profile?.default_days_per_week, numeric(settings?.default_days_per_week, 5)),
        frequency: profile?.pay_frequency ?? settings?.default_pay_frequency ?? "biweekly",
        hasPayrollProfile: Boolean(profile),
        hasBirthDate: Boolean(profile?.birth_date),
        hireDate: profile?.hire_date ?? null,
        status: profile?.employment_status ?? worker.status,
        contractEndDate: profile?.contract_end_date ?? null,
        paymentMethod: profile?.payment_method ?? "paper_cheque",
        vacationPercent: numeric(profile?.vacation_percent,4),
        vacationPolicy: profile?.vacation_policy ?? "paid_each_period",
        overtimeMultiplier: numeric(profile?.overtime_multiplier,1.5)
      };
    });
  const [{data:savedLines,error:linesError},{data:previousPayments,error:paymentsError}]=await Promise.all([
    selectedDraft ? db.from("kal_payroll_draft_lines")
      .select("worker_id,regular_hours,hourly_rate,overtime_hours,vacation_pay,stat_holiday_pay,memo,payment_method")
      .eq("client_id",clientId).eq("run_id",selectedDraft.id) : Promise.resolve({data:[],error:null}),
    db.from("worker_payments").select("worker_id,gross_pay,payment_date")
      .eq("client_id",clientId).eq("company_id",selected.id)
      .order("payment_date",{ascending:false}).limit(300)
  ]);
  if(linesError||paymentsError) throw new Error("Could not load payroll draft records.");
  const priorGross=new Map<string,{gross:number;date:string}>();
  for(const payment of previousPayments??[]){
    if(!priorGross.has(payment.worker_id)) priorGross.set(payment.worker_id,{gross:Number(payment.gross_pay)||0,date:payment.payment_date});
  }
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-xl font-black text-slate-950">Scheduled payroll drafts</h2><p className="mt-1 text-sm text-slate-600">Recurring periods prepared by the company schedule. Every pay run still requires review.</p></div>
        <Link href={`/admin/clients/${encodeURIComponent(clientId)}/payroll/settings?companyId=${encodeURIComponent(selected.id)}&year=${year}`} className="text-sm font-bold text-emerald-700 hover:underline">Edit schedule</Link>
      </div>
      {draftRuns?.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {draftRuns.map(draft => <Link key={draft.id}
          href={`/admin/clients/${encodeURIComponent(clientId)}/payroll/run?companyId=${encodeURIComponent(selected.id)}&year=${year}&draftId=${encodeURIComponent(draft.id)}`}
          className={selectedDraft?.id === draft.id ? "rounded-xl border-2 border-emerald-700 bg-emerald-50 p-4" : "rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-500"}>
          <span className="block text-sm font-bold text-slate-950">{draft.period_start} – {draft.period_end}</span>
          <span className="mt-1 block text-xs text-slate-600">Pay date: {draft.pay_date} · {draft.status}</span>
        </Link>)}
      </div> : <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No recurring drafts yet. Enable automatic draft preparation in Company Settings. The daily scheduler creates the future periods. You can use the prefilled dates below immediately.</p>}
    </section>
    {query?.saved==="1" ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Payroll draft saved. No payments or CRA filings have been issued.</p> : null}
    {query?.scheduleUpdated==="1"?<p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Employee pay schedules assigned to the company schedule. Review missing birthdates, pay rates and tax settings before previewing payroll. No payments were issued.</p>:null}
    <PayrollRunGrid key={selected.id+"-"+(selectedDraft?.id??"new")} clientId={clientId} companyId={selected.id} year={year}
      companyName={selected.trade_name || selected.legal_name}
      frequency={selectedDraft?.frequency ?? settings?.default_pay_frequency ?? "biweekly"}
      companyFrequency={settings?.default_pay_frequency ?? "biweekly"}
      initialPeriodStart={currentPeriodStart}
      initialPeriodEnd={currentPeriodEnd}
      initialPayDate={selectedDraft?.pay_date ?? settings?.next_pay_date ?? ""}
      draftId={selectedDraft?.id ?? ""}
      savedLines={(savedLines??[]).map(line=>({
        workerId:line.worker_id,regularHours:Number(line.regular_hours),hourlyRate:Number(line.hourly_rate),
        overtimeHours:Number(line.overtime_hours),vacationPay:Number(line.vacation_pay),
        statHolidayPay:Number(line.stat_holiday_pay),memo:line.memo??"",
        paymentMethod:line.payment_method
      }))}
      priorPay={Object.fromEntries(priorGross)}
      employees={employees}/>
  </main>;
}
