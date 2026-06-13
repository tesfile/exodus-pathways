import Link from "next/link";
import { DashboardGrid } from "@/components/portal/dashboard-grid";
import { GuidedOnboarding } from "@/components/portal/guided-onboarding";
import { InlineNotice } from "@/components/portal/inline-notice";
import { PortalHero } from "@/components/portal/portal-hero";
import { clientAccountingItems, clientDashboardItems, clientImmigrationItems } from "@/lib/constants";
import { getClientServiceProfile } from "@/lib/onboarding";
import { getCurrentUserRecord } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedSection = Array.isArray(params?.section) ? params?.section[0] : params?.section;
  const user = await getCurrentUserRecord();
  const profile = await getClientServiceProfile(user.id);
  const sectionItems =
    selectedSection === "immigration"
      ? clientImmigrationItems
      : selectedSection === "accounting"
        ? clientAccountingItems
        : clientDashboardItems;
  const sectionTitle =
    selectedSection === "immigration"
      ? "Immigration"
      : selectedSection === "accounting"
        ? "Accounting"
        : "What do you need help with?";
  const sectionHelp =
    selectedSection === "immigration"
      ? "Choose the immigration help you need."
      : selectedSection === "accounting"
        ? "Choose what you want to enter."
        : "Pick one. The next screen will show simple choices.";

  return (
    <div className="grid gap-6">
      <PortalHero
        eyebrowKey="portal.client.eyebrow"
        titleKey="portal.client.welcome"
        subtitleKey="portal.client.subtitle"
        badgeKey="common.yourRecordsOnly"
        name={user.display_name}
      />
      <InlineNotice messageKey="common.disclaimer" />
      {!profile.onboarding_completed ? (
        <GuidedOnboarding userId={user.id} profile={profile} />
      ) : null}
      <section className="grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-exodus-navy">{sectionTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-exodus-slate">{sectionHelp}</p>
          </div>
          {selectedSection ? (
            <Link href="/portal" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-exodus-navy shadow-sm">
              Back
            </Link>
          ) : null}
        </div>
        <DashboardGrid items={sectionItems} />
      </section>
    </div>
  );
}
