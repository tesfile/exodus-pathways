import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AccountingTable } from "@/components/portal/accounting-records";
import { formatDate, formatMoney, toNumber } from "@/lib/accounting/data";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";
import { adminClassificationOptions } from "@/lib/workers-options";
import {
  payrollSummaryRows,
  sourceDeductionPlaceholderRows,
  t4aPreparationRows,
  t4PreparationRows,
  t4YearlyTotalRows,
  t5018SupportRows,
  type WorkerPaymentRecord,
  type WorkerRecord,
  type WorkersPaymentsData
} from "@/lib/workers-payments";
import type { DemoRow } from "@/lib/types";

const provinces = ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"];
const payFrequencies = ["weekly", "biweekly", "semi-monthly", "monthly"];
const readyStatuses = ["Not Ready", "In Review", "Ready"];
const workerReviewTabs = [
  { key: "payments", label: "Payments" },
  { key: "payroll", label: "Payroll / Paystubs" },
  { key: "t4", label: "T4 Summary" },
  { key: "t4a", label: "T4A Summary" },
  { key: "t5018", label: "T5018 Summary" },
  { key: "notes", label: "Notes" }
] as const;

type WorkerReviewTab = (typeof workerReviewTabs)[number]["key"];

async function reviewWorkerPaymentAction(formData: FormData) {
  "use server";

  const admin = await requireRole(["admin"]);
  const paymentId = String(formData.get("paymentId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const taxYear = String(formData.get("taxYear") ?? "");
  const returnPath = String(formData.get("returnPath") ?? "");
  const adminClassification = String(formData.get("adminClassification") ?? "Review Needed");
  const updates: Record<string, string | number | boolean | null> = {
    admin_classification: adminClassification,
    slip_needed: slipNeededForClassification(adminClassification),
    review_notes: String(formData.get("reviewNotes") ?? "").trim() || null,
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString(),
    status: "reviewed"
  };

  if (!paymentId) {
    return;
  }

  if (adminClassification === "T4 Employee") {
    const box14 = amountValue(formData, "t4Box14") || amountValue(formData, "amountPaid");
    const box16 = amountValue(formData, "t4Box16");
    const box18 = amountValue(formData, "t4Box18");
    const box22 = amountValue(formData, "t4Box22");
    const benefits = amountValue(formData, "t4Benefits");
    const vacationPay = amountValue(formData, "t4VacationPay");
    const netPay = amountValue(formData, "t4NetPay");
    const payPeriodStart = dateValue(formData, "payPeriodStart");
    const payPeriodEnd = dateValue(formData, "payPeriodEnd");
    const payFrequency = String(formData.get("payFrequency") ?? "").trim() || null;

    Object.assign(updates, {
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
      pay_frequency: payFrequency,
      pay_period: payPeriodStart && payPeriodEnd ? `${payPeriodStart} to ${payPeriodEnd}` : null,
      gross_pay: box14,
      cpp: box16,
      ei: box18,
      income_tax_deducted: box22,
      benefits,
      vacation_pay: vacationPay,
      net_pay: netPay,
      t4_box14_employment_income: box14,
      t4_box16_cpp: box16,
      t4_box18_ei: box18,
      t4_box22_income_tax_deducted: box22,
      t4_box24_ei_insurable_earnings: amountValue(formData, "t4Box24") || amountValue(formData, "amountPaid"),
      t4_box26_cpp_pensionable_earnings: amountValue(formData, "t4Box26") || amountValue(formData, "amountPaid"),
      t4_benefits: benefits,
      t4_vacation_pay: vacationPay,
      t4_net_pay: netPay,
      t4_ready_status: String(formData.get("t4ReadyStatus") ?? "Not Ready"),
      payroll_calculator_province: String(formData.get("calculatorProvince") ?? "").trim() || null,
      payroll_calculator_pay_frequency: payFrequency,
      payroll_calculator_pay_date: String(formData.get("calculatorPayDate") ?? "").trim() || null,
      payroll_calculator_gross_pay: amountValue(formData, "calculatorGrossPay") || amountValue(formData, "amountPaid"),
      payroll_calculator_td1_federal_amount: amountValue(formData, "calculatorTd1FederalAmount"),
      payroll_calculator_td1_provincial_amount: amountValue(formData, "calculatorTd1ProvincialAmount"),
      payroll_calculator_cpp_exempt: String(formData.get("calculatorCppExempt") ?? "No") === "Yes",
      payroll_calculator_ei_exempt: String(formData.get("calculatorEiExempt") ?? "No") === "Yes",
      payroll_calculator_employer_cpp: amountValue(formData, "calculatorEmployerCpp"),
      payroll_calculator_employer_ei: amountValue(formData, "calculatorEmployerEi")
    });
  }

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("worker_payments")
    .update(updates)
    .eq("id", paymentId);

  if (returnPath.startsWith("/admin/")) {
    revalidatePath(returnPath);
  }

  if (clientId) {
    revalidatePath(`/admin/clients/${clientId}`);
  }

  revalidatePath(`/admin/workers-payroll-review?clientId=${clientId}&year=${taxYear}`);
}

export function WorkerReviewWorkspace({
  data,
  clientId,
  taxYear,
  baseHref,
  selectedWorkerId,
  selectedTab
}: {
  data: WorkersPaymentsData;
  clientId: string;
  taxYear: number;
  baseHref: string;
  selectedWorkerId?: string;
  selectedTab?: string;
}) {
  const selectedWorker = data.workers.find((worker) => worker.id === selectedWorkerId) ?? null;
  const activeTab = parseWorkerReviewTab(selectedTab);

  return (
    <section className="grid gap-6">
      <AccountingTable
        title="Worker List"
        description="Choose one worker to review payments, payroll, paystubs, and slip summaries."
        columns={[
          { key: "worker", label: "Worker name" },
          { key: "idNumber", label: "SIN/BN" },
          { key: "type", label: "Worker type" },
          { key: "payments", label: "Number of payments" },
          { key: "totalPaid", label: "Total paid" },
          { key: "slipNeeded", label: "Slip needed" },
          { key: "status", label: "Status" },
          { key: "review", label: "Review" }
        ]}
        rows={workerListRows(data, baseHref)}
      />

      {selectedWorker ? (
        <SelectedWorkerReview
          data={data}
          worker={selectedWorker}
          activeTab={activeTab}
          clientId={clientId}
          taxYear={taxYear}
          baseHref={baseHref}
        />
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-exodus-slate">
          Select View / Review beside a worker to open that worker&apos;s payments and payroll review.
        </div>
      )}

      <WorkersPayrollSummaryTables data={data} />
      <WorkerExportPlaceholders />
    </section>
  );
}

function SelectedWorkerReview({
  data,
  worker,
  activeTab,
  clientId,
  taxYear,
  baseHref
}: {
  data: WorkersPaymentsData;
  worker: WorkerRecord;
  activeTab: WorkerReviewTab;
  clientId: string;
  taxYear: number;
  baseHref: string;
}) {
  const workerPayments = data.payments.filter((payment) => payment.worker_id === worker.id);
  const tabHref = (tab: WorkerReviewTab) => `${baseHref}&workerId=${worker.id}&workerTab=${tab}`;

  return (
    <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-exodus-navy">{worker.worker_name}</h2>
          <p className="mt-1 text-sm font-semibold text-exodus-slate">
            {worker.sin_or_business_number ?? "No SIN/BN"} | {worker.worker_type} | {workerPayments.length} payment(s)
          </p>
        </div>
        <Link href={baseHref} className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-exodus-light px-4 text-sm font-black text-exodus-navy">
          Back to worker list
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Selected worker review tabs">
        {workerReviewTabs.map((tab) => (
          <Link
            key={tab.key}
            href={tabHref(tab.key)}
            className={`focus-ring rounded-md px-3 py-2 text-xs font-black ${
              activeTab === tab.key ? "bg-exodus-navy text-white" : "bg-exodus-light text-exodus-navy"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {activeTab === "payments" ? (
        <WorkerPaymentsTab payments={workerPayments} worker={worker} clientId={clientId} taxYear={taxYear} returnPath={tabHref("payments")} />
      ) : null}
      {activeTab === "payroll" ? (
        <PayrollPaystubsTab payments={workerPayments} worker={worker} clientId={clientId} taxYear={taxYear} returnPath={tabHref("payroll")} />
      ) : null}
      {activeTab === "t4" ? <T4SummaryTab payments={workerPayments} /> : null}
      {activeTab === "t4a" ? <SlipSummaryTab payments={workerPayments} classification="T4A Contractor" title="T4A Summary" /> : null}
      {activeTab === "t5018" ? <SlipSummaryTab payments={workerPayments} classification="T5018 Subcontractor" title="T5018 Summary" /> : null}
      {activeTab === "notes" ? <WorkerNotesTab worker={worker} payments={workerPayments} /> : null}
    </section>
  );
}

function WorkerPaymentsTab({
  payments,
  worker,
  clientId,
  taxYear,
  returnPath
}: {
  payments: WorkerPaymentRecord[];
  worker: WorkerRecord;
  clientId: string;
  taxYear: number;
  returnPath: string;
}) {
  return (
    <div className="grid gap-4">
      <AccountingTable
        title="Payments"
        columns={[
          { key: "date", label: "Payment Date" },
          { key: "amount", label: "Amount Paid" },
          { key: "method", label: "Payment Method" },
          { key: "invoiceProvided", label: "Invoice Provided" },
          { key: "clientType", label: "Client Selected Type" },
          { key: "notes", label: "Notes" },
          { key: "adminClassification", label: "Admin Classification" },
          { key: "slipNeeded", label: "Slip Needed" },
          { key: "status", label: "Status" }
        ]}
        rows={paymentRows(payments, worker)}
      />
      <div className="grid gap-3">
        {payments.map((payment) => (
          <PaymentClassificationDetails
            key={payment.id}
            payment={payment}
            worker={worker}
            clientId={clientId}
            taxYear={taxYear}
            returnPath={returnPath}
          />
        ))}
      </div>
    </div>
  );
}

function PayrollPaystubsTab({
  payments,
  worker,
  clientId,
  taxYear,
  returnPath
}: {
  payments: WorkerPaymentRecord[];
  worker: WorkerRecord;
  clientId: string;
  taxYear: number;
  returnPath: string;
}) {
  const t4Payments = payments.filter((payment) => payment.admin_classification === "T4 Employee");

  if (t4Payments.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-exodus-slate">
        No T4 employee payments for this worker yet. Use the Payments tab to classify a payment as T4 Employee.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {t4Payments.map((payment) => (
        <PayrollPaymentDetails
          key={payment.id}
          payment={payment}
          worker={worker}
          clientId={clientId}
          taxYear={taxYear}
          returnPath={returnPath}
        />
      ))}
    </div>
  );
}

function PaymentClassificationDetails({
  payment,
  worker,
  clientId,
  taxYear,
  returnPath
}: {
  payment: WorkerPaymentRecord;
  worker: WorkerRecord;
  clientId: string;
  taxYear: number;
  returnPath: string;
}) {
  return (
    <details className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-black text-exodus-navy">
        {formatDate(payment.payment_date)} | {formatMoney(payment.amount_paid)} | {payment.admin_classification}
      </summary>
      <form action={reviewWorkerPaymentAction} className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <PaymentReviewHiddenFields payment={payment} clientId={clientId} taxYear={taxYear} returnPath={returnPath} />
        <div className="grid gap-2 text-sm text-exodus-slate">
          <p><span className="font-black text-exodus-navy">Worker:</span> {worker.worker_name}</p>
          <p><span className="font-black text-exodus-navy">Payment method:</span> {payment.payment_method ?? "-"}</p>
          <p><span className="font-black text-exodus-navy">Invoice provided:</span> {payment.invoice_provided ?? "-"}</p>
          <p><span className="font-black text-exodus-navy">Client selected type:</span> {payment.client_worker_type ?? worker.worker_type}</p>
          <p><span className="font-black text-exodus-navy">Notes:</span> {payment.notes ?? "-"}</p>
          {payment.invoice_url ? (
            <a href={payment.invoice_url} className="font-black text-exodus-blue underline-offset-4 hover:underline">
              Download invoice or receipt
            </a>
          ) : null}
        </div>
        <div className="grid content-start gap-3">
          <label className="grid gap-2">
            <span className="label">Admin Classification</span>
            <select name="adminClassification" className="field" defaultValue={payment.admin_classification}>
              {adminClassificationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="label">Review Notes</span>
            <textarea name="reviewNotes" className="field min-h-24" defaultValue={payment.review_notes ?? ""} />
          </label>
          <button type="submit" className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
            Save Review
          </button>
        </div>
      </form>
    </details>
  );
}

function PayrollPaymentDetails({
  payment,
  worker,
  clientId,
  taxYear,
  returnPath
}: {
  payment: WorkerPaymentRecord;
  worker: WorkerRecord;
  clientId: string;
  taxYear: number;
  returnPath: string;
}) {
  return (
    <details className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-black text-exodus-navy">
        {formatDate(payment.payment_date)} | {worker.worker_name} | Gross {formatMoney(amountDefault(payment.t4_box14_employment_income, payment.amount_paid))}
      </summary>
      <form action={reviewWorkerPaymentAction} className="mt-4 grid gap-4">
        <PaymentReviewHiddenFields payment={payment} clientId={clientId} taxYear={taxYear} returnPath={returnPath} />
        <input type="hidden" name="adminClassification" value="T4 Employee" />
        <label className="grid gap-2">
          <span className="label">Review Notes</span>
          <textarea name="reviewNotes" className="field min-h-24" defaultValue={payment.review_notes ?? ""} />
        </label>
        <T4PreparationPanel payment={payment} />
        <button type="submit" className="focus-ring min-h-11 w-fit rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
          Save Payroll Review
        </button>
      </form>
    </details>
  );
}

function PaymentReviewHiddenFields({
  payment,
  clientId,
  taxYear,
  returnPath
}: {
  payment: WorkerPaymentRecord;
  clientId: string;
  taxYear: number;
  returnPath: string;
}) {
  return (
    <>
      <input type="hidden" name="paymentId" value={payment.id} />
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="taxYear" value={taxYear} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <input type="hidden" name="amountPaid" value={String(payment.amount_paid)} />
    </>
  );
}

function T4SummaryTab({ payments }: { payments: WorkerPaymentRecord[] }) {
  const t4Payments = payments.filter((payment) => payment.admin_classification === "T4 Employee");
  return (
    <AccountingTable
      title="T4 Summary"
      description="Full-year T4 totals for the selected worker."
      columns={[
        { key: "item", label: "Item" },
        { key: "value", label: "Value" }
      ]}
      rows={selectedWorkerT4Rows(t4Payments)}
    />
  );
}

function SlipSummaryTab({
  payments,
  classification,
  title
}: {
  payments: WorkerPaymentRecord[];
  classification: string;
  title: string;
}) {
  const rows = payments
    .filter((payment) => payment.admin_classification === classification)
    .map((payment) => ({
      date: formatDate(payment.payment_date),
      amount: formatMoney(payment.amount_paid),
      invoice: payment.invoice_provided ?? "-",
      status: payment.slip_needed
    }));

  return (
    <AccountingTable
      title={title}
      columns={[
        { key: "date", label: "Payment Date" },
        { key: "amount", label: "Amount Paid" },
        { key: "invoice", label: "Invoice Provided" },
        { key: "status", label: "Slip Needed" }
      ]}
      rows={rows}
    />
  );
}

function WorkerNotesTab({ worker, payments }: { worker: WorkerRecord; payments: WorkerPaymentRecord[] }) {
  const rows = payments
    .filter((payment) => payment.notes || payment.review_notes)
    .map((payment) => ({
      date: formatDate(payment.payment_date),
      clientNote: payment.notes ?? "-",
      reviewNote: payment.review_notes ?? "-"
    }));

  return (
    <div className="grid gap-4">
      <div className="rounded-md bg-exodus-light p-4 text-sm leading-6 text-exodus-slate">
        <span className="font-black text-exodus-navy">Worker notes:</span> {worker.notes ?? "-"}
      </div>
      <AccountingTable
        title="Payment Notes"
        columns={[
          { key: "date", label: "Payment Date" },
          { key: "clientNote", label: "Client Notes" },
          { key: "reviewNote", label: "Admin Review Notes" }
        ]}
        rows={rows}
      />
    </div>
  );
}

function workerListRows(data: WorkersPaymentsData, baseHref: string): DemoRow[] {
  return data.summaries.map((summary) => ({
    worker: summary.worker.worker_name,
    idNumber: summary.worker.sin_or_business_number ?? "-",
    type: summary.worker.worker_type,
    payments: String(summary.paymentCount),
    totalPaid: formatMoney(summary.totalPaid),
    slipNeeded: summary.slipNeeded,
    status: summary.worker.status,
    review: "View / Review",
    reviewHref: `${baseHref}&workerId=${summary.worker.id}&workerTab=payments`
  }));
}

function paymentRows(payments: WorkerPaymentRecord[], worker: WorkerRecord): DemoRow[] {
  return payments.map((payment) => ({
    date: formatDate(payment.payment_date),
    amount: formatMoney(payment.amount_paid),
    method: payment.payment_method ?? "-",
    invoiceProvided: payment.invoice_provided ?? "-",
    clientType: payment.client_worker_type ?? worker.worker_type,
    notes: payment.notes ?? "-",
    adminClassification: payment.admin_classification,
    slipNeeded: payment.slip_needed,
    status: payment.status
  }));
}

function selectedWorkerT4Rows(payments: WorkerPaymentRecord[]): DemoRow[] {
  return [
    { item: "Box 14 Employment income", value: formatMoney(sumReviewed(payments, "t4_box14_employment_income", "amount_paid")) },
    { item: "Box 16 CPP", value: formatMoney(sumReviewed(payments, "t4_box16_cpp", "cpp")) },
    { item: "Box 18 EI", value: formatMoney(sumReviewed(payments, "t4_box18_ei", "ei")) },
    { item: "Box 22 Income tax deducted", value: formatMoney(sumReviewed(payments, "t4_box22_income_tax_deducted", "income_tax_deducted")) },
    { item: "Box 24 EI insurable earnings", value: formatMoney(sumReviewed(payments, "t4_box24_ei_insurable_earnings", "amount_paid")) },
    { item: "Box 26 CPP pensionable earnings", value: formatMoney(sumReviewed(payments, "t4_box26_cpp_pensionable_earnings", "amount_paid")) },
    { item: "Net Pay", value: formatMoney(sumReviewed(payments, "t4_net_pay", "net_pay")) }
  ];
}

type NumericWorkerPaymentKey = {
  [K in keyof WorkerPaymentRecord]: WorkerPaymentRecord[K] extends number | string ? K : never
}[keyof WorkerPaymentRecord];

function sumReviewed(payments: WorkerPaymentRecord[], primary: NumericWorkerPaymentKey, fallback: NumericWorkerPaymentKey) {
  return payments.reduce((sum, payment) => {
    const primaryValue = toNumber(payment[primary]);
    return sum + (primaryValue > 0 ? primaryValue : toNumber(payment[fallback]));
  }, 0);
}

function parseWorkerReviewTab(value: string | undefined): WorkerReviewTab {
  return workerReviewTabs.some((tab) => tab.key === value) ? (value as WorkerReviewTab) : "payments";
}

export function WorkerPaymentReviewCards({
  payments,
  workers,
  clientId,
  taxYear,
  returnPath
}: {
  payments: WorkerPaymentRecord[];
  workers: WorkerRecord[];
  clientId: string;
  taxYear: number;
  returnPath: string;
}) {
  const workerById = new Map(workers.map((worker) => [worker.id, worker]));

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-xl font-black text-exodus-navy">Admin Classification</h2>
        <p className="mt-1 text-sm leading-6 text-exodus-slate">
          Payroll calculations, slip decisions, and worker classification are reviewed by Exodus Pathways only.
        </p>
      </div>
      {payments.length > 0 ? (
        <div className="grid gap-4">
          {payments.map((payment) => {
            const worker = workerById.get(payment.worker_id);
            return (
              <form key={payment.id} action={reviewWorkerPaymentAction} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <input type="hidden" name="paymentId" value={payment.id} />
                <input type="hidden" name="clientId" value={clientId} />
                <input type="hidden" name="taxYear" value={taxYear} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <input type="hidden" name="amountPaid" value={String(payment.amount_paid)} />
                <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                  <div>
                    <p className="text-lg font-black text-exodus-navy">{worker?.worker_name ?? "Worker"}</p>
                    <p className="mt-1 text-sm font-semibold text-exodus-slate">
                      {formatDate(payment.payment_date)} | {formatMoney(payment.amount_paid)} | {payment.payment_method ?? "Method not provided"}
                    </p>
                    <p className="mt-1 text-sm text-exodus-slate">Client selected type: {payment.client_worker_type ?? worker?.worker_type ?? "-"}</p>
                    <p className="mt-1 text-sm text-exodus-slate">Invoice given: {payment.invoice_provided ?? "-"}</p>
                    <p className="mt-1 text-sm text-exodus-slate">Notes: {payment.notes ?? "-"}</p>
                    {payment.invoice_url ? (
                      <a href={payment.invoice_url} className="mt-3 inline-flex text-sm font-black text-exodus-blue underline-offset-4 hover:underline">
                        Download invoice or receipt
                      </a>
                    ) : null}
                    {payment.admin_classification === "T4 Employee" ? (
                      <T4PreparationPanel payment={payment} />
                    ) : (
                      <p className="mt-4 rounded-md bg-exodus-light p-3 text-sm font-semibold text-exodus-slate">
                        Select and save T4 Employee to open the Payroll/T4 preparation panel for this payment.
                      </p>
                    )}
                  </div>
                  <div className="grid content-start gap-3">
                    <label className="grid gap-2">
                      <span className="label">Admin Classification</span>
                      <select name="adminClassification" className="field" defaultValue={payment.admin_classification}>
                        {adminClassificationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2">
                      <span className="label">Review Notes</span>
                      <textarea name="reviewNotes" className="field min-h-28" defaultValue={payment.review_notes ?? ""} />
                    </label>
                    <button type="submit" className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
                      Save Admin Review
                    </button>
                  </div>
                </div>
              </form>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-exodus-slate">
          No worker payments found for this client and year.
        </div>
      )}
    </section>
  );
}

export function WorkersPayrollSummaryTables({ data }: { data: WorkersPaymentsData }) {
  return (
    <details className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer text-lg font-black text-exodus-navy">
        Yearly totals for all workers
      </summary>
      <div className="mt-5 grid gap-6">
        <AccountingTable
          title="Workers & Payments Yearly Totals"
          columns={[
            { key: "item", label: "Item" },
            { key: "value", label: "Value" },
            { key: "detail", label: "Detail" }
          ]}
          rows={t4YearlyTotalRows(data)}
        />
        <AccountingTable
          title="T4 Preparation Table"
          columns={[
            { key: "worker", label: "Worker" },
            { key: "sin", label: "SIN" },
            { key: "box14", label: "Box 14" },
            { key: "box16", label: "Box 16" },
            { key: "box18", label: "Box 18" },
            { key: "box22", label: "Box 22" },
            { key: "box24", label: "Box 24" },
            { key: "box26", label: "Box 26" },
            { key: "slipStatus", label: "Slip Status" }
          ]}
          rows={t4PreparationRows(data)}
        />
        <AccountingTable
          title="T4A Preparation Table"
          columns={[
            { key: "worker", label: "Worker" },
            { key: "idNumber", label: "SIN / Business Number" },
            { key: "payments", label: "Payments" },
            { key: "total", label: "Total Paid" },
            { key: "status", label: "Status" }
          ]}
          rows={t4aPreparationRows(data)}
        />
        <AccountingTable
          title="T5018 Support Table"
          columns={[
            { key: "worker", label: "Worker" },
            { key: "idNumber", label: "SIN / Business Number" },
            { key: "payments", label: "Payments" },
            { key: "total", label: "Total Paid" },
            { key: "status", label: "Status" }
          ]}
          rows={t5018SupportRows(data)}
        />
        <AccountingTable
          title="Payroll Calculation"
          columns={[
            { key: "item", label: "Item" },
            { key: "value", label: "Value" },
            { key: "detail", label: "Detail" }
          ]}
          rows={payrollSummaryRows(data)}
        />
        <AccountingTable
          title="Source Deduction Summary"
          description="Placeholder for future source deduction workflow. CRA connection is not enabled."
          columns={[
            { key: "item", label: "Item" },
            { key: "value", label: "Value" },
            { key: "detail", label: "Detail" }
          ]}
          rows={sourceDeductionPlaceholderRows(data)}
        />
      </div>
    </details>
  );
}

export function WorkerExportPlaceholders() {
  const labels = [
    "Export CSV",
    "Export T4 preparation report",
    "Export T4A preparation report",
    "Export T5018 support report"
  ];

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-exodus-navy">Exports</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            disabled
            className="min-h-11 cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-black text-slate-600"
          >
            {label} - Coming soon
          </button>
        ))}
      </div>
    </section>
  );
}

function MoneyInput({ name, label, value }: { name: string; label: string; value: number | string }) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <input name={name} type="number" min="0" step="0.01" className="field" defaultValue={String(value)} />
    </label>
  );
}

function T4PreparationPanel({ payment }: { payment: WorkerPaymentRecord }) {
  const box14 = amountDefault(payment.t4_box14_employment_income, payment.amount_paid);
  const box16 = amountDefault(payment.t4_box16_cpp, payment.cpp);
  const box18 = amountDefault(payment.t4_box18_ei, payment.ei);
  const box22 = amountDefault(payment.t4_box22_income_tax_deducted, payment.income_tax_deducted);
  const box24 = amountDefault(payment.t4_box24_ei_insurable_earnings, payment.amount_paid);
  const box26 = amountDefault(payment.t4_box26_cpp_pensionable_earnings, payment.amount_paid);
  const benefits = amountDefault(payment.t4_benefits, payment.benefits);
  const vacationPay = amountDefault(payment.t4_vacation_pay, payment.vacation_pay);
  const netPay = amountDefault(payment.t4_net_pay, payment.net_pay);
  const calculatorGrossPay = amountDefault(payment.payroll_calculator_gross_pay, payment.amount_paid);
  const payFrequency = payment.pay_frequency ?? payment.payroll_calculator_pay_frequency ?? "biweekly";

  return (
    <div className="mt-5 grid gap-5 rounded-md border border-exodus-gold/35 bg-exodus-light p-4">
      <div>
        <h3 className="text-lg font-black text-exodus-navy">Payroll/T4 Preparation</h3>
        <p className="mt-1 text-sm font-semibold text-exodus-slate">
          Gross pay defaults to Amount Paid. Admin can manually edit all T4 boxes before preparing slips.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-2">
          <span className="label">Pay period start</span>
          <input name="payPeriodStart" type="date" className="field" defaultValue={payment.pay_period_start ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className="label">Pay period end</span>
          <input name="payPeriodEnd" type="date" className="field" defaultValue={payment.pay_period_end ?? ""} />
        </label>
        <label className="grid gap-2">
          <span className="label">Pay frequency</span>
          <select name="payFrequency" className="field" defaultValue={payFrequency}>
            {payFrequencies.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency}
              </option>
            ))}
          </select>
        </label>
        <MoneyInput name="t4Box14" label="Box 14 Employment income" value={box14} />
        <MoneyInput name="t4Box24" label="Box 24 EI insurable earnings" value={box24} />
        <MoneyInput name="t4Box26" label="Box 26 CPP pensionable earnings" value={box26} />
        <MoneyInput name="t4Benefits" label="Benefits" value={benefits} />
        <MoneyInput name="t4VacationPay" label="Vacation Pay" value={vacationPay} />
        <label className="grid gap-2">
          <span className="label">T4 Ready status</span>
          <select name="t4ReadyStatus" className="field" defaultValue={payment.t4_ready_status}>
            {readyStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>
      <a
        href={`/admin/paystubs/${payment.id}`}
        target="_blank"
        className="focus-ring inline-flex min-h-11 w-fit items-center rounded-md bg-exodus-gold px-4 text-sm font-black text-exodus-navy"
      >
        Download Paystub PDF
      </a>
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h4 className="text-base font-black text-exodus-navy">Payroll Calculator</h4>
        <p className="mt-1 text-sm font-bold text-red-700">Verify payroll deductions with CRA PDOC before filing or remitting.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-2">
            <span className="label">Province</span>
            <select name="calculatorProvince" className="field" defaultValue={payment.payroll_calculator_province ?? "Alberta"}>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="label">Pay date</span>
            <input name="calculatorPayDate" type="date" className="field" defaultValue={payment.payroll_calculator_pay_date ?? payment.payment_date} />
          </label>
          <MoneyInput name="calculatorGrossPay" label="Gross pay" value={calculatorGrossPay} />
          <MoneyInput name="calculatorTd1FederalAmount" label="TD1 federal amount" value={payment.payroll_calculator_td1_federal_amount} />
          <MoneyInput name="calculatorTd1ProvincialAmount" label="TD1 provincial amount" value={payment.payroll_calculator_td1_provincial_amount} />
          <label className="grid gap-2">
            <span className="label">CPP exempt yes/no</span>
            <select name="calculatorCppExempt" className="field" defaultValue={payment.payroll_calculator_cpp_exempt ? "Yes" : "No"}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="label">EI exempt yes/no</span>
            <select name="calculatorEiExempt" className="field" defaultValue={payment.payroll_calculator_ei_exempt ? "Yes" : "No"}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </label>
        </div>
        <div className="mt-4 rounded-md bg-exodus-light p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h5 className="text-sm font-black uppercase tracking-[0.12em] text-exodus-slate">Calculate placeholder</h5>
            <button type="button" disabled className="min-h-10 cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-black text-slate-600">
              Calculate - Coming soon
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <MoneyInput name="t4Box16" label="CPP box 16" value={box16} />
            <MoneyInput name="t4Box18" label="EI box 18" value={box18} />
            <MoneyInput name="t4Box22" label="Income tax deducted box 22" value={box22} />
            <MoneyInput name="t4NetPay" label="Net pay" value={netPay} />
            <MoneyInput name="calculatorEmployerCpp" label="Employer CPP" value={payment.payroll_calculator_employer_cpp} />
            <MoneyInput name="calculatorEmployerEi" label="Employer EI" value={payment.payroll_calculator_employer_ei} />
          </div>
        </div>
      </div>
    </div>
  );
}

function amountValue(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function dateValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function amountDefault(primary: number | string, fallback: number | string) {
  const primaryValue = Number(primary);
  return Number.isFinite(primaryValue) && primaryValue > 0 ? primary : fallback;
}

function slipNeededForClassification(classification: string) {
  if (classification === "T4 Employee") {
    return "T4";
  }

  if (classification === "T4A Contractor") {
    return "T4A";
  }

  if (classification === "T5018 Subcontractor") {
    return "T5018";
  }

  if (classification === "Shareholder") {
    return "T5 Dividend";
  }

  if (classification === "Expense Only") {
    return "Expense Only";
  }

  return "Review Needed";
}
