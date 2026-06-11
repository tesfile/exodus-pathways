import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getIrccRequestRows } from "@/lib/portal/records";

export default async function IrccRequestsPage() {
  const rows = await getIrccRequestRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader title="IRCC Requests" description="Track IRCC request title, requested document, due date, notes, and status." />
      <AccountingTable
        title="IRCC Requests"
        columns={[
          { key: "client", label: "Client" },
          { key: "title", label: "IRCC Request Title" },
          { key: "document", label: "Requested Document" },
          { key: "due", label: "Due Date" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
