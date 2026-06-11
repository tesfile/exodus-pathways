import {
  AccountingHeader,
  AccountingTable,
  AdminAccountingFilter
} from "@/components/portal/accounting-records";
import {
  getAdminAccountingData,
  parseYear,
  receiptTableRows
} from "@/lib/accounting/data";
import {
  getAdminSelfEmployedData,
  selfEmployedRecordRows,
  selfEmployedSummaryRows
} from "@/lib/tax/personal-tax";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSelfEmployedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const [{ clients, selectedClient, data }, accounting] = await Promise.all([
    getAdminSelfEmployedData(clientId, taxYear),
    getAdminAccountingData(clientId, taxYear)
  ]);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Self-Employed"
        description="Admin view of self-employed income, expenses, GST summary, receipts, and year-end summary by client and year."
      >
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/self-employed" />
      </AccountingHeader>
      <AccountingTable
        title={`${selectedClient?.companyName ?? "Client"} Self-Employed Year-End Summary`}
        columns={[
          { key: "item", label: "Item" },
          { key: "value", label: "Value" },
          { key: "detail", label: "Detail" }
        ]}
        rows={selfEmployedSummaryRows(data)}
      />
      <AccountingTable
        title="Self-Employed Income, Expenses, and GST"
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
      <AccountingTable
        title="Receipts"
        description="Receipts uploaded in the regular accounting module for the selected client and tax year."
        columns={[
          { key: "date", label: "Date" },
          { key: "paidTo", label: "Paid To" },
          { key: "name", label: "File name" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" }
        ]}
        rows={accounting.data ? receiptTableRows(accounting.data) : []}
      />
    </div>
  );
}
