"use client";

import { Save } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

export function ProfileActions() {
  const { t } = useT();

  return (
    <div className="lg:col-span-2">
      <button type="button" disabled className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-md bg-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700">
        <Save className="h-4 w-4" aria-hidden="true" />
        {t("profile.saveComingSoon")}
      </button>
      <p className="mt-2 text-sm font-semibold text-exodus-slate">{t("profile.updatesComingSoon")}</p>
    </div>
  );
}
