import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { clientRows, getClientOptions } from "@/lib/accounting/data";

export default async function AdminClientsPage() {
  const clients = await getClientOptions();

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="All Clients"
        description="Admin view for real client records from public.users and linked company records."
      />
      <AccountingTable
        title="Clients"
        columns={[
          { key: "client", label: "Client" },
          { key: "owner", label: "Owner" },
          { key: "email", label: "Email" },
          { key: "status", label: "Status" }
        ]}
        rows={clientRows(clients, "/admin/clients")}
      />
    </div>
  );
}
