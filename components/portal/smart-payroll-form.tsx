"use client";

import { FormEvent, useMemo, useState } from "react";
import { Save, WalletCards } from "lucide-react";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured
} from "@/lib/supabase/browser";

function todayInputDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export function SmartPayrollForm({ taxYear }: { taxYear: number }) {
  const [status, setStatus] = useState("");
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const periodStart = String(form.get("periodStart") ?? "");
    const periodEnd = String(form.get("periodEnd") ?? "");
    const employeeCount = Number(form.get("employeeCount") ?? 0);
    const grossPay = Number(form.get("grossPay") ?? 0);
    const sourceDeductions = Number(form.get("sourceDeductions") ?? 0);
    const notes = String(form.get("notes") ?? "");
    const recordYear = Number(periodStart.slice(0, 4)) || taxYear;

    if (!periodStart || !periodEnd) {
      setStatus("Please choose a payroll period start and end date.");
      return;
    }

    if (!configured) {
      setStatus("Supabase is required before saving payroll records.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("Please sign in before saving.");
      return;
    }

    const { error } = await supabase.from("payroll_records").insert({
      client_id: user.id,
      period_start: periodStart,
      period_end: periodEnd,
      employee_count: employeeCount,
      gross_pay: grossPay,
      source_deductions: sourceDeductions,
      tax_year: recordYear,
      status: "submitted",
      notes
    });

    if (error) {
      setStatus(`Payroll record could not be saved: ${error.message}`);
      return;
    }

    setStatus("Payroll record saved.");
    formElement.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <WalletCards className="h-6 w-6 text-exodus-gold" aria-hidden="true" />
        <h2 className="text-xl font-black text-exodus-navy">Add Payroll Entry</h2>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <div>
          <label htmlFor="payroll-period-start" className="label">Payroll Period Start</label>
          <input id="payroll-period-start" name="periodStart" type="date" className="field mt-2" defaultValue={todayInputDate()} required />
        </div>
        <div>
          <label htmlFor="payroll-period-end" className="label">Payroll Period End</label>
          <input id="payroll-period-end" name="periodEnd" type="date" className="field mt-2" defaultValue={todayInputDate()} required />
        </div>
        <div>
          <label htmlFor="employee-count" className="label">Employees</label>
          <input id="employee-count" name="employeeCount" type="number" min="0" step="1" className="field mt-2" placeholder="0" />
        </div>
        <div>
          <label htmlFor="gross-pay" className="label">Gross Payroll</label>
          <input id="gross-pay" name="grossPay" type="number" min="0" step="0.01" className="field mt-2" placeholder="0.00" />
        </div>
        <div>
          <label htmlFor="source-deductions" className="label">Source Deductions</label>
          <input id="source-deductions" name="sourceDeductions" type="number" min="0" step="0.01" className="field mt-2" placeholder="0.00" />
        </div>
        <div className="lg:col-span-3">
          <label htmlFor="payroll-notes" className="label">Notes</label>
          <textarea id="payroll-notes" name="notes" className="field mt-2 min-h-24" />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-exodus-navy px-5 text-sm font-black text-white transition hover:bg-exodus-blue">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save Payroll Entry
        </button>
        {status ? <p className="text-sm font-bold text-exodus-navy">{status}</p> : null}
      </div>
    </form>
  );
}
