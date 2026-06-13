"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DashboardItem } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

type DashboardGridProps = {
  items: DashboardItem[];
};

export function DashboardGrid({ items }: DashboardGridProps) {
  const { t } = useT();

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="focus-ring group rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-exodus-blue/40 hover:shadow-soft sm:p-5"
        >
          <div className="flex min-h-20 items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-exodus-navy sm:text-lg">{item.titleKey ? t(item.titleKey) : item.title}</h2>
              <p className="mt-1 text-sm leading-6 text-exodus-slate">{item.descriptionKey ? t(item.descriptionKey) : item.description}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-exodus-light">
              <ArrowUpRight className="h-5 w-5 text-exodus-gold transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
          </div>
          {item.metric ? (
            <p className="mt-4 inline-flex rounded-md bg-exodus-light px-3 py-1.5 text-sm font-black text-exodus-navy">
              {item.metric}
            </p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
