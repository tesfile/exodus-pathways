"use client";

import { ShieldCheck } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

type PortalHeroProps = {
  eyebrowKey: string;
  titleKey: string;
  subtitleKey: string;
  badgeKey: string;
  name?: string;
};

export function PortalHero({ eyebrowKey, titleKey, subtitleKey, badgeKey, name }: PortalHeroProps) {
  const { t } = useT();

  return (
    <section className="rounded-md bg-exodus-navy p-6 text-white shadow-soft">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow text-exodus-goldSoft">{t(eyebrowKey)}</p>
          <h1 className="mt-2 text-3xl font-black">
            {t(titleKey, name ? { name } : undefined)}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-50">{t(subtitleKey)}</p>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-bold">
          <ShieldCheck className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
          {t(badgeKey)}
        </div>
      </div>
    </section>
  );
}

