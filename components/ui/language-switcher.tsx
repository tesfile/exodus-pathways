"use client";

import { Globe2 } from "lucide-react";
import { languages, type LanguageCode } from "@/lib/i18n/types";
import { useT } from "@/lib/i18n/provider";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useT();

  return (
    <label className="focus-within:ring-2 focus-within:ring-exodus-gold flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-exodus-navy shadow-sm">
      <Globe2 className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
      <span className="sr-only">{t("common.language")}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
        className="bg-transparent outline-none"
        aria-label={t("common.language")}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
