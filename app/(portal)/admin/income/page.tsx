import { AccountingHeader, AccountingTable, AdminAccountingFilter } from "@/components/portal/accounting-records";
import { getAdminAccountingData, incomeTableRows, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminIncomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId;
  const { clients, selectedClient, data } = await getAdminAccountingData(clientId, taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Income" description="Admin view of real income entries for the selected client and year.">
        <AdminAccountingFilter clients={clients} selectedClientId={selectedClient?.id} selectedYear={taxYear} action="/admin/income" />
      </AccountingHeader>
      <AccountingTable
        title={`${selectedClient?.companyName ?? "Client"} Income`}
        columns={[
          { key: "date", label: "Date" },
          { key: "source", label: "Who Paid You / Work Done" },
          { key: "amount", label: "Amount" },
          { key: "gst", label: "GST" },
          { key: "invoice", label: "Invoice" },
          { key: "status", label: "Status" }
        ]}
        rows={data ? incomeTableRows(data) : []}
      />
    </div>
  );
}
