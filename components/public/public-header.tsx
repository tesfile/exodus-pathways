"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole, Menu, X } from "lucide-react";
import { useState } from "react";
import { brand, publicNav } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useT } from "@/lib/i18n/provider";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useT();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="section-shell flex min-h-[72px] items-center justify-between gap-4">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-md">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-exodus-navy text-lg font-black text-white">
            EP
          </span>
          <span className="min-w-0">
            <span className="block text-base font-black text-exodus-navy sm:text-lg">{brand.name}</span>
            <span className="block truncate text-xs font-semibold text-exodus-slate">{t("brand.tagline")}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Public navigation">
          {publicNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring rounded-md px-3 py-2 text-sm font-semibold text-exodus-slate transition hover:bg-exodus-light hover:text-exodus-navy",
                pathname === item.href && "bg-exodus-light text-exodus-navy"
              )}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <ButtonLink href="/login" variant="secondary" icon={LockKeyhole}>
            {t("nav.clientLogin")}
          </ButtonLink>
        </div>

        <button
          type="button"
          className="focus-ring grid h-11 w-11 place-items-center rounded-md border border-slate-200 bg-white text-exodus-navy lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="section-shell grid gap-1 py-4" aria-label="Mobile navigation">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "focus-ring rounded-md px-3 py-3 text-sm font-semibold text-exodus-slate hover:bg-exodus-light",
                  pathname === item.href && "bg-exodus-light text-exodus-navy"
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            <LanguageSwitcher />
            <ButtonLink href="/login" variant="primary" icon={LockKeyhole} className="mt-2 w-full">
              {t("nav.clientLogin")}
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
