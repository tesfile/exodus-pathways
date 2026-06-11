"use client";

import { AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import type { DemoRow } from "@/lib/types";

export function MissingItems({ items = [] }: { items?: DemoRow[] }) {
  const { t } = useT();
  const visibleItems = items.length > 0 ? items : [{ item: "Nothing missing", detail: "No missing accounting items for this year.", status: "Clear" }];

  return (
    <section className="rounded-md border border-exodus-gold/35 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
        <h2 className="text-lg font-black text-exodus-navy">{t("portal.client.missingItems")}</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleItems.map((item) => (
          <div key={`${item.item}-${item.detail}`} className="rounded-md bg-exodus-light p-4">
            <p className="font-black text-exodus-navy">{item.item}</p>
            <p className="mt-1 text-sm font-semibold text-exodus-slate">{item.detail}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-exodus-blue">{item.status}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
