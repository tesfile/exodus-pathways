"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, ClipboardCheck, FileText, Landmark, LogOut, Menu, MessageSquareText, Receipt, Settings, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { adminNav, brand, clientNav, employeeNav } from "@/lib/constants";
import type { PortalUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useT } from "@/lib/i18n/provider";
import type { ClientServiceProfile } from "@/lib/onboarding-rules";

type PortalShellProps = {
  user: PortalUser;
  clientProfile?: ClientServiceProfile;
  children: React.ReactNode;
};

export function PortalShell({ user, children }: PortalShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useT();
  const selectedClientId = user.role === "admin" ? pathname.match(/^\/admin\/clients\/([^/]+)/)?.[1] : undefined;
  const clientBase = selectedClientId ? `/admin/clients/${selectedClientId}` : "";
  const isPayrollWorkspace = Boolean(selectedClientId && pathname.startsWith(`${clientBase}/payroll`));
  const payrollWorkspaceNav = isPayrollWorkspace ? [
    { href: `${clientBase}/payroll`, label: "Overview", icon: Wallet },
    { href: `${clientBase}/payroll?section=employees`, label: "Employees", icon: Users },
    { href: `${clientBase}/payroll/run`, label: "Run Payroll", icon: CalendarDays },
    { href: `${clientBase}/payroll?section=tax`, label: "Payroll Tax", icon: Landmark },
    { href: `${clientBase}/payroll?section=compliance`, label: "Compliance", icon: ClipboardCheck },
    { href: `${clientBase}/payroll/settings`, label: "Payroll Settings", icon: Settings },
    { href: `${clientBase}?tab=bookkeeping`, label: "Back to KAL Accounting", icon: ArrowLeft },
  ] : [];

  const clientWorkspaceNav = selectedClientId ? [
    { href: "/admin/clients", label: "Back to All Clients", icon: ArrowLeft },
    { href: clientBase, label: "Client Overview", icon: Users },
    { href: `${clientBase}?tab=bookkeeping`, label: "Bookkeeping", icon: BookOpen },
    { href: `${clientBase}/payroll`, label: "Payroll", icon: Wallet },
    { href: `${clientBase}?tab=documents`, label: "Scan & Documents", icon: FileText },
    { href: `${clientBase}?tab=reports`, label: "Reports", icon: Receipt },
  ] : [];
  const nav = user.role === "admin"
    ? adminNav
    : user.role === "employee"
      ? employeeNav
      : clientNav;

  async function signOut() {
    try {
      await createBrowserSupabaseClient().auth.signOut();
    } finally {
      window.location.href = "/login";
    }
  }

  const sidebar = (
    <aside className={cn("flex h-full flex-col text-white", isPayrollWorkspace ? "bg-[#252525]" : "bg-exodus-navy")}>
      <div className="border-b border-white/10 p-5">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-md">
          <Image src="/images/kal-logo.png" alt="KAL Service Alliance logo" width={48} height={48} className="h-12 w-12 shrink-0 rounded bg-white object-contain p-0.5" priority />
          <span className="min-w-0">
            <span className="block text-sm font-black leading-5">{brand.name}</span>
            <span className="block text-[0.65rem] font-semibold leading-4 text-amber-100">{brand.tagline}</span>
            <span className="block text-xs font-semibold text-blue-100">
              {user.role === "admin" ? t("common.adminAccess") : user.role === "employee" ? t("common.employeeAccess") : t("common.yourRecordsOnly")}
            </span>
          </span>
        </Link>
      </div>

      <nav className="grid gap-1 overflow-y-auto p-3" aria-label="Portal navigation">
        {isPayrollWorkspace ? <p className="px-3 pb-2 text-xs font-black uppercase tracking-widest text-emerald-400">Company Payroll</p> :
          selectedClientId ? <p className="px-3 pb-2 text-xs font-black uppercase tracking-widest text-amber-200">Selected Client Only</p> : null}
        {isPayrollWorkspace ? payrollWorkspaceNav.map((item) => {
          const Icon = item.icon;
          const active = item.href.endsWith("/run") || item.href.endsWith("/settings")
            ? pathname === item.href
            : item.href === `${clientBase}/payroll` && pathname === `${clientBase}/payroll`;
          return <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
            className={cn("focus-ring flex min-h-11 items-center gap-3 rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white",
              active && "border-emerald-500 bg-white/10 text-white")}>
            <Icon className="h-4 w-4" aria-hidden="true"/><span>{item.label}</span>
          </Link>;
        }) : selectedClientId ? clientWorkspaceNav.map((item) => {
          const Icon = item.icon;
          const active = item.href === clientBase ? pathname === clientBase : false;
          return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("focus-ring flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-bold text-blue-50 hover:bg-white/10", active && "bg-white text-exodus-navy")}><Icon className="h-4 w-4" aria-hidden="true"/><span>{item.label}</span></Link>;
        }) : nav.map((item) => {
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
          <p className="truncate text-sm font-black">{user.display_name}</p>
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
            <Link href="/portal/documents" className="flex items-center gap-2 font-black text-exodus-navy">
              <Image src="/images/kal-logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
              <span className="text-xs">{brand.name}</span>
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

        <main className={cn("mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8", user.role === "client" && "pb-28 lg:pb-8", isPayrollWorkspace && "max-w-none bg-[#f6f7f8]")}>{children}</main>
        {user.role === "client" ? <ClientBottomNav pathname={pathname} /> : null}
      </div>
    </div>
  );
}

function ClientBottomNav({ pathname }: { pathname: string }) {
  const items = [
    { label: "Documents", href: "/portal/documents", icon: FileText },
    { label: "Messages", href: "/portal/messages", icon: MessageSquareText }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(15,61,115,0.12)] backdrop-blur lg:hidden" aria-label="Quick client navigation">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[0.72rem] font-black text-exodus-slate",
                active && "bg-exodus-light text-exodus-navy"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-exodus-gold" : "text-exodus-blue")} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
