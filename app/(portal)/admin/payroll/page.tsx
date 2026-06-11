import { AccountingHeader, AccountingTable, AdminAccountingFilter, PayrollSummaryTable } from "@/components/portal/accounting-records";
import { getAdminAccountingData, parseYear, payrollTableRows } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPayrollPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Payroll" description="Admin payroll records for the selected client and year.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/payroll" />
      </AccountingHeader>
      <AccountingTable
        title={`${selectedClient?.companyName ?? "Client"} Payroll`}
        columns={[
          { key: "period", label: "Period" },
          { key: "employees", label: "Employees" },
          { key: "gross", label: "Gross payroll" },
          { key: "deductions", label: "Deductions" },
          { key: "status", label: "Status" }
        ]}
        rows={data ? payrollTableRows(data) : []}
      />
      {data ? <PayrollSummaryTable data={data} /> : null}
    </div>
  );
}
