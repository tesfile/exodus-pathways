import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getTaskRows } from "@/lib/portal/records";

export default async function EmployeeReportsPage() {
  const rows = await getTaskRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Reports" description="Assigned-client report tasks and export work." />
      <AccountingTable
        title="Report Tasks"
        columns={[
          { key: "task", label: "Task" },
          { key: "client", label: "Client" },
          { key: "owner", label: "Owner" },
          { key: "due", label: "Due" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
