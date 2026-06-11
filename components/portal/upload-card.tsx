"use client";

import { FormEvent, useMemo, useState } from "react";
import { Camera, UploadCloud } from "lucide-react";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured
} from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n/provider";

type UploadCardProps = {
  bucket: "receipts" | "invoices" | "bank-statements" | "immigration-documents" | "tax-documents" | "client-documents";
  documentType: string;
  title?: string;
  taxYear?: number;
};

function documentDateLabel(documentType: string) {
  if (documentType.includes("bank_statement")) {
    return "Bank Statement Date";
  }

  if (documentType.includes("receipt")) {
    return "Receipt Date";
  }

  if (documentType.includes("invoice")) {
    return "Invoice Date";
  }

  if (documentType.includes("payroll")) {
    return "Payroll Period Date";
  }

  if (documentType.includes("gst")) {
    return "GST Filing Period";
  }

  return "Document Date";
}

export function UploadCard({ bucket, documentType, title = "Upload files", taxYear }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);
  const { t } = useT();

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!configured) {
      setStatus("Add Supabase environment variables to enable secure uploads.");
      return;
    }
    if (!file) {
      setStatus("Choose a file first.");
      return;
    }

    try {
      setStatus("Uploading...");
      const formData = new FormData(form);
      const rawDocumentDate = String(formData.get("documentDate") ?? "").trim();
      const documentDate = rawDocumentDate || null;
      const documentYear = documentDate ? Number(documentDate.slice(0, 4)) : undefined;
      const effectiveTaxYear = documentYear || taxYear;
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setStatus("Please sign in before uploading files.");
        return;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false
      });

      if (error) {
        setStatus(`Upload failed: ${error.message}`);
        return;
      }

      const { error: documentError } = await supabase.from("documents").insert({
        client_id: user.id,
        uploaded_by: user.id,
        bucket,
        storage_path: path,
        document_type: documentType,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        document_date: documentDate,
        tax_year: effectiveTaxYear,
        status: "uploaded"
      });

      if (documentError) {
        setStatus(`Upload saved, but document record failed: ${documentError.message}`);
        return;
      }

      if (bucket === "receipts") {
        const { error: receiptError } = await supabase.from("receipts").insert({
          client_id: user.id,
          bucket,
          storage_path: path,
          file_name: file.name,
          receipt_date: documentDate,
          tax_year: effectiveTaxYear ?? new Date().getFullYear(),
          status: "uploaded"
        });

        if (receiptError) {
          setStatus(`Upload saved, but receipt record failed: ${receiptError.message}`);
          return;
        }
      }

      if (bucket === "bank-statements") {
        const { error: statementError } = await supabase.from("bank_statements").insert({
          client_id: user.id,
          bucket,
          storage_path: path,
          file_name: file.name,
          statement_month: documentDate ?? `${effectiveTaxYear ?? new Date().getFullYear()}-01-01`,
          tax_year: effectiveTaxYear ?? new Date().getFullYear(),
          status: "uploaded"
        });

        if (statementError) {
          setStatus(`Upload saved, but bank statement record failed: ${statementError.message}`);
          return;
        }
      }

      setFile(null);
      setStatus("Uploaded securely.");
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed. Please try again.");
    }
  }

  return (
    <form onSubmit={handleUpload} className="rounded-md border border-dashed border-exodus-blue/35 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-exodus-light text-exodus-blue">
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-black text-exodus-navy">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-exodus-slate">
            {t("common.noBankLogin")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[220px_1fr_1fr_auto]">
        <label className="grid gap-2">
          <span className="label">{documentDateLabel(documentType)}</span>
          <input name="documentDate" type="date" className="field" />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-exodus-light px-4 text-sm font-black text-exodus-navy">
          <UploadCloud className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
          {t("common.chooseFile")}
          <input
            className="sr-only"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            aria-label={t("common.chooseFile")}
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-exodus-navy shadow-sm">
          <Camera className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
          {t("common.takePicture")}
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            aria-label={t("common.takePicture")}
          />
        </label>
        <button
          type="submit"
          className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-exodus-blue"
        >
          {t("common.upload")}
        </button>
      </div>
      {status ? <p className="mt-3 text-sm font-semibold text-exodus-navy">{status}</p> : null}
    </form>
  );
}
