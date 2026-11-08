import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact KAL Accounting & Tax"
};

export default function ContactPage() {
  return (
    <section className="bg-exodus-light py-16">
      <div className="section-shell mx-auto max-w-3xl">
        <p className="eyebrow">KAL ACCOUNTING &amp; TAX</p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-exodus-navy sm:text-5xl">Contact our Calgary office</h1>
        <p className="mt-5 text-base leading-7 text-exodus-slate">For accounting, bookkeeping, payroll, or tax support, contact KAL Service Alliance Inc.</p>
        <div className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <a className="focus-ring flex items-center gap-3 font-semibold text-exodus-navy" href="mailto:info@kalservice.ca"><Mail className="h-5 w-5 text-exodus-gold" aria-hidden="true" />info@kalservice.ca</a>
          <a className="focus-ring flex items-center gap-3 font-semibold text-exodus-navy" href="tel:+13688869018"><Phone className="h-5 w-5 text-exodus-gold" aria-hidden="true" />+1 (368) 886-9018</a>
          <a className="focus-ring flex items-center gap-3 font-semibold text-exodus-navy" href="https://maps.app.goo.gl/cKAqwtTAjhVDbEuP6?g_st=ac" target="_blank" rel="noreferrer"><MapPin className="h-5 w-5 text-exodus-gold" aria-hidden="true" />3016 5 Ave NE, Calgary, AB T2A 6K4</a>
          <a className="focus-ring w-fit font-semibold text-exodus-blue underline" href="https://wa.me/15877033787" target="_blank" rel="noreferrer">WhatsApp +1 (587) 703-3787</a>
        </div>
      </div>
    </section>
  );
}
