"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, FilePlus2, UploadCloud } from "lucide-react";
import { createBrowserSupabaseClient, isBrowserSupabaseConfigured } from "@/lib/supabase/browser";

type CompanyChoice = { id: string; name: string };

type ClientDocumentWorkspaceProps = {
  companies: CompanyChoice[];
  taxYear: number;
  rows: Array<Record<string, string>>;
};

const documentTypes = [
  { value: "receipt", label: "Scan Receipt" },
  { value: "bank_statement", label: "Upload Bank Statement" },
  { value: "invoice", label: "Upload Invoice" },
  { value: "tax_document", label: "Upload Tax Document" },
  { value: "payroll_document", label: "Payroll / Worker Document" },
  { value: "client_document", label: "Other Document" }
];

const acceptedFormats = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.tif,.tiff,.doc,.docx,.xls,.xlsx,.csv";
const maxFileSize = 50 * 1024 * 1024;

export function ClientDocumentWorkspace({ companies, taxYear, rows }: ClientDocumentWorkspaceProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);
  const years = Array.from({ length: 12 }, (_, index) => taxYear - index);

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles((current) => [...current, ...Array.from(event.target.files ?? [])]);
    event.target.value = "";
  }

  async function uploadDocuments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const documentType = String(form.get("documentType") ?? "client_document");
    const companyId = String(form.get("companyId") ?? "") || null;
    const selectedYear = Number(form.get("taxYear") ?? taxYear);
    const documentDate = String(form.get("documentDate") ?? "") || null;

    if (!configured) {
      setStatus("Supabase must be configured before secure uploads are available.");
      return;
    }
    if (files.length === 0) {
      setStatus("Choose or scan at least one file.");
      return;
    }
    if (!Number.isInteger(selectedYear) || selectedYear < 2000 || selectedYear > taxYear + 2) {
      setStatus("Choose a valid tax year.");
      return;
    }
    const oversized = files.find((file) => file.size > maxFileSize);
    if (oversized) {
      setStatus(`${oversized.name} exceeds the 50 MB file limit.`);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setStatus("Please sign in again before uploading files.");
      return;
    }

    let uploadedCount = 0;
    for (const [index, file] of files.entries()) {
      setStatus(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const storagePath = `${user.id}/${companyId ?? "unassigned"}/${selectedYear}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("client-documents").upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined
      });

      if (uploadError) {
        setStatus(`${uploadedCount} file(s) saved. Upload stopped at ${file.name}: ${uploadError.message}`);
        return;
      }

      const { error: recordError } = await supabase.from("documents").insert({
        client_id: user.id,
        uploaded_by: user.id,
        company_id: companyId,
        bucket: "client-documents",
        storage_path: storagePath,
        document_type: documentType,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
        document_date: documentDate,
        tax_year: selectedYear,
        status: "uploaded"
      });

      if (recordError) {
        setStatus(`${uploadedCount} file(s) saved. ${file.name} uploaded but its document record could not be saved: ${recordError.message}`);
        return;
      }
      uploadedCount += 1;
    }

    setFiles([]);
    setStatus(`${uploadedCount} document(s) uploaded securely. Processing status will appear below.`);
    window.location.reload();
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="eyebrow">Secure client uploads</p>
        <h1 className="mt-2 text-3xl font-black text-exodus-navy">Scan and upload documents</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-exodus-slate">
          Send receipts, statements, invoices, tax files, payroll files, and other records to your accounting team. Staff review and classify documents for you.
        </p>

        <form onSubmit={uploadDocuments} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-2">
              <span className="label">Document type</span>
              <select name="documentType" className="field" defaultValue="receipt">
                {documentTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">Company</span>
              <select name="companyId" className="field" defaultValue={companies.length === 1 ? companies[0].id : ""}>
                <option value="">Personal / not linked</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">Tax year</span>
              <select name="taxYear" className="field" defaultValue={taxYear}>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">Document date (optional)</span>
              <input name="documentDate" type="date" className="field" />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="focus-ring flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-exodus-light px-4 text-sm font-black text-exodus-navy">
              <FilePlus2 className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
              Choose files (multiple pages supported)
              <input className="sr-only" type="file" accept={acceptedFormats} multiple onChange={selectFiles} />
            </label>
            <label className="focus-ring flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-exodus-navy">
              <Camera className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
              Scan with camera
              <input className="sr-only" type="file" accept="image/*" capture="environment" multiple onChange={selectFiles} />
            </label>
          </div>

          {files.length ? (
            <ul className="grid gap-2 rounded-md bg-exodus-light p-4 text-sm text-exodus-navy">
              {files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${index}`}>{file.name} <span className="text-exodus-slate">({(file.size / 1024 / 1024).toFixed(1)} MB)</span></li>)}
            </ul>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" disabled={!configured} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-exodus-navy px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
              <UploadCloud className="h-4 w-4" aria-hidden="true" /> Upload securely
            </button>
            {status ? <p role="status" className="text-sm font-semibold text-exodus-navy">{status}</p> : null}
          </div>
          <p className="text-xs leading-5 text-exodus-slate">PDF, images, Office documents, and CSV are accepted. Each file is private and linked to your account, selected company, and tax year. Maximum 50 MB per file.</p>
        </form>
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-2xl font-black text-exodus-navy">My Documents</h2>
          <p className="mt-1 text-sm leading-6 text-exodus-slate">Check the latest review and processing status for each upload.</p>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-exodus-light text-xs uppercase tracking-wide text-exodus-slate"><tr>{["Document", "Type", "Company", "Tax year", "Uploaded", "Status"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={`${row.name}-${index}`}>
                <td className="px-4 py-3 font-semibold text-exodus-navy">{row.nameHref ? <a href={row.nameHref} target="_blank" rel="noreferrer" className="underline underline-offset-2">{row.name}</a> : row.name}</td>
                <td className="px-4 py-3">{row.type}</td><td className="px-4 py-3">{row.company}</td><td className="px-4 py-3">{row.year}</td><td className="px-4 py-3">{row.uploadedDate}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">{row.status}</span>{row.note !== "-" ? <p className="mt-1 max-w-xs text-xs text-exodus-slate">{row.note}</p> : null}</td>
              </tr>)}</tbody>
            </table>
          </div>
        ) : <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-exodus-slate">No documents uploaded yet.</div>}
      </section>
    </div>
  );
}
