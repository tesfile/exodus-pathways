import { ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

type ServicePageProps = {
  title: string;
  eyebrow: string;
  summary: string;
  bullets: string[];
  outcomes: string[];
};

export function ServicePage({ title, eyebrow, summary, bullets, outcomes }: ServicePageProps) {
  return (
    <>
      <section className="bg-exodus-navy py-16 text-white sm:py-20">
        <div className="section-shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="eyebrow text-exodus-goldSoft">{eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">{summary}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact?intake=1" icon={ClipboardList}>
                Start Client Intake
              </ButtonLink>
              <ButtonLink href="/login" variant="ghost">
                Client Login
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-md border border-white/15 bg-white/[0.08] p-6 shadow-soft backdrop-blur">
            <h2 className="text-lg font-black">What clients can expect</h2>
            <div className="mt-5 grid gap-3">
              {outcomes.map((outcome) => (
                <div key={outcome} className="flex items-center gap-3 rounded-md bg-white/10 p-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-exodus-gold" aria-hidden="true" />
                  <span className="text-sm font-semibold text-white">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="section-shell grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">Service workflow</p>
            <h2 className="mt-3 text-3xl font-black text-exodus-navy">Built around secure records and clear next steps.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {bullets.map((bullet) => (
              <div key={bullet} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <ArrowRight className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
                <p className="mt-4 text-sm font-semibold leading-6 text-exodus-ink">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
