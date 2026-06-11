import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getDocumentRowsForScope } from "@/lib/accounting/data";

export default async function AdminDocumentsPage() {
  const rows = await getDocumentRowsForScope();

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Client Documents"
        description="Review real uploaded receipts, invoices, bank statements, immigration files, tax documents, and shared client records."
      />
      <AccountingTable
        title="Uploaded Documents"
        columns={[
          { key: "name", label: "Document Name" },
          { key: "documentDate", label: "Document Date" },
          { key: "uploadedDate", label: "Uploaded Date" },
          { key: "status", label: "Status" },
          { key: "client", label: "Client" },
          { key: "type", label: "Type" }
        ]}
        rows={rows}
      />
    </div>
  );
}
