"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { brand, publicNav } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";

export function PublicFooter() {
  const { t } = useT();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="section-shell grid gap-10 py-12 lg:grid-cols-[1.3fr_0.7fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-exodus-navy text-lg font-black text-white">
              EP
            </span>
            <div>
              <p className="font-black text-exodus-navy">{brand.name}</p>
              <p className="text-sm font-semibold text-exodus-slate">{t("brand.tagline")}</p>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-exodus-slate">
            Secure support for Canadian accounting, bookkeeping, payroll, corporate tax,
            immigration, and business service workflows.
          </p>
          <p className="mt-4 flex max-w-2xl gap-2 rounded-md bg-exodus-light p-3 text-sm font-medium leading-6 text-exodus-navy">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-exodus-gold" aria-hidden="true" />
            {t("common.disclaimer")}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-exodus-navy">Pages</h2>
          <div className="mt-4 grid gap-2">
            {publicNav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-semibold text-exodus-slate hover:text-exodus-navy">
                {t(item.labelKey)}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-exodus-navy">Contact</h2>
          <div className="mt-4 grid gap-3 text-sm font-medium text-exodus-slate">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
              Serving clients across Canada
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
              +1 (000) 000-0000
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
              hello@exoduspathways.ca
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4">
        <div className="section-shell text-sm text-exodus-slate">
          Copyright {new Date().getFullYear()} Exodus Pathways. Do not submit credit card numbers or bank login credentials through this portal.
        </div>
      </div>
    </footer>
  );
}
