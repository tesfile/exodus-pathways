import Link from "next/link";
import { AccountingHeader, AdminAccountingFilter } from "@/components/portal/accounting-records";
import { WorkerReviewWorkspace } from "@/components/portal/workers-admin-review";
import { parseYear } from "@/lib/accounting/data";
import { getAdminWorkersPaymentsData } from "@/lib/workers-payments";
import { requireRole } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkersPayrollReviewPage({ searchParams }: PageProps) {
  await requireRole(["admin"]);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Register employees under the correct company before entering payroll.</p>
        <Link href={`/admin/t4-year-end?clientId=${encodeURIComponent(selectedClient?.id ?? "")}&year=${taxYear}`} className="rounded-lg border border-blue-900 px-5 py-3 font-semibold text-blue-900">T4 Year-End Review</Link>
        {selectedClient ? (
          <Link
            href={`/admin/workers-payroll-review/new?clientId=${encodeURIComponent(selectedClient.id)}&year=${taxYear}`}
            className="rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            + Add Employee
          </Link>
        ) : null}
      </div>
      <WorkerReviewWorkspace
        data={data}
        clientId={selectedClient?.id ?? ""}
        taxYear={taxYear}
        baseHref={baseHref}
        selectedWorkerId={selectedWorkerId}
        selectedTab={selectedWorkerTab}
        workerNotice={firstParam(params?.workerNotice)}
      />
    </div>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
