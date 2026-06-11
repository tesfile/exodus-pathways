import { AccountingHeader, AccountingTable, AdminAccountingFilter } from "@/components/portal/accounting-records";
import { assetTableRows, getAdminAccountingData, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAssetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Assets" description="Real asset records for the selected client and year.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/assets" />
      </AccountingHeader>
      <AccountingTable
        title={`${selectedClient?.companyName ?? "Client"} Assets`}
        columns={[
          { key: "date", label: "Date" },
          { key: "description", label: "Description" },
          { key: "class", label: "Class" },
          { key: "cost", label: "Cost" },
          { key: "status", label: "Status" }
        ]}
        rows={data ? assetTableRows(data) : []}
      />
    </div>
  );
}
