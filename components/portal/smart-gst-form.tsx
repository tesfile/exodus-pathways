"use client";

import { FormEvent, useMemo, useState } from "react";
import { Landmark, Save } from "lucide-react";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured
} from "@/lib/supabase/browser";

function todayInputDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export function SmartGstForm({ taxYear }: { taxYear: number }) {
  const [status, setStatus] = useState("");
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const periodStart = String(form.get("periodStart") ?? "");
    const periodEnd = String(form.get("periodEnd") ?? "");
    const gstCollected = Number(form.get("gstCollected") ?? 0);
    const gstPaid = Number(form.get("gstPaid") ?? 0);
    const recordYear = Number(periodStart.slice(0, 4)) || taxYear;

    if (!periodStart || !periodEnd) {
      setStatus("Please choose a GST period start and end date.");
      return;
    }

    if (!configured) {
      setStatus("Supabase is required before saving GST records.");
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

    const periodLabel = `${periodStart} to ${periodEnd}`;
    const { error } = await supabase.from("gst_records").upsert(
      {
        client_id: user.id,
        tax_year: recordYear,
        period_label: periodLabel,
        period_start: periodStart,
        period_end: periodEnd,
        gst_collected: gstCollected,
        gst_paid: gstPaid,
        status: "submitted"
      },
      { onConflict: "client_id,tax_year,period_label" }
    );

    if (error) {
      setStatus(`GST record could not be saved: ${error.message}`);
      return;
    }

    setStatus("GST record saved.");
    formElement.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Landmark className="h-6 w-6 text-exodus-gold" aria-hidden="true" />
        <h2 className="text-xl font-black text-exodus-navy">Add GST Entry</h2>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <div>
          <label htmlFor="gst-period-start" className="label">GST Period Start</label>
          <input id="gst-period-start" name="periodStart" type="date" className="field mt-2" defaultValue={todayInputDate()} required />
        </div>
        <div>
          <label htmlFor="gst-period-end" className="label">GST Period End</label>
          <input id="gst-period-end" name="periodEnd" type="date" className="field mt-2" defaultValue={todayInputDate()} required />
        </div>
        <div>
          <label htmlFor="gst-collected" className="label">GST Collected</label>
          <input id="gst-collected" name="gstCollected" type="number" min="0" step="0.01" className="field mt-2" placeholder="0.00" />
        </div>
        <div>
          <label htmlFor="gst-paid" className="label">GST Paid</label>
          <input id="gst-paid" name="gstPaid" type="number" min="0" step="0.01" className="field mt-2" placeholder="0.00" />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-exodus-navy px-5 text-sm font-black text-white transition hover:bg-exodus-blue">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save GST Entry
        </button>
        {status ? <p className="text-sm font-bold text-exodus-navy">{status}</p> : null}
      </div>
    </form>
  );
}
