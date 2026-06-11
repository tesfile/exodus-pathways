import { DashboardGrid } from "@/components/portal/dashboard-grid";
import { PortalHero } from "@/components/portal/portal-hero";
import { adminDashboardItems } from "@/lib/constants";

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-6">
      <PortalHero
        eyebrowKey="portal.admin.eyebrow"
        titleKey="portal.admin.title"
        subtitleKey="portal.admin.subtitle"
        badgeKey="common.adminAccess"
      />
      <DashboardGrid items={adminDashboardItems} />
    </div>
  );
}
