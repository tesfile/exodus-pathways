"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { exportButtons } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";

export function ExportButtons() {
  const { t } = useT();
  const [status, setStatus] = useState("");

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {exportButtons.map((button) => {
          const label = t(button.labelKey) || button.fallback;
          const comingSoon = t("common.comingSoonFor", { label });
          return (
            <button
              key={button.labelKey}
              type="button"
              onClick={() => setStatus(comingSoon)}
              className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-exodus-navy shadow-sm transition hover:bg-exodus-light"
              title={comingSoon}
            >
              <Download className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
      {status ? <p className="text-xs font-bold text-exodus-blue">{status}</p> : null}
    </div>
  );
}
