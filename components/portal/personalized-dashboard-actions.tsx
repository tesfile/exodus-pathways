import Link from "next/link";
import { FileText, MessageSquareText, Send, SquareCheckBig } from "lucide-react";
import {
  isSelfEmployedClient,
  needsImmigration,
  needsTaxAccounting,
  serviceSummary,
  type ClientServiceProfile
} from "@/lib/onboarding-rules";

export function PersonalizedDashboardActions({ profile }: { profile: ClientServiceProfile }) {
  const enterInformationHref = getEnterInformationHref(profile);
  const statusHref = needsImmigration(profile) ? "/portal/immigration-files" : "/portal/personal-tax";
  const actions = [
    {
      title: "Upload Documents",
      detail: "Send slips, receipts, immigration files, and other documents.",
      href: "/portal/documents",
      icon: FileText
    },
    {
      title: "Enter Information",
      detail: "Add the details Exodus Pathways needs for your selected service.",
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
      href: statusHref,
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
  if (needsImmigration(profile)) {
    return "/portal/immigration-files";
  }

  if (isSelfEmployedClient(profile)) {
    return "/portal/self-employed";
  }

  if (needsTaxAccounting(profile)) {
    return "/portal/personal-tax";
  }

  return "/portal/profile";
}
