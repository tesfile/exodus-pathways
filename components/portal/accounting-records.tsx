import Link from "next/link";
import { CalendarDays, PackageCheck } from "lucide-react";
import { DataTable } from "@/components/portal/data-table";
import { ExportButtons } from "@/components/portal/export-buttons";
import {
  type AccountingData,
  type ClientOption,
  formatMoney,
  generalLedgerRows,
  gstTableRows,
  payrollSummaryRows
} from "@/lib/accounting/data";
import type { DemoRow, TableColumn } from "@/lib/types";

type AccountingHeaderProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function AccountingHeader({ title, description, children }: AccountingHeaderProps) {
  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Accounting records</p>
          <h1 className="mt-2 text-3xl font-black text-exodus-navy">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-exodus-slate">{description}</p>
        </div>
        <ExportButtons />
      </div>
      {children}
    </div>
  );
}

export function AdminAccountingFilter({
  clients,
  selectedClientId,
  selectedYear,
  action
}: {
  clients: ClientOption[];
  selectedClientId: string | undefined;
  selectedYear: number;
  action: string;
}) {
  return (
    <form action={action} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
        <label className="grid gap-2">
          <span className="label">Client</span>
          <select name="clientId" className="field" defaultValue={selectedClientId ?? ""} required>
            {clients.length === 0 ? <option value="">No clients found</option> : null}
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="label">Year</span>
          <YearSelect selectedYear={selectedYear} />
        </label>
        <button type="submit" className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
          View Records
        </button>
      </div>
    </form>
  );
}

export function ClientAccountingFilter({ selectedYear, action }: { selectedYear: number; action: string }) {
  return (
    <form action={action} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[220px_auto] sm:items-end">
        <label className="grid gap-2">
          <span className="label">Year</span>
          <YearSelect selectedYear={selectedYear} />
        </label>
        <button type="submit" className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
          View Year
        </button>
      </div>
    </form>
  );
}

function YearSelect({ selectedYear }: { selectedYear: number }) {
  const current = new Date().getFullYear();
  const years = Array.from(new Set([selectedYear, current, current - 1, current - 2, current - 3, current - 4]));

  return (
    <select name="year" className="field" defaultValue={selectedYear}>
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
}

export function AccountingSummary({ data }: { data: AccountingData }) {
  const cards = [
    { label: "Income", value: formatMoney(data.totals.income) },
    { label: "Expenses", value: formatMoney(data.totals.expenses) },
    { label: "GST Net", value: formatMoney(data.totals.gstNet) },
    { label: "Payroll", value: formatMoney(data.totals.payrollGross) },
    { label: "Assets", value: formatMoney(data.totals.assets) },
    { label: "Year Status", value: data.accountingYear?.status ?? "No year record" }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-exodus-slate">{card.label}</p>
          <p className="mt-2 text-xl font-black text-exodus-navy">{card.value}</p>
        </div>
      ))}
    </section>
  );
}

export function AccountingModuleLinks({
  basePath,
  clientId,
  year
}: {
  basePath: "admin" | "portal";
  clientId?: string;
  year: number;
}) {
  const adminQuery = clientId ? `?clientId=${clientId}&year=${year}` : `?year=${year}`;
  const clientQuery = `?year=${year}`;
  const query = basePath === "admin" ? adminQuery : clientQuery;
  const links =
    basePath === "admin"
      ? [
          ["Income", `/admin/income${query}`],
          ["Expenses", `/admin/expenses${query}`],
          ["Receipts", `/admin/receipts${query}`],
          ["Bank Statements", `/admin/bank-statements${query}`],
          ["GST", `/admin/gst${query}`],
          ["Workers & Payments", `/admin/workers-payroll-review${query}`],
          ["Assets", `/admin/assets${query}`],
          ["General Ledger", `/admin/general-ledger${query}`],
          ["Year-End Package", `/admin/year-end-package${query}`]
        ]
      : [
          ["Income", `/portal/income${query}`],
          ["Expenses", `/portal/expenses${query}`],
          ["Receipts", `/portal/receipts${query}`],
          ["Bank Statements", `/portal/bank-statements${query}`],
          ["GST", `/portal/gst${query}`],
          ["Workers & Payments", `/portal/workers-payments${query}`],
          ["Assets", `/portal/assets${query}`]
        ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {links.map(([label, href]) => (
        <Link key={href} href={href} className="focus-ring rounded-md bg-exodus-light p-4 text-sm font-black text-exodus-navy">
          {label}
        </Link>
      ))}
    </section>
  );
}

export function AccountingTable({
  title,
  description,
  columns,
  rows
}: {
  title: string;
  description?: string;
  columns: TableColumn[];
  rows: DemoRow[];
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h2 className="text-xl font-black text-exodus-navy">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-exodus-slate">{description}</p> : null}
      </div>
      {rows.length > 0 ? (
        <DataTable columns={columns} rows={rows} />
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-exodus-slate">
          No records found for this client and year.
        </div>
      )}
    </section>
  );
}

export function YearEndPackagePanel({ data, adminHref }: { data: AccountingData; adminHref?: string }) {
  return (
    <section className="rounded-md border border-exodus-gold/35 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-1 h-5 w-5 text-exodus-gold" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-black text-exodus-navy">{data.client.companyName} - {data.taxYear}</h2>
            <p className="mt-1 text-sm leading-6 text-exodus-slate">
              Income, expenses, receipts, bank statements, GST, payroll, assets, and general ledger are grouped by year.
            </p>
          </div>
        </div>
        {adminHref ? (
          <Link href={adminHref} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
            <PackageCheck className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
            Generate Year-End Package
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function GeneralLedgerTable({ data }: { data: AccountingData }) {
  return (
    <AccountingTable
      title="General Ledger"
      description="Income and expense transactions for the selected year."
      columns={[
        { key: "date", label: "Date" },
        { key: "account", label: "Account" },
        { key: "description", label: "Description" },
        { key: "debit", label: "Debit" },
        { key: "credit", label: "Credit" },
        { key: "gst", label: "GST" }
      ]}
      rows={generalLedgerRows(data)}
    />
  );
}

export function GstSummaryTable({ data }: { data: AccountingData }) {
  return (
    <AccountingTable
      title="GST Summary"
      description="Calculated from income GST collected and expense GST paid, plus saved GST records if available."
      columns={[
        { key: "period", label: "Period" },
        { key: "collected", label: "GST Collected" },
        { key: "paid", label: "GST Paid" },
        { key: "net", label: "Net GST" },
        { key: "status", label: "Status" }
      ]}
      rows={gstTableRows(data)}
    />
  );
}

export function PayrollSummaryTable({ data }: { data: AccountingData }) {
  return (
    <AccountingTable
      title="Payroll Summary"
      description="Generated from payroll records for the selected client and year."
      columns={[
        { key: "item", label: "Item" },
        { key: "value", label: "Value" },
        { key: "detail", label: "Detail" }
      ]}
      rows={payrollSummaryRows(data)}
    />
  );
}
