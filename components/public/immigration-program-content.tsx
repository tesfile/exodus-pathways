"use client";

import Link from "next/link";
import { CheckCircle2, ClipboardList, HelpCircle, LogIn } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { useT } from "@/lib/i18n/provider";
import type { ImmigrationProgram } from "@/lib/immigration/programs";

type ImmigrationProgramContentProps = {
  program: ImmigrationProgram;
};

function KeyList({ keys, prefix }: { keys: string[]; prefix: string }) {
  const { t } = useT();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {keys.map((key) => (
        <div key={key} className="flex gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-exodus-gold" aria-hidden="true" />
          <p className="text-sm font-semibold leading-6 text-exodus-ink">{t(`${prefix}.${key}`)}</p>
        </div>
      ))}
    </div>
  );
}

export function ImmigrationProgramContent({ program }: ImmigrationProgramContentProps) {
  const { t } = useT();

  return (
    <>
      <section className="bg-exodus-navy py-16 text-white">
        <div className="section-shell">
          <p className="eyebrow text-exodus-goldSoft">{t("imm.public.eyebrow")}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">
            {t(program.titleKey)}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-50">{t(program.overviewKey)}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={`/contact?assessment=${program.slug}`} icon={ClipboardList}>
              {t("imm.public.startAssessment")}
            </ButtonLink>
            <ButtonLink href="/login" variant="ghost" icon={LogIn}>
              {t("nav.clientLogin")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">{t("imm.public.overview")}</p>
            <h2 className="mt-3 text-3xl font-black text-exodus-navy">{t("imm.public.who")}</h2>
            <p className="mt-4 text-base leading-7 text-exodus-slate">{t(program.whoKey)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-exodus-light p-6">
            <h2 className="text-xl font-black text-exodus-navy">{t("imm.public.requirements")}</h2>
            <div className="mt-5">
              <KeyList keys={program.requirements} prefix="imm.req" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-exodus-light py-16">
        <div className="section-shell">
          <div className="max-w-3xl">
            <p className="eyebrow">{t("imm.public.documents")}</p>
            <h2 className="mt-3 text-3xl font-black text-exodus-navy">{t("imm.portal.checklist")}</h2>
          </div>
          <div className="mt-8">
            <KeyList keys={program.documents} prefix="imm.doc" />
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="section-shell grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">{t("imm.public.steps")}</p>
            <div className="mt-5 grid gap-3">
              {program.steps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-exodus-navy text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1.5 text-sm font-bold text-exodus-ink">{t(`imm.step.${step}`)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow">{t("imm.public.faq")}</p>
            <div className="mt-5 grid gap-3">
              {program.faqs.map((faq) => (
                <details key={faq.questionKey} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <summary className="flex cursor-pointer items-center gap-3 text-sm font-black text-exodus-navy">
                    <HelpCircle className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
                    {t(faq.questionKey)}
                  </summary>
                  <p className="mt-3 text-sm font-medium leading-6 text-exodus-slate">{t(faq.answerKey)}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-exodus-navy py-12 text-white">
        <div className="section-shell flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow text-exodus-goldSoft">{t("imm.public.startAssessment")}</p>
            <h2 className="mt-2 text-2xl font-black">{t(program.titleKey)}</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={`/contact?assessment=${program.slug}`} icon={ClipboardList}>
              {t("imm.public.startAssessment")}
            </ButtonLink>
            <Link href="/login" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/30 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t("nav.clientLogin")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

