import { AccountingHeader, AccountingTable, AdminAccountingFilter } from "@/components/portal/accounting-records";
import { getAdminAccountingData, getTaxYearRows, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TaxYearsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const [{ clients, selectedClient }, rows] = await Promise.all([
    getAdminAccountingData(clientId, taxYear),
    getTaxYearRows()
  ]);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Tax Years" description="Admin year folders for real client accounting and tax records.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/tax-years" />
      </AccountingHeader>
      <AccountingTable
        title="Client Tax Years"
        columns={[
          { key: "client", label: "Client" },
          { key: "year", label: "Year" },
          { key: "income", label: "Income" },
          { key: "expenses", label: "Expenses" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
