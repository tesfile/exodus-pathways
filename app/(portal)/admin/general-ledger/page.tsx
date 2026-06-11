import { AccountingHeader, AdminAccountingFilter, GeneralLedgerTable } from "@/components/portal/accounting-records";
import { getAdminAccountingData, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminGeneralLedgerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="General Ledger" description="Year transaction detail from real income and expense records.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/general-ledger" />
      </AccountingHeader>
      {data ? <GeneralLedgerTable data={data} /> : null}
    </div>
  );
}
