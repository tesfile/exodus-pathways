import Link from "next/link";
import {
  AccountingHeader,
  AccountingTable,
  ClientAccountingFilter,
  YearEndPackagePanel
} from "@/components/portal/accounting-records";
import { UploadCard } from "@/components/portal/upload-card";
import {
  assetTableRows,
  getClientAccountingData,
  parseYear
} from "@/lib/accounting/data";
import type { DemoRow } from "@/lib/types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BusinessCorporationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const accounting = await getClientAccountingData(taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Business / Corporation"
        description="Company profile, corporate documents, asset purchases, and year-end business records."
      >
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/business-corporation" />
      </AccountingHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Upload Corporate Document", "/portal/documents"],
          ["Add Asset Purchase", `/portal/assets?year=${taxYear}`],
          ["Income", `/portal/income?year=${taxYear}`],
          ["Expenses", `/portal/expenses?year=${taxYear}`]
        ].map(([label, href]) => (
          <Link key={href} href={href} className="focus-ring rounded-md bg-exodus-light p-4 text-sm font-black text-exodus-navy">
            {label}
          </Link>
        ))}
      </section>

      <YearEndPackagePanel data={accounting} />

      <AccountingTable
        title="Company Records"
        columns={[
          { key: "legalName", label: "Legal Name" },
          { key: "tradeName", label: "Trade Name" },
          { key: "businessNumber", label: "Business Number" }
        ]}
        rows={companyRows(accounting)}
      />

      <UploadCard bucket="client-documents" documentType="business_document" title="Upload business or corporate document" taxYear={taxYear} />

      <AccountingTable
        title={`${accounting.taxYear} Asset Purchases`}
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

function companyRows(accounting: Awaited<ReturnType<typeof getClientAccountingData>>): DemoRow[] {
  return accounting.companies.map((company) => ({
    legalName: company.legal_name,
    tradeName: company.trade_name ?? "-",
    businessNumber: company.business_number ?? "-"
  }));
}
