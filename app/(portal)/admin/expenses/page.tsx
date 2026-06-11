import { AccountingHeader, AccountingTable, AdminAccountingFilter } from "@/components/portal/accounting-records";
import { expenseTableRows, getAdminAccountingData, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminExpensesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Expenses" description="Admin view of real expense entries for the selected client and year.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/expenses" />
      </AccountingHeader>
      <AccountingTable
        title={`${selectedClient?.companyName ?? "Client"} Expenses`}
        columns={[
          { key: "date", label: "Date" },
          { key: "paidTo", label: "Paid To" },
          { key: "what", label: "What" },
          { key: "type", label: "Type" },
          { key: "amount", label: "Amount" },
          { key: "gst", label: "GST" },
          { key: "status", label: "Status" }
        ]}
        rows={data ? expenseTableRows(data) : []}
      />
    </div>
  );
}
