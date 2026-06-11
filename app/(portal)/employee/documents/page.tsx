import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getDocumentRowsForScope } from "@/lib/accounting/data";

export default async function EmployeeDocumentsPage() {
  const rows = await getDocumentRowsForScope();

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Documents"
        description="Documents for assigned clients only, filtered by Supabase RLS."
      />
      <AccountingTable
        title="Assigned Client Documents"
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
