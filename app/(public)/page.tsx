import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  FileCheck2,
  LockKeyhole,
  MessageSquareText,
  UploadCloud
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { brand, services, trustItems } from "@/lib/constants";

const portalSteps = [
  { icon: ClipboardList, label: "Start intake", copy: "Clients enter contact, company, tax, payroll, or immigration details." },
  { icon: UploadCloud, label: "Upload documents", copy: "Receipts, invoices, bank statements, tax files, and immigration records stay organized." },
  { icon: FileCheck2, label: "Review progress", copy: "Admin and assigned employees track review status, tasks, and missing items." },
  { icon: MessageSquareText, label: "Message securely", copy: "Clients and staff keep questions tied to each client record." }
];

export default function HomePage() {
  const serviceCards = Object.entries(services);

  return (
    <>
      <section className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-exodus-navy text-white">
        <Image
          src="/exodus-hero.png"
          alt="Professional desk with Canadian business, tax, and immigration documents"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-exodus-navy/70" />
        <div className="section-shell relative flex min-h-[calc(100vh-72px)] items-center py-16">
          <div className="max-w-3xl">
            <p className="eyebrow text-exodus-goldSoft">{brand.tagline}</p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              {brand.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50 sm:text-xl">{brand.subheadline}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact?intake=1" icon={ClipboardList}>
                Start Client Intake
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary" icon={LockKeyhole}>
                Client Login
              </ButtonLink>
              <ButtonLink href="/contact?consultation=1" variant="ghost" icon={CalendarCheck}>
                Book Consultation
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-6">
        <div className="section-shell grid gap-3 md:grid-cols-3">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <Icon className="h-5 w-5 shrink-0 text-exodus-gold" aria-hidden="true" />
                <span className="text-sm font-bold text-exodus-navy">{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-exodus-light py-16">
        <div className="section-shell">
          <div className="max-w-3xl">
            <p className="eyebrow">Services</p>
            <h2 className="mt-3 text-3xl font-black text-exodus-navy sm:text-4xl">
              One secure platform for financial, immigration, and business service workflows.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceCards.map(([slug, service]) => (
              <Link key={slug} href={`/${slug}`} className="focus-ring group rounded-md border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-exodus-gold">{service.eyebrow}</p>
                <h3 className="mt-3 text-xl font-black text-exodus-navy">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-exodus-slate">{service.summary}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-exodus-blue">
                  View service <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="eyebrow">Client portal</p>
            <h2 className="mt-3 text-3xl font-black text-exodus-navy sm:text-4xl">
              Practical enough for a phone in the truck. Secure enough for professional records.
            </h2>
            <p className="mt-4 text-base leading-7 text-exodus-slate">
              The portal is designed for roofers, mechanics, contractors, small business owners,
              families, and employers who need a simple way to send complete documents without
              sharing sensitive bank login information.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {portalSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                  <Icon className="h-6 w-6 text-exodus-gold" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-black text-exodus-navy">{step.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-exodus-slate">{step.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-exodus-navy py-12 text-white">
        <div className="section-shell flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow text-exodus-goldSoft">Ready when your documents are</p>
            <h2 className="mt-2 text-2xl font-black">Start with intake, then upload securely.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/contact?intake=1" icon={ClipboardList}>
              Start Client Intake
            </ButtonLink>
            <ButtonLink href="/contact?consultation=1" variant="ghost" icon={CalendarCheck}>
              Book Consultation
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
