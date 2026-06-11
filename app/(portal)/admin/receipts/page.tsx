import { AccountingHeader, AccountingTable, AdminAccountingFilter } from "@/components/portal/accounting-records";
import { getAdminAccountingData, parseYear, receiptTableRows } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReceiptsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Receipts" description="Real receipt records for the selected client and year.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/receipts" />
      </AccountingHeader>
      <AccountingTable
        title={`${selectedClient?.companyName ?? "Client"} Receipts`}
        columns={[
          { key: "date", label: "Date" },
          { key: "paidTo", label: "Paid To" },
          { key: "name", label: "File name" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" }
        ]}
        rows={data ? receiptTableRows(data) : []}
      />
    </div>
  );
}
