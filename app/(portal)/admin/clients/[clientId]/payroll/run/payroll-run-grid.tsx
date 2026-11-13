"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type RunPayrollEmployee = {
  id: string;
  name: string;
  payType: "hourly" | "salary";
  hourlyRate: number | null;
  salaryAmount: number | null;
  hoursPerDay: number;
  daysPerWeek: number;
  frequency: string;
  status: string;
};
type Props = {
  clientId: string;
  companyId: string;
  year: number;
  companyName: string;
  frequency: string;
  employees: RunPayrollEmployee[];
};

const money = (amount: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);
const validNumber = (n: number) => Number.isFinite(n) && n >= 0;
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"));

function periodWorkingDays(start: string, end: string, daysPerWeek: number): number {
  if (!validDate(start) || !validDate(end) || end < start) return 0;
  let date = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  let count = 0;
  for (let i = 0; date <= last && i < 370; i++) {
    const weekDay = (date.getUTCDay() + 6) % 7; // Monday is day zero.
    if (weekDay < daysPerWeek) count += 1;
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return count;
}

export function PayrollRunGrid({ clientId, companyId, year, companyName, frequency, employees }: Props) {
  const [payFrequency, setPayFrequency] = useState(frequency);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [overrides, setOverrides] = useState<Record<string, { hours?: string; rate?: string; overtimeHours?: string }>>({});
  const [customized, setCustomized] = useState<Record<string, boolean>>({});

  const getValue = (employee: RunPayrollEmployee) => {
    const override = overrides[employee.id] ?? {};
    let standardHours = 0;
    if (payFrequency === "weekly") standardHours = employee.hoursPerDay * employee.daysPerWeek;
    else if (payFrequency === "biweekly") standardHours = employee.hoursPerDay * employee.daysPerWeek * 2;
    else if (validDate(start) && validDate(end)) standardHours = employee.hoursPerDay * periodWorkingDays(start, end, employee.daysPerWeek);
    const hours = Number(override.hours ?? standardHours.toFixed(2));
    const rate = Number(override.rate ?? employee.hourlyRate ?? 0);
    const overtimeHours = Number(override.overtimeHours ?? 0);
    // Overtime rate is not silently applied: these hours require manual payroll review.
    const gross = employee.payType === "salary"
      ? Number(employee.salaryAmount ?? 0)
      : hours * rate;
    return { hours, rate, overtimeHours, gross };
  };
  const update = (id: string, key: "hours" | "rate" | "overtimeHours", value: string) => {
    setCustomized(prev => ({ ...prev, [id]: true }));
    setOverrides(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };
  const resetHours = () => { setOverrides({}); setCustomized({}); };
  const rows = employees.map(employee => ({ employee, values: getValue(employee) }));
  const previewTotal = useMemo(() =>
    rows.reduce((sum, item) => sum + (validNumber(item.values.gross) ? item.values.gross : 0), 0),
    // rows are recalculated from state every render; no cached payroll amounts are persisted here.
    [rows]
  );
  const datesOk = validDate(start) && validDate(end) && validDate(payDate) && start <= end && end <= payDate && payDate.slice(0, 4) === String(year);
  const settingsUrl = `/admin/clients/${encodeURIComponent(clientId)}/payroll/settings?companyId=${encodeURIComponent(companyId)}&year=${year}`;
  const employeeUrl = (employee: RunPayrollEmployee) =>
    `/admin/clients/${encodeURIComponent(clientId)}/payroll/employees/${encodeURIComponent(employee.id)}?year=${year}`;

  function recordUrl(employee: RunPayrollEmployee, hours: number, rate: number) {
    const params = new URLSearchParams({
      clientId, workerId: employee.id,
      payFrequency, periodStart: start, periodEnd: end, payDate,
      hours: hours.toFixed(2), rate: rate.toFixed(2)
    });
    return `/admin/workers-payroll-review/record?${params.toString()}`;
  }

  return <section className="grid gap-6">
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-widest text-emerald-700">KAL Accounting &amp; Tax</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Run Payroll — {companyName}</h2>
          <p className="mt-2 text-sm text-slate-600">Draft regular hours and gross amounts. Nothing is paid, posted or filed by this page.</p>
        </div>
        <Link href={settingsUrl} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">Company settings</Link>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold">Frequency
          <select value={payFrequency} onChange={e => { setPayFrequency(e.target.value); resetHours(); }} className="rounded-lg border border-slate-300 p-3">
            <option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="semimonthly">Twice monthly</option><option value="monthly">Monthly</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Period start
          <input type="date" value={start} onChange={e => { setStart(e.target.value); resetHours(); }} className="rounded-lg border border-slate-300 p-3"/>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Period end
          <input type="date" min={start || undefined} value={end} onChange={e => { setEnd(e.target.value); resetHours(); }} className="rounded-lg border border-slate-300 p-3"/>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Pay date
          <input type="date" min={end || undefined} value={payDate} onChange={e => setPayDate(e.target.value)} className="rounded-lg border border-slate-300 p-3"/>
        </label>
      </div>
      <p className="mt-3 text-xs text-slate-500">Weekly hours default to 40 and biweekly hours to 80 for an 8-hour, 5-day employee. Twice-monthly and monthly hours use the dates and configured workdays. Review statutory holidays, leave and overtime manually.</p>
    </div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div><h3 className="text-lg font-black text-slate-900">Employee regular hours</h3><p className="text-sm text-slate-500">Click an hours cell to change it before preparing the paycheck.</p></div>
        <button onClick={resetHours} type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">Reset draft hours</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[910px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-700"><tr>
            <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Pay type</th><th className="px-4 py-3">Regular hours</th>
            <th className="px-4 py-3">Hourly rate</th><th className="px-4 py-3">OT hours (review)</th><th className="px-4 py-3 text-right">Draft gross</th><th className="px-4 py-3">Paycheck</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ employee, values }) => {
              const ready = datesOk && employee.payType === "hourly" && validNumber(values.hours) && values.hours <= 1000
                && values.rate > 0 && validNumber(values.rate) && values.overtimeHours === 0 && values.gross > 0;
              return <tr key={employee.id}>
                <td className="px-4 py-4"><span className="font-bold text-slate-900">{employee.name}</span>
                  <Link href={employeeUrl(employee)} className="mt-1 block text-xs font-semibold text-emerald-700 hover:underline">Edit pay rate / profile</Link></td>
                <td className="px-4 py-4">{employee.payType}</td>
                <td className="px-4 py-4"><input aria-label={`Regular hours for ${employee.name}`} type="number" min="0" max="1000" step="0.25"
                  value={overrides[employee.id]?.hours ?? values.hours.toFixed(2)}
                  onChange={e => update(employee.id, "hours", e.target.value)} disabled={employee.payType !== "hourly"}
                  className="w-24 rounded-lg border border-slate-300 px-2 py-2 outline-emerald-700"/></td>
                <td className="px-4 py-4"><input aria-label={`Hourly rate for ${employee.name}`} type="number" min="0" step="0.01"
                  value={overrides[employee.id]?.rate ?? String(employee.hourlyRate ?? "")}
                  onChange={e => update(employee.id, "rate", e.target.value)} disabled={employee.payType !== "hourly"}
                  className="w-28 rounded-lg border border-slate-300 px-2 py-2 outline-emerald-700"/></td>
                <td className="px-4 py-4"><input aria-label={`Overtime hours for ${employee.name}`} type="number" min="0" step="0.25"
                  value={overrides[employee.id]?.overtimeHours ?? "0"} onChange={e => update(employee.id, "overtimeHours", e.target.value)}
                  className="w-24 rounded-lg border border-slate-300 px-2 py-2 outline-emerald-700"/></td>
                <td className="px-4 py-4 text-right font-black">{validNumber(values.gross) ? money(values.gross) : "Invalid"}</td>
                <td className="px-4 py-4">
                  {ready ? <Link href={recordUrl(employee, values.hours, values.rate)} className="inline-flex rounded-lg bg-emerald-700 px-3 py-2 font-bold text-white hover:bg-emerald-800">Review paycheck</Link> :
                    <span className="text-xs text-slate-500">{employee.payType !== "hourly" ? "Salary: use individual payroll form" : values.overtimeHours > 0 ? "Review overtime separately" : "Enter valid dates and rate"}</span>}
                </td>
              </tr>;
            })}
            {employees.length === 0 ? <tr><td colSpan={7} className="p-7 text-center text-slate-500">No active employees assigned to this company. Add employees and their hourly rates first.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-600">Draft gross pay total (regular wages only). Deductions and net pay require individual review and CRA verification.</p>
        <strong className="text-xl text-slate-900">{money(previewTotal)}</strong>
      </div>
    </div>
    <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Changes to hours here are drafts only. To finalize a paycheck, select Review paycheck, confirm CRA deductions and save through the existing payroll workflow. Already saved pay records are not changed by this screen.</p>
  </section>;
}
