import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";
import { savePayrollEntry } from "./actions";
import { PayrollEntryPreview } from "@/components/portal/payroll-entry-preview";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ clientId?: string; workerId?: string }> };
export default async function RecordPaymentPage({ searchParams }: Props) {
  await requireRole(["admin"]);
  const { clientId, workerId } = await searchParams;
  if (!clientId || !workerId) notFound();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Server database configuration missing");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: worker, error } = await db.from("workers")
    .select("id,worker_name,worker_type,company_id").eq("client_id", clientId).eq("id", workerId).single();
  if (error || !worker) notFound();
  const isEmployee = worker.worker_type === "Employee";
  const today = new Date().toISOString().slice(0, 10);
  const back = "/admin/workers-payroll-review?clientId=" + encodeURIComponent(clientId);
  return (
    <main className="mx-auto grid max-w-4xl gap-5">
      <Link href={back} className="font-bold text-blue-800">← Workers & Payments</Link>
      <div><h1 className="text-3xl font-bold text-blue-950">Record {isEmployee ? "Payroll" : "Contractor Payment"}</h1>
        <p className="text-slate-600">{worker.worker_name} · {worker.worker_type}</p></div>
      <form action={savePayrollEntry} className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
        <input type="hidden" name="client_id" value={clientId}/>
        <input type="hidden" name="worker_id" value={workerId}/>
        <input type="hidden" name="classification" value={isEmployee ? "T4 Employee" : "T5018 Subcontractor"}/>
        <div className="md:col-span-2 rounded-lg bg-blue-50 p-4">
          <strong>{isEmployee ? "T4 Employee Payroll" : "Contractor / T5018 Payment"}</strong>
          <p className="mt-1 text-sm">Enter the actual amounts for this pay period. Automatic Canadian payroll deductions are not yet verified. Use CRA PDOC to calculate CPP, CPP2, EI and income tax before saving.</p>
        </div>
        <label className="grid gap-1">Pay date<input required name="payment_date" type="date" defaultValue={today} className="rounded border p-3"/></label>
        <label className="grid gap-1">Pay frequency<select name="pay_frequency" defaultValue="biweekly" className="rounded border p-3"><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="semi-monthly">Semi-monthly</option><option value="monthly">Monthly</option></select></label>
        <label className="grid gap-1">Period start<input required name="pay_period_start" type="date" defaultValue={today} className="rounded border p-3"/></label>
        <label className="grid gap-1">Period end<input required name="pay_period_end" type="date" defaultValue={today} className="rounded border p-3"/></label>
        <label className="grid gap-1">{isEmployee ? "Gross pay" : "Amount before GST"} ($)<input required name="gross" type="number" min="0.01" step="0.01" className="rounded border p-3"/></label>
        {isEmployee ? <>
          <label className="grid gap-1">Employee CPP (including applicable CPP2) ($)<input required name="cpp" type="number" min="0" step="0.01" defaultValue="0" className="rounded border p-3"/></label>
          <label className="grid gap-1">Employee EI ($)<input required name="ei" type="number" min="0" step="0.01" defaultValue="0" className="rounded border p-3"/></label>
          <label className="grid gap-1">Income tax withheld ($)<input required name="income_tax" type="number" min="0" step="0.01" defaultValue="0" className="rounded border p-3"/></label>
          <label className="grid gap-1">Employer CPP (including applicable CPP2) ($)<input required name="employer_cpp" type="number" min="0" step="0.01" defaultValue="0" className="rounded border p-3"/></label>
          <label className="grid gap-1">Employer EI ($)<input required name="employer_ei" type="number" min="0" step="0.01" defaultValue="0" className="rounded border p-3"/></label>
        </> : <label className="grid gap-1">GST paid ($)<input required name="gst" type="number" min="0" step="0.01" defaultValue="0" className="rounded border p-3"/></label>}
        {isEmployee && <PayrollEntryPreview />}
        <p className="md:col-span-2 text-sm text-amber-800">Draft entry only. Saving does not pay employees, submit T4/T4A/T5018 slips, or remit funds to CRA. Review amounts before use.</p>
        <button type="submit" className="rounded-lg bg-blue-900 px-6 py-3 font-bold text-white md:col-span-2">Save {isEmployee ? "Payroll Entry" : "Contractor Payment"}</button>
      </form>
    </main>
  );
}
