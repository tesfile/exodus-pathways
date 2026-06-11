import { revalidatePath } from "next/cache";
import Link from "next/link";
import { AccountingHeader, AccountingTable, AdminAccountingFilter } from "@/components/portal/accounting-records";
import { formatDate, formatDateTime, parseYear } from "@/lib/accounting/data";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";
import {
  displaySlipStatus,
  getPersonalTaxClientSummaryRows,
  getPersonalTaxSlips,
  getTaxSlipExtractions,
  personalTaxSlipRows,
  type PersonalTaxSlip,
  type TaxSlipExtraction
} from "@/lib/tax/personal-tax";
import { getClientOptions } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function reviewPersonalTaxAction(formData: FormData) {
  "use server";

  const admin = await requireRole(["admin"]);
  const slipId = String(formData.get("slipId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "");
  const taxYear = String(formData.get("taxYear") ?? "");
  const extractionIds = formData.getAll("extractionId").map(String);

  if (!slipId) {
    return;
  }

  const supabase = await createServerSupabaseClient();

  await Promise.all(
    extractionIds.map((id) => {
      const extracted = String(formData.get(`extracted_${id}`) ?? "").trim();
      const confirmed = String(formData.get(`confirmed_${id}`) ?? "").trim();
      const status = String(formData.get(`status_${id}`) ?? "reviewed");
      return supabase
        .from("tax_slip_extractions")
        .update({
          extracted_value: extracted ? Number(extracted) : null,
          confirmed_value: confirmed ? Number(confirmed) : null,
          status
        })
        .eq("id", id);
    })
  );

  const slipUpdates: Record<string, string | null> = {
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString(),
    review_notes: reviewNotes || null
  };

  if (action === "approve") {
    slipUpdates.status = "approved";
  } else if (action === "ready") {
    slipUpdates.status = "ready_for_tax_preparation";
  } else {
    slipUpdates.status = "review_in_progress";
  }

  await supabase.from("personal_tax_slips").update(slipUpdates).eq("id", slipId);
  revalidatePath(`/admin/personal-tax?clientId=${clientId}&year=${taxYear}`);
  revalidatePath("/admin/personal-tax");
}

export default async function AdminPersonalTaxPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const clients = await getClientOptions();
  const selectedClient = clients.find((client) => client.id === clientId) ?? clients[0] ?? null;
  const [summaryRows, slips] = await Promise.all([
    getPersonalTaxClientSummaryRows(taxYear),
    selectedClient ? getPersonalTaxSlips(selectedClient.id, taxYear) : Promise.resolve([])
  ]);
  const extractions = await getTaxSlipExtractions(slips.map((slip) => slip.id));
  const extractionsBySlip = new Map<string, TaxSlipExtraction[]>();

  extractions.forEach((extraction) => {
    extractionsBySlip.set(extraction.slip_id, [...(extractionsBySlip.get(extraction.slip_id) ?? []), extraction]);
  });

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Personal Tax"
        description="Review uploaded personal tax slips, T4 extraction placeholders, and tax preparation readiness by client and year."
      >
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/personal-tax" />
      </AccountingHeader>
      <AccountingTable
        title={`${taxYear} Personal Tax Clients`}
        columns={[
          { key: "client", label: "Client" },
          { key: "year", label: "Tax Year" },
          { key: "slips", label: "Uploaded Slips" },
          { key: "ready", label: "Ready" },
          { key: "status", label: "Status" }
        ]}
        rows={summaryRows}
      />
      <AccountingTable
        title={`${selectedClient?.companyName ?? "Client"} Uploaded Slips`}
        columns={[
          { key: "file", label: "Tax Slip" },
          { key: "type", label: "Slip Type" },
          { key: "payer", label: "Employer / Payer" },
          { key: "documentDate", label: "Document Date" },
          { key: "uploadedDate", label: "Uploaded Date" },
          { key: "status", label: "Status" },
          { key: "notes", label: "Notes" }
        ]}
        rows={personalTaxSlipRows(slips)}
      />
      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-black text-exodus-navy">Review Extraction</h2>
          <p className="mt-1 text-sm leading-6 text-exodus-slate">
            Edit extracted and confirmed values, approve the slip, or mark it ready for tax preparation.
          </p>
        </div>
        {slips.length > 0 ? (
          <div className="grid gap-4">
            {slips.map((slip) => (
              <PersonalTaxReviewCard
                key={slip.id}
                slip={slip}
                extractions={extractionsBySlip.get(slip.id) ?? []}
                selectedClientId={selectedClient?.id ?? ""}
                taxYear={taxYear}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-exodus-slate">
            No personal tax slips uploaded for this client and year.
          </div>
        )}
      </section>
    </div>
  );
}

function PersonalTaxReviewCard({
  slip,
  extractions,
  selectedClientId,
  taxYear
}: {
  slip: PersonalTaxSlip;
  extractions: TaxSlipExtraction[];
  selectedClientId: string;
  taxYear: number;
}) {
  return (
    <form action={reviewPersonalTaxAction} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="slipId" value={slip.id} />
      <input type="hidden" name="clientId" value={selectedClientId} />
      <input type="hidden" name="taxYear" value={taxYear} />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-black text-exodus-navy">{slip.file_name}</p>
              <p className="mt-1 text-sm font-semibold text-exodus-slate">
                {slip.client_name} | {slip.slip_type} | {slip.tax_year}
              </p>
              <p className="mt-1 text-sm text-exodus-slate">Employer / Payer: {slip.payer_name ?? "-"}</p>
              <p className="mt-1 text-sm text-exodus-slate">Document Date: {formatDate(slip.document_date)}</p>
              <p className="mt-1 text-sm text-exodus-slate">Uploaded Date: {formatDateTime(slip.uploaded_at)}</p>
            </div>
            <span className="rounded-md bg-exodus-light px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-exodus-navy">
              {displaySlipStatus(slip.status)}
            </span>
          </div>
          {slip.download_url ? (
            <Link href={slip.download_url} className="mt-3 inline-flex text-sm font-black text-exodus-blue underline-offset-4 hover:underline">
              Download slip
            </Link>
          ) : null}
          <div className="mt-5 grid gap-3">
            {extractions.length > 0 ? (
              extractions.map((extraction) => (
                <div key={extraction.id} className="grid gap-3 rounded-md bg-exodus-light p-4 md:grid-cols-[80px_1fr_150px_150px_160px]">
                  <input type="hidden" name="extractionId" value={extraction.id} />
                  <div>
                    <p className="text-xs font-black uppercase text-exodus-slate">Box</p>
                    <p className="mt-2 font-black text-exodus-navy">{extraction.box_number}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-exodus-slate">Label</p>
                    <p className="mt-2 font-black text-exodus-navy">{extraction.box_label}</p>
                  </div>
                  <label className="grid gap-2">
                    <span className="label">Extracted</span>
                    <input name={`extracted_${extraction.id}`} type="number" min="0" step="0.01" className="field" defaultValue={amountInputValue(extraction.extracted_value)} />
                  </label>
                  <label className="grid gap-2">
                    <span className="label">Confirmed</span>
                    <input name={`confirmed_${extraction.id}`} type="number" min="0" step="0.01" className="field" defaultValue={amountInputValue(extraction.confirmed_value)} />
                  </label>
                  <label className="grid gap-2">
                    <span className="label">Status</span>
                    <select name={`status_${extraction.id}`} className="field" defaultValue={extraction.status}>
                      <option value="not_extracted">Not Extracted</option>
                      <option value="extracted">Extracted</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="reviewed">Reviewed</option>
                    </select>
                  </label>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold text-exodus-slate">
                Extraction rows are prepared for T4 slips. Other slip types are stored for review.
              </div>
            )}
          </div>
        </div>
        <div className="grid content-start gap-3">
          <label className="grid gap-2">
            <span className="label">Review Notes</span>
            <textarea name="reviewNotes" className="field min-h-28" defaultValue={slip.review_notes ?? ""} />
          </label>
          <button name="action" value="save" className="focus-ring min-h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-exodus-navy">
            Save Extraction Review
          </button>
          <button name="action" value="approve" className="focus-ring min-h-11 rounded-md bg-emerald-700 px-4 text-sm font-black text-white">
            Approve Slip
          </button>
          <button name="action" value="ready" className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
            Mark Ready for Tax Preparation
          </button>
        </div>
      </div>
    </form>
  );
}

function amountInputValue(value: number | string | null) {
  return value === null || value === "" ? "" : String(value);
}
