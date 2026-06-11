import { AccountingHeader, AccountingTable, ClientAccountingFilter, PayrollSummaryTable } from "@/components/portal/accounting-records";
import { SmartPayrollForm } from "@/components/portal/smart-payroll-form";
import { UploadCard } from "@/components/portal/upload-card";
import { getClientAccountingData, parseYear, payrollTableRows } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientPayrollPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const accounting = await getClientAccountingData(taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Payroll"
        description="Review payroll periods, employee counts, gross payroll totals, and supporting documents for payroll processing."
      >
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/payroll" />
      </AccountingHeader>
      <SmartPayrollForm taxYear={taxYear} />
      <UploadCard bucket="client-documents" documentType="payroll_document" title="Upload payroll document" taxYear={taxYear} />
      <AccountingTable
        title={`${accounting.taxYear} Payroll Records`}
        columns={[
          { key: "period", label: "Period" },
          { key: "employees", label: "Employees" },
          { key: "gross", label: "Gross payroll" },
          { key: "deductions", label: "Deductions" },
          { key: "status", label: "Status" }
        ]}
        rows={payrollTableRows(accounting)}
      />
      <PayrollSummaryTable data={accounting} />
    </div>
  );
}
