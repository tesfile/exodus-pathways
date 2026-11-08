import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileUp, ShieldCheck } from "lucide-react";

export function PublicHomePage() {
  return (
    <>
      <section className="kal-skyline-hero py-16 text-white sm:py-24">
        <div className="section-shell grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-center">
          <div>
            <div className="flex items-center gap-4">
              <Image src="/images/kal-logo.png" alt="Original KAL Service Alliance gold and blue logo" width={88} height={88} className="h-20 w-20 rounded-md bg-white/95 object-contain p-1 shadow-lg" priority />
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">{`A Division of Kal Service Alliance Inc.`}</p><p className="mt-1 text-sm font-bold text-blue-100">Calgary • Alberta</p></div>
            </div>
            <p className="mt-7 text-sm font-black uppercase tracking-[0.2em] text-amber-200">Tax · Bookkeeping · Payroll</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
              KAL ACCOUNTING &amp; TAX
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50">
              Organized bookkeeping, payroll, GST/HST, and personal and corporate tax support, with a secure portal to share your documents and stay connected with our team.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-exodus-navy px-5 text-sm font-black text-white hover:bg-exodus-blue">
                <FileUp className="h-4 w-4 text-exodus-gold" aria-hidden="true" /> Scan Documents and Upload Files
              </Link>
              <Link href="/signup" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-exodus-navy/20 bg-white px-5 text-sm font-black text-exodus-navy hover:bg-blue-50">
                Register as a Client <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-white/30 bg-[#fff9e9]/95 p-7 text-exodus-ink shadow-soft">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-exodus-light text-exodus-blue"><ShieldCheck className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="mt-5 text-2xl font-black text-exodus-navy">A secure place for your records</h2>
            <p className="mt-3 text-sm leading-6 text-exodus-slate">
              Upload receipts, bank statements, invoices, tax and payroll documents. Your accounting team reviews the files and follows up securely when anything else is needed.
            </p>
            <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-exodus-slate">
              Your documents are private. Never send bank passwords or online banking credentials.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="section-shell grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-black text-exodus-navy">Contact KAL Accounting &amp; Tax</h2>
            <p className="mt-2 text-sm leading-6 text-exodus-slate">Questions about accounting or tax support? Get in touch with our team.</p>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-exodus-navy">
            <a href="mailto:info@kalservice.ca" className="focus-ring w-fit underline underline-offset-4">info@kalservice.ca</a>
            <a href="tel:+13688869018" className="focus-ring w-fit underline underline-offset-4">+1 (368) 886-9018</a>
            <span>3016 5 Ave NE, Calgary, AB T2A 6K4</span>
          </div>
        </div>
      </section>
    </>
  );
}
