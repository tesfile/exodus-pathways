"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

const actions = [
  { key: "expense.quick.materials", type: "Materials" },
  { key: "expense.quick.fuel", type: "Fuel" },
  { key: "expense.quick.vehicle", type: "Vehicle" },
  { key: "expense.quick.payroll", type: "Payroll" }
];

export function QuickActions() {
  const { t } = useT();

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-exodus-navy">{t("portal.client.quickActions")}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.type}
            href={`/portal/expenses?type=${encodeURIComponent(action.type)}`}
            className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-exodus-navy px-4 text-base font-black text-white shadow-sm transition hover:bg-exodus-blue"
          >
            <Plus className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
            {t(action.key)}
          </Link>
        ))}
      </div>
    </section>
  );
}

