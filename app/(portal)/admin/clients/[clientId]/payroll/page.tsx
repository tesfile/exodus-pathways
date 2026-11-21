import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecret) throw new Error("Payroll settings are not configured.");
  const db = createClient(supabaseUrl, supabaseSecret, { auth: { persistSession: false, autoRefreshToken: false } });
  // Protected profiles are read on the server. Only non-sensitive pay display fields are sent to the browser.
  const { data: rateProfiles, error: rateError } = await db.from("kal_payroll_employee_profiles")
    .select("worker_id,pay_type,hourly_rate,salary_amount,vacation_percent,employment_status,payment_method")
    .eq("client_id", clientId);
  if (rateError) throw new Error("Could not load employee pay profiles.");
  const rates = new Map((rateProfiles ?? []).map(profile => [profile.worker_id, profile]));
  const money = (amount: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);

  const relevantEmployees = workers
    .filter(worker => /employee/i.test(worker.worker_type))
    .map(worker => ({
      id: worker.id,
      name: worker.worker_name,
      company: worker.company_name,
      companyId: worker.company_id ?? "",
      status: rates.get(worker.id)?.employment_status ?? worker.status,
      payRateLabel: rates.get(worker.id)?.pay_type === "salary"
        ? rates.get(worker.id)?.salary_amount == null ? "Not set" : `${money(Number(rates.get(worker.id)!.salary_amount))}/pay period`
        : rates.get(worker.id)?.hourly_rate == null ? "Not set" : `${money(Number(rates.get(worker.id)!.hourly_rate))}/hour`,
      payMethodLabel: rates.get(worker.id)?.payment_method === "manual_bank_transfer" ? "Manual transfer" : rates.get(worker.id)?.payment_method === "external_direct_deposit" ? "External direct deposit" : "Paper cheque",
      vacationLabel: rates.get(worker.id)?.vacation_percent == null
        ? "Review setup" : `${Number(rates.get(worker.id)!.vacation_percent)}% · review policy`
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
        <Link href="/admin/payroll" className="text-sm font-bold text-emerald-800 hover:underline">
          ← All payroll companies
        </Link>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">Payroll workspace · {year}</span>
      </div>
      <ClientPayrollTabs key={`${year}:${section}:${initialCompanyId}`}
        clientId={client.id} clientName={client.companyName} taxYear={year}
        initialTab={section} initialCompanyId={initialCompanyId}
        companies={companies} employees={relevantEmployees} payments={employeePayments} />
    </div>
  );
}
