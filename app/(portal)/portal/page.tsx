import { DashboardGrid } from "@/components/portal/dashboard-grid";
import { FutureReady } from "@/components/portal/future-ready";
import { GuidedOnboarding } from "@/components/portal/guided-onboarding";
import { InlineNotice } from "@/components/portal/inline-notice";
import { MissingItems } from "@/components/portal/missing-items";
import { PersonalizedDashboardActions } from "@/components/portal/personalized-dashboard-actions";
import { PortalHero } from "@/components/portal/portal-hero";
import { QuickActions } from "@/components/portal/quick-actions";
import {
  AccountingModuleLinks,
  AccountingSummary,
  ClientAccountingFilter,
  YearEndPackagePanel
} from "@/components/portal/accounting-records";
import { clientDashboardItems } from "@/lib/constants";
import { getClientAccountingData, missingItemRows, parseYear } from "@/lib/accounting/data";
import { getClientServiceProfile } from "@/lib/onboarding";
import { getCurrentUserRecord } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const [user, accounting] = await Promise.all([
    getCurrentUserRecord(),
    getClientAccountingData(taxYear)
  ]);
  const profile = await getClientServiceProfile(user.id);

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
      ) : (
        <PersonalizedDashboardActions profile={profile} />
      )}
      <section className="grid gap-3">
        <div>
          <h2 className="text-2xl font-black text-exodus-navy">What do you want to do?</h2>
          <p className="mt-1 text-sm leading-6 text-exodus-slate">Choose one simple step. You can come back here anytime.</p>
        </div>
        <DashboardGrid items={clientDashboardItems} />
      </section>
      <ClientAccountingFilter selectedYear={taxYear} action="/portal" />
      <AccountingSummary data={accounting} />
      <QuickActions />
      <MissingItems items={missingItemRows(accounting)} />
      <YearEndPackagePanel data={accounting} />
      <AccountingModuleLinks basePath="portal" year={taxYear} />
      <FutureReady />
    </div>
  );
}
