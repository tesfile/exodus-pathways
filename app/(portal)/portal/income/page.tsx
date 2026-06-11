import { AccountingHeader, AccountingTable, ClientAccountingFilter } from "@/components/portal/accounting-records";
import { SmartIncomeForm } from "@/components/portal/smart-income-form";
import { getClientAccountingData, incomeTableRows, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function IncomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const accounting = await getClientAccountingData(taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Income"
        description="Record money that came into the business using simple words."
      >
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/income" />
      </AccountingHeader>
      <SmartIncomeForm taxYear={taxYear} />
      <AccountingTable
        title={`${accounting.taxYear} Income Entries`}
        columns={[
          { key: "date", label: "Date" },
          { key: "source", label: "Who Paid You / Work Done" },
          { key: "amount", label: "Amount" },
          { key: "gst", label: "GST" },
          { key: "invoice", label: "Invoice" },
          { key: "status", label: "Status" }
        ]}
        rows={incomeTableRows(accounting)}
      />
    </div>
  );
}
