import { revalidatePath } from "next/cache";
import { AccountingHeader, AccountingTable, AdminAccountingFilter } from "@/components/portal/accounting-records";
import { expenseTableRows, formatDate, formatMoney, getAdminAccountingData, parseYear } from "@/lib/accounting/data";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

const expenseClassificationOptions = [
  "Regular expense",
  "Asset / equipment",
  "Vehicle",
  "Tools",
  "Furniture",
  "Computer",
  "Leasehold improvement",
  "CCA review needed"
];

async function classifyExpenseAction(formData: FormData) {
  "use server";

  const admin = await requireRole(["admin"]);
  const expenseId = String(formData.get("expenseId") ?? "");
  const classification = String(formData.get("classification") ?? "Regular expense");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!expenseId || !expenseClassificationOptions.includes(classification)) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("expense_entries")
    .update({
      admin_expense_classification: classification,
      admin_expense_classification_notes: notes || null,
      classified_by: admin.id,
      classified_at: new Date().toISOString()
    })
    .eq("id", expenseId);

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/assets");
  revalidatePath("/admin/year-end-package");
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminExpensesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Expenses" description="Admin view of real expense entries for the selected client and year.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/expenses" />
      </AccountingHeader>
      <AccountingTable
        title={`${selectedClient?.companyName ?? "Client"} Expenses`}
        columns={[
          { key: "date", label: "Date" },
          { key: "paidTo", label: "Paid To" },
          { key: "what", label: "What" },
          { key: "type", label: "Type" },
          { key: "amount", label: "Amount" },
          { key: "gst", label: "GST" },
          { key: "classification", label: "Admin Classification" },
          { key: "status", label: "Status" }
        ]}
        rows={data ? expenseTableRows(data) : []}
      />
      {data ? (
        <section className="grid gap-3">
          <div>
            <h2 className="text-xl font-black text-exodus-navy">Classify Expenses For Assets / CCA</h2>
            <p className="mt-1 text-sm leading-6 text-exodus-slate">
              Client purchases stay saved as expenses. Admin can mark items that need asset, equipment, vehicle, tools, or CCA review.
            </p>
          </div>
          <div className="grid gap-3">
            {data.expenses.map((expense) => (
              <form key={expense.id} action={classifyExpenseAction} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <input type="hidden" name="expenseId" value={expense.id} />
                <div className="grid gap-4 lg:grid-cols-[1fr_220px_1fr_auto] lg:items-end">
                  <div>
                    <p className="text-base font-black text-exodus-navy">{expense.description ?? "Purchase"}</p>
                    <p className="mt-1 text-sm font-semibold text-exodus-slate">
                      {formatDate(expense.expense_date)} | {expense.vendor ?? "Seller"} | {formatMoney(expense.amount)}
                    </p>
                  </div>
                  <label className="grid gap-2">
                    <span className="label">Classification</span>
                    <select name="classification" className="field" defaultValue={expense.admin_expense_classification ?? "Regular expense"}>
                      {expenseClassificationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="label">Admin note</span>
                    <input name="notes" className="field" defaultValue={expense.admin_expense_classification_notes ?? ""} />
                  </label>
                  <button type="submit" className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
                    Save
                  </button>
                </div>
              </form>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
