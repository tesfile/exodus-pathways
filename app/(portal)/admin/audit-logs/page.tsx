import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getAuditLogRows } from "@/lib/portal/records";

export default async function AuditLogsPage() {
  const rows = await getAuditLogRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Audit Logs" description="Security, document, task, message, and case activity history." />
      <AccountingTable
        title="Audit Logs"
        columns={[
          { key: "date", label: "Date" },
          { key: "actor", label: "Actor" },
          { key: "action", label: "Action" },
          { key: "area", label: "Area" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
