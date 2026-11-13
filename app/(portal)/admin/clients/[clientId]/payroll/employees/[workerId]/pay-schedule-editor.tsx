"use client";

import { useMemo, useState } from "react";

type Frequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
const weekdays = 24 * 60 * 60 * 1000;
const parseDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? null : date;
};
const iso = (date: Date) => date.toISOString().slice(0, 10);
const eom = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

function nextPeriodEnd(date: Date, frequency: Frequency, anchor: number, wasMonthEnd: boolean): Date {
  const y = date.getUTCFullYear(), m = date.getUTCMonth(), d = date.getUTCDate();
  if (frequency === "weekly" || frequency === "biweekly") {
    return new Date(date.valueOf() + (frequency === "weekly" ? 7 : 14) * weekdays);
  }
  if (frequency === "semimonthly") {
    if (d < 15) return new Date(Date.UTC(y, m, 15));
    if (d < eom(y, m)) return new Date(Date.UTC(y, m, eom(y, m)));
    return new Date(Date.UTC(y, m + 1, 15));
  }
  return new Date(Date.UTC(y, m + 1, wasMonthEnd ? eom(y, m + 1) : Math.min(anchor, eom(y, m + 1))));
}

export function PayScheduleEditor({
  scheduleName = "Regular payroll",
  initialFrequency = "biweekly",
  initialPeriodEnd = "",
  initialPayDate = "",
  initialDefault = false
}: {
  scheduleName?: string;
  initialFrequency?: string;
  initialPeriodEnd?: string;
  initialPayDate?: string;
  initialDefault?: boolean;
}) {
  const [frequency, setFrequency] = useState<Frequency>(
    (["weekly", "biweekly", "semimonthly", "monthly"].includes(initialFrequency)
      ? initialFrequency : "biweekly") as Frequency
  );
  const [periodEnd, setPeriodEnd] = useState(initialPeriodEnd);
  const [payDate, setPayDate] = useState(initialPayDate);
  const upcoming = useMemo(() => {
    const start = parseDate(periodEnd), pay = parseDate(payDate);
    if (!start || !pay || pay.valueOf() < start.valueOf()) return [];
    const lag = Math.round((pay.valueOf() - start.valueOf()) / weekdays);
    const anchor = start.getUTCDate();
    const wasMonthEnd = anchor === eom(start.getUTCFullYear(), start.getUTCMonth());
    const entries = [];
    let cursor = start;
    for (let i = 0; i < 4; i++) {
      entries.push({ periodEnd: iso(cursor), payDate: iso(new Date(cursor.valueOf() + lag * weekdays)) });
      cursor = nextPeriodEnd(cursor, frequency, anchor, wasMonthEnd);
    }
    return entries;
  }, [frequency, periodEnd, payDate]);

  return (
    <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:col-span-2">
      <div><h2 className="text-xl font-black text-slate-900">Pay schedule</h2>
        <p className="mt-1 text-sm text-slate-600">Choose a frequency, enter the next period end and the actual payday. Future dates are previews only.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Schedule name"><input name="schedule_name" maxLength={100} defaultValue={scheduleName} className="field" required /></Field>
        <Field label="Pay frequency"><select name="pay_frequency" value={frequency} onChange={e => setFrequency(e.target.value as Frequency)} className="field">
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly (every 2 weeks)</option>
          <option value="semimonthly">Twice a month (15th and month end)</option>
          <option value="monthly">Monthly</option>
        </select></Field>
        <Field label="End of next pay period"><input name="next_period_end" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="field" /></Field>
        <Field label="Next pay date"><input name="next_pay_date" type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="field" min={periodEnd || undefined} /></Field>
      </div>
      <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
        <input name="default_schedule" type="checkbox" defaultChecked={initialDefault} className="mt-1 accent-emerald-700" />
        <span><strong>Use this schedule for future employees</strong><span className="mt-0.5 block text-xs text-slate-600">Keep one default schedule per client. Existing employee schedules will not be changed.</span></span>
      </label>
      <div className="rounded-lg border border-slate-200">
        <h3 className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-900">Upcoming pay periods — preview</h3>
        {upcoming.length === 0 ? <p className="p-4 text-sm text-slate-500">Enter valid dates to preview the next four pay periods.</p> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-2">Period ending</th><th className="px-4 py-2">Pay date</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{upcoming.map(row => <tr key={row.periodEnd}><td className="px-4 py-2">{row.periodEnd}</td><td className="px-4 py-2">{row.payDate}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold text-slate-800">{label}{children}</label>;
}
