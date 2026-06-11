"use client";

import { FormEvent, useMemo, useState } from "react";
import { Save, WalletCards } from "lucide-react";
import { selfEmployedExpenseTypes, selfEmploymentBusinessTypes } from "@/lib/tax/personal-options";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured
} from "@/lib/supabase/browser";

export function SelfEmployedForm({ taxYear }: { taxYear: number }) {
  const [status, setStatus] = useState("");
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const selectedTaxYear = Number(form.get("taxYear") ?? taxYear);
    const businessType = String(form.get("businessType") ?? "Other");
    const expenseType = String(form.get("expenseType") ?? "Other");
    const income = Number(form.get("income") ?? 0);
    const expenses = Number(form.get("expenses") ?? 0);
    const gstCollected = Number(form.get("gstCollected") ?? 0);
    const gstPaid = Number(form.get("gstPaid") ?? 0);
    const notes = String(form.get("notes") ?? "").trim();

    if (income < 0 || expenses < 0 || gstCollected < 0 || gstPaid < 0) {
      setStatus("Amounts cannot be negative.");
      return;
    }

    if (!configured) {
      setStatus("Supabase is required before saving self-employed records.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setStatus("Please sign in before saving.");
      return;
    }

    const { error } = await supabase.from("self_employed_records").insert({
      client_id: user.id,
      tax_year: selectedTaxYear,
      business_type: businessType,
      expense_type: expenseType,
      income_amount: income,
      expense_amount: expenses,
      gst_collected: gstCollected,
      gst_paid: gstPaid,
      status: "submitted",
      notes: notes || null
    });

    if (error) {
      setStatus(`Self-employed record could not be saved: ${error.message}`);
      return;
    }

    setStatus("Self-employed record saved.");
    formElement.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-exodus-light text-exodus-blue">
          <WalletCards className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-black text-exodus-navy">Self-Employed Entry</h2>
          <p className="mt-1 text-sm leading-6 text-exodus-slate">
            Add simple yearly self-employed income, expenses, and GST totals.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">Tax Year</span>
          <input name="taxYear" type="number" min="2000" max="2100" className="field" defaultValue={taxYear} required />
        </label>
        <label className="grid gap-2">
          <span className="label">Business Type</span>
          <select name="businessType" className="field" defaultValue="Contractor" required>
            {selfEmploymentBusinessTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Expense Type</span>
          <select name="expenseType" className="field" defaultValue="Fuel" required>
            {selfEmployedExpenseTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Income</span>
          <input name="income" type="number" min="0" step="0.01" className="field" placeholder="0.00" required />
        </label>
        <label className="grid gap-2">
          <span className="label">Expenses</span>
          <input name="expenses" type="number" min="0" step="0.01" className="field" placeholder="0.00" required />
        </label>
        <label className="grid gap-2">
          <span className="label">GST Collected</span>
          <input name="gstCollected" type="number" min="0" step="0.01" className="field" placeholder="0.00" />
        </label>
        <label className="grid gap-2">
          <span className="label">GST Paid</span>
          <input name="gstPaid" type="number" min="0" step="0.01" className="field" placeholder="0.00" />
        </label>
        <label className="grid gap-2 lg:col-span-2">
          <span className="label">Notes</span>
          <textarea name="notes" className="field min-h-24" placeholder="Mileage, platform, or business details." />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-exodus-navy px-5 text-sm font-black text-white transition hover:bg-exodus-blue">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save Self-Employed Record
        </button>
        {status ? <p className="text-sm font-bold text-exodus-navy">{status}</p> : null}
      </div>
    </form>
  );
}
