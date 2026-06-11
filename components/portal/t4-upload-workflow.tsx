"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, FileText, ScanText, UploadCloud } from "lucide-react";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured
} from "@/lib/supabase/browser";

type ExtractedT4 = {
  slipId: string;
  documentName: string;
  documentDate: string;
  taxYear: string;
  employerName: string;
  employeeName: string;
  box14: string;
  box16: string;
  box18: string;
  box22: string;
};

function todayInputDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function normalizeAmount(value: string | null) {
  if (!value) {
    return "";
  }

  const cleaned = value.replace(/[$,\s]/g, "");
  const numberValue = Number(cleaned);
  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : "";
}

function findBoxAmount(text: string, box: string) {
  const compact = text.replace(/\s+/g, " ");
  const patterns = [
    new RegExp(`(?:box\\s*)?${box}[^0-9$-]{0,80}([$]?\\d[\\d,\\s]*(?:\\.\\d{2})?)`, "i"),
    new RegExp(`${box}\\s+([$]?\\d[\\d,\\s]*(?:\\.\\d{2})?)`, "i")
  ];

  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match?.[1]) {
      return normalizeAmount(match[1]);
    }
  }

  return "";
}

function findNamedValue(text: string, labels: string[]) {
  const compact = text.replace(/\s+/g, " ");
  for (const label of labels) {
    const pattern = new RegExp(`${label}[:\\s-]{1,12}([A-Za-z0-9&.,' /-]{2,80})`, "i");
    const match = compact.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return "";
}

async function readFileText(file: File) {
  try {
    return (await file.text()).slice(0, 120000);
  } catch {
    return "";
  }
}

export function T4UploadWorkflow() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [extracted, setExtracted] = useState<ExtractedT4 | null>(null);
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const documentDate = String(formData.get("documentDate") ?? "") || todayInputDate();
    const taxYear = String(formData.get("taxYear") ?? documentDate.slice(0, 4));

    if (!file) {
      setStatus("Choose a T4 file first.");
      return;
    }

    if (!configured) {
      setStatus("Supabase is required before uploading T4 slips.");
      return;
    }

    setStatus("Reading T4 boxes...");
    const text = await readFileText(file);
    const extractedValues = {
      employerName: findNamedValue(text, ["Employer", "Employer name", "Name of employer"]),
      employeeName: findNamedValue(text, ["Employee", "Employee name", "Name of employee"]),
      box14: findBoxAmount(text, "14"),
      box16: findBoxAmount(text, "16"),
      box18: findBoxAmount(text, "18"),
      box22: findBoxAmount(text, "22")
    };
    const foundBoxes = [extractedValues.box14, extractedValues.box16, extractedValues.box18, extractedValues.box22].filter(Boolean).length;

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setStatus("Please sign in before uploading T4 slips.");
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/t4/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("tax-documents").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (uploadError) {
      setStatus(`T4 upload failed: ${uploadError.message}`);
      return;
    }

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({
        client_id: user.id,
        uploaded_by: user.id,
        bucket: "tax-documents",
        storage_path: path,
        document_type: "t4_slip",
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        document_date: documentDate,
        tax_year: Number(taxYear),
        status: "uploaded"
      })
      .select("id")
      .single();

    if (documentError || !document) {
      setStatus(`T4 uploaded, but document record failed: ${documentError?.message ?? "Unknown error"}`);
      return;
    }

    const { data: t4Slip, error: slipError } = await supabase
      .from("t4_slips")
      .insert({
        client_id: user.id,
        document_id: document.id,
        tax_year: Number(taxYear),
        employer_name: extractedValues.employerName || null,
        employee_name: extractedValues.employeeName || null,
        box_14_employment_income: extractedValues.box14 || null,
        box_16_cpp_contributions: extractedValues.box16 || null,
        box_18_ei_premiums: extractedValues.box18 || null,
        box_22_income_tax_deducted: extractedValues.box22 || null,
        extraction_status: foundBoxes > 0 ? "extracted" : "needs_client_entry",
        extraction_method: "browser_text_regex",
        extracted_text_sample: text.slice(0, 4000),
        review_status: "awaiting_client_confirmation"
      })
      .select("id")
      .single();

    if (slipError || !t4Slip) {
      setStatus(`T4 uploaded, but extraction record failed: ${slipError?.message ?? "Unknown error"}`);
      return;
    }

    setExtracted({
      slipId: t4Slip.id,
      documentName: file.name,
      documentDate,
      taxYear,
      ...extractedValues
    });
    setStatus(foundBoxes > 0 ? "T4 read complete. Confirm or correct the extracted boxes." : "T4 uploaded. Enter the box numbers from the slip, then confirm.");
    setFile(null);
    form.reset();
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!extracted) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("t4_slips")
      .update({
        tax_year: Number(form.get("taxYear") ?? extracted.taxYear),
        employer_name: String(form.get("employerName") ?? "").trim() || null,
        employee_name: String(form.get("employeeName") ?? "").trim() || null,
        box_14_employment_income: String(form.get("box14") ?? "") || null,
        box_16_cpp_contributions: String(form.get("box16") ?? "") || null,
        box_18_ei_premiums: String(form.get("box18") ?? "") || null,
        box_22_income_tax_deducted: String(form.get("box22") ?? "") || null,
        client_notes: String(form.get("clientNotes") ?? "").trim() || null,
        client_confirmed_at: new Date().toISOString(),
        extraction_status: "client_confirmed",
        review_status: "pending_admin_review"
      })
      .eq("id", extracted.slipId);

    if (error) {
      setStatus(`Could not confirm T4: ${error.message}`);
      return;
    }

    setStatus("T4 confirmed. Exodus Pathways will review it.");
    setExtracted(null);
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 rounded-md border border-exodus-gold/35 bg-white p-5 shadow-sm md:grid-cols-4">
        {["Upload T4", "Read boxes 14, 16, 18, 22", "Client confirms", "Exodus reviews"].map((step, index) => (
          <div key={step} className="rounded-md bg-exodus-light p-4">
            <p className="text-xs font-black uppercase text-exodus-slate">Step {index + 1}</p>
            <p className="mt-2 text-sm font-black text-exodus-navy">{step}</p>
          </div>
        ))}
      </section>

      <form onSubmit={handleUpload} className="rounded-md border border-dashed border-exodus-blue/35 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-exodus-light text-exodus-blue">
            <ScanText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-black text-exodus-navy">Upload T4</h2>
            <p className="mt-1 text-sm leading-6 text-exodus-slate">
              The system attempts to read boxes 14, 16, 18, and 22. You can correct the numbers before confirming.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[180px_180px_1fr_auto]">
          <label className="grid gap-2">
            <span className="label">T4 Year</span>
            <input name="taxYear" type="number" min="2000" max="2100" className="field" defaultValue={new Date().getFullYear() - 1} required />
          </label>
          <label className="grid gap-2">
            <span className="label">T4 Date</span>
            <input name="documentDate" type="date" className="field" defaultValue={todayInputDate()} required />
          </label>
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 self-end rounded-md border border-slate-200 bg-exodus-light px-4 text-sm font-black text-exodus-navy">
            <FileText className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
            {file ? file.name : "Choose T4 file"}
            <input
              className="sr-only"
              type="file"
              accept="image/*,.pdf,.txt,.csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              aria-label="Choose T4 file"
            />
          </label>
          <button type="submit" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-md bg-exodus-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-exodus-blue">
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            Upload and Read
          </button>
        </div>
        {status ? <p className="mt-3 text-sm font-semibold text-exodus-navy">{status}</p> : null}
      </form>

      {extracted ? (
        <form onSubmit={handleConfirm} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
            <h2 className="text-lg font-black text-exodus-navy">Confirm Extracted T4 Numbers</h2>
          </div>
          <p className="mt-2 text-sm font-semibold text-exodus-slate">{extracted.documentName}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2">
              <span className="label">T4 Year</span>
              <input name="taxYear" type="number" className="field" defaultValue={extracted.taxYear} required />
            </label>
            <label className="grid gap-2">
              <span className="label">Employer</span>
              <input name="employerName" className="field" defaultValue={extracted.employerName} />
            </label>
            <label className="grid gap-2">
              <span className="label">Employee</span>
              <input name="employeeName" className="field" defaultValue={extracted.employeeName} />
            </label>
            <label className="grid gap-2">
              <span className="label">Box 14 Employment Income</span>
              <input name="box14" type="number" min="0" step="0.01" className="field" defaultValue={extracted.box14} required />
            </label>
            <label className="grid gap-2">
              <span className="label">Box 16 CPP Contributions</span>
              <input name="box16" type="number" min="0" step="0.01" className="field" defaultValue={extracted.box16} required />
            </label>
            <label className="grid gap-2">
              <span className="label">Box 18 EI Premiums</span>
              <input name="box18" type="number" min="0" step="0.01" className="field" defaultValue={extracted.box18} required />
            </label>
            <label className="grid gap-2">
              <span className="label">Box 22 Income Tax Deducted</span>
              <input name="box22" type="number" min="0" step="0.01" className="field" defaultValue={extracted.box22} required />
            </label>
            <label className="grid gap-2 md:col-span-2 xl:col-span-4">
              <span className="label">Notes for Exodus Pathways</span>
              <textarea name="clientNotes" className="field min-h-24" placeholder="Anything you want us to know about this T4." />
            </label>
          </div>
          <button type="submit" className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-exodus-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-exodus-blue">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Confirm and Send for Review
          </button>
        </form>
      ) : null}
    </div>
  );
}
