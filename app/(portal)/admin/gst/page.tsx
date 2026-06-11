import { AccountingHeader, AdminAccountingFilter, GstSummaryTable } from "@/components/portal/accounting-records";
import { getAdminAccountingData, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminGstPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="GST" description="Admin GST review center for calculated and saved GST records.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/gst" />
      </AccountingHeader>
      {data ? <GstSummaryTable data={data} /> : null}
    </div>
  );
}
