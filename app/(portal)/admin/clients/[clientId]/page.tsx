import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import {
  AccountingHeader,
  AccountingSummary,
  AccountingTable,
  GeneralLedgerTable,
  GstSummaryTable,
  YearEndPackagePanel
} from "@/components/portal/accounting-records";
import {
  WorkerReviewWorkspace
} from "@/components/portal/workers-admin-review";
import {
  assetTableRows,
  expenseTableRows,
  formatDate,
  formatDateTime,
  getAccountingData,
  getClientDocuments,
  getClientOptionById,
  incomeTableRows,
  parseYear,
  reportRows,
  receiptTableRows,
  bankStatementTableRows
} from "@/lib/accounting/data";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";
import {
  getPersonalTaxSlips,
  getSelfEmployedData,
  personalTaxSlipRows,
  selfEmployedRecordRows,
  selfEmployedSummaryRows
} from "@/lib/tax/personal-tax";
import type { DemoRow } from "@/lib/types";
import { getWorkersPaymentsData } from "@/lib/workers-payments";

type PageProps = {
  params: Promise<{ clientId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const clientDetailTabs = [
  { key: "profile", label: "Profile" },
  { key: "documents", label: "Documents" },
  { key: "immigration", label: "Immigration" },
  { key: "personal-tax", label: "Personal Tax" },
  { key: "self-employed", label: "Self-Employed" },
  { key: "income", label: "Income" },
  { key: "expenses", label: "Expenses" },
  { key: "gst", label: "GST" },
  { key: "workers-payments", label: "Workers & Payments" },
  { key: "messages", label: "Messages" },
  { key: "tasks", label: "Tasks" },
  { key: "notes", label: "Notes" },
  { key: "reports", label: "Reports" }
] as const;

type ClientDetailTab = (typeof clientDetailTabs)[number]["key"];

async function reviewDocumentAction(formData: FormData) {
  "use server";

  const admin = await requireRole(["admin"]);
  const clientId = String(formData.get("clientId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  const action = String(formData.get("action") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (!clientId || !documentId) {
    return;
  }

  const updates: Record<string, string | null> = {
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString()
  };

  if (action === "approve") {
    updates.status = "approved";
  }

  if (action === "reject") {
    updates.status = "rejected";
  }

  if (action === "request_again") {
    updates.status = "requested";
    updates.requested_again_at = new Date().toISOString();
  }

  if (note) {
    updates.review_notes = note;
  }

  if (dueDate) {
    updates.due_date = dueDate;
  }

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("documents")
    .update(updates)
    .eq("id", documentId)
    .eq("client_id", clientId);

  revalidatePath(`/admin/clients/${clientId}`);
}

export default async function AdminClientDetailPage({ params, searchParams }: PageProps) {
  const { clientId } = await params;
  const query = await searchParams;
  const taxYear = parseYear(query?.year);
  const activeTab = parseClientDetailTab(query?.tab);
  const selectedWorkerId = firstParam(query?.workerId);
  const selectedWorkerTab = firstParam(query?.workerTab);
  const client = await getClientOptionById(clientId);

  if (!client) {
    notFound();
  }

  const [accounting, documents, related, personalTaxSlips, selfEmployed, workersPayments] = await Promise.all([
    getAccountingData(client, taxYear),
    getClientDocuments(client.id),
    getRelatedClientRows(client.id),
    getPersonalTaxSlips(client.id, taxYear),
    getSelfEmployedData(client, taxYear),
    getWorkersPaymentsData(client, taxYear)
  ]);

  const company = accounting.companies[0];

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title={client.companyName}
        description="Client detail workspace for profile, documents, accounting records, immigration cases, messages, tasks, and notes."
      >
        <form action={`/admin/clients/${client.id}`} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-[220px_auto] sm:items-end">
            <label className="grid gap-2">
              <span className="label">Year</span>
              <select name="year" className="field" defaultValue={taxYear}>
                {[taxYear, new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 text-sm font-black text-white">
              View Year
            </button>
          </div>
        </form>
      </AccountingHeader>

      <nav className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm" aria-label="Client detail tabs">
        {clientDetailTabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/clients/${client.id}?year=${taxYear}&tab=${tab.key}`}
            className={`focus-ring rounded-md px-3 py-2 text-xs font-black ${
              activeTab === tab.key ? "bg-exodus-navy text-white" : "bg-exodus-light text-exodus-navy"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <section id="profile" className={tabSectionClass(activeTab, "profile", "scroll-mt-24 rounded-md border border-slate-200 bg-white p-5 shadow-sm")}>
        <h2 className="text-xl font-black text-exodus-navy">Profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ProfileItem label="Client" value={client.companyName} />
          <ProfileItem label="Email" value={client.email} />
          <ProfileItem label="Contact" value={client.name} />
          <ProfileItem label="Company" value={company?.legal_name ?? client.companyName} />
          <ProfileItem label="Business Number" value={company?.business_number ?? "-"} />
        </div>
      </section>

      {activeTab === "profile" ? (
        <>
          <YearEndPackagePanel data={accounting} adminHref={`/admin/year-end-package?clientId=${client.id}&year=${taxYear}`} />
          <AccountingSummary data={accounting} />
        </>
      ) : null}

      <section id="documents" className={tabSectionClass(activeTab, "documents", "scroll-mt-24 grid gap-4")}>
        <h2 className="text-xl font-black text-exodus-navy">Documents</h2>
        {documents.length > 0 ? (
          <div className="grid gap-4">
            {documents.map((document) => (
              <form key={document.id} action={reviewDocumentAction} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <input type="hidden" name="clientId" value={client.id} />
                <input type="hidden" name="documentId" value={document.id} />
                <div className="grid gap-4 lg:grid-cols-[1fr_160px] lg:items-start">
                  <div>
                    <p className="text-base font-black text-exodus-navy">{document.file_name}</p>
                    <p className="mt-1 text-sm font-semibold text-exodus-slate">
                      {document.document_type} | {document.bucket}
                    </p>
                    <p className="mt-2 text-sm text-exodus-slate">Document Date: {formatDate(document.document_date)}</p>
                    <p className="mt-1 text-sm text-exodus-slate">Uploaded: {formatDateTime(document.created_at)}</p>
                    <p className="mt-2 text-sm font-semibold text-exodus-blue">Status: {document.status}</p>
                    <p className="mt-1 text-sm text-exodus-slate">Due: {formatDate(document.due_date)}</p>
                    <p className="mt-1 text-sm text-exodus-slate">Note: {document.review_notes ?? "-"}</p>
                    {document.download_url ? (
                      <Link href={document.download_url} className="mt-3 inline-flex text-sm font-black text-exodus-blue underline-offset-4 hover:underline">
                        Download private file
                      </Link>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <input name="dueDate" type="date" className="field" aria-label="Document due date" />
                    <textarea name="note" className="field min-h-20" placeholder="Add note" />
                    <div className="grid grid-cols-2 gap-2">
                      <button name="action" value="approve" className="focus-ring rounded-md bg-emerald-700 px-3 py-2 text-xs font-black text-white">
                        Approve
                      </button>
                      <button name="action" value="reject" className="focus-ring rounded-md bg-red-700 px-3 py-2 text-xs font-black text-white">
                        Reject
                      </button>
                      <button name="action" value="request_again" className="focus-ring rounded-md bg-exodus-navy px-3 py-2 text-xs font-black text-white">
                        Request Again
                      </button>
                      <button name="action" value="note" className="focus-ring rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-exodus-navy">
                        Save Note/Due
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ))}
          </div>
        ) : (
          <EmptyState text="No documents uploaded for this client yet." />
        )}
      </section>

      <section id="immigration" className={tabSectionClass(activeTab, "immigration", "scroll-mt-24")}>
        <AccountingTable
          title="Immigration"
          columns={[
            { key: "case", label: "Case" },
            { key: "applicant", label: "Applicant" },
            { key: "status", label: "Status" },
            { key: "due", label: "Due" }
          ]}
          rows={related.immigrationCases}
        />
      </section>

      <section id="personal-tax" className={tabSectionClass(activeTab, "personal-tax", "scroll-mt-24")}>
        <AccountingTable
          title="Personal Tax"
          columns={[
            { key: "file", label: "Tax Slip" },
            { key: "type", label: "Slip Type" },
            { key: "payer", label: "Employer / Payer" },
            { key: "documentDate", label: "Document Date" },
            { key: "uploadedDate", label: "Uploaded Date" },
            { key: "status", label: "Status" },
            { key: "notes", label: "Notes" }
          ]}
          rows={personalTaxSlipRows(personalTaxSlips)}
        />
      </section>

      <section id="self-employed" className={tabSectionClass(activeTab, "self-employed", "scroll-mt-24 grid gap-6")}>
        <AccountingTable
          title="Self-Employed Year Summary"
          columns={[
            { key: "item", label: "Item" },
            { key: "value", label: "Value" },
            { key: "detail", label: "Detail" }
          ]}
          rows={selfEmployedSummaryRows(selfEmployed)}
        />
        <AccountingTable
          title="Self-Employed Records"
          columns={[
            { key: "date", label: "Date" },
            { key: "business", label: "Business Type" },
            { key: "expenseType", label: "Expense Type" },
            { key: "income", label: "Income" },
            { key: "expenses", label: "Expenses" },
            { key: "gstCollected", label: "GST Collected" },
            { key: "gstPaid", label: "GST Paid" },
            { key: "status", label: "Status" }
          ]}
          rows={selfEmployedRecordRows(selfEmployed)}
        />
      </section>

      <section id="income" className={tabSectionClass(activeTab, "income", "scroll-mt-24")}>
        <AccountingTable
          title="Income"
          columns={[
            { key: "date", label: "Date" },
            { key: "source", label: "Who Paid You / Work Done" },
            { key: "amount", label: "Amount" },
            { key: "gst", label: "GST" },
            { key: "status", label: "Status" }
          ]}
          rows={incomeTableRows(accounting)}
        />
      </section>

      <section id="expenses" className={tabSectionClass(activeTab, "expenses", "scroll-mt-24")}>
        <AccountingTable
          title="Expenses"
          columns={[
            { key: "date", label: "Date" },
            { key: "paidTo", label: "Paid To" },
            { key: "what", label: "What" },
            { key: "type", label: "Type" },
            { key: "amount", label: "Amount" },
            { key: "gst", label: "GST" }
          ]}
          rows={expenseTableRows(accounting)}
        />
      </section>

      <section id="gst" className={tabSectionClass(activeTab, "gst", "scroll-mt-24")}>
        <GstSummaryTable data={accounting} />
      </section>

      <section id="workers-payments" className={tabSectionClass(activeTab, "workers-payments", "scroll-mt-24 grid gap-6")}>
        <WorkerReviewWorkspace
          data={workersPayments}
          clientId={client.id}
          taxYear={taxYear}
          baseHref={`/admin/clients/${client.id}?year=${taxYear}&tab=workers-payments`}
          selectedWorkerId={selectedWorkerId}
          selectedTab={selectedWorkerTab}
        />
      </section>

      <section id="messages" className={tabSectionClass(activeTab, "messages", "scroll-mt-24")}>
        <AccountingTable
          title="Messages"
          columns={[
            { key: "subject", label: "Subject" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status" }
          ]}
          rows={related.messages}
        />
      </section>

      <section id="tasks" className={tabSectionClass(activeTab, "tasks", "scroll-mt-24")}>
        <AccountingTable
          title="Tasks"
          columns={[
            { key: "task", label: "Task" },
            { key: "due", label: "Due Date" },
            { key: "status", label: "Status" }
          ]}
          rows={related.tasks}
        />
      </section>

      <section id="notes" className={tabSectionClass(activeTab, "notes", "scroll-mt-24 rounded-md border border-slate-200 bg-white p-5 shadow-sm")}>
        <h2 className="text-xl font-black text-exodus-navy">Notes</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-exodus-slate">{related.notes || "No notes saved for this client."}</p>
      </section>

      <section id="reports" className={tabSectionClass(activeTab, "reports", "scroll-mt-24 grid gap-6")}>
        <AccountingTable
          title="Reports"
          columns={[
            { key: "report", label: "Report" },
            { key: "period", label: "Period" },
            { key: "records", label: "Records" },
            { key: "total", label: "Total" },
            { key: "status", label: "Status" }
          ]}
          rows={reportRows(accounting)}
        />
        <AccountingTable
          title="Receipts"
          columns={[
            { key: "date", label: "Date" },
            { key: "paidTo", label: "Paid To" },
            { key: "name", label: "File name" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status" }
          ]}
          rows={receiptTableRows(accounting)}
        />
        <AccountingTable
          title="Bank Statements"
          columns={[
            { key: "month", label: "Month" },
            { key: "bank", label: "Bank" },
            { key: "account", label: "Account" },
            { key: "name", label: "File name" },
            { key: "status", label: "Status" }
          ]}
          rows={bankStatementTableRows(accounting)}
        />
        <AccountingTable
          title="Assets"
          columns={[
            { key: "date", label: "Date" },
            { key: "description", label: "Description" },
            { key: "class", label: "Class" },
            { key: "cost", label: "Cost" },
            { key: "status", label: "Status" }
          ]}
          rows={assetTableRows(accounting)}
        />
        <GeneralLedgerTable data={accounting} />
      </section>
    </div>
  );
}

function parseClientDetailTab(value: string | string[] | undefined): ClientDetailTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return clientDetailTabs.some((item) => item.key === tab) ? (tab as ClientDetailTab) : "profile";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function tabSectionClass(activeTab: ClientDetailTab, tab: ClientDetailTab, className: string) {
  return activeTab === tab ? className : `${className} hidden`;
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-exodus-light p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-exodus-slate">{label}</p>
      <p className="mt-2 font-black text-exodus-navy">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-exodus-slate">
      {text}
    </div>
  );
}

async function getRelatedClientRows(clientId: string): Promise<{
  immigrationCases: DemoRow[];
  messages: DemoRow[];
  tasks: DemoRow[];
  notes: string;
}> {
  const supabase = await createServerSupabaseClient();
  const [casesResult, messagesResult, tasksResult, profileResult] = await Promise.all([
    supabase
      .from("immigration_cases")
      .select("case_type,applicant_name,status,due_date")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("id,subject,read_at,created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("title,status,due_date")
      .eq("client_id", clientId)
      .order("due_date", { ascending: true }),
    supabase
      .from("client_profiles")
      .select("service_notes")
      .eq("user_id", clientId)
      .maybeSingle()
  ]);

  return {
    immigrationCases: ((casesResult.data ?? []) as Array<{ case_type: string; applicant_name: string; status: string; due_date: string | null }>).map((row) => ({
      case: row.case_type,
      applicant: row.applicant_name,
      status: row.status,
      due: formatDate(row.due_date)
    })),
    messages: ((messagesResult.data ?? []) as Array<{ id: string; subject: string; read_at: string | null; created_at: string }>).map((row) => ({
      subject: row.subject,
      date: formatDate(row.created_at.slice(0, 10)),
      href: `/admin/messages/${row.id}`,
      status: row.read_at ? "Read" : "Unread"
    })),
    tasks: ((tasksResult.data ?? []) as Array<{ title: string; status: string; due_date: string | null }>).map((row) => ({
      task: row.title,
      due: formatDate(row.due_date),
      status: row.status
    })),
    notes: (profileResult.data as { service_notes: string | null } | null)?.service_notes ?? ""
  };
}
