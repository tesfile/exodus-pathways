import { AccountingHeader, AccountingTable, AdminAccountingFilter } from "@/components/portal/accounting-records";
import { getAdminAccountingData, parseYear, reportRows } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Reports"
        description="Generated report center for Trial Balance, General Ledger, GST Summary, Payroll Summary, and T2 Working Papers."
      >
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/reports" />
      </AccountingHeader>
      <AccountingTable
        title={`${selectedClient?.companyName ?? "Client"} Reports`}
        columns={[
          { key: "report", label: "Report" },
          { key: "period", label: "Period" },
          { key: "records", label: "Records" },
          { key: "total", label: "Total" },
          { key: "status", label: "Status" }
        ]}
        rows={data ? reportRows(data) : []}
      />
    </div>
  );
}
