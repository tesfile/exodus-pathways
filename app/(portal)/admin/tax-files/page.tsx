import { revalidatePath } from "next/cache";
import Link from "next/link";
import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { formatDate, formatDateTime, formatMoney } from "@/lib/accounting/data";
import { getTaskRows } from "@/lib/portal/records";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";
import { getT4SlipRecords, type T4SlipRecord } from "@/lib/tax/t4";
import type { DemoRow } from "@/lib/types";

async function reviewT4Action(formData: FormData) {
  "use server";

  const admin = await requireRole(["admin"]);
  const slipId = String(formData.get("slipId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim();

  if (!slipId) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("t4_slips")
    .update({
      review_status: action === "approve" ? "reviewed" : "needs_client_follow_up",
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes || null
    })
    .eq("id", slipId);

  revalidatePath("/admin/tax-files");
}

export default async function TaxFilesPage() {
  const [taskRows, t4Records] = await Promise.all([getTaskRows(), getT4SlipRecords()]);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Tax Files" description="Admin review queue for T1, T2, GST/HST, trial balance, general ledger, and working paper preparation." />
      <AccountingTable
        title="T4 Review Queue"
        description="Client-confirmed T4 slips with boxes 14, 16, 18, and 22 ready for Exodus Pathways review."
        columns={[
          { key: "document", label: "Document" },
          { key: "client", label: "Client" },
          { key: "year", label: "Tax Year" },
          { key: "box14", label: "Box 14" },
          { key: "box16", label: "Box 16" },
          { key: "box18", label: "Box 18" },
          { key: "box22", label: "Box 22" },
          { key: "uploaded", label: "Uploaded" },
          { key: "status", label: "Status" }
        ]}
        rows={t4TableRows(t4Records)}
      />
      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-black text-exodus-navy">Review T4 Details</h2>
          <p className="mt-1 text-sm leading-6 text-exodus-slate">
            Approve the confirmed numbers or request a correction from the client.
          </p>
        </div>
        {t4Records.length > 0 ? (
          <div className="grid gap-4">
            {t4Records.map((record) => (
              <form key={record.id} action={reviewT4Action} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <input type="hidden" name="slipId" value={record.id} />
                <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                  <div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-black text-exodus-navy">{record.document_name}</p>
                        <p className="mt-1 text-sm font-semibold text-exodus-slate">
                          {record.client_name} | Tax year {record.tax_year}
                        </p>
                        <p className="mt-1 text-sm text-exodus-slate">T4 Date: {formatDate(record.document_date)}</p>
                        <p className="mt-1 text-sm text-exodus-slate">Uploaded: {formatDateTime(record.uploaded_at)}</p>
                      </div>
                      <span className="rounded-md bg-exodus-light px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-exodus-navy">
                        {record.review_status}
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <ReviewValue label="Box 14 Employment Income" value={moneyOrDash(record.box_14_employment_income)} />
                      <ReviewValue label="Box 16 CPP Contributions" value={moneyOrDash(record.box_16_cpp_contributions)} />
                      <ReviewValue label="Box 18 EI Premiums" value={moneyOrDash(record.box_18_ei_premiums)} />
                      <ReviewValue label="Box 22 Income Tax Deducted" value={moneyOrDash(record.box_22_income_tax_deducted)} />
                      <ReviewValue label="Employer" value={record.employer_name ?? "-"} />
                      <ReviewValue label="Employee" value={record.employee_name ?? "-"} />
                      <ReviewValue label="Client Confirmed" value={formatDateTime(record.client_confirmed_at)} />
                      <ReviewValue label="Reviewed" value={formatDateTime(record.reviewed_at)} />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-exodus-slate">Client note: {record.client_notes ?? "-"}</p>
                    {record.document_url ? (
                      <Link href={record.document_url} className="mt-3 inline-flex text-sm font-black text-exodus-blue underline-offset-4 hover:underline">
                        Download private T4 file
                      </Link>
                    ) : null}
                  </div>
                  <div className="grid content-start gap-3">
                    <label className="grid gap-2">
                      <span className="label">Review Notes</span>
                      <textarea name="reviewNotes" className="field min-h-28" defaultValue={record.review_notes ?? ""} />
                    </label>
                    <button name="action" value="approve" className="focus-ring min-h-11 rounded-md bg-emerald-700 px-4 text-sm font-black text-white">
                      Mark Reviewed
                    </button>
                    <button name="action" value="request_correction" className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
                      Request Correction
                    </button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-exodus-slate">
            No T4 slips uploaded yet.
          </div>
        )}
      </section>
      <AccountingTable
        title="Tax Tasks"
        columns={[
          { key: "task", label: "Tax item" },
          { key: "client", label: "Client" },
          { key: "owner", label: "Owner" },
          { key: "due", label: "Due" },
          { key: "status", label: "Status" }
        ]}
        rows={taskRows}
      />
    </div>
  );
}

function t4TableRows(records: T4SlipRecord[]): DemoRow[] {
  return records.map((record) => ({
    document: record.document_name,
    documentHref: record.document_url,
    client: record.client_name,
    year: String(record.tax_year),
    box14: moneyOrDash(record.box_14_employment_income),
    box16: moneyOrDash(record.box_16_cpp_contributions),
    box18: moneyOrDash(record.box_18_ei_premiums),
    box22: moneyOrDash(record.box_22_income_tax_deducted),
    uploaded: formatDateTime(record.uploaded_at),
    status: record.review_status
  }));
}

function moneyOrDash(value: number | string | null | undefined) {
  return value === null || value === undefined || value === "" ? "-" : formatMoney(value);
}

function ReviewValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-exodus-light p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-exodus-slate">{label}</p>
      <p className="mt-2 text-sm font-black text-exodus-navy">{value}</p>
    </div>
  );
}
