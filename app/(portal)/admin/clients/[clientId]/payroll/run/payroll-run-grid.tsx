"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
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
  const date = new Date(start + "T00:00:00Z");
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
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(employees.map(employee => employee.id));
  const [end, setEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [overrides, setOverrides] = useState<Record<string, { hours?: string; rate?: string; overtimeHours?: string }>>({});

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
    setOverrides(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };
  const resetHours = () => setOverrides({});
  const rows = employees.filter(employee => selectedIds.includes(employee.id)).map(employee => ({ employee, values: getValue(employee) }));
  const displayRows = rows.filter(row => row.employee.name.toLowerCase().includes(search.toLowerCase()));
  const totalHours = rows.reduce((sum, item) => sum + (validNumber(item.values.hours) ? item.values.hours : 0), 0);
  const selectedCount = rows.length;
  const previewTotal = rows.reduce(
    (sum, item) => sum + (validNumber(item.values.gross) ? item.values.gross : 0), 0
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

  return <section className="grid gap-6 bg-white">
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-widest text-emerald-700">KAL PAYROLL</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Run payroll: {payFrequency === "weekly" ? "Every week" : payFrequency === "biweekly" ? "Every other week" : payFrequency === "semimonthly" ? "Twice a month" : "Every month"}</h2>
          <p className="mt-2 text-sm text-slate-600">{companyName} · Prepare employee pay details before preview. Nothing is paid, posted or filed by this page.</p>
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
    {year !== 2026 ? <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-950">The existing automated payroll calculator currently supports 2026 only. Review the draft hours, but do not save a paycheck for another year until the correct year\u0027s CRA rules are available.</p> : null}
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
        <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3">
          <Search className="h-4 w-4 text-slate-500" aria-hidden="true"/>
          <span className="sr-only">Search employees</span>
          <input type="search" placeholder="Search employees" value={search} onChange={e => setSearch(e.target.value)} className="min-h-11 w-48 bg-transparent text-sm outline-none"/>
        </label>
        <button onClick={resetHours} type="button" className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold"><SlidersHorizontal className="h-4 w-4"/> Reset draft hours</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"><tr>
            <th className="px-3 py-4"><label className="flex items-center gap-2"><input type="checkbox" checked={selectedIds.length === employees.length && employees.length > 0} onChange={e => setSelectedIds(e.target.checked ? employees.map(employee => employee.id) : [])} className="h-4 w-4 accent-emerald-700"/><span>Employees</span></label><span className="mt-1 block font-normal text-slate-500">Showing {selectedCount} of {employees.length}</span></th>
            <th className="px-3 py-4">Regular pay (hrs)</th><th className="px-3 py-4">Hourly rate</th><th className="px-3 py-4">Overtime (hrs)</th>
            <th className="px-3 py-4">Vacation pay</th><th className="px-3 py-4">Stat holiday pay</th><th className="px-3 py-4">Total hrs</th><th className="px-3 py-4 text-right">Draft gross</th><th className="px-3 py-4">Pay method</th><th className="px-3 py-4">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {displayRows.map(({ employee, values }, index) => {
              const ready = year === 2026 && datesOk && employee.payType === "hourly" && validNumber(values.hours) && values.hours <= 1000
                && values.rate > 0 && validNumber(values.rate) && values.overtimeHours === 0 && values.gross > 0;
              return <tr key={employee.id} className={index % 2 ? "bg-slate-50/70" : "bg-white"}>
                <td className="px-3 py-4"><div className="flex items-center gap-3"><input aria-label={`Include ${employee.name}`} type="checkbox" checked={selectedIds.includes(employee.id)} onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, employee.id] : prev.filter(id => id !== employee.id))} className="h-4 w-4 accent-emerald-700"/><span><Link href={employeeUrl(employee)} className="font-bold text-slate-900 hover:text-emerald-700">{employee.name}</Link><span className="block text-xs text-slate-500">{employee.payType}</span></span></div></td>
                <td className="px-3 py-4"><input aria-label={`Regular hours for ${employee.name}`} type="number" min="0" max="1000" step="0.25" value={overrides[employee.id]?.hours ?? values.hours.toFixed(2)} onChange={e => update(employee.id, "hours", e.target.value)} disabled={employee.payType !== "hourly"} className="w-24 rounded-lg border border-slate-300 p-2 outline-emerald-700"/></td>
                <td className="px-3 py-4"><input aria-label={`Rate for ${employee.name}`} type="number" min="0" step="0.01" value={overrides[employee.id]?.rate ?? String(employee.hourlyRate ?? "")} onChange={e => update(employee.id, "rate", e.target.value)} disabled={employee.payType !== "hourly"} className="w-24 rounded-lg border border-slate-300 p-2 outline-emerald-700"/></td>
                <td className="px-3 py-4"><input aria-label={`Overtime hours for ${employee.name}`} type="number" min="0" step="0.25" value={overrides[employee.id]?.overtimeHours ?? "0"} onChange={e => update(employee.id, "overtimeHours", e.target.value)} className="w-20 rounded-lg border border-slate-300 p-2 outline-emerald-700"/></td>
                <td className="px-3 py-4 text-slate-600">Review separately</td>
                <td className="px-3 py-4 text-slate-600">Review separately</td>
                <td className="px-3 py-4 font-semibold">{values.hours + values.overtimeHours}h</td>
                <td className="px-3 py-4 text-right font-bold">{validNumber(values.gross) ? money(values.gross) : "Invalid"}</td>
                <td className="px-3 py-4 text-slate-600">Not configured</td>
                <td className="px-3 py-4">{ready ? <Link href={recordUrl(employee, values.hours, values.rate)} className="text-sm font-bold text-emerald-700 hover:underline">Review paycheque</Link> : <span className="text-xs text-slate-500">{values.overtimeHours > 0 ? "Review overtime" : employee.payType === "salary" ? "Salary: individual pay form" : "Set dates / rate"}</span>}</td>
              </tr>;
            })}
            {!displayRows.length ? <tr><td colSpan={10} className="p-8 text-center text-slate-500">No employees selected or matching the search.</td></tr> : null}
          </tbody>
          <tfoot><tr className="border-t border-slate-200 bg-slate-100 font-black text-slate-950"><td className="px-3 py-4">Total · {selectedCount} employees</td><td className="px-3 py-4">{totalHours.toFixed(2)}h</td><td/><td/><td/><td/><td/><td className="px-3 py-4 text-right">{money(previewTotal)}</td><td/><td/></tr></tfoot>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5">
        <p className="text-xs text-slate-600">Draft gross is regular earnings only. CPP, EI, CPP2, income tax, vacation and employer contributions are not computed on this screen.</p>
        <button type="button" onClick={() => setShowPreview(true)} disabled={!selectedCount || !datesOk || !rows.every(r => validNumber(r.values.gross))}
          className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Preview for {selectedCount} employees</button>
      </div>
    </div>
    {showPreview ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="kal-preview-title" className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3"><div><h3 id="kal-preview-title" className="text-2xl font-black text-slate-950">Preview payroll · draft only</h3><p className="mt-1 text-sm text-slate-600">Regular gross pay before deductions and other pay items. Not ready for payment.</p></div><button type="button" aria-label="Close preview" onClick={() => setShowPreview(false)}><X className="h-6 w-6 text-slate-700"/></button></div>
        <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-5 sm:grid-cols-3">
          <div><p className="text-xs uppercase text-slate-500">Regular gross pay</p><p className="text-2xl font-black">{money(previewTotal)}</p></div>
          <div><p className="text-xs uppercase text-slate-500">Employees</p><p className="text-2xl font-black">{selectedCount}</p></div>
          <div><p className="text-xs uppercase text-slate-500">Period</p><p className="text-sm font-semibold">{start} to {end}</p></div>
        </div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="border-b bg-slate-50"><tr><th className="p-3">Employee</th><th className="p-3">Hours</th><th className="p-3 text-right">Regular gross</th></tr></thead><tbody className="divide-y">{rows.map(({ employee, values }) => <tr key={employee.id}><td className="p-3">{employee.name}</td><td className="p-3">{values.hours}</td><td className="p-3 text-right font-semibold">{money(values.gross)}</td></tr>)}</tbody></table></div>
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">To calculate deductions and record a paycheque, return to the grid and open Review paycheque for each eligible employee. KAL does not submit bank payments or CRA filings here.</p>
        <div className="mt-5 flex justify-end"><button type="button" onClick={() => setShowPreview(false)} className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white">Back to payroll</button></div>
      </div>
    </div> : null}
    <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Changes to hours here are drafts only. To finalize a paycheck, select Review paycheck, confirm CRA deductions and save through the existing payroll workflow. Already saved pay records are not changed by this screen.</p>
  </section>;
}
