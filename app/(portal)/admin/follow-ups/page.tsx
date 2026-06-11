import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getFollowUpRows } from "@/lib/portal/records";

export default async function FollowUpsPage() {
  const rows = await getFollowUpRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Follow-Ups" description="Client follow-up requests, follow-up dates, deadlines, assigned staff, priority, and status." />
      <AccountingTable
        title="Follow-Ups"
        columns={[
          { key: "client", label: "Client" },
          { key: "item", label: "Follow-Up" },
          { key: "follow", label: "Follow-Up Date" },
          { key: "staff", label: "Assigned Staff" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
