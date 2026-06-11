import { AccountingHeader, AccountingTable, ClientAccountingFilter } from "@/components/portal/accounting-records";
import { SelfEmployedForm } from "@/components/portal/self-employed-form";
import { parseYear } from "@/lib/accounting/data";
import {
  getClientSelfEmployedData,
  selfEmployedRecordRows,
  selfEmployedSummaryRows
} from "@/lib/tax/personal-tax";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SelfEmployedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const data = await getClientSelfEmployedData(taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Self-Employed"
        description="Track self-employed income, expenses, GST collected, and GST paid by tax year."
      >
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/self-employed" />
      </AccountingHeader>
      <SelfEmployedForm taxYear={taxYear} />
      <AccountingTable
        title={`${taxYear} Self-Employed Summary`}
        columns={[
          { key: "item", label: "Item" },
          { key: "value", label: "Value" },
          { key: "detail", label: "Detail" }
        ]}
        rows={selfEmployedSummaryRows(data)}
      />
      <AccountingTable
        title={`${taxYear} Self-Employed Records`}
        columns={[
          { key: "date", label: "Date" },
          { key: "business", label: "Business Type" },
          { key: "expenseType", label: "Expense Type" },
          { key: "income", label: "Income" },
          { key: "expenses", label: "Expenses" },
          { key: "gstCollected", label: "GST Collected" },
          { key: "gstPaid", label: "GST Paid" },
          { key: "status", label: "Status" }
        ]}
        rows={selfEmployedRecordRows(data)}
      />
    </div>
  );
}
