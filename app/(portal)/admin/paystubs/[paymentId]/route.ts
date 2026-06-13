import { formatDate, formatMoney, toNumber } from "@/lib/accounting/data";
import { createPaystubPdf } from "@/lib/paystub-pdf";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

type PaymentRow = {
  id: string;
  worker_id: string;
  client_id: string;
  company_id: string | null;
  payment_date: string;
  amount_paid: number | string;
  pay_period_start: string | null;
  pay_period_end: string | null;
  pay_frequency: string | null;
  gross_pay: number | string;
  cpp: number | string;
  ei: number | string;
  income_tax_deducted: number | string;
  benefits: number | string;
  vacation_pay: number | string;
  net_pay: number | string;
  t4_box14_employment_income: number | string;
  t4_box16_cpp: number | string;
  t4_box18_ei: number | string;
  t4_box22_income_tax_deducted: number | string;
  t4_benefits: number | string;
  t4_vacation_pay: number | string;
  t4_net_pay: number | string;
  payroll_calculator_pay_date: string | null;
  payroll_calculator_pay_frequency: string | null;
};

type WorkerRow = {
  worker_name: string;
  address: string | null;
};

type CompanyRow = {
  legal_name: string;
  trade_name: string | null;
  business_number: string | null;
  address: string | null;
};

type ClientProfileRow = {
  address: string | null;
  province: string | null;
  postal_code: string | null;
};

type UserRow = {
  full_name: string;
  display_name: string | null;
};

export async function GET(_request: Request, { params }: RouteContext) {
  await requireRole(["admin"]);
  const { paymentId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: paymentData } = await supabase
    .from("worker_payments")
    .select("id,worker_id,client_id,company_id,payment_date,amount_paid,pay_period_start,pay_period_end,pay_frequency,gross_pay,cpp,ei,income_tax_deducted,benefits,vacation_pay,net_pay,t4_box14_employment_income,t4_box16_cpp,t4_box18_ei,t4_box22_income_tax_deducted,t4_benefits,t4_vacation_pay,t4_net_pay,payroll_calculator_pay_date,payroll_calculator_pay_frequency")
    .eq("id", paymentId)
    .maybeSingle();

  const payment = paymentData as PaymentRow | null;
  if (!payment) {
    return new Response("Paystub payment not found.", { status: 404 });
  }

  if (!payment.pay_period_start || !payment.pay_period_end || !payment.pay_frequency) {
    return new Response("Save payroll review first.", { status: 409 });
  }

  const [{ data: workerData }, { data: userData }, { data: profileData }, { data: companyData }] = await Promise.all([
    supabase.from("workers").select("worker_name,address").eq("id", payment.worker_id).maybeSingle(),
    supabase.from("users").select("full_name,display_name").eq("id", payment.client_id).maybeSingle(),
    supabase.from("client_profiles").select("address,province,postal_code").eq("user_id", payment.client_id).maybeSingle(),
    getCompanyForPayment(payment)
  ]);

  const worker = workerData as WorkerRow | null;
  const user = userData as UserRow | null;
  const profile = profileData as ClientProfileRow | null;
  const company = companyData as CompanyRow | null;
  const employerName = user?.display_name || company?.legal_name || company?.trade_name || user?.full_name || "Employer";
  const companyAddress = company?.address || [profile?.address, profile?.province, profile?.postal_code].filter(Boolean).join(", ");
  const payDate = payment.payroll_calculator_pay_date || payment.payment_date;
  const grossPay = amountWithFallback(payment.t4_box14_employment_income, payment.gross_pay, payment.amount_paid);
  const cpp = amountWithFallback(payment.t4_box16_cpp, payment.cpp);
  const ei = amountWithFallback(payment.t4_box18_ei, payment.ei);
  const tax = amountWithFallback(payment.t4_box22_income_tax_deducted, payment.income_tax_deducted);
  const benefits = amountWithFallback(payment.t4_benefits, payment.benefits);
  const vacationPay = amountWithFallback(payment.t4_vacation_pay, payment.vacation_pay);
  const netPay = amountWithFallback(payment.t4_net_pay, payment.net_pay) || Math.max(grossPay - cpp - ei - tax, 0);

  const pdf = createPaystubPdf(employerName, [
    {
      title: "Employer",
      rows: [
        { label: "Employer / Company name", value: employerName },
        ...(company?.business_number ? [{ label: "Business number", value: company.business_number }] : []),
        ...(companyAddress ? [{ label: "Company address", value: companyAddress }] : [])
      ]
    },
    {
      title: "Worker",
      rows: [
        { label: "Worker name", value: worker?.worker_name ?? "Worker" },
        ...(worker?.address ? [{ label: "Worker address", value: worker.address }] : [])
      ]
    },
    {
      title: "Pay Details",
      rows: [
        { label: "Pay period start", value: formatDate(payment.pay_period_start) },
        { label: "Pay period end", value: formatDate(payment.pay_period_end) },
        { label: "Pay date", value: formatDate(payDate) },
        { label: "Pay frequency", value: payment.pay_frequency }
      ]
    },
    {
      title: "Earnings and Deductions",
      rows: [
        { label: "Gross pay", value: formatMoney(grossPay) },
        { label: "CPP", value: formatMoney(cpp) },
        { label: "EI", value: formatMoney(ei) },
        { label: "Income tax deducted", value: formatMoney(tax) },
        { label: "Benefits", value: formatMoney(benefits) },
        { label: "Vacation pay", value: formatMoney(vacationPay) },
        { label: "Net pay", value: formatMoney(netPay) }
      ]
    }
  ]);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName(`paystub-${worker?.worker_name ?? "worker"}-${payDate}.pdf`)}"`,
      "Cache-Control": "private, no-store"
    }
  });

  async function getCompanyForPayment(row: PaymentRow) {
    if (row.company_id) {
      const companyResult = await supabase
        .from("companies")
        .select("legal_name,trade_name,business_number,address")
        .eq("id", row.company_id)
        .maybeSingle();

      if (companyResult.data) {
        return companyResult;
      }
    }

    return supabase
      .from("companies")
      .select("legal_name,trade_name,business_number,address")
      .eq("client_id", row.client_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
  }
}

function amountWithFallback(primary: number | string, fallback: number | string, finalFallback: number | string = 0) {
  const primaryValue = toNumber(primary);
  if (primaryValue > 0) {
    return primaryValue;
  }

  const fallbackValue = toNumber(fallback);
  return fallbackValue > 0 ? fallbackValue : toNumber(finalFallback);
}

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}
