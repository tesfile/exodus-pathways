import type { Metadata } from "next";
import { CalendarCheck, ClipboardList, Mail, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "Contact"
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-exodus-light py-16">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="eyebrow">Contact</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-exodus-navy sm:text-5xl">
              Start intake or book a consultation.
            </h1>
            <p className="mt-5 text-base leading-7 text-exodus-slate">
              Tell Exodus Pathways what service you need. A team member can confirm the document
              checklist, next steps, and portal setup.
            </p>
            <div className="mt-8 grid gap-3 text-sm font-bold text-exodus-navy">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
                +1 (000) 000-0000
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
                hello@exoduspathways.ca
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/login" icon={ClipboardList}>
                Start Client Intake
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" icon={CalendarCheck}>
                Book Consultation
              </ButtonLink>
            </div>
          </div>

          <form className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">
                  Full name
                </label>
                <input id="name" className="field mt-2" placeholder="Your name" />
              </div>
              <div>
                <label className="label" htmlFor="company">
                  Company
                </label>
                <input id="company" className="field mt-2" placeholder="Company name" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input id="email" type="email" className="field mt-2" placeholder="you@example.ca" />
              </div>
              <div>
                <label className="label" htmlFor="service">
                  Service needed
                </label>
                <select id="service" className="field mt-2" defaultValue="">
                  <option value="" disabled>
                    Select a service
                  </option>
                  <option>Accounting & Tax</option>
                  <option>Bookkeeping</option>
                  <option>Payroll</option>
                  <option>Immigration Services</option>
                  <option>Business Services</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="message">
                How can we help?
              </label>
              <textarea id="message" className="field mt-2 min-h-32" placeholder="Briefly describe your needs." />
            </div>
            <p className="rounded-md bg-exodus-light p-3 text-xs font-semibold leading-5 text-exodus-navy">
              Do not include credit card details, bank login information, passwords, SIN numbers, or
              highly sensitive documents in this public contact form. Use the secure portal after
              your account is created.
            </p>
            <button type="button" className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-exodus-blue">
              Send request
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
