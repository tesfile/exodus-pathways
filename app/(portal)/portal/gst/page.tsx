import { AccountingHeader, ClientAccountingFilter, GstSummaryTable } from "@/components/portal/accounting-records";
import { SmartGstForm } from "@/components/portal/smart-gst-form";
import { getClientAccountingData, parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GstPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const accounting = await getClientAccountingData(taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader title="GST" description="Track GST collected and GST paid in simple totals.">
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/gst" />
      </AccountingHeader>
      <SmartGstForm taxYear={taxYear} />
      <GstSummaryTable data={accounting} />
    </div>
  );
}
