import { DashboardGrid } from "@/components/portal/dashboard-grid";
import { PortalHero } from "@/components/portal/portal-hero";
import { employeeDashboardItems } from "@/lib/constants";

export default function EmployeeDashboardPage() {
  return (
    <div className="grid gap-6">
      <PortalHero
        eyebrowKey="portal.employee.eyebrow"
        titleKey="portal.employee.title"
        subtitleKey="portal.employee.subtitle"
        badgeKey="common.employeeAccess"
      />
      <DashboardGrid items={employeeDashboardItems} />
    </div>
  );
}

