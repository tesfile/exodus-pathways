import {
  AccountingHeader,
  AccountingModuleLinks,
  AccountingSummary,
  AdminAccountingFilter,
  GeneralLedgerTable,
  GstSummaryTable,
  YearEndPackagePanel
} from "@/components/portal/accounting-records";
import {
  getAdminAccountingData,
  parseYear
} from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountingClientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Accounting Clients"
        description="Select a real client and year to view income, expenses, receipts, bank statements, GST, payroll, assets, and reports."
      >
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/accounting-clients" />
      </AccountingHeader>
      {data ? (
        <>
          <YearEndPackagePanel data={data} adminHref={`/admin/year-end-package?clientId=${data.client.id}&year=${data.taxYear}`} />
          <AccountingSummary data={data} />
          <AccountingModuleLinks basePath="admin" clientId={data.client.id} year={data.taxYear} />
          <GstSummaryTable data={data} />
          <GeneralLedgerTable data={data} />
        </>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-exodus-slate">
          No client records found in public.users.
        </div>
      )}
    </div>
  );
}
