import { revalidatePath } from "next/cache";
import {
  AccountingHeader,
  AccountingSummary,
  AdminAccountingFilter,
  GeneralLedgerTable,
  GstSummaryTable,
  PayrollSummaryTable,
  YearEndPackagePanel
} from "@/components/portal/accounting-records";
import {
  AccountingTable
} from "@/components/portal/accounting-records";
import {
  assetTableRows,
  bankStatementTableRows,
  expenseTableRows,
  getAdminAccountingData,
  incomeTableRows,
  parseYear,
  payrollTableRows,
  receiptTableRows
} from "@/lib/accounting/data";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function generateYearEndPackageAction(formData: FormData) {
  "use server";

  const admin = await requireRole(["admin"]);
  const clientId = String(formData.get("clientId") ?? "");
  const taxYear = Number(formData.get("taxYear") ?? 0);

  if (!clientId || !Number.isInteger(taxYear)) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("accounting_years").upsert(
    {
      client_id: clientId,
      tax_year: taxYear,
      status: "year_end_ready",
      year_end_package_status: "generated",
      metadata: {
        generated_at: new Date().toISOString(),
        generated_by: admin.id
      }
    },
    { onConflict: "client_id,tax_year" }
  );

  revalidatePath(`/admin/year-end-package?clientId=${clientId}&year=${taxYear}`);
  revalidatePath("/admin/reports");
  revalidatePath("/admin/accounting-clients");
}

export default async function AdminYearEndPackagePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Year-End Package" description="Review all accounting records needed for year-end before exports are generated.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/year-end-package" />
      </AccountingHeader>
      {data ? (
        <>
          <YearEndPackagePanel data={data} />
          <form action={generateYearEndPackageAction} className="rounded-md border border-exodus-gold/35 bg-white p-5 shadow-sm">
            <input type="hidden" name="clientId" value={data.client.id} />
            <input type="hidden" name="taxYear" value={data.taxYear} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-exodus-navy">Generate package record</h2>
                <p className="mt-1 text-sm leading-6 text-exodus-slate">
                  Marks this client year as generated using the current income, expense, GST, payroll, asset, document, and ledger data.
                </p>
              </div>
              <button type="submit" className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
                Generate Year-End Package
              </button>
            </div>
          </form>
          <AccountingSummary data={data} />
          <AccountingTable
            title="Income"
            columns={[
              { key: "date", label: "Date" },
              { key: "source", label: "Who Paid You / Work Done" },
              { key: "amount", label: "Amount" },
              { key: "gst", label: "GST" },
              { key: "status", label: "Status" }
            ]}
            rows={incomeTableRows(data)}
          />
          <AccountingTable
            title="Expenses"
            columns={[
              { key: "date", label: "Date" },
              { key: "paidTo", label: "Paid To" },
              { key: "what", label: "What" },
              { key: "type", label: "Type" },
              { key: "amount", label: "Amount" },
              { key: "gst", label: "GST" }
            ]}
            rows={expenseTableRows(data)}
          />
          <AccountingTable
            title="Receipts"
            columns={[
              { key: "date", label: "Date" },
              { key: "paidTo", label: "Paid To" },
              { key: "name", label: "File name" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" }
            ]}
            rows={receiptTableRows(data)}
          />
          <AccountingTable
            title="Bank Statements"
            columns={[
              { key: "month", label: "Month" },
              { key: "bank", label: "Bank" },
              { key: "account", label: "Account" },
              { key: "name", label: "File name" }
            ]}
            rows={bankStatementTableRows(data)}
          />
          <GstSummaryTable data={data} />
          <AccountingTable
            title="Payroll"
            columns={[
              { key: "period", label: "Period" },
              { key: "employees", label: "Employees" },
              { key: "gross", label: "Gross payroll" },
              { key: "deductions", label: "Deductions" }
            ]}
            rows={payrollTableRows(data)}
          />
          <PayrollSummaryTable data={data} />
          <AccountingTable
            title="Assets"
            columns={[
              { key: "date", label: "Date" },
              { key: "description", label: "Description" },
              { key: "class", label: "Class" },
              { key: "cost", label: "Cost" }
            ]}
            rows={assetTableRows(data)}
          />
          <GeneralLedgerTable data={data} />
        </>
      ) : null}
    </div>
  );
}
