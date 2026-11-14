"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Search, UsersRound, Wallet } from "lucide-react";

type Company = { id: string; companyName: string; ownerName: string };

export function CompanyPayrollPicker({ companies, year }: { companies: Company[]; year: number }) {
  const [search, setSearch] = useState("");
  const [taxYear, setTaxYear] = useState(year);
  const results = useMemo(() => companies.filter(company =>
    `${company.companyName} ${company.ownerName}`.toLowerCase().includes(search.trim().toLowerCase())
  ).sort((a, b) => a.companyName.localeCompare(b.companyName)), [companies, search]);

  return (
    <div className="mx-auto grid max-w-7xl gap-7">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">KAL Service Alliance · Payroll</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Payroll</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Select an employer to manage its employees, pay runs, payroll taxes, and year-end reporting.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
          <Wallet className="h-8 w-8 text-emerald-700" aria-hidden="true" />
          <div><p className="text-xs font-semibold text-slate-500">Payroll companies</p><p className="text-xl font-black tabular-nums text-slate-900">{companies.length}</p></div>
        </div>
      </header>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 p-5 sm:flex sm:items-end sm:justify-between sm:p-6">
          <div><h2 className="text-xl font-black text-slate-900">Choose a company</h2><p className="mt-1 text-sm text-slate-500">Your employers and their payroll records</p></div>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">Payroll year
            <select className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900" value={taxYear} onChange={e => setTaxYear(Number(e.target.value))}>
              {[year + 1, year, year - 1, year - 2, year - 3].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        </div>
        <div className="p-5 sm:p-6">
          <label className="mb-5 flex max-w-xl items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 focus-within:border-emerald-600">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <span className="sr-only">Search payroll companies</span>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a company or client" className="min-h-12 w-full bg-transparent text-sm text-slate-900 outline-none" />
          </label>
          {results.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.map(company => <Link key={company.id} href={`/admin/clients/${encodeURIComponent(company.id)}/payroll?year=${taxYear}`}
              className="group flex min-h-32 items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-500 hover:bg-emerald-50/40 focus-visible:outline-2 focus-visible:outline-emerald-600">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><Building2 className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block break-words text-base font-black text-slate-900">{company.companyName}</span>
                <span className="mt-1 block break-words text-xs text-slate-500">{company.ownerName}</span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">Open payroll <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              </span>
            </Link>)}
          </div> : <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <UsersRound className="h-9 w-9 text-slate-400" aria-hidden="true" />
            <h3 className="font-bold text-slate-900">{companies.length ? "No matching companies" : "No payroll companies yet"}</h3>
            <p className="max-w-md text-sm text-slate-600">{companies.length ? "Try a different company name." : "Add an employer client before setting up its payroll."}</p>
          </div>}
        </div>
      </section>
    </div>
  );
}
