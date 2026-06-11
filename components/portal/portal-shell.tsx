"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { adminNav, brand, clientNav, employeeNav } from "@/lib/constants";
import type { PortalUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useT } from "@/lib/i18n/provider";

type PortalShellProps = {
  user: PortalUser;
  children: React.ReactNode;
};

export function PortalShell({ user, children }: PortalShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useT();
  const nav = user.role === "admin" ? adminNav : user.role === "employee" ? employeeNav : clientNav;

  async function signOut() {
    try {
      await createBrowserSupabaseClient().auth.signOut();
    } finally {
      window.location.href = "/login";
    }
  }

  const sidebar = (
    <aside className="flex h-full flex-col bg-exodus-navy text-white">
      <div className="border-b border-white/10 p-5">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-md">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-exodus-gold text-sm font-black text-exodus-ink">
            EP
          </span>
          <span>
            <span className="block text-base font-black">{brand.name}</span>
            <span className="block text-xs font-semibold text-blue-100">
              {user.role === "admin" ? t("common.adminAccess") : user.role === "employee" ? t("common.employeeAccess") : t("common.yourRecordsOnly")}
            </span>
          </span>
        </Link>
      </div>

      <nav className="grid gap-1 overflow-y-auto p-3" aria-label="Portal navigation">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "focus-ring flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-blue-50 transition hover:bg-white/10",
                active && "bg-white text-exodus-navy"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-exodus-gold" : "text-blue-100")} aria-hidden="true" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 p-4">
        <div className="mb-3">
          <LanguageSwitcher />
        </div>
        <div className="rounded-md bg-white/10 p-3">
          <p className="truncate text-sm font-black">{user.full_name}</p>
          <p className="truncate text-xs font-medium text-blue-100">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm font-bold transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t("common.signOut")}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-72">{sidebar}</div>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex min-h-16 items-center justify-between px-4">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="focus-ring grid h-11 w-11 place-items-center rounded-md border border-slate-200 bg-white text-exodus-navy"
              aria-label="Open portal menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/portal" className="font-black text-exodus-navy">
              {brand.name}
            </Link>
            <LanguageSwitcher />
          </div>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/60"
              aria-label="Close portal menu"
              onClick={() => setOpen(false)}
            />
            <div className="relative h-full w-80 max-w-[86vw]">{sidebar}</div>
          </div>
        ) : null}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
