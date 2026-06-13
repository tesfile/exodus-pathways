import { Suspense } from "react";
import { AccountingHeader, AccountingTable, ClientAccountingFilter } from "@/components/portal/accounting-records";
import { SmartExpenseForm } from "@/components/portal/smart-expense-form";
import { defaultExpenseTypes } from "@/lib/constants";
import { expenseTableRows, getClientAccountingData, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExpensesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const accounting = await getClientAccountingData(taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Expenses"
        description="Add what you paid for. Saved expenses appear below."
        eyebrow="Client portal"
        showExports={false}
      >
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/expenses" />
      </AccountingHeader>
      <Suspense fallback={<div className="rounded-md bg-white p-5 shadow-sm">Loading expense form...</div>}>
        <SmartExpenseForm taxYear={taxYear} />
      </Suspense>
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-black text-exodus-navy">Default Types</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {defaultExpenseTypes.map((type) => (
            <span key={type.value} className="rounded-md bg-exodus-light px-3 py-1.5 text-xs font-bold text-exodus-navy">
              {type.value}
            </span>
          ))}
        </div>
      </div>
      <AccountingTable
        title={`${accounting.taxYear} Expense Entries`}
        columns={[
          { key: "date", label: "Date" },
          { key: "paidTo", label: "Paid To" },
          { key: "what", label: "What" },
          { key: "type", label: "Type" },
          { key: "amount", label: "Amount" },
          { key: "gst", label: "GST" },
          { key: "status", label: "Status" }
        ]}
        rows={expenseTableRows(accounting)}
      />
    </div>
  );
}
