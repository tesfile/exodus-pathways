import { AccountingHeader, AccountingTable, ClientAccountingFilter } from "@/components/portal/accounting-records";
import { SmartAssetForm } from "@/components/portal/smart-asset-form";
import { assetTableRows, getClientAccountingData, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientAssetsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const accounting = await getClientAccountingData(taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Assets" description="Record equipment, vehicle, tool, and other asset purchases by purchase date.">
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/assets" />
      </AccountingHeader>
      <SmartAssetForm taxYear={taxYear} />
      <AccountingTable
        title={`${accounting.taxYear} Assets`}
        columns={[
          { key: "date", label: "Purchase Date" },
          { key: "description", label: "Description" },
          { key: "class", label: "Class" },
          { key: "cost", label: "Cost" },
          { key: "status", label: "Status" }
        ]}
        rows={assetTableRows(accounting)}
      />
    </div>
  );
}
