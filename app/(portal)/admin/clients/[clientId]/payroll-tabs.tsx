"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

type Tab = "overview" | "employees" | "tax" | "compliance";

export function ClientPayrollTabs({ clientId, taxYear, children }: { clientId: string; taxYear: number; children: ReactNode }) {
  const [tab, setTab] = useState<Tab>("overview");
  const base = `/admin/workers-payroll-review?clientId=${encodeURIComponent(clientId)}&year=${taxYear}`;
  const add = `/admin/workers-payroll-review/new?clientId=${encodeURIComponent(clientId)}&year=${taxYear}`;
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "employees", label: "Employees" },
    { id: "tax", label: "Payroll Tax" },
    { id: "compliance", label: "Compliance" }
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">KAL Accounting &amp; Tax</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Payroll</h2>
          <p className="text-sm text-slate-500">Manage payroll for this client only · {taxYear}</p>
        </div>
        <Link href={add} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">+ Add employee</Link>
      </header>
      <nav aria-label="Payroll sections" className="flex flex-wrap gap-1 border-b border-slate-200 px-4 pt-3">
        {tabs.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)}
            aria-current={tab === item.id ? "page" : undefined}
            className={`rounded-t-lg px-4 py-3 text-sm font-bold ${tab === item.id ? "border-b-2 border-emerald-700 bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50"}`}>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="grid gap-5 p-5">
        {tab === "overview" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="text-lg font-black text-slate-900">Payroll overview</h3><p className="text-sm text-slate-500">Existing payroll records, calculations and paystubs remain available below.</p></div>
              <Link href={base} className="rounded-lg border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800">Payroll review</Link>
            </div>
            {children}
          </>
        )}
        {tab === "employees" && (
          <section className="grid gap-4">
            <h3 className="text-lg font-black text-slate-900">Employees &amp; Paychecks</h3>
            <p className="text-sm text-slate-600">Add employees or open the existing client-specific worker list to review employee payments and paystubs.</p>
            <div className="flex flex-wrap gap-3">
              <Link href={add} className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white">Add employee</Link>
              <Link href={base} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800">Employee paycheck list</Link>
            </div>
            <p className="text-xs text-slate-500">SIN and date-of-birth editing require secured payroll profile storage and are not enabled yet.</p>
          </section>
        )}
        {tab === "tax" && (
          <section className="grid gap-3">
            <h3 className="text-lg font-black text-slate-900">Payroll Tax</h3>
            <p className="text-sm text-slate-600">Review CPP, CPP2, EI, income tax and employer deductions using the existing payroll records. Verify CRA remittances before filing.</p>
            <Link href={base} className="font-bold text-emerald-700 underline">Review payroll deductions</Link>
          </section>
        )}
        {tab === "compliance" && (
          <section className="grid gap-3">
            <h3 className="text-lg font-black text-slate-900">Compliance</h3>
            <p className="text-sm text-slate-600">Year-end T4 records, dental benefit reporting and employment records.</p>
            <Link href="/admin/t4-year-end" className="font-bold text-emerald-700 underline">T4 year-end preparation</Link>
            <Link href={base} className="font-bold text-emerald-700 underline">Worker records and paystubs</Link>
            <p className="text-xs text-slate-500">ROE generation and CRA filing are not automated in this screen.</p>
          </section>
        )}
      </div>
    </div>
  );
}
