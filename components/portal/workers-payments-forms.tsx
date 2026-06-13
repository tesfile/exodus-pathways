"use client";

import { FormEvent, useMemo, useState } from "react";
import { Save, UploadCloud, UserRound } from "lucide-react";
import { invoiceProvidedOptions, paymentMethodOptions, workerTypeOptions } from "@/lib/workers-options";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured
} from "@/lib/supabase/browser";

type CompanyOption = {
  id: string;
  name: string;
};

function todayInputDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function normalizeWorkerName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function WorkersPaymentsForms({
  taxYear,
  companies,
  workers
}: {
  taxYear: number;
  companies: CompanyOption[];
  workers: Array<{ id: string; name: string; type: string; companyId: string | null }>;
}) {
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const workerName = String(form.get("workerName") ?? "").trim();
    const sinOrBusinessNumber = String(form.get("sinOrBusinessNumber") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const clientWorkerType = String(form.get("workerType") ?? "Not sure");
    const amountPaid = Number(form.get("amountPaid") ?? 0);
    const datePaid = String(form.get("datePaid") ?? "");
    const selectedCompanyId = companies[0]?.id ?? null;

    if (!workerName || !sinOrBusinessNumber || !address || !clientWorkerType || !datePaid || amountPaid <= 0) {
      setStatus("Complete Full Name, SIN or Business Number, Address, Date Paid, Amount Paid, and Client Selected Type.");
      return;
    }

    if (!configured) {
      setStatus("Supabase is required before saving worker payments.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setStatus("Please sign in before saving worker payments.");
      return;
    }

    setStatus("Saving...");
    const normalizedWorkerName = normalizeWorkerName(workerName);
    const knownWorker = workers.find((worker) => normalizeWorkerName(worker.name) === normalizedWorkerName);
    let workerId = knownWorker?.id;

    if (!workerId) {
      const { data: existingWorker } = await supabase
        .from("workers")
        .select("id")
        .eq("client_id", user.id)
        .eq("worker_name", workerName)
        .maybeSingle();

      workerId = (existingWorker as { id: string } | null)?.id;
    }

    if (!workerId) {
      const { data: worker, error: workerError } = await supabase
        .from("workers")
        .insert({
          client_id: user.id,
          company_id: selectedCompanyId,
          worker_name: workerName,
          sin_or_business_number: sinOrBusinessNumber,
          address,
          phone: phone || null,
          email: email || null,
          worker_type: clientWorkerType,
          notes: String(form.get("notes") ?? "").trim() || null
        })
        .select("id")
        .single();

      if (workerError || !worker) {
        setStatus(`Worker could not be saved: ${workerError?.message ?? "Unknown error"}`);
        return;
      }

      workerId = worker.id;
    } else {
      await supabase
        .from("workers")
        .update({
          sin_or_business_number: sinOrBusinessNumber,
          address,
          phone: phone || null,
          email: email || null,
          worker_type: clientWorkerType,
          notes: String(form.get("notes") ?? "").trim() || null
        })
        .eq("id", workerId)
        .eq("client_id", user.id);
    }

    let invoiceBucket: string | null = null;
    let invoiceStoragePath: string | null = null;
    let invoiceFileName: string | null = null;

    if (file && file.size > 0) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/workers/${taxYear}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("invoices").upload(path, file, {
        cacheControl: "3600",
        upsert: false
      });

      if (uploadError) {
        setStatus(`Payment not saved because upload failed: ${uploadError.message}`);
        return;
      }

      invoiceBucket = "invoices";
      invoiceStoragePath = path;
      invoiceFileName = file.name;

      await supabase.from("documents").insert({
        client_id: user.id,
        uploaded_by: user.id,
        bucket: "invoices",
        storage_path: path,
        document_type: "worker_invoice_or_receipt",
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        document_date: datePaid,
        tax_year: taxYear,
        status: "uploaded"
      });
    }

    const { error: paymentError } = await supabase.from("worker_payments").insert({
      worker_id: workerId,
      client_id: user.id,
      company_id: selectedCompanyId,
      tax_year: taxYear,
      payment_date: datePaid,
      amount_paid: amountPaid,
      gst_paid: 0,
      payment_method: String(form.get("paymentMethod") ?? "Other"),
      invoice_provided: String(form.get("invoiceProvided") ?? "Not sure"),
      client_worker_type: clientWorkerType,
      admin_classification: "Review Needed",
      slip_needed: "Review Needed",
      invoice_bucket: invoiceBucket,
      invoice_storage_path: invoiceStoragePath,
      invoice_file_name: invoiceFileName,
      notes: String(form.get("notes") ?? "").trim() || null,
      amount_before_gst: amountPaid,
      total_paid: amountPaid
    });

    if (paymentError) {
      setStatus(`Payment could not be saved: ${paymentError.message}`);
      return;
    }

    setFile(null);
    setStatus("Payment saved. Exodus Pathways will review and classify it correctly.");
    formElement.reset();
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <UserRound className="mt-1 h-5 w-5 text-exodus-gold" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-black text-exodus-navy">Add Worker Payment</h2>
          <p className="mt-1 text-sm leading-6 text-exodus-slate">
            Do not worry if you are not sure. Exodus Pathways will review and classify it correctly.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 lg:col-span-2">
          <span className="label">Full Name</span>
          <input name="workerName" className="field" required />
        </label>
        <label className="grid gap-2">
          <span className="label">SIN or Business Number</span>
          <input name="sinOrBusinessNumber" className="field" required />
        </label>
        <label className="grid gap-2">
          <span className="label">Client Selected Type</span>
          <select name="workerType" className="field" required defaultValue="Not sure">
            {workerTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 lg:col-span-2">
          <span className="label">Address</span>
          <input name="address" className="field" required />
        </label>
        <label className="grid gap-2">
          <span className="label">Phone optional</span>
          <input name="phone" className="field" />
        </label>
        <label className="grid gap-2">
          <span className="label">Email optional</span>
          <input name="email" type="email" className="field" />
        </label>
        <label className="grid gap-2">
          <span className="label">Date Paid</span>
          <input name="datePaid" type="date" className="field" defaultValue={todayInputDate()} required />
        </label>
        <label className="grid gap-2">
          <span className="label">Amount Paid</span>
          <input name="amountPaid" type="number" min="0" step="0.01" className="field" required />
        </label>
        <label className="grid gap-2">
          <span className="label">Payment Method</span>
          <select name="paymentMethod" className="field" required>
            {paymentMethodOptions.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Invoice Yes/No/Not sure</span>
          <select name="invoiceProvided" className="field" required>
            {invoiceProvidedOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-exodus-navy shadow-sm lg:col-span-2">
          <UploadCloud className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
          {file ? file.name : "Upload invoice or receipt"}
          <input
            className="sr-only"
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            aria-label="Upload invoice or receipt"
          />
        </label>
        <label className="grid gap-2 lg:col-span-2">
          <span className="label">Notes</span>
          <textarea name="notes" className="field min-h-24" />
        </label>
      </div>

      <button type="submit" className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-exodus-navy px-5 text-sm font-black text-white transition hover:bg-exodus-blue">
        <Save className="h-4 w-4" aria-hidden="true" />
        Save Payment
      </button>
      {status ? <p className="mt-3 text-sm font-bold text-exodus-navy">{status}</p> : null}
    </form>
  );
}
