import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { clientRows, getClientOptions } from "@/lib/accounting/data";

export default async function EmployeeClientsPage() {
  const clients = await getClientOptions();

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Clients"
        description="Assigned clients only. Supabase RLS prevents access to unassigned clients."
      />
      <AccountingTable
        title="Assigned Clients"
        columns={[
          { key: "client", label: "Client" },
          { key: "owner", label: "Owner" },
          { key: "email", label: "Email" },
          { key: "status", label: "Status" }
        ]}
        rows={clientRows(clients)}
      />
    </div>
  );
}
