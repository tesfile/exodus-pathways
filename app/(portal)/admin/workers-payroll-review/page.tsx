import {
  AccountingHeader,
  AdminAccountingFilter
} from "@/components/portal/accounting-records";
import { WorkerReviewWorkspace } from "@/components/portal/workers-admin-review";
import { parseYear } from "@/lib/accounting/data";
import { getAdminWorkersPaymentsData } from "@/lib/workers-payments";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkersPayrollReviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = firstParam(params?.clientId);
  const selectedWorkerId = firstParam(params?.workerId);
  const selectedWorkerTab = firstParam(params?.workerTab);
  const { clients, selectedClient, data } = await getAdminWorkersPaymentsData(clientId, taxYear);
  const baseHref = `/admin/workers-payroll-review?clientId=${selectedClient?.id ?? ""}&year=${taxYear}`;

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Workers & Payments Review"
        description="Review worker payments, admin classification, payroll calculations, slip needed, and export-ready reports by client, company, and tax year."
      >
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/workers-payroll-review" />
      </AccountingHeader>
      <WorkerReviewWorkspace
        data={data}
        clientId={selectedClient?.id ?? ""}
        taxYear={taxYear}
        baseHref={baseHref}
        selectedWorkerId={selectedWorkerId}
        selectedTab={selectedWorkerTab}
      />
    </div>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
