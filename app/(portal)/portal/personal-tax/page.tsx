import { AccountingHeader, AccountingTable, ClientAccountingFilter } from "@/components/portal/accounting-records";
import { PersonalTaxUploadForm } from "@/components/portal/personal-tax-upload-form";
import { parseYear } from "@/lib/accounting/data";
import { getCurrentUserRecord } from "@/lib/supabase/server";
import {
  getPersonalTaxSlips,
  getTaxSlipExtractions,
  personalTaxSlipRows,
  taxSlipExtractionRows
} from "@/lib/tax/personal-tax";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PersonalTaxPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const user = await getCurrentUserRecord();
  const slips = await getPersonalTaxSlips(user.id, taxYear);
  const extractions = await getTaxSlipExtractions(slips.map((slip) => slip.id));

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Personal Tax"
        description="Upload personal tax slips by year. T4 extraction is prepared for boxes 14, 16, 18, 20, and 22."
      >
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/personal-tax" />
      </AccountingHeader>
      <PersonalTaxUploadForm taxYear={taxYear} />
      <AccountingTable
        title={`${taxYear} Tax Slips`}
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
      <AccountingTable
        title="Future T4 Extraction Boxes"
        description="These rows are prepared for future OCR. Exodus Pathways can review or update them from the admin portal."
        columns={[
          { key: "box", label: "Box" },
          { key: "label", label: "Label" },
          { key: "extracted", label: "Extracted Value" },
          { key: "confirmed", label: "Confirmed Value" },
          { key: "status", label: "Status" }
        ]}
        rows={taxSlipExtractionRows(extractions)}
      />
    </div>
  );
}
