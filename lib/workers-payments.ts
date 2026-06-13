import {
  formatDate,
  formatMoney,
  getClientOptionForCurrentUser,
  getClientOptions,
  toNumber,
  type ClientOption
} from "@/lib/accounting/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DemoRow } from "@/lib/types";

export type CompanyOption = {
  id: string;
  name: string;
};

export type WorkerRecord = {
  id: string;
  client_id: string;
  company_id: string | null;
  company_name: string;
  worker_name: string;
  sin_or_business_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  worker_type: string;
  business_name: string | null;
  gst_number: string | null;
  status: string;
  notes: string | null;
};

export type WorkerPaymentRecord = {
  id: string;
  worker_id: string;
  client_id: string;
  company_id: string | null;
  tax_year: number;
  payment_date: string;
  amount_paid: number | string;
  gst_paid: number | string;
  payment_method: string | null;
  client_worker_type: string | null;
  invoice_provided: string | null;
  admin_classification: string;
  slip_needed: string;
  pay_period: string | null;
  pay_period_start: string | null;
  pay_period_end: string | null;
  pay_frequency: string | null;
  invoice_bucket: string | null;
  invoice_storage_path: string | null;
  invoice_file_name: string | null;
  invoice_url: string;
  notes: string | null;
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
  t4_box24_ei_insurable_earnings: number | string;
  t4_box26_cpp_pensionable_earnings: number | string;
  t4_benefits: number | string;
  t4_vacation_pay: number | string;
  t4_net_pay: number | string;
  t4_ready_status: string;
  payroll_calculator_province: string | null;
  payroll_calculator_pay_frequency: string | null;
  payroll_calculator_pay_date: string | null;
  payroll_calculator_gross_pay: number | string;
  payroll_calculator_td1_federal_amount: number | string;
  payroll_calculator_td1_provincial_amount: number | string;
  payroll_calculator_cpp_exempt: boolean;
  payroll_calculator_ei_exempt: boolean;
  payroll_calculator_employer_cpp: number | string;
  payroll_calculator_employer_ei: number | string;
  business_name: string | null;
  gst_number: string | null;
  invoice_number: string | null;
  amount_before_gst: number | string;
  subcontractor_gst: number | string;
  total_paid: number | string;
  status: string;
  review_notes: string | null;
};

type WorkerRow = Omit<WorkerRecord, "company_name">;
type WorkerPaymentRow = Omit<WorkerPaymentRecord, "invoice_url">;

export type WorkerSummary = {
  worker: WorkerRecord;
  taxYear: number;
  paymentCount: number;
  totalPaid: number;
  gstPaid: number;
  slipNeeded: string;
};

export type WorkersPaymentsData = {
  client: ClientOption | null;
  taxYear: number;
  companies: CompanyOption[];
  workers: WorkerRecord[];
  payments: WorkerPaymentRecord[];
  summaries: WorkerSummary[];
  totals: {
    totalPaid: number;
    gstPaid: number;
    grossPay: number;
    cpp: number;
    ei: number;
    incomeTaxDeducted: number;
    benefits: number;
    vacationPay: number;
    netPay: number;
  };
};

export async function getClientWorkersPaymentsData(taxYear: number): Promise<WorkersPaymentsData> {
  const client = await getClientOptionForCurrentUser();
  return getWorkersPaymentsData(client, taxYear);
}

export async function getAdminWorkersPaymentsData(clientId: string | undefined, taxYear: number) {
  const clients = await getClientOptions();
  const selectedClient = clients.find((client) => client.id === clientId) ?? clients[0] ?? null;
  return {
    clients,
    selectedClient,
    taxYear,
    data: await getWorkersPaymentsData(selectedClient, taxYear)
  };
}

export async function getWorkersPaymentsData(client: ClientOption | null, taxYear: number): Promise<WorkersPaymentsData> {
  if (!client) {
    return emptyWorkersData(null, taxYear);
  }

  const supabase = await createServerSupabaseClient();
  const [companiesResult, workersResult, paymentsResult] = await Promise.all([
    supabase.from("companies").select("id,legal_name,trade_name").eq("client_id", client.id).order("legal_name"),
    supabase
      .from("workers")
      .select("id,client_id,company_id,worker_name,sin_or_business_number,address,phone,email,worker_type,business_name,gst_number,status,notes")
      .eq("client_id", client.id)
      .order("worker_name"),
    supabase
      .from("worker_payments")
      .select("id,worker_id,client_id,company_id,tax_year,payment_date,amount_paid,gst_paid,payment_method,client_worker_type,invoice_provided,admin_classification,slip_needed,pay_period,pay_period_start,pay_period_end,pay_frequency,invoice_bucket,invoice_storage_path,invoice_file_name,notes,gross_pay,cpp,ei,income_tax_deducted,benefits,vacation_pay,net_pay,t4_box14_employment_income,t4_box16_cpp,t4_box18_ei,t4_box22_income_tax_deducted,t4_box24_ei_insurable_earnings,t4_box26_cpp_pensionable_earnings,t4_benefits,t4_vacation_pay,t4_net_pay,t4_ready_status,payroll_calculator_province,payroll_calculator_pay_frequency,payroll_calculator_pay_date,payroll_calculator_gross_pay,payroll_calculator_td1_federal_amount,payroll_calculator_td1_provincial_amount,payroll_calculator_cpp_exempt,payroll_calculator_ei_exempt,payroll_calculator_employer_cpp,payroll_calculator_employer_ei,business_name,gst_number,invoice_number,amount_before_gst,subcontractor_gst,total_paid,status,review_notes")
      .eq("client_id", client.id)
      .eq("tax_year", taxYear)
      .order("payment_date", { ascending: false })
  ]);

  const companies = ((companiesResult.data ?? []) as Array<{ id: string; legal_name: string; trade_name: string | null }>).map((company) => ({
    id: company.id,
    name: company.trade_name || company.legal_name
  }));
  const companyById = new Map(companies.map((company) => [company.id, company.name]));
  const workers = ((workersResult.data ?? []) as WorkerRow[]).map((worker) => ({
    ...worker,
    company_name: worker.company_id ? companyById.get(worker.company_id) ?? "-" : "-"
  }));
  const payments = await Promise.all(
    ((paymentsResult.data ?? []) as WorkerPaymentRow[]).map(async (payment) => ({
      ...payment,
      invoice_url: payment.invoice_bucket && payment.invoice_storage_path
        ? await createSignedDownloadUrl(payment.invoice_bucket, payment.invoice_storage_path)
        : ""
    }))
  );

  return buildWorkersData(client, taxYear, companies, workers, payments);
}

export function workerRows(data: WorkersPaymentsData): DemoRow[] {
  return data.workers.map((worker) => ({
    worker: worker.worker_name,
    company: worker.company_name,
    type: worker.worker_type,
    idNumber: worker.sin_or_business_number ?? "-",
    address: worker.address ?? "-",
    email: worker.email ?? "-",
    phone: worker.phone ?? "-",
    status: worker.status
  }));
}

export function workerPaymentRows(data: WorkersPaymentsData): DemoRow[] {
  const workerById = new Map(data.workers.map((worker) => [worker.id, worker]));
  return data.payments.map((payment) => {
    const worker = workerById.get(payment.worker_id);
    return {
      date: formatDate(payment.payment_date),
      worker: worker?.worker_name ?? "Worker",
      company: worker?.company_name ?? "-",
      amount: formatMoney(payment.amount_paid),
      gst: formatMoney(payment.gst_paid),
      method: payment.payment_method ?? "-",
      invoiceProvided: payment.invoice_provided ?? "-",
      clientType: payment.client_worker_type ?? worker?.worker_type ?? "-",
      adminClassification: payment.admin_classification,
      slipNeeded: payment.slip_needed,
      netPay: formatMoney(payment.net_pay),
      payPeriod: payment.pay_period ?? "-",
      invoice: payment.invoice_file_name ?? "-",
      invoiceHref: payment.invoice_url,
      status: payment.status
    };
  });
}

export function workerPaymentReviewRows(data: WorkersPaymentsData): DemoRow[] {
  const workerById = new Map(data.workers.map((worker) => [worker.id, worker]));
  return data.payments.map((payment) => {
    const worker = workerById.get(payment.worker_id);
    return {
      date: formatDate(payment.payment_date),
      worker: worker?.worker_name ?? "Worker",
      idNumber: worker?.sin_or_business_number ?? "-",
      address: worker?.address ?? "-",
      phone: worker?.phone ?? "-",
      email: worker?.email ?? "-",
      amount: formatMoney(payment.amount_paid),
      method: payment.payment_method ?? "-",
      invoiceProvided: payment.invoice_provided ?? "-",
      clientType: payment.client_worker_type ?? worker?.worker_type ?? "-",
      notes: payment.notes ?? "-",
      adminClassification: payment.admin_classification,
      slipNeeded: payment.slip_needed,
      status: payment.status
    };
  });
}

export function workerSummaryRows(data: WorkersPaymentsData): DemoRow[] {
  return data.summaries.map((summary) => ({
    worker: summary.worker.worker_name,
    company: summary.worker.company_name,
    type: summary.worker.worker_type,
    classification: summary.worker.worker_type,
    slipNeeded: summary.slipNeeded,
    payments: String(summary.paymentCount),
    totalPaid: formatMoney(summary.totalPaid),
    gstPaid: formatMoney(summary.gstPaid)
  }));
}

export function payrollSummaryRows(data: WorkersPaymentsData): DemoRow[] {
  return [
    { item: "Gross Pay", value: formatMoney(data.totals.grossPay), detail: String(data.taxYear) },
    { item: "CPP", value: formatMoney(data.totals.cpp), detail: "Employee payroll" },
    { item: "EI", value: formatMoney(data.totals.ei), detail: "Employee payroll" },
    { item: "Income Tax Deducted", value: formatMoney(data.totals.incomeTaxDeducted), detail: "Employee payroll" },
    { item: "Benefits", value: formatMoney(data.totals.benefits), detail: "Employee payroll" },
    { item: "Vacation Pay", value: formatMoney(data.totals.vacationPay), detail: "Employee payroll" },
    { item: "Net Pay", value: formatMoney(data.totals.netPay), detail: "Employee payroll" }
  ];
}

export function sourceDeductionPlaceholderRows(data: WorkersPaymentsData): DemoRow[] {
  return [
    {
      item: "Source Deduction Summary",
      value: formatMoney(data.totals.cpp + data.totals.ei + data.totals.incomeTaxDeducted),
      detail: "Prepared placeholder. CRA remittance connection is not enabled."
    }
  ];
}

export function t4YearlyTotalRows(data: WorkersPaymentsData): DemoRow[] {
  const t4Payments = data.payments.filter((payment) => payment.admin_classification === "T4 Employee");

  return [
    { item: "Payment count", value: String(data.payments.length), detail: String(data.taxYear) },
    { item: "Total amount paid", value: formatMoney(data.totals.totalPaid), detail: "All saved worker payments" },
    { item: "GST paid", value: formatMoney(data.totals.gstPaid), detail: "All saved worker payments" },
    { item: "Total Box 14", value: formatMoney(sumPayments(t4Payments, "t4_box14_employment_income", "amount_paid")), detail: "Employment income" },
    { item: "Total Box 16", value: formatMoney(sumPayments(t4Payments, "t4_box16_cpp", "cpp")), detail: "CPP contributions" },
    { item: "Total Box 18", value: formatMoney(sumPayments(t4Payments, "t4_box18_ei", "ei")), detail: "EI premiums" },
    { item: "Total Box 22", value: formatMoney(sumPayments(t4Payments, "t4_box22_income_tax_deducted", "income_tax_deducted")), detail: "Income tax deducted" },
    { item: "Total Box 24", value: formatMoney(sumPayments(t4Payments, "t4_box24_ei_insurable_earnings", "amount_paid")), detail: "EI insurable earnings" },
    { item: "Total Box 26", value: formatMoney(sumPayments(t4Payments, "t4_box26_cpp_pensionable_earnings", "amount_paid")), detail: "CPP pensionable earnings" },
    { item: "Total net pay", value: formatMoney(sumPayments(t4Payments, "t4_net_pay", "net_pay")), detail: "Reviewed T4 employee payments" }
  ];
}

export function t4PreparationRows(data: WorkersPaymentsData): DemoRow[] {
  const workerById = new Map(data.workers.map((worker) => [worker.id, worker]));
  const rowsByWorker = new Map<string, DemoRow & { _sort: string }>();

  data.payments
    .filter((payment) => payment.admin_classification === "T4 Employee")
    .forEach((payment) => {
      const worker = workerById.get(payment.worker_id);
      const existing = rowsByWorker.get(payment.worker_id);
      const next = {
        worker: worker?.worker_name ?? "Worker",
        sin: worker?.sin_or_business_number ?? "-",
        box14: formatMoney((existing ? moneyToNumber(existing.box14) : 0) + valueWithFallback(payment, "t4_box14_employment_income", "amount_paid")),
        box16: formatMoney((existing ? moneyToNumber(existing.box16) : 0) + valueWithFallback(payment, "t4_box16_cpp", "cpp")),
        box18: formatMoney((existing ? moneyToNumber(existing.box18) : 0) + valueWithFallback(payment, "t4_box18_ei", "ei")),
        box22: formatMoney((existing ? moneyToNumber(existing.box22) : 0) + valueWithFallback(payment, "t4_box22_income_tax_deducted", "income_tax_deducted")),
        box24: formatMoney((existing ? moneyToNumber(existing.box24) : 0) + valueWithFallback(payment, "t4_box24_ei_insurable_earnings", "amount_paid")),
        box26: formatMoney((existing ? moneyToNumber(existing.box26) : 0) + valueWithFallback(payment, "t4_box26_cpp_pensionable_earnings", "amount_paid")),
        slipStatus: payment.t4_ready_status,
        _sort: worker?.worker_name ?? "Worker"
      };
      rowsByWorker.set(payment.worker_id, next);
    });

  return Array.from(rowsByWorker.values())
    .sort((a, b) => a._sort.localeCompare(b._sort))
    .map((row) => ({
      worker: row.worker,
      sin: row.sin,
      box14: row.box14,
      box16: row.box16,
      box18: row.box18,
      box22: row.box22,
      box24: row.box24,
      box26: row.box26,
      slipStatus: row.slipStatus
    }));
}

export function t4aPreparationRows(data: WorkersPaymentsData): DemoRow[] {
  return slipSupportRows(data, "T4A Contractor", "T4A");
}

export function t5018SupportRows(data: WorkersPaymentsData): DemoRow[] {
  return slipSupportRows(data, "T5018 Subcontractor", "T5018");
}

function buildWorkersData(
  client: ClientOption,
  taxYear: number,
  companies: CompanyOption[],
  workers: WorkerRecord[],
  payments: WorkerPaymentRecord[]
): WorkersPaymentsData {
  const paymentsByWorker = new Map<string, WorkerPaymentRecord[]>();
  payments.forEach((payment) => {
    paymentsByWorker.set(payment.worker_id, [...(paymentsByWorker.get(payment.worker_id) ?? []), payment]);
  });

  const summaries = workers.map((worker) => {
    const workerPayments = paymentsByWorker.get(worker.id) ?? [];
    return {
      worker,
      taxYear,
      paymentCount: workerPayments.length,
      totalPaid: workerPayments.reduce((sum, payment) => sum + toNumber(payment.amount_paid), 0),
      gstPaid: workerPayments.reduce((sum, payment) => sum + toNumber(payment.gst_paid), 0),
      slipNeeded: workerPayments[0]?.slip_needed ?? slipNeededForWorker(worker.worker_type)
    };
  });

  return {
    client,
    taxYear,
    companies,
    workers,
    payments,
    summaries,
    totals: {
      totalPaid: payments.reduce((sum, payment) => sum + toNumber(payment.amount_paid), 0),
      gstPaid: payments.reduce((sum, payment) => sum + toNumber(payment.gst_paid), 0),
      grossPay: payments.reduce((sum, payment) => sum + toNumber(payment.gross_pay), 0),
      cpp: payments.reduce((sum, payment) => sum + toNumber(payment.cpp), 0),
      ei: payments.reduce((sum, payment) => sum + toNumber(payment.ei), 0),
      incomeTaxDeducted: payments.reduce((sum, payment) => sum + toNumber(payment.income_tax_deducted), 0),
      benefits: payments.reduce((sum, payment) => sum + toNumber(payment.benefits), 0),
      vacationPay: payments.reduce((sum, payment) => sum + toNumber(payment.vacation_pay), 0),
      netPay: payments.reduce((sum, payment) => sum + toNumber(payment.net_pay), 0)
    }
  };
}

function emptyWorkersData(client: ClientOption | null, taxYear: number): WorkersPaymentsData {
  return {
    client,
    taxYear,
    companies: [],
    workers: [],
    payments: [],
    summaries: [],
    totals: {
      totalPaid: 0,
      gstPaid: 0,
      grossPay: 0,
      cpp: 0,
      ei: 0,
      incomeTaxDeducted: 0,
      benefits: 0,
      vacationPay: 0,
      netPay: 0
    }
  };
}

function slipNeededForWorker(workerType: string) {
  if (workerType === "Employee" || workerType === "Employee / Payroll" || workerType === "T4 Employee") {
    return "T4";
  }
  if (workerType === "T4A Contractor" || workerType === "T4A contractor") {
    return "T4A";
  }
  if (workerType === "Subcontractor" || workerType === "Construction subcontractor" || workerType === "T5018 Subcontractor") {
    return "T5018";
  }
  return "Review Needed";
}

async function createSignedDownloadUrl(bucket: string, storagePath: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 300, {
    download: true
  });

  if (error) {
    return "";
  }

  return data.signedUrl;
}

type NumericPaymentKey = {
  [K in keyof WorkerPaymentRecord]: WorkerPaymentRecord[K] extends number | string ? K : never
}[keyof WorkerPaymentRecord];

function sumPayments(payments: WorkerPaymentRecord[], primary: NumericPaymentKey, fallback: NumericPaymentKey) {
  return payments.reduce((sum, payment) => sum + valueWithFallback(payment, primary, fallback), 0);
}

function valueWithFallback(payment: WorkerPaymentRecord, primary: NumericPaymentKey, fallback: NumericPaymentKey) {
  const primaryValue = toNumber(payment[primary]);
  return primaryValue > 0 ? primaryValue : toNumber(payment[fallback]);
}

function moneyToNumber(value: string) {
  return Number(value.replace(/[^0-9.-]/g, "")) || 0;
}

function slipSupportRows(data: WorkersPaymentsData, classification: string, slip: string): DemoRow[] {
  const workerById = new Map(data.workers.map((worker) => [worker.id, worker]));
  const rowsByWorker = new Map<string, { worker: string; idNumber: string; payments: number; total: number; status: string }>();

  data.payments
    .filter((payment) => payment.admin_classification === classification)
    .forEach((payment) => {
      const worker = workerById.get(payment.worker_id);
      const existing = rowsByWorker.get(payment.worker_id);
      rowsByWorker.set(payment.worker_id, {
        worker: worker?.worker_name ?? "Worker",
        idNumber: worker?.sin_or_business_number ?? "-",
        payments: (existing?.payments ?? 0) + 1,
        total: (existing?.total ?? 0) + toNumber(payment.amount_paid),
        status: payment.slip_needed === slip ? `${slip} Needed` : payment.slip_needed
      });
    });

  return Array.from(rowsByWorker.values()).map((row) => ({
    worker: row.worker,
    idNumber: row.idNumber,
    payments: String(row.payments),
    total: formatMoney(row.total),
    status: row.status
  }));
}
