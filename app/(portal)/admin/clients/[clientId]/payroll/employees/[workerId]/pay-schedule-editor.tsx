"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Info } from "lucide-react";

type Frequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
const dayMs = 24 * 60 * 60 * 1000;
const fieldClass = "min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value ? date : null;
}
const iso = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => new Date(date.valueOf() + days * dayMs);
const monthEnd = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
const displayDate = (date: Date) => new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC"
}).format(date);
const weekday = (date: Date) => new Intl.DateTimeFormat("en-CA", {
  weekday: "long", timeZone: "UTC"
}).format(date);

function firstPeriodStart(end: Date, frequency: Frequency): Date {
  const year = end.getUTCFullYear(), month = end.getUTCMonth(), day = end.getUTCDate();
  if (frequency === "weekly") return addDays(end, -6);
  if (frequency === "biweekly") return addDays(end, -13);
  if (frequency === "semimonthly") {
    return new Date(Date.UTC(year, month, day <= 15 ? 1 : 16));
  }
  return new Date(Date.UTC(year, month, 1));
}

function followingPeriodEnd(end: Date, frequency: Frequency, anchor: number, endOfMonth: boolean): Date {
  const year = end.getUTCFullYear(), month = end.getUTCMonth(), day = end.getUTCDate();
  if (frequency === "weekly" || frequency === "biweekly") {
    return addDays(end, frequency === "weekly" ? 7 : 14);
  }
  if (frequency === "semimonthly") {
    if (day < 15) return new Date(Date.UTC(year, month, 15));
    if (day < monthEnd(year, month)) return new Date(Date.UTC(year, month, monthEnd(year, month)));
    return new Date(Date.UTC(year, month + 1, 15));
  }
  return new Date(Date.UTC(year, month + 1, endOfMonth ? monthEnd(year, month + 1) : Math.min(anchor, monthEnd(year, month + 1))));
}

export function PayScheduleEditor({
  employeeName,
  scheduleName = "Regular payroll",
  initialFrequency = "biweekly",
  initialPeriodEnd = "",
  initialPayDate = "",
  initialDefault = false
}: {
  employeeName?: string;
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
  const [isDefault, setIsDefault] = useState(initialDefault);

  const upcoming = useMemo(() => {
    const end = parseDate(periodEnd), pay = parseDate(payDate);
    if (!end || !pay || pay.valueOf() < end.valueOf()) return [];
    const lagDays = Math.round((pay.valueOf() - end.valueOf()) / dayMs);
    const anchor = end.getUTCDate();
    const isMonthEnd = anchor === monthEnd(end.getUTCFullYear(), end.getUTCMonth());
    let currentEnd = end, currentStart = firstPeriodStart(end, frequency);
    const periods: { start: string; end: string; payday: string }[] = [];
    for (let i = 0; i < 4; i++) {
      periods.push({
        start: displayDate(currentStart),
        end: displayDate(currentEnd),
        payday: displayDate(addDays(currentEnd, lagDays))
      });
      const oldEnd = currentEnd;
      currentEnd = followingPeriodEnd(currentEnd, frequency, anchor, isMonthEnd);
      currentStart = addDays(oldEnd, 1);
    }
    return periods;
  }, [frequency, periodEnd, payDate]);

  const invalidOrder = Boolean(periodEnd && payDate && payDate < periodEnd);
  const firstPayDate = parseDate(payDate);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 sm:p-7">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Employee payroll setup</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Choose when to pay {employeeName || "this employee"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">Set the pay frequency, next payday, and pay-period dates.</p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
          <CalendarDays className="h-4 w-4" aria-hidden="true" /> Pay schedule
        </span>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] xl:gap-12">
        <div className="grid content-start gap-6">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Pay frequency
            <select name="pay_frequency" value={frequency} onChange={event => setFrequency(event.target.value as Frequency)} className={fieldClass}>
              <option value="weekly">Every week</option>
              <option value="biweekly">Every other week</option>
              <option value="semimonthly">Twice a month</option>
              <option value="monthly">Every month</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Next pay date
            <input name="next_pay_date" type="date" value={payDate} onChange={event => setPayDate(event.target.value)}
              min={periodEnd || undefined} className={fieldClass} />
            <span className="text-xs font-normal text-slate-500">{firstPayDate ? weekday(firstPayDate) : "The date employees will receive their pay"}</span>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            End of next pay period
            <input name="next_period_end" type="date" value={periodEnd} onChange={event => setPeriodEnd(event.target.value)} className={fieldClass} />
            <span className="text-xs font-normal text-slate-500">
              {parseDate(periodEnd) ? weekday(parseDate(periodEnd)!) : "The final day covered by this paycheque"}
            </span>
          </label>

          {invalidOrder && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">
            Payday cannot be before the end of the pay period.
          </p>}

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2">Pay schedule name <Info className="h-4 w-4 text-slate-400" aria-label="A name to recognize this schedule" /></span>
            <input name="schedule_name" maxLength={100} defaultValue={scheduleName} className={fieldClass} required
              placeholder="For example: Every Friday" />
          </label>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-800">
            <input name="default_schedule" type="checkbox" checked={isDefault} onChange={event => setIsDefault(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-700" />
            <span>Use this pay schedule for employees you add after this one
              <span className="mt-1 block text-xs text-slate-500">This becomes the default schedule for future hires. Existing employees are not changed.</span>
            </span>
          </label>
        </div>

        <aside className="min-w-0">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Upcoming pay periods</h3>
          {upcoming.length ? (
            <div className="grid gap-4">
              {upcoming.map((period, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pay period {index + 1}</p>
                  {index === 0 && <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-label="Next scheduled period" />}
                </div>
                <p className="mt-2 text-base font-semibold text-slate-900">{period.start} – {period.end}</p>
                <p className="mt-2 text-sm text-slate-600">Expected payday: <span className="font-bold text-slate-800">{period.payday}</span></p>
              </div>)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
              Enter the next pay date and end of the next pay period to preview four upcoming pay periods.
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Dates are previews, not submitted pay runs. Review holidays and processing deadlines before paying employees.
          </p>
        </aside>
      </div>
    </section>
  );
}
