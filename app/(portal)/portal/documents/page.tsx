import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { UploadCard } from "@/components/portal/upload-card";
import { getDocumentRowsForScope } from "@/lib/accounting/data";
import { getCurrentUserRecord } from "@/lib/supabase/server";

export default async function DocumentsPage() {
  const user = await getCurrentUserRecord();
  const rows = await getDocumentRowsForScope(user.id);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Documents"
        description="Upload and review shared client documents including invoices, tax slips, CRA notices, corporate records, and immigration files."
      />
      <UploadCard bucket="client-documents" documentType="client_document" title="Upload client document" />
      <AccountingTable
        title="Uploaded Documents"
        columns={[
          { key: "name", label: "Document Name" },
          { key: "documentDate", label: "Document Date" },
          { key: "uploadedDate", label: "Uploaded Date" },
          { key: "status", label: "Status" },
          { key: "type", label: "Type" }
        ]}
        rows={rows}
      />
    </div>
  );
}
