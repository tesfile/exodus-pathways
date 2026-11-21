"use client";

import { useMemo, useState } from "react";

type Frequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
const msDay = 86400000;
const css = "min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100";
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.valueOf() + n * msDay);
const parse = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d + "T00:00:00Z")) ? new Date(d + "T00:00:00Z") : null;
const lastDay = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
const fmt = (date: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }).format(date);

function nextEnd(current: Date, frequency: Frequency, anchor: number, eom: boolean) {
  const year = current.getUTCFullYear(), month = current.getUTCMonth(), day = current.getUTCDate();
  if (frequency === "weekly") return addDays(current, 7);
  if (frequency === "biweekly") return addDays(current, 14);
  if (frequency === "semimonthly") {
    if (day < 15) return new Date(Date.UTC(year, month, 15));
    if (day < lastDay(year,month)) return new Date(Date.UTC(year, month, lastDay(year,month)));
    return new Date(Date.UTC(year, month + 1, 15));
  }
  return new Date(Date.UTC(year, month + 1, eom ? lastDay(year, month + 1) : Math.min(anchor,lastDay(year,month+1))));
}

export function CompanyScheduleFields({ name, frequency: initialFrequency, periodEnd: initialEnd, payDate: initialPayDate }:
{ name: string; frequency: string; periodEnd: string; payDate: string }) {
  const [frequency, setFrequency] = useState<Frequency>(
    (["weekly","biweekly","semimonthly","monthly"].includes(initialFrequency) ? initialFrequency : "biweekly") as Frequency
  );
  const [periodEnd, setPeriodEnd] = useState(initialEnd);
  const [payDate, setPayDate] = useState(initialPayDate);
  const dates = useMemo(() => {
    const end = parse(periodEnd), payday = parse(payDate);
    if (!end || !payday || payday.valueOf() < end.valueOf()) return [];
    const diffDays = Math.round((payday.valueOf()-end.valueOf())/msDay);
    const monthOffset = (payday.getUTCFullYear()-end.getUTCFullYear())*12 + payday.getUTCMonth()-end.getUTCMonth();
    const payAnchor = payday.getUTCDate(), payEom = payAnchor===lastDay(payday.getUTCFullYear(),payday.getUTCMonth());
    const endAnchor=end.getUTCDate(), endEom=endAnchor===lastDay(end.getUTCFullYear(),end.getUTCMonth());
    let cursor=end;
    const out: { start:string; end:string; payday:string }[]=[];
    for (let i=0;i<4;i++) {
      const start = i===0
        ? frequency==="weekly" ? addDays(cursor,-6)
          : frequency==="biweekly" ? addDays(cursor,-13)
          : new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth(),frequency==="monthly" || cursor.getUTCDate()<=15?1:16))
        : addDays(new Date(out[i-1].end+"T00:00:00Z"),1);
      let payForPeriod=addDays(cursor,diffDays);
      if (frequency==="monthly") {
        const shifted=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+monthOffset,1));
        payForPeriod=new Date(Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),
          payEom?lastDay(shifted.getUTCFullYear(),shifted.getUTCMonth()):Math.min(payAnchor,lastDay(shifted.getUTCFullYear(),shifted.getUTCMonth()))));
      }
      out.push({start:iso(start),end:iso(cursor),payday:iso(payForPeriod)});
      cursor=nextEnd(cursor,frequency,endAnchor,endEom);
    }
    return out;
  },[frequency,periodEnd,payDate]);
  const warning=Boolean(periodEnd && payDate && payDate<periodEnd);
  return <div className="grid gap-8 sm:col-span-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)] lg:gap-12">
    <div className="grid content-start gap-5">
      <label className="grid gap-2 text-sm font-semibold text-slate-800">Pay schedule name
        <input name="schedule_name" maxLength={100} defaultValue={name} className={css} placeholder="Example: Every Friday"/>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">Pay frequency
        <select name="default_pay_frequency" value={frequency} onChange={event=>setFrequency(event.target.value as Frequency)} className={css}>
          <option value="weekly">Every week</option>
          <option value="biweekly">Every other week</option>
          <option value="semimonthly">Twice a month</option>
          <option value="monthly">Every month</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">Next pay date
        <input name="next_pay_date" type="date" value={payDate} min={periodEnd || undefined} onChange={event=>setPayDate(event.target.value)} className={css}/>
        <span className="text-xs font-normal text-slate-500">The day employees are scheduled to receive their pay.</span>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">End of next pay period
        <input name="next_period_end" type="date" value={periodEnd} onChange={event=>setPeriodEnd(event.target.value)} className={css}/>
        <span className="text-xs font-normal text-slate-500">The last day of work covered by the next paycheque.</span>
      </label>
      {warning ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">The pay date cannot be before the end of the pay period.</p> : null}
    </div>
    <aside className="min-w-0">
      <h3 className="mb-4 text-lg font-black text-slate-900">Upcoming pay periods</h3>
      {dates.length ? <div className="grid gap-3">{dates.map((d,i)=><div key={d.end} className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pay period {i+1}</p>
        <p className="mt-2 text-sm font-bold text-slate-950">{fmt(new Date(d.start+"T00:00:00Z"))} – {fmt(new Date(d.end+"T00:00:00Z"))}</p>
        <p className="mt-2 text-sm text-slate-600">Payday: <strong className="text-slate-950">{fmt(new Date(d.payday+"T00:00:00Z"))}</strong></p>
      </div>)}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">Choose a pay frequency, pay date and pay-period end to preview the upcoming four pay periods.</p>}
      <p className="mt-3 text-xs leading-5 text-slate-500">Preview only. Review holidays, cutoff times and statutory deductions before final payroll approval.</p>
    </aside>
  </div>;
}
