import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/public/login-form";

export const metadata: Metadata = {
  title: "Client Login"
};

export default function LoginPage() {
  return (
    <section className="bg-exodus-light py-16">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="eyebrow">Client login</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-exodus-navy sm:text-5xl">
            Sign in to your secure Exodus Pathways portal.
          </h1>
          <p className="mt-5 text-base leading-7 text-exodus-slate">
            Upload documents, review bookkeeping and tax items, manage payroll records, track
            immigration files, send messages, and book appointments.
          </p>
          <div className="mt-6 rounded-md border border-exodus-gold/30 bg-white p-4 text-sm font-semibold leading-6 text-exodus-navy shadow-sm">
            Exodus Pathways provides professional support, but clients remain responsible for
            providing complete and accurate documents.
          </div>
        </div>
        <Suspense fallback={<div className="rounded-md bg-white p-6 shadow-soft">Loading login...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
