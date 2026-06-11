import { AccountingHeader, AccountingTable, AdminAccountingFilter } from "@/components/portal/accounting-records";
import { bankStatementTableRows, getAdminAccountingData, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBankStatementsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Bank Statements" description="Real bank statement records for the selected client and year.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/bank-statements" />
      </AccountingHeader>
      <AccountingTable
        title={`${selectedClient?.companyName ?? "Client"} Bank Statements`}
        columns={[
          { key: "month", label: "Month" },
          { key: "bank", label: "Bank" },
          { key: "account", label: "Account" },
          { key: "name", label: "File name" },
          { key: "status", label: "Status" }
        ]}
        rows={data ? bankStatementTableRows(data) : []}
      />
    </div>
  );
}
