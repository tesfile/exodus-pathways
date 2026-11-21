"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, FileCheck2, Landmark, Plus, UsersRound, Wallet } from "lucide-react";

/** Safe payroll display data only. Do not pass SINs, birthdates or complete worker rows to this client component. */
export type PayrollEmployeeView = {
  id: string;
  name: string;
  company: string;
  companyId: string;
  status: string;
  payRateLabel?: string;
  payMethodLabel?: string;
  vacationLabel?: string;
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
const money = (amount: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);
const prettyDate = (date: string | null) => date || "—";
const officialPayrollResources=[
 {title:"Current minimum wages in Canadian provinces and territories",description:"Check jurisdiction-specific current rates before setting an employee's hourly pay.",href:"https://minwage-salairemin.service.canada.ca/en/general.html"},
 {title:"CRA payroll deductions calculator (PDOC)",description:"Verify federal and provincial income tax, CPP and EI deductions for individual paycheques.",href:"https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-businesses/payroll-deductions-online-calculator.html"},
 {title:"Employer CPP and CPP2 contributions",description:"Review the current earnings ceilings, second CPP contributions and employer responsibilities.",href:"https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-enhancement.html"},
 {title:"Annual dental benefits reporting — T4 Box 45",description:"Confirm the correct dental access code reported on T4 slips.",href:"https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/completing-filing-information-returns/t4-information-employers/t4-slip.html"},
 {title:"Employers’ guide to T4 slips and summaries",description:"Review what to report and how to prepare annual information returns.",href:"https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4120/employers-guide-filing-t4-slip-summary.html"},
 {title:"Payroll remittance deadlines",description:"Check deadlines according to the employer's actual CRA remitter type.",href:"https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/remitting-source-deductions/how-when-remit-due-dates.html"},
 {title:"Record of Employment (ROE) employer guide",description:"Understand interruption of earnings, ROE codes, recordkeeping and how to issue ROEs.",href:"https://www.canada.ca/en/employment-social-development/programs/ei/ei-list/reports/roe-guide.html"},
 {title:"Service Canada — ROE Web",description:"Access the official employer platform for submitting ROEs.",href:"https://www.canada.ca/en/employment-social-development/programs/ei/ei-list/ei-roe/access-roe.html"},
 {title:"FINTRAC — who is required to report",description:"Learn which businesses are reporting entities; FINTRAC is not a routine payroll remittance authority.",href:"https://fintrac-canafe.canada.ca/reporting-declaration/Info/re-ed-eng"}
];


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
  children?: ReactNode;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [companyId, setCompanyId] = useState(initialCompanyId || companies[0]?.id || "");
  const employees = allEmployees.filter(employee => !companyId || employee.companyId === companyId);
  const payments = allPayments.filter(payment => !companyId || payment.companyId === companyId);
  const company = companies.find(item => item.id === companyId);
  const companyParams = `companyId=${encodeURIComponent(companyId)}&year=${taxYear}`;
  const runHref = `/admin/clients/${encodeURIComponent(clientId)}/payroll/run?${companyParams}`;
  const settingsHref = `/admin/clients/${encodeURIComponent(clientId)}/payroll/settings?${companyParams}`;
  const paychequesHref = `/admin/clients/${encodeURIComponent(clientId)}/payroll/paycheques?${companyParams}`;
  const sectionHref = (section: Tab, selectedCompany = companyId) =>
    `/admin/clients/${encodeURIComponent(clientId)}/payroll?year=${taxYear}&companyId=${encodeURIComponent(selectedCompany)}&section=${section}`;
  const navigateToTab = (section: Tab) => {
    setTab(section);
    router.replace(sectionHref(section), { scroll: false });
  };


  const [search, setSearch] = useState("");
  const [taxCentreView, setTaxCentreView] = useState<"payments" | "filings">("payments");

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

  const employeeHref = (workerId: string) =>
    `${base}&workerId=${encodeURIComponent(workerId)}&workerTab=payroll`;
  const profileHref = (workerId: string) =>
    `/admin/clients/${encodeURIComponent(clientId)}/payroll/employees/${encodeURIComponent(workerId)}?year=${taxYear}`;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-white p-5 sm:p-7">
        <div>
          <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">KAL PAYROLL · {taxYear}</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Payroll</h2>
          {clientName ? <p className="mt-1 text-sm font-bold text-slate-800">{clientName}</p> : null}
          <p className="mt-2 text-sm text-slate-600">Manage employees, paychecks, and CRA payroll records for the selected employer.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={add} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50">
            <Plus className="h-4 w-4" aria-hidden="true"/> Add employee
          </Link>
          <Link href={runHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">
            <Wallet className="h-4 w-4" aria-hidden="true"/> Run Payroll
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
        <label className="grid min-w-60 flex-1 gap-1 text-sm font-bold text-slate-800">Employer company
          <select value={companyId} onChange={event => { const selected = event.target.value; setCompanyId(selected); router.replace(sectionHref(tab, selected), { scroll: false }); }}
            className="max-w-lg rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900">
            {companies.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Link href={settingsHref} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800">Payroll settings</Link>
        </div>
      </div>

      <nav aria-label="Payroll sections" className="flex flex-wrap items-end gap-1 border-b border-slate-200 bg-white px-5 sm:px-7">
        {([
          { id: "overview", label: "Overview" },
          { id: "employees", label: "Employees" },
          { id: "tax", label: "Payroll tax" },
          { id: "compliance", label: "Compliance" }
        ] as const).map(item => (
          <button key={item.id} type="button" onClick={() => navigateToTab(item.id)}
            aria-current={tab === item.id ? "page" : undefined}
            className={tab === item.id
              ? "min-h-12 border-b-4 border-emerald-600 px-4 py-3 text-sm font-bold text-slate-950"
              : "min-h-12 border-b-4 border-transparent px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-slate-900"}>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 bg-white p-4 sm:p-7">
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
                <Link href={paychequesHref} className="mt-4 inline-block text-sm font-bold text-emerald-700 hover:underline">View paycheques &amp; export</Link>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <h4 className="text-lg font-black text-slate-900">Payroll tasks</h4>
                <p className="mb-4 text-sm text-slate-500">Keep your payroll records organized.</p>
                <div className="grid gap-3">
                  <Link href={base} className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 font-semibold text-slate-900 hover:bg-slate-50"><ClipboardList className="h-5 w-5 text-emerald-700"/> Record or review a paycheck <span className="ml-auto">›</span></Link>
                  <button onClick={() => navigateToTab("tax")} type="button" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-left font-semibold text-slate-900 hover:bg-slate-50"><Landmark className="h-5 w-5 text-emerald-700"/> Review payroll deductions <span className="ml-auto">›</span></button>
                  <button onClick={() => navigateToTab("compliance")} type="button" className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-left font-semibold text-slate-900 hover:bg-slate-50"><FileCheck2 className="h-5 w-5 text-emerald-700"/> Year-end T4 records <span className="ml-auto">›</span></button>
                </div>
              </article>
            </div>
            {children ? <details className="rounded-xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer text-sm font-black text-slate-900">Additional payroll review</summary>
              <div className="mt-4 grid gap-5">{children}</div>
            </details> : null}
          </>
        ) : null}

        {tab === "employees" ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Employees</h3>
                <div className="mt-4 inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                  <span className="rounded-md border border-emerald-600 bg-white px-5 py-2 text-sm font-bold text-emerald-800">List</span>
                  <span className="px-5 py-2 text-sm text-slate-500" title="Directory view is not available yet">Directory</span>
                </div>
              </div>
              <div className="grid justify-items-end gap-2">
                <Link href={runHref} className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">▶ Run payroll</Link>
                <Link href={paychequesHref} className="text-sm font-bold text-emerald-700 hover:underline">Paycheque list</Link>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="kal-employee-search" className="sr-only">Find an employee</label>
                <input id="kal-employee-search" type="search" value={search} onChange={event => setSearch(event.target.value)}
                  placeholder="Find an employee" className="min-h-11 w-64 max-w-full rounded-lg border border-slate-300 px-3 text-sm outline-emerald-700"/>
                <span className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">All employees ({employees.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={settingsHref} className="rounded-lg border border-emerald-700 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50">Edit payroll settings</Link>
                <Link href={add} className="rounded-lg border border-emerald-700 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50">Add an employee</Link>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[830px] border-separate border-spacing-y-1 text-left text-sm">
                <thead><tr className="text-xs uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">Pay rate</th>
                  <th className="px-4 py-3">Pay method</th><th className="px-4 py-3">Available vacation</th>
                  <th className="px-4 py-3">Status</th><th className="px-4 py-3">Profile</th>
                </tr></thead>
                <tbody>
                  {filteredEmployees.map(employee => {
                    const initials = employee.name.split(/\s+/).slice(0, 2).map(word => word[0]?.toUpperCase() ?? "").join("");
                    const inactive = ["Terminated", "Deceased", "Not on payroll"].includes(employee.status);
                    return <tr key={employee.id} className="border-t border-slate-100 hover:bg-emerald-50/40">
                      <td className="border-t border-slate-100 px-4 py-4"><Link href={profileHref(employee.id)} className="inline-flex items-center gap-3 font-bold text-slate-950 hover:text-emerald-700"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-200 font-bold text-slate-600" aria-hidden="true">{initials || "E"}</span><span>{employee.name}</span></Link></td>
                      <td className="border-t border-slate-100 px-4 py-4">{employee.payRateLabel || "Not set"}</td>
                      <td className="border-t border-slate-100 px-4 py-4">{employee.payMethodLabel || "Not configured"}</td>
                      <td className="border-t border-slate-100 px-4 py-4">{employee.vacationLabel || "Review setup"}</td>
                      <td className="border-t border-slate-100 px-4 py-4"><span className={inactive ? "rounded-full bg-slate-100 px-3 py-1 text-slate-700" : "rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-800"}>{employee.status || "Active"}</span></td>
                      <td className="border-t border-slate-100 px-4 py-4"><Link href={profileHref(employee.id)} className="font-bold text-emerald-700 hover:underline">View / Edit</Link></td>
                    </tr>;
                  })}
                  {!filteredEmployees.length ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">No employees found. Add an employee to start payroll setup.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <section id="kal-paycheck-list" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><h4 className="text-lg font-black text-slate-900">Paycheque list</h4><p className="text-sm text-slate-500">Previously saved employee payment records · {taxYear}</p></div>
                <div className="flex flex-wrap gap-3"><Link href={runHref} className="text-sm font-bold text-emerald-700 hover:underline">Run payroll</Link><Link href={paychequesHref} className="text-sm font-bold text-emerald-700 hover:underline">Open Paycheque List &amp; Export</Link></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-600"><tr><th className="p-3">Employee</th><th className="p-3">Pay date</th><th className="p-3">Pay period</th><th className="p-3 text-right">Gross</th><th className="p-3 text-right">Net</th><th className="p-3">Records</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {orderedPayments.map(payment => <tr key={payment.id}>
                      <td className="p-3 font-semibold">{employeeById.get(payment.workerId)?.name ?? "Employee"}</td>
                      <td className="p-3">{prettyDate(payment.date)}</td>
                      <td className="p-3">{payment.periodStart || payment.periodEnd ? `${payment.periodStart ?? "—"} to ${payment.periodEnd ?? "—"}` : "—"}</td>
                      <td className="p-3 text-right">{money(payment.gross)}</td>
                      <td className="p-3 text-right font-semibold">{money(payment.net)}</td>
                      <td className="p-3"><Link href={employeeHref(payment.workerId)} className="font-bold text-emerald-700 hover:underline">Review</Link></td>
                    </tr>)}
                    {orderedPayments.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">No recorded paycheques for this year.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {tab === "tax" ? (
          <>
            <div>
              <h3 className="text-2xl font-black text-slate-950">Payroll Tax Centre</h3>
              <p className="mt-2 text-sm text-slate-600">Recorded payroll tax withholdings for {company?.name ?? "this company"}. CRA remittances must be verified separately.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
              <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-slate-100 p-1">
                <button type="button" onClick={() => setTaxCentreView("payments")} aria-pressed={taxCentreView === "payments"} className={taxCentreView === "payments" ? "rounded-md border border-emerald-700 bg-white px-5 py-2 text-sm font-bold text-emerald-800" : "px-5 py-2 text-sm font-semibold text-slate-600"}>Payments</button>
                <button type="button" onClick={() => setTaxCentreView("filings")} aria-pressed={taxCentreView === "filings"} className={taxCentreView === "filings" ? "rounded-md border border-emerald-700 bg-white px-5 py-2 text-sm font-bold text-emerald-800" : "px-5 py-2 text-sm font-semibold text-slate-600"}>Filings</button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm font-semibold">
                <button type="button" onClick={() => window.print()} className="text-slate-700 hover:underline">Print</button>
                <a href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll.html" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">CRA resources</a>
                <Link href={base} className="text-emerald-700 hover:underline">Payment records</Link>
              </div>
            </div>
            {taxCentreView === "payments" ? <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryCard label="Employee CPP withheld" value={money(totals.cpp)} icon={<Landmark className="h-5 w-5"/>} detail="From saved employee paycheques" />
                <SummaryCard label="Employer CPP" value={money(totals.employerCpp)} icon={<Landmark className="h-5 w-5"/>} detail="From saved employee paycheques" />
                <SummaryCard label="Employee EI withheld" value={money(totals.ei)} icon={<Landmark className="h-5 w-5"/>} detail="From saved employee paycheques" />
                <SummaryCard label="Employer EI" value={money(totals.employerEi)} icon={<Landmark className="h-5 w-5"/>} detail="From saved employee paycheques" />
                <SummaryCard label="Income tax withheld" value={money(totals.incomeTax)} icon={<Landmark className="h-5 w-5"/>} detail="From saved employee paycheques" />
                <SummaryCard label="Total recorded deductions & contributions" value={money(totals.cpp + totals.employerCpp + totals.ei + totals.employerEi + totals.incomeTax)} icon={<ClipboardList className="h-5 w-5"/>} detail="NOT a CRA balance owing" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Recorded payroll deductions</h4>
              {orderedPayments.length ? <div className="grid gap-3">
                {orderedPayments.slice(0, 30).map(payment => <div key={payment.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
                  <div><p className="font-bold text-slate-900">{employeeById.get(payment.workerId)?.name ?? "Employee"} · Payroll deductions</p><p className="mt-1 text-sm text-slate-600">Pay date: {prettyDate(payment.date)} · Recorded payroll, not CRA remittance</p></div>
                  <div className="flex items-center gap-5"><strong className="text-base text-slate-950">{money(payment.cpp + payment.ei + payment.incomeTax + payment.employerCpp + payment.employerEi)}</strong><Link href={employeeHref(payment.workerId)} className="text-sm font-bold text-emerald-700 hover:underline">Review</Link></div>
                </div>)}
              </div> : <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-600">No payroll tax deductions have been recorded for this company in {taxYear}.</div>}
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">KAL has not reconciled these figures against CRA payments, filing history, or CPP2. Past-due amounts and Pay &amp; File actions are intentionally not displayed until real remittance data is connected. Use CRA My Business Account to check actual balances and make payments.</p>
            </> : <>
              <section className="grid gap-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Filed recently</h4>
                <div className="grid min-h-28 place-items-center rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">No confirmed CRA filings recorded in KAL yet.</div>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h4 className="text-lg font-black text-slate-900">Filing resources</h4>
                <div className="mt-4 grid gap-5">
                  <div><p className="font-bold text-slate-950">Record of Employment (ROE)</p><p className="mt-1 text-sm text-slate-600">Review employee records before creating or submitting an ROE with Service Canada.</p><button type="button" onClick={() => navigateToTab("employees")} className="mt-2 text-sm font-bold text-emerald-700 hover:underline">Review employees</button></div>
                  <div><p className="font-bold text-slate-950">T4 slips and annual filings</p><p className="mt-1 text-sm text-slate-600">Prepare and verify T4 values, including Box 45 dental-benefits access codes.</p><button type="button" onClick={() => navigateToTab("compliance")} className="mt-2 text-sm font-bold text-emerald-700 hover:underline">Open compliance</button></div>
                  <div><p className="font-bold text-slate-950">CRA payroll forms and remittances</p><a href="https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll.html" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-bold text-emerald-700 hover:underline">Official CRA payroll resources</a></div>
                </div>
              </section>
            </>}
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
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h4 className="text-xl font-black text-slate-950">Compliance News and Information</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">Official Canadian payroll, employment standards and year-end reporting resources. Open a resource to verify current requirements before preparing filings.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {officialPayrollResources.map(resource=><article key={resource.href} className="rounded-xl border border-slate-200 p-4">
                  <a href={resource.href} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-800 hover:underline">{resource.title} ↗</a>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                </article>)}
              </div>
              <p className="mt-5 text-xs leading-5 text-amber-800">These are official external resources, not evidence that KAL has issued ROEs, filed T4s, or remitted payroll tax.</p>
            </section>
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
