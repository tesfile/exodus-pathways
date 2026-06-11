import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getMessageRows } from "@/lib/portal/records";

export default async function EmployeeMessagesPage() {
  const rows = await getMessageRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Messages"
        description="Messages for assigned clients."
      />
      <AccountingTable
        title="Assigned Client Messages"
        columns={[
          { key: "subject", label: "Subject" },
          { key: "client", label: "Client" },
          { key: "from", label: "From" },
          { key: "date", label: "Date" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
