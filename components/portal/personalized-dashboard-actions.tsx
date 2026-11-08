import Link from "next/link";
import { FileText, MessageSquareText, Send, SquareCheckBig } from "lucide-react";
import {
  needsTaxAccounting,
  serviceSummary,
  type ClientServiceProfile
} from "@/lib/onboarding-rules";

export function PersonalizedDashboardActions({ profile }: { profile: ClientServiceProfile }) {
  const enterInformationHref = getEnterInformationHref(profile);
  const actions = [
    {
      title: "Upload Documents",
      detail: "Send tax slips, receipts, and accounting documents.",
      href: "/portal/documents",
      icon: FileText
    },
    {
      title: "Enter Information",
      detail: "Add the details KAL Accounting & Tax needs for your selected service.",
      href: enterInformationHref,
      icon: Send
    },
    {
      title: "Messages",
      detail: "Ask questions and keep replies in one secure place.",
      href: "/portal/messages",
      icon: MessageSquareText
    },
    {
      title: "Status Tracking",
      detail: "Check what is uploaded, waiting, or under review.",
      href: "/portal/personal-tax",
      icon: SquareCheckBig
    }
  ];

  return (
    <section className="grid gap-4">
      <div className="rounded-md border border-exodus-gold/35 bg-white p-5 shadow-sm">
        <p className="eyebrow">Your services</p>
        <h2 className="mt-2 text-2xl font-black text-exodus-navy">{serviceSummary(profile)}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href} className="focus-ring rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-exodus-blue/40">
              <Icon className="h-6 w-6 text-exodus-gold" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-black text-exodus-navy">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-exodus-slate">{action.detail}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getEnterInformationHref(profile: ClientServiceProfile) {
  if (needsTaxAccounting(profile)) {
    return profile.tax_accounting_type === "Self-Employed" ? "/portal/self-employed" : "/portal/personal-tax";
  }

  return "/portal/profile";
}
