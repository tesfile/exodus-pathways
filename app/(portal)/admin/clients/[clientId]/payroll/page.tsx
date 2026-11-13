import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientPayrollTabs } from "../payroll-tabs";
import { getClientOptionById, parseYear } from "@/lib/accounting/data";
import { getWorkersPaymentsData } from "@/lib/workers-payments";
import { requireRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type PageProps = {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const sections = ["overview", "employees", "tax", "compliance"] as const;

export default async function KalClientPayrollPage({ params, searchParams }: PageProps) {
  await requireRole(["admin"]);
  const { clientId } = await params;
  const query = await searchParams;
  const year = parseYear(query?.year);
  const rawSection = first(query?.section);
  const section = sections.find(item => item === rawSection) ?? "overview";
  const client = await getClientOptionById(clientId);
  if (!client) notFound();

  const { companies, workers, payments } = await getWorkersPaymentsData(client, year, true);
  const activeCompany = first(query?.companyId);
  const initialCompanyId = companies.find(company => company.id === activeCompany)?.id ?? companies[0]?.id ?? "";
  const relevantEmployees = workers
    .filter(worker => /employee/i.test(worker.worker_type))
    .map(worker => ({
      id: worker.id,
      name: worker.worker_name,
      company: worker.company_name,
      companyId: worker.company_id ?? "",
      status: worker.status
    }));
  const payrollWorkerIds = new Set(relevantEmployees.map(worker => worker.id));
  const employeePayments = payments
    .filter(payment => payrollWorkerIds.has(payment.worker_id))
    .map(payment => ({
      id: payment.id,
      workerId: payment.worker_id,
      companyId: payment.company_id ?? "",
      date: payment.payment_date,
      periodStart: payment.pay_period_start,
      periodEnd: payment.pay_period_end,
      frequency: payment.pay_frequency,
      gross: Number(payment.gross_pay) || 0,
      cpp: Number(payment.cpp) || 0,
      ei: Number(payment.ei) || 0,
      incomeTax: Number(payment.income_tax_deducted) || 0,
      employerCpp: Number(payment.payroll_calculator_employer_cpp) || 0,
      employerEi: Number(payment.payroll_calculator_employer_ei) || 0,
      net: Number(payment.net_pay) || 0
    }));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500">
          <Link href={`/admin/clients/${clientId}`} className="font-semibold text-slate-600 hover:text-emerald-700">
            {client.companyName}
          </Link>
          <span className="mx-2">/</span>
          <span className="font-bold text-slate-900">Payroll</span>
        </div>
        <Link href={`/admin/clients/${clientId}?year=${year}&tab=bookkeeping`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
          Return to KAL Accounting
        </Link>
      </div>
      <ClientPayrollTabs key={`${year}:${section}:${initialCompanyId}`}
        clientId={client.id} clientName={client.companyName} taxYear={year}
        initialTab={section} initialCompanyId={initialCompanyId}
        companies={companies} employees={relevantEmployees} payments={employeePayments}>
        <p className="text-sm text-slate-600">
          The original payroll review and verified payment-entry workflow remain available.
        </p>
        <Link href={`/admin/workers-payroll-review?clientId=${encodeURIComponent(client.id)}&year=${year}`}
          className="font-bold text-emerald-700 hover:underline">Open original payroll record review</Link>
      </ClientPayrollTabs>
    </div>
  );
}
