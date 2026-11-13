"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, FileCheck2, Landmark, Plus, UsersRound, Wallet } from "lucide-react";

/** Safe payroll display data only. Do not pass SINs, birthdates or complete worker rows to this client component. */
export type PayrollEmployeeView = {
  id: string;
  name: string;
  company: string;
  companyId: string;
  status: string;
};
export type PayrollPaymentView = {
  id: string;
  workerId: string;
  companyId: string;
  date: string;
  periodStart: string | null;
  periodEnd: string | null;
  frequency: string | null;
  gross: number;
  cpp: number;
  ei: number;
  incomeTax: number;
  employerCpp: number;
  employerEi: number;
  net: number;
};

type Tab = "overview" | "employees" | "tax" | "compliance";
const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "employees", label: "Employees" },
  { id: "tax", label: "Payroll Tax" },
  { id: "compliance", label: "Compliance" }
];
const money = (amount: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);
const prettyDate = (date: string | null) => date || "—";

export function ClientPayrollTabs({
  clientId, clientName, taxYear, initialTab = "overview", initialCompanyId, companies, employees: allEmployees, payments: allPayments, children
}: {
  clientId: string;
  clientName?: string;
  taxYear: number;
  initialTab?: Tab;
  initialCompanyId?: string;
  companies: { id: string; name: string }[];
  employees: PayrollEmployeeView[];
  payments: PayrollPaymentView[];
  children: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [companyId, setCompanyId] = useState(initialCompanyId || companies[0]?.id || "");
  const employees = allEmployees.filter(employee => !companyId || employee.companyId === companyId);
  const payments = allPayments.filter(payment => !companyId || payment.companyId === companyId);
  const company = companies.find(item => item.id === companyId);
  const companyParams = `companyId=${encodeURIComponent(companyId)}&year=${taxYear}`;
  const runHref = `/admin/clients/${encodeURIComponent(clientId)}/payroll/run?${companyParams}`;
  const settingsHref = `/admin/clients/${encodeURIComponent(clientId)}/payroll/settings?${companyParams}`;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [search, setSearch] = useState("");

  const base = `/admin/workers-payroll-review?clientId=${encodeURIComponent(clientId)}&year=${taxYear}`;
  const add = `/admin/workers-payroll-review/new?clientId=${encodeURIComponent(clientId)}&year=${taxYear}`;
  const totals = useMemo(() => payments.reduce((sum, payment) => ({
    gross: sum.gross + payment.gross,
    net: sum.net + payment.net,
    cpp: sum.cpp + payment.cpp,
    ei: sum.ei + payment.ei,
    incomeTax: sum.incomeTax + payment.incomeTax,
    employerCpp: sum.employerCpp + payment.employerCpp,
    employerEi: sum.employerEi + payment.employerEi
  }), { gross: 0, net: 0, cpp: 0, ei: 0, incomeTax: 0, employerCpp: 0, employerEi: 0 }), [payments]);
  const orderedPayments = useMemo(() =>
    [...payments].sort((a, b) => b.date.localeCompare(a.date)), [payments]);
  const employeeById = useMemo(() => new Map(employees.map(employee => [employee.id, employee])), [employees]);
  const filteredEmployees = employees.filter(employee =>
    `${employee.name} ${employee.company}`.toLowerCase().includes(search.toLowerCase()));
  const selectedEmployee = employeeById.get(selectedEmployeeId);
  const visiblePayments = selectedEmployeeId
    ? orderedPayments.filter(payment => payment.workerId === selectedEmployeeId)
    : orderedPayments;

  const employeeHref = (workerId: string) =>
    `${base}&workerId=${encodeURIComponent(workerId)}&workerTab=payroll`;
  const profileHref = (workerId: string) =>
    `/admin/clients/${encodeURIComponent(clientId)}/payroll/employees/${encodeURIComponent(workerId)}?year=${taxYear}`;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white p-5 sm:p-7">
        <div>
          <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">KAL Accounting &amp; Tax · {taxYear}</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Payroll</h2>
          {clientName ? <p className="mt-1 text-sm font-bold text-slate-800">{clientName}</p> : null}
          <p className="mt-2 text-sm text-slate-600">Employee payroll for this selected client and employer company only.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={add} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50">
            <Plus className="h-4 w-4" aria-hidden="true"/> Add employee
          </Link>
          <Link href={base} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">
            <Wallet className="h-4 w-4" aria-hidden="true"/> Review / record payroll
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
        <label className="grid min-w-60 flex-1 gap-1 text-sm font-bold text-slate-800">Employer company
          <select value={companyId} onChange={event => { setCompanyId(event.target.value); setSelectedEmployeeId(""); }}
            className="max-w-lg rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900">
            {companies.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Link href={runHref} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">Run Payroll</Link>
          <Link href={settingsHref} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800">Payroll settings</Link>
        </div>
      </div>
      <nav aria-label="Payroll sections" className="flex flex-wrap gap-1 border-b border-slate-200 px-4 pt-2 sm:px-7">
        {tabs.map(item => (
          <button key={item.id} type="button" aria-current={tab === item.id ? "page" : undefined}
            onClick={() => { setTab(item.id); setSelectedEmployeeId(""); }}
            className={`min-h-12 border-b-[3px] px-4 py-2 text-sm font-bold transition ${tab === item.id
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-600 hover:border-slate-200 hover:text-slate-900"}`}>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 bg-[#f8fafb] p-4 sm:p-7">
        {tab === "overview" ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-xl font-black text-slate-900">Payroll overview</h3>
                <p className="mt-1 text-sm text-slate-600">Recorded employee pay information for {company?.name ?? "this employer"} in {taxYear}. Figures are not a CRA remittance confirmation.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">CAD · {taxYear}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Employees" value={String(employees.length)} icon={<UsersRound className="h-5 w-5"/>} detail="In this client's payroll" />
              <SummaryCard label="Recorded gross pay" value={money(totals.gross)} icon={<Wallet className="h-5 w-5"/>} detail="Employee payment records" />
              <SummaryCard label="Recorded net pay" value={money(totals.net)} icon={<FileCheck2 className="h-5 w-5"/>} detail="Employee payment records" />
              <SummaryCard label="Recorded paychecks" value={String(payments.length)} icon={<CalendarDays className="h-5 w-5"/>} detail="Selected tax year" />
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <h4 className="text-lg font-black text-slate-900">Recent paychecks</h4>
                <p className="mb-4 text-sm text-slate-500">Latest saved payroll payments</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[460px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <tr><th className="py-3 pr-2">Employee</th><th className="py-3 pr-2">Pay date</th><th className="py-3 pr-2 text-right">Gross</th><th className="py-3 text-right">Net</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderedPayments.slice(0, 5).map(payment => (
                        <tr key={payment.id}>
                          <td className="py-3 pr-2 font-semibold text-slate-900">{employeeById.get(payment.workerId)?.name ?? "Employee"}</td>
                          <td className="py-3 pr-2 text-slate-600">{prettyDate(payment.date)}</td>
                          <td className="py-3 pr-2 text-right">{money(payment.gross)}</td>
                          <td className="py-3 text-right font-semibold">{money(payment.net)}</td>
                        </tr>
                      ))}
                      {orderedPayments.length === 0 ? <tr><td colSpan={4} className="py-7 text-center text-slate-500">No payroll payments recorded for this year.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
                <button onClick={() => setTab("employees")} type="button" className="mt-4 text-sm font-bold text-emerald-700 hover:underline">View employees and paychecks</button>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <h4 className="text-lg font-black text-slate-900">Payroll tasks</h4>
                <p className="mb-4 text-sm text-slate-500">Keep your payroll records organized.</p>
                <div className="grid gap-3">
                  <Link href={base} className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 font-semibold text-slate-900 hover:bg-slate-50"><ClipboardList className="h-5 w-5 text-emerald-700"/> Record or review a paycheck <span className="ml-auto">›</span></Link>
                  <button onClick={() => setTab("tax")} type="button" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-left font-semibold text-slate-900 hover:bg-slate-50"><Landmark className="h-5 w-5 text-emerald-700"/> Review payroll deductions <span className="ml-auto">›</span></button>
                  <button onClick={() => setTab("compliance")} type="button" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-left font-semibold text-slate-900 hover:bg-slate-50"><FileCheck2 className="h-5 w-5 text-emerald-700"/> Year-end T4 records <span className="ml-auto">›</span></button>
                </div>
              </article>
            </div>
            <details className="rounded-xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer text-base font-black text-slate-900">Detailed payroll records and existing calculations</summary>
              <p className="my-3 text-sm text-slate-600">The original worker review, payroll entries, paystub and calculations remain available here.</p>
              <div className="grid gap-5">{children}</div>
            </details>
          </>
        ) : null}

        {tab === "employees" ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Employees</h3>
                <p className="mt-1 text-sm text-slate-600">Select an employee to review their recorded paychecks.</p>
              </div>
              <Link href={add} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">+ New employee</Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <label className="mb-4 block text-sm font-semibold text-slate-700" htmlFor="kal-employee-search">Find employee</label>
              <input id="kal-employee-search" type="search" value={search} onChange={event => setSearch(event.target.value)}
                placeholder="Search employee or company" className="mb-4 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-emerald-700"/>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr><th className="p-3">Employee</th><th className="p-3">Status</th><th className="p-3">Last recorded pay</th><th className="p-3">Pay frequency</th><th className="p-3">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map(employee => {
                      const latest = orderedPayments.find(payment => payment.workerId === employee.id);
                      return <tr key={employee.id} className={selectedEmployeeId === employee.id ? "bg-emerald-50" : ""}>
                        <td className="p-3"><button type="button" onClick={() => setSelectedEmployeeId(employee.id)} className="font-bold text-emerald-800 hover:underline">{employee.name}</button><span className="block text-xs text-slate-500">{employee.company}</span></td>
                        <td className="p-3">{employee.status || "—"}</td>
                        <td className="p-3">{prettyDate(latest?.date ?? null)}</td>
                        <td className="p-3">{latest?.frequency || "Not recorded"}</td>
                        <td className="p-3"><div className="flex flex-wrap gap-3"><Link href={profileHref(employee.id)} className="font-bold text-emerald-700 hover:underline">Edit profile &amp; schedule</Link><Link href={employeeHref(employee.id)} className="font-bold text-blue-800 hover:underline">Review paychecks</Link></div></td>
                      </tr>;
                    })}
                    {filteredEmployees.length === 0 ? <tr><td colSpan={5} className="p-7 text-center text-slate-500">No matching employees found.</td></tr> : null}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-slate-500">Employee profile and schedule settings open in a protected admin page. SIN is never displayed in this list.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><h4 className="text-lg font-black text-slate-900">{selectedEmployee ? `${selectedEmployee.name} — Paychecks` : "Employee Paycheck List"}</h4>
                  <p className="text-sm text-slate-500">Saved pay dates, pay periods and amounts</p></div>
                {selectedEmployee ? <button onClick={() => setSelectedEmployeeId("")} className="text-sm font-bold text-emerald-700" type="button">Show all employees</button> : null}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[590px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600"><tr><th className="p-3">Employee</th><th className="p-3">Pay date</th><th className="p-3">Period</th><th className="p-3 text-right">Gross</th><th className="p-3 text-right">Net</th><th className="p-3">Details</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {visiblePayments.map(payment => <tr key={payment.id}>
                      <td className="p-3 font-semibold">{employeeById.get(payment.workerId)?.name ?? "Employee"}</td>
                      <td className="p-3">{prettyDate(payment.date)}</td>
                      <td className="p-3">{payment.periodStart || payment.periodEnd ? `${payment.periodStart ?? "—"} to ${payment.periodEnd ?? "—"}` : "—"}</td>
                      <td className="p-3 text-right">{money(payment.gross)}</td>
                      <td className="p-3 text-right font-semibold">{money(payment.net)}</td>
                      <td className="p-3"><Link href={employeeHref(payment.workerId)} className="font-bold text-emerald-700 hover:underline">View</Link></td>
                    </tr>)}
                    {visiblePayments.length === 0 ? <tr><td colSpan={6} className="p-7 text-center text-slate-500">No recorded paychecks for this selection.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}

        {tab === "tax" ? (
          <>
            <div><h3 className="text-xl font-black text-slate-900">Payroll Tax</h3><p className="mt-1 text-sm text-slate-600">Year-to-date amounts from saved employee payroll records. These are not proof of payment to CRA.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryCard label="Employee CPP" value={money(totals.cpp)} icon={<Landmark className="h-5 w-5"/>} detail="Recorded deduction" />
              <SummaryCard label="Employer CPP" value={money(totals.employerCpp)} icon={<Landmark className="h-5 w-5"/>} detail="Recorded employer portion" />
              <SummaryCard label="Employee EI" value={money(totals.ei)} icon={<Landmark className="h-5 w-5"/>} detail="Recorded premium" />
              <SummaryCard label="Employer EI" value={money(totals.employerEi)} icon={<Landmark className="h-5 w-5"/>} detail="Recorded employer portion" />
              <SummaryCard label="Income tax" value={money(totals.incomeTax)} icon={<Landmark className="h-5 w-5"/>} detail="Withheld from employees" />
              <SummaryCard label="Combined recorded amounts" value={money(totals.cpp + totals.employerCpp + totals.ei + totals.employerEi + totals.incomeTax)} icon={<ClipboardList className="h-5 w-5"/>} detail="Not reconciled to CRA" />
            </div>
            <div className="rounded-xl border border-amber-200 bg-white p-5">
              <h4 className="font-black text-slate-900">CRA remittances and CPP2</h4>
              <p className="mt-2 text-sm text-slate-600">CRA payment history, remittance reconciliation and CPP2 are not separately verified by this screen. Do not treat the displayed amounts as an amount due without checking CRA and the payroll period records.</p>
              <Link href={base} className="mt-3 inline-block text-sm font-bold text-emerald-700 hover:underline">Open payroll calculation and deduction review</Link>
            </div>
          </>
        ) : null}

        {tab === "compliance" ? (
          <>
            <div><h3 className="text-xl font-black text-slate-900">Compliance</h3><p className="mt-1 text-sm text-slate-600">Review year-end employee reporting and supporting records for {taxYear}.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><FileCheck2 className="h-6 w-6"/></div>
                <h4 className="text-lg font-black text-slate-900">T4 year-end</h4>
                <p className="my-2 text-sm text-slate-600">Review employment income, CPP, EI and withheld income tax before preparing T4 slips.</p>
                <Link href={`/admin/t4-year-end?clientId=${encodeURIComponent(clientId)}&year=${taxYear}`} className="font-bold text-emerald-700 hover:underline">Open T4 preparation</Link>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ClipboardList className="h-6 w-6"/></div>
                <h4 className="text-lg font-black text-slate-900">Payroll records &amp; ROE</h4>
                <p className="my-2 text-sm text-slate-600">Review worker payment histories and supporting documents. ROE filing is not automated here.</p>
                <Link href={base} className="font-bold text-emerald-700 hover:underline">Open worker records</Link>
              </article>
            </div>
            <p className="text-sm text-slate-600">T4 dental-benefit access codes and official CRA submissions must be reviewed through a supported year-end workflow before filing.</p>
          </>
        ) : null}
      </div>
    </section>
  );
}

function SummaryCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5">
    <div className="mb-4 flex items-center justify-between gap-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className="text-emerald-700" aria-hidden="true">{icon}</span>
    </div>
    <p className="break-words text-2xl font-black text-slate-900">{value}</p>
    <p className="mt-2 text-xs text-slate-500">{detail}</p>
  </div>;
}
