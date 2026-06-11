"use client";

import { FormEvent, useMemo, useState } from "react";
import { FileText, ScanText, UploadCloud } from "lucide-react";
import { personalTaxSlipTypes, t4ExtractionBoxes } from "@/lib/tax/personal-options";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured
} from "@/lib/supabase/browser";

function todayInputDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export function PersonalTaxUploadForm({ taxYear }: { taxYear: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const selectedTaxYear = Number(form.get("taxYear") ?? taxYear);
    const slipType = String(form.get("slipType") ?? "Other");
    const payerName = String(form.get("payerName") ?? "").trim();
    const documentDate = String(form.get("documentDate") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();

    if (!file) {
      setStatus("Choose a tax slip file first.");
      return;
    }

    if (!configured) {
      setStatus("Supabase is required before uploading tax slips.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setStatus("Please sign in before uploading tax slips.");
      return;
    }

    setStatus("Uploading tax slip...");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `${user.id}/${selectedTaxYear}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("tax-slips").upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (uploadError) {
      setStatus(`Tax slip upload failed: ${uploadError.message}`);
      return;
    }

    const { data: slip, error: slipError } = await supabase
      .from("personal_tax_slips")
      .insert({
        client_id: user.id,
        tax_year: selectedTaxYear,
        slip_type: slipType,
        payer_name: payerName || null,
        document_date: documentDate || null,
        file_name: file.name,
        bucket: "tax-slips",
        storage_path: storagePath,
        status: "waiting_for_review",
        notes: notes || null
      })
      .select("id")
      .single();

    if (slipError || !slip) {
      setStatus(`Tax slip uploaded, but record failed: ${slipError?.message ?? "Unknown error"}`);
      return;
    }

    if (slipType === "T4") {
      const { error: extractionError } = await supabase.from("tax_slip_extractions").insert(
        t4ExtractionBoxes.map((box) => ({
          slip_id: slip.id,
          box_number: box.boxNumber,
          box_label: box.boxLabel,
          status: "not_extracted"
        }))
      );

      if (extractionError) {
        setStatus(`Tax slip uploaded, but extraction setup failed: ${extractionError.message}`);
        return;
      }
    }

    setFile(null);
    setStatus("Uploaded. Waiting for Review.");
    formElement.reset();
  }

  return (
    <form onSubmit={handleUpload} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-exodus-light text-exodus-blue">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-black text-exodus-navy">Upload Tax Slip</h2>
          <p className="mt-1 text-sm leading-6 text-exodus-slate">
            Upload T4, T4A, T5, RRSP, tuition, medical, childcare, rent, or other personal tax slips.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">Tax Year</span>
          <input name="taxYear" type="number" min="2000" max="2100" className="field" defaultValue={taxYear} required />
        </label>
        <label className="grid gap-2">
          <span className="label">Slip Type</span>
          <select name="slipType" className="field" defaultValue="T4" required>
            {personalTaxSlipTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Employer / Payer</span>
          <input name="payerName" className="field" placeholder="Employer, bank, school, landlord, or payer" />
        </label>
        <label className="grid gap-2">
          <span className="label">Document Date</span>
          <input name="documentDate" type="date" className="field" defaultValue={todayInputDate()} />
        </label>
        <label className="grid gap-2 lg:col-span-2">
          <span className="label">Notes</span>
          <textarea name="notes" className="field min-h-24" placeholder="Anything Exodus Pathways should know about this slip." />
        </label>
        <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-exodus-light px-4 text-sm font-black text-exodus-navy">
          <UploadCloud className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
          {file ? file.name : "Upload File"}
          <input
            className="sr-only"
            type="file"
            accept="image/*,.pdf,.txt,.csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            aria-label="Upload tax slip file"
          />
        </label>
        <button
          type="button"
          onClick={() => setStatus("Extract Slip Data is prepared for future OCR. For now, Exodus Pathways reviews uploaded slips.")}
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-exodus-gold/50 bg-white px-4 text-sm font-black text-exodus-navy"
        >
          <ScanText className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
          Extract Slip Data
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-exodus-navy px-5 text-sm font-black text-white transition hover:bg-exodus-blue">
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          Upload Tax Slip
        </button>
        {status ? <p className="text-sm font-bold text-exodus-navy">{status}</p> : null}
      </div>
    </form>
  );
}
