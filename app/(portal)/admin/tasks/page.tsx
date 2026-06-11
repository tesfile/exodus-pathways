import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getTaskRows } from "@/lib/portal/records";

export default async function AdminTasksPage() {
  const rows = await getTaskRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Tasks" description="Admin tasks with staff assignment, deadlines, priority, and status." />
      <AccountingTable
        title="Tasks"
        columns={[
          { key: "task", label: "Task" },
          { key: "client", label: "Client" },
          { key: "owner", label: "Assigned Staff" },
          { key: "due", label: "Deadline" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
