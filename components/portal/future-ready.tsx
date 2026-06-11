"use client";

import { Sparkles } from "lucide-react";
import { futureReadyItems } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";

export function FutureReady() {
  const { t } = useT();

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
        <h2 className="text-lg font-black text-exodus-navy">{t("future.title")}</h2>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {futureReadyItems.map((key) => (
          <span key={key} className="rounded-md bg-exodus-light px-3 py-1.5 text-xs font-bold text-exodus-navy">
            {t(key)}
          </span>
        ))}
      </div>
    </section>
  );
}
