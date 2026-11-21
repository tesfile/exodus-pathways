import Link from "next/link";
import { ArrowRight, CalendarDays, FileCheck2, LockKeyhole, ShieldCheck, UsersRound, Wallet } from "lucide-react";

export const metadata = {
  title: "KAL Payroll | Canadian Payroll Management",
  description: "KAL Payroll by Kal Service Alliance Inc. Secure employee records, pay schedules and payroll reviews."
};

const features = [
  { title: "Employee profiles", detail: "Secure employee setup, pay rates, employment details and protected SINs.", icon: UsersRound },
  { title: "Run payroll", detail: "Review work hours, regular earnings and paycheque records.", icon: Wallet },
  { title: "Pay schedules", detail: "Weekly, biweekly, twice-monthly and monthly pay calendars.", icon: CalendarDays },
  { title: "Payroll tax & T4", detail: "Review recorded deductions and prepare supporting payroll records.", icon: FileCheck2 }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f8f9] text-slate-950">
      <header className="border-b border-slate-200 bg-[#202124] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white">K</span>
            <span>KAL <span className="text-emerald-400">Payroll</span></span>
          </Link>
          <Link href="/admin/payroll" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            Open Payroll <ArrowRight className="h-4 w-4"/>
          </Link>
        </div>
      </header>
      <section className="bg-white px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Kal Service Alliance Inc.</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">Payroll. Employees. <span className="text-emerald-700">Simplified.</span></h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Your dedicated KAL Payroll workspace for managing employee information, pay schedules, payroll records and Canadian year-end reporting preparation.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/admin/payroll" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800">Go to Payroll <ArrowRight className="h-5 w-5"/></Link>
              <Link href="/login?next=%2Fadmin%2Fpayroll" className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">Administrator sign in</Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><LockKeyhole className="h-4 w-4"/> Employee records are available only to authorized users.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-[#fafafa] p-6 shadow-sm sm:p-8">
            <p className="mb-5 text-xs font-black uppercase tracking-widest text-slate-500">Payroll workspace</p>
            <div className="grid gap-3">
              {[["Employees", "Employee profiles, rates and status"], ["Run Payroll", "Editable hours and draft preview"], ["Payroll Tax", "Deduction records and CRA resources"], ["Compliance", "T4 information and supporting records"]].map(item => <div key={item[0]} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5"><div><p className="font-bold text-slate-950">{item[0]}</p><p className="mt-1 text-sm text-slate-600">{item[1]}</p></div><span className="text-emerald-700">●</span></div>)}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <h2 className="text-2xl font-black text-slate-950">One workspace for payroll</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map(feature => { const Icon = feature.icon; return <article key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6"><Icon className="h-7 w-7 text-emerald-700"/><h3 className="mt-5 font-black text-slate-950">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{feature.detail}</p></article>; })}
        </div>
        <div className="mt-10 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"/><span>Payroll tax calculations, bank payments and CRA submissions must be independently verified before operational use. This site does not claim to transmit CRA filings or automatically pay employees.</span></div>
      </section>
      <footer className="border-t border-slate-200 px-5 py-7 text-center text-xs text-slate-500">KAL Payroll · Kal Service Alliance Inc. · Canada</footer>
    </main>
  );
}
