"use client";

import { AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

export function InlineNotice({ messageKey }: { messageKey: string }) {
  const { t } = useT();

  return (
    <div className="flex gap-3 rounded-md border border-exodus-gold/30 bg-white p-4 text-sm font-semibold leading-6 text-exodus-navy shadow-sm">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-exodus-gold" aria-hidden="true" />
      {t(messageKey)}
    </div>
  );
}

