import type { Metadata } from "next";
import { ShieldCheck, UsersRound, Workflow } from "lucide-react";

export const metadata: Metadata = {
  title: "About"
};

const values = [
  {
    icon: ShieldCheck,
    title: "Secure by design",
    copy: "Supabase Auth, Storage, PostgreSQL, and Row Level Security keep client records separated by role and assignment."
  },
  {
    icon: Workflow,
    title: "Process matters",
    copy: "Every workflow starts with clear intake, required documents, review status, messaging, and task ownership."
  },
  {
    icon: UsersRound,
    title: "Built for real clients",
    copy: "The mobile-friendly interface supports contractors, trades, small business owners, families, and growing companies."
  }
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-exodus-navy py-16 text-white">
        <div className="section-shell max-w-4xl">
          <p className="eyebrow text-exodus-goldSoft">About Exodus Pathways</p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Professional support for the records, filings, and decisions that move life forward in Canada.
          </h1>
          <p className="mt-5 text-lg leading-8 text-blue-50">
            Exodus Pathways brings accounting, tax, bookkeeping, payroll, immigration, and business
            service workflows into one secure portal so clients and staff can work from the same
            organized record.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="section-shell grid gap-5 md:grid-cols-3">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title} className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-6 w-6 text-exodus-gold" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-black text-exodus-navy">{value.title}</h2>
                <p className="mt-3 text-sm leading-6 text-exodus-slate">{value.copy}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
