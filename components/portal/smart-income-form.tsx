"use client";

import { FormEvent, useMemo, useState } from "react";
import { Banknote, Save, UploadCloud } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured
} from "@/lib/supabase/browser";

function todayInputDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export function SmartIncomeForm({ taxYear }: { taxYear: number }) {
  const { t } = useT();
  const [status, setStatus] = useState("");
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const transactionDate = String(form.get("transactionDate") ?? "");
    const transactionYear = Number(transactionDate.slice(0, 4)) || taxYear;
    const whoPaid = String(form.get("whoPaid") ?? "");
    const workDone = String(form.get("workDone") ?? "");
    const amount = Number(form.get("amount") ?? 0);
    const gst = Number(form.get("gst") ?? 0);
    const notes = String(form.get("notes") ?? "");
    const invoice = form.get("invoice") as File | null;

    if (!transactionDate || !whoPaid || !workDone || amount <= 0) {
      setStatus("Please complete Income Date, Who Paid You, Work Done, and Amount.");
      return;
    }

    if (!configured) {
      setStatus(t("income.form.saved"));
      formElement.reset();
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

    const { error: incomeError } = await supabase.from("income_entries").insert({
      client_id: user.id,
      entry_date: transactionDate,
      source: `${whoPaid} - ${workDone}`,
      amount,
      gst_hst_amount: gst,
      tax_year: transactionYear,
      status: "submitted",
      notes
    });

    if (incomeError) {
      setStatus(`Income could not be saved: ${incomeError.message}`);
      return;
    }

    if (invoice && invoice.size > 0) {
      const safeName = invoice.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("invoices").upload(path, invoice, {
        cacheControl: "3600",
        upsert: false
      });

      if (uploadError) {
        setStatus(`Income saved, but invoice upload failed: ${uploadError.message}`);
        formElement.reset();
        return;
      }

      const { error: documentError } = await supabase.from("documents").insert({
        client_id: user.id,
        uploaded_by: user.id,
        bucket: "invoices",
        storage_path: path,
        document_type: "invoice",
        file_name: invoice.name,
        mime_type: invoice.type || "application/octet-stream",
        size_bytes: invoice.size,
        document_date: transactionDate,
        tax_year: transactionYear,
        status: "uploaded"
      });

      if (documentError) {
        setStatus(`Income saved, but invoice record failed: ${documentError.message}`);
        formElement.reset();
        return;
      }
    }

    setStatus(t("income.form.saved"));
    formElement.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Banknote className="h-6 w-6 text-exodus-gold" aria-hidden="true" />
        <h2 className="text-xl font-black text-exodus-navy">{t("income.form.title")}</h2>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="income-date" className="label">
            Income Date
          </label>
          <input id="income-date" name="transactionDate" type="date" className="field mt-2" defaultValue={todayInputDate()} required />
        </div>

        <div>
          <label htmlFor="whoPaid" className="label">
            {t("income.form.whoPaid")}
          </label>
          <input id="whoPaid" name="whoPaid" className="field mt-2" placeholder="Customer name" required />
        </div>
        <div>
          <label htmlFor="workDone" className="label">
            {t("income.form.workDone")}
          </label>
          <input id="workDone" name="workDone" className="field mt-2" placeholder="Roof repair, delivery, sale" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="incomeAmount" className="label">
              {t("income.form.amount")}
            </label>
            <input id="incomeAmount" name="amount" type="number" min="0" step="0.01" className="field mt-2" placeholder="500.00" required />
          </div>
          <div>
            <label htmlFor="incomeGst" className="label">
              {t("income.form.gst")}
            </label>
            <input id="incomeGst" name="gst" type="number" min="0" step="0.01" className="field mt-2" placeholder="25.00" />
          </div>
        </div>
        <div>
          <label htmlFor="invoice" className="label">
            {t("income.form.invoice")}
          </label>
          <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-exodus-light px-4 text-sm font-black text-exodus-navy">
            <UploadCloud className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
            {t("common.upload")}
            <input id="invoice" name="invoice" type="file" accept="image/*,.pdf" className="sr-only" />
          </label>
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="incomeNotes" className="label">
            {t("income.form.notes")}
          </label>
          <textarea id="incomeNotes" name="notes" className="field mt-2 min-h-24" placeholder="Extra details" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-exodus-navy px-5 text-sm font-black text-white transition hover:bg-exodus-blue">
          <Save className="h-4 w-4" aria-hidden="true" />
          {t("income.form.save")}
        </button>
        {status ? <p className="text-sm font-bold text-exodus-navy">{status}</p> : null}
      </div>
    </form>
  );
}
