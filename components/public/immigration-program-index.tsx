"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { immigrationPrograms } from "@/lib/immigration/programs";
import { useT } from "@/lib/i18n/provider";

export function ImmigrationProgramIndex() {
  const { t } = useT();

  return (
    <section className="bg-exodus-light py-16">
      <div className="section-shell">
        <div className="max-w-3xl">
          <p className="eyebrow">{t("imm.public.eyebrow")}</p>
          <h2 className="mt-3 text-3xl font-black text-exodus-navy">{t("imm.portal.chooseProgram")}</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {immigrationPrograms.map((program) => (
            <Link
              key={program.slug}
              href={`/immigration-services/${program.slug}`}
              className="focus-ring group rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <h3 className="text-lg font-black text-exodus-navy">{t(program.titleKey)}</h3>
              <p className="mt-2 text-sm leading-6 text-exodus-slate">{t(program.overviewKey)}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-exodus-blue">
                {t("imm.public.startAssessment")}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
