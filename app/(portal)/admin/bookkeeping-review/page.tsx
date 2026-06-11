import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getTaskRows } from "@/lib/portal/records";

export default async function BookkeepingReviewPage() {
  const rows = await getTaskRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Bookkeeping Review" description="Monthly review tasks, missing receipt follow-ups, bank statement checks, and reconciliation notes." />
      <AccountingTable
        title="Bookkeeping Tasks"
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
