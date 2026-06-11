import { DashboardGrid } from "@/components/portal/dashboard-grid";
import { FutureReady } from "@/components/portal/future-ready";
import { InlineNotice } from "@/components/portal/inline-notice";
import { MissingItems } from "@/components/portal/missing-items";
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

  return (
    <div className="grid gap-6">
      <PortalHero
        eyebrowKey="portal.client.eyebrow"
        titleKey="portal.client.welcome"
        subtitleKey="portal.client.subtitle"
        badgeKey="common.yourRecordsOnly"
        name={user.full_name}
      />
      <InlineNotice messageKey="common.disclaimer" />
      <ClientAccountingFilter selectedYear={taxYear} action="/portal" />
      <YearEndPackagePanel data={accounting} />
      <AccountingSummary data={accounting} />
      <QuickActions />
      <AccountingModuleLinks basePath="portal" year={taxYear} />
      <MissingItems items={missingItemRows(accounting)} />
      <DashboardGrid items={clientDashboardItems} />
      <FutureReady />
    </div>
  );
}
