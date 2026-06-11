import { AccountingHeader, AccountingTable, ClientAccountingFilter } from "@/components/portal/accounting-records";
import { UploadCard } from "@/components/portal/upload-card";
import { getClientAccountingData, parseYear, receiptTableRows } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const accounting = await getClientAccountingData(taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Receipts"
        description="Upload receipts from your phone or computer. Staff can match files to expenses and request missing details."
      >
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/receipts" />
      </AccountingHeader>
      <UploadCard bucket="receipts" documentType="receipt" title="Upload receipt" taxYear={taxYear} />
      <AccountingTable
        title={`${accounting.taxYear} Receipts`}
        columns={[
          { key: "date", label: "Date" },
          { key: "paidTo", label: "Paid To" },
          { key: "name", label: "File name" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" }
        ]}
        rows={receiptTableRows(accounting)}
      />
    </div>
  );
}
