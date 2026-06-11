import { AccountingHeader, AccountingTable, ClientAccountingFilter } from "@/components/portal/accounting-records";
import { UploadCard } from "@/components/portal/upload-card";
import { bankStatementTableRows, getClientAccountingData, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BankStatementsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const accounting = await getClientAccountingData(taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Bank Statements"
        description="Upload PDF monthly statements for reconciliation. The portal never asks for bank login credentials."
      >
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/bank-statements" />
      </AccountingHeader>
      <UploadCard bucket="bank-statements" documentType="bank_statement" title="Upload bank statement" taxYear={taxYear} />
      <AccountingTable
        title={`${accounting.taxYear} Bank Statements`}
        columns={[
          { key: "month", label: "Month" },
          { key: "bank", label: "Bank" },
          { key: "account", label: "Account" },
          { key: "name", label: "File name" },
          { key: "status", label: "Status" }
        ]}
        rows={bankStatementTableRows(accounting)}
      />
    </div>
  );
}
