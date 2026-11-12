import Link from "next/link";
import { AccountingHeader, AccountingTable, AdminAccountingFilter, PayrollSummaryTable } from "@/components/portal/accounting-records";
import { getAdminAccountingData, parseYear, payrollTableRows } from "@/lib/accounting/data";
import { getAdminWorkersPaymentsData } from "@/lib/workers-payments";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const tabs = [
  { id: "overview", title: "Overview" },
  { id: "employees", title: "Employees" },
  { id: "tax", title: "Payroll Tax" },
  { id: "compliance", title: "Compliance" }
] as const;

export default async function AdminPayrollPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const tab = Array.isArray(params?.tab) ? params?.tab[0] : params?.tab;
  const activeTab = tabs.some((item) => item.id === tab) ? tab : "overview";
  const [{ clients, selectedClient, data }, workersResult] = await Promise.all([
    getAdminAccountingData(clientId, taxYear),
    getAdminWorkersPaymentsData(clientId, taxYear)
  ]);
  const selectedId = selectedClient?.id ?? workersResult.selectedClient?.id ?? "";
  const query = new URLSearchParams({ clientId: selectedId, year: String(taxYear) });
  const reviewBase = `/admin/workers-payroll-review?${query.toString()}`;
  const employees = workersResult.data.workers.filter((worker) =>
    ["Employee", "Employee / Payroll", "T4 Employee"].includes(worker.worker_type)
  );

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Payroll" description="KAL Service Alliance payroll management.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedId} selectedYear={taxYear} action="/admin/payroll" />
      </AccountingHeader>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <nav aria-label="Payroll sections" className="flex flex-wrap gap-1 border-b border-slate-200 px-4 pt-4">
          {tabs.map((item) => (
            <Link key={item.id} href={`/admin/payroll?${query.toString()}&tab=${item.id}`}
              aria-current={activeTab === item.id ? "page" : undefined}
              className={`rounded-t-lg px-4 py-3 text-sm font-bold transition-colors ${activeTab === item.id ? "border-b-2 border-emerald-600 bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-100"}`}>
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="grid gap-5 p-5">
          {activeTab === "overview" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-exodus-navy">Payroll Overview</h2>
                  <p className="text-sm text-slate-600">Review pay periods, employee wages and deductions.</p>
                </div>
                <Link href={reviewBase} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">Review Payroll</Link>
              </div>
              <AccountingTable title={`${selectedClient?.companyName ?? "Client"} Payroll`}
                columns={[
                  { key: "period", label: "Period" },
                  { key: "employees", label: "Employees" },
                  { key: "gross", label: "Gross payroll" },
                  { key: "deductions", label: "Deductions" },
                  { key: "status", label: "Status" }
                ]}
                rows={data ? payrollTableRows(data) : []} />
              {data ? <PayrollSummaryTable data={data} /> : null}
            </>
          )}

          {activeTab === "employees" && (
            <>
              <div>
                <h2 className="text-xl font-black text-exodus-navy">Employee Paycheck List</h2>
                <p className="mt-1 text-sm text-slate-600">Choose an employee to review individual payments and paystubs. Personal identifiers are not displayed in this list.</p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700"><tr>
                    <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((worker) => (
                      <tr key={worker.id}>
                        <td className="px-4 py-3 font-semibold">{worker.worker_name}</td>
                        <td className="px-4 py-3">{worker.company_name}</td>
                        <td className="px-4 py-3">{worker.status}</td>
                        <td className="px-4 py-3">
                          <Link className="font-bold text-emerald-700 hover:underline"
                            href={`${reviewBase}&workerId=${encodeURIComponent(worker.id)}&workerTab=payroll`}>View Paychecks</Link>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No payroll employees found for this client.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "tax" && (
            <>
              <h2 className="text-xl font-black text-exodus-navy">Payroll Tax</h2>
              <p className="text-sm text-slate-600">Review CPP, EI, income tax and employer contributions. CRA remittances must be verified against CRA records.</p>
              <Link href={reviewBase} className="font-bold text-emerald-700 hover:underline">Open payroll deduction review</Link>
            </>
          )}

          {activeTab === "compliance" && (
            <>
              <h2 className="text-xl font-black text-exodus-navy">Payroll Compliance</h2>
              <p className="text-sm text-slate-600">Prepare year-end slips and review employee payroll records.</p>
              <Link href="/admin/t4-year-end" className="font-bold text-emerald-700 hover:underline">Open T4 Year-End</Link>
              <Link href={reviewBase} className="font-bold text-emerald-700 hover:underline">Open Workers & Payments Review</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
