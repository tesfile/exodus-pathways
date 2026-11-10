import { AccountingFoundation } from "./accounting-foundation";
import { saveClientBookkeepingEntry, uploadAdminClientDocument } from "./bookkeeping-actions";
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
  { key: "documents", label: "Scan & Documents" },
  { key: "workers-payments", label: "Payroll" },
  { key: "personal-tax", label: "Personal Tax" },
  { key: "self-employed", label: "Self-Employed" },
  { key: "bookkeeping", label: "Bookkeeping" },
  { key: "gst", label: "GST" },
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
    getWorkersPaymentsData(client, taxYear, true)
  ]);

  const company = accounting.companies[0];

  return (
    <div className="grid gap-6">
    <AccountingHeader
        title={client.companyName}
        description="Dedicated client workspace: payroll, bookkeeping, documents, tax and reports. All records are scoped to this client."
      >
        <form action={`/admin/clients/${client.id}`} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-[220px_auto] sm:items-end">
            <label className="grid gap-2">
              <span className="label">Year</span>
              <select name="year" className="field" defaultValue={taxYear}>
                {Array.from(new Set([taxYear, new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2])).map((year) => (
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

      {activeTab === "bookkeeping" ? (
        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-exodus-navy">Bookkeeping</h2>
          <p className="text-sm text-exodus-slate">All accounting records below belong to this client and selected tax year.</p>
          <nav className="flex flex-wrap gap-2" aria-label="Bookkeeping sections">
            {["Income", "Expenses", "Accounts Receivable", "Accounts Payable", "Chart of Accounts", "General Ledger", "Trial Balance", "Financial Statements", "GST"].map((label) => (
              <a key={label} href={`#bookkeeping-${label.toLowerCase().replaceAll(" ", "-")}`} className="rounded-md bg-exodus-light px-3 py-2 text-sm font-bold text-exodus-navy">{label}</a>
            ))}
          </nav>
          <p className="text-sm text-exodus-slate">Enter transactions below, or <a className="font-bold text-exodus-blue underline" href={`?year=${taxYear}&tab=documents`}>upload a receipt or invoice</a>. A receipt can create a categorized expense draft after you enter its details.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {(["income", "expense"] as const).map(kind => (
              <form id={`bookkeeping-add-${kind}`} key={kind} action={saveClientBookkeepingEntry} className="grid gap-3 rounded-md border border-slate-200 p-4">
                <h3 className="text-lg font-black text-exodus-navy">+ Add {kind === "income" ? "Income" : "Expense"}</h3>
                <input type="hidden" name="kind" value={kind}/><input type="hidden" name="clientId" value={client.id}/><input type="hidden" name="taxYear" value={taxYear}/>
                <label className="grid gap-1 text-sm">Transaction date<input className="field" name="date" type="date" required/></label>
                <label className="grid gap-1 text-sm">{kind === "income" ? "Payer / company name" : "Supplier / payee"}<input className="field" name="party" required/></label>
                {kind === "expense" ? <label className="grid gap-1 text-sm">Expense category<select className="field" name="category">{["Advertising","Automobile & Fuel","Bank Charges","Contract Labour","Insurance","Meals","Office Expenses","Professional Fees","Rent","Repairs","Salaries & Wages","Supplies","Telephone & Internet","Travel","Utilities","Other"].map(item => <option key={item} value={item}>{item}</option>)}</select></label> : <><label className="grid gap-1 text-sm">Payer address<input className="field" name="address"/></label><label className="grid gap-1 text-sm">Invoice number<input className="field" name="invoice"/></label></>}
                <label className="grid gap-1 text-sm">Description<input className="field" name="description"/></label>
                <div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-sm">Amount ($)<input className="field" name="amount" type="number" step="0.01" min="0.01" required/></label><label className="grid gap-1 text-sm">GST ($)<input className="field" name="gst" type="number" step="0.01" min="0" defaultValue="0"/></label></div>
                <label className="grid gap-1 text-sm">Notes<input className="field" name="notes"/></label>
                <button type="submit" className="rounded-md bg-exodus-navy px-4 py-3 text-sm font-bold text-white">Save {kind} as draft</button>
              </form>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-4">
              <h3 className="font-black text-exodus-navy">Expense Categories</h3>
              <p className="mt-2 text-sm text-exodus-slate">Choose a category when entering an expense.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {["Advertising", "Automobile & Fuel", "Bank Charges", "Contract Labour", "Insurance", "Meals", "Office Expenses", "Professional Fees", "Rent", "Repairs", "Salaries & Wages", "Supplies", "Telephone & Internet", "Travel", "Utilities", "Other"].map(category => <div key={category} className="rounded bg-exodus-light p-2">{category}</div>)}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <h3 className="font-black text-exodus-navy">Income Information</h3>
              <p className="mt-2 text-sm text-exodus-slate">Each income entry should identify the payer, company address, invoice number, service description, amount, GST, date and payment status.</p>
              <p className="mt-3 text-sm text-exodus-slate">Use the forms above to save draft transactions. Review and approve entries before using them in finalized accounts.</p>
            </div>
          </div>
          <div id="bookkeeping-income"><AccountingTable title="Income" columns={[{ key: "date", label: "Date" }, { key: "source", label: "Payer / Company" }, { key: "amount", label: "Amount" }, { key: "gst", label: "GST" }, { key: "status", label: "Status" }]} rows={incomeTableRows(accounting)} /></div>
          <div id="bookkeeping-expenses"><AccountingTable title="Expenses by Category" columns={[{ key: "date", label: "Date" }, { key: "paidTo", label: "Supplier" }, { key: "what", label: "Description" }, { key: "type", label: "Expense Category" }, { key: "amount", label: "Amount" }, { key: "gst", label: "GST" }]} rows={expenseTableRows(accounting)} /></div>
          <AccountingFoundation clientId={client.id} taxYear={taxYear} />
          <div id="bookkeeping-general-ledger"><GeneralLedgerTable data={accounting} /></div>
          <div id="bookkeeping-trial-balance"><p className="font-bold text-exodus-navy">Trial Balance</p><p className="text-sm text-exodus-slate">Use the Trial Balance export above for the selected client and year.</p></div>
          <div id="bookkeeping-financial-statements"><p className="font-bold text-exodus-navy">Financial Statements</p><AccountingSummary data={accounting} /></div>
          <div id="bookkeeping-gst"><GstSummaryTable data={accounting} /></div>
        </section>
      ) : null}

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
        <h2 className="text-xl font-black text-exodus-navy">Scan & Upload Documents</h2>
        <form action={uploadAdminClientDocument} className="grid gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <input type="hidden" name="clientId" value={client.id}/><input type="hidden" name="taxYear" value={taxYear}/>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">Document type<select className="field" name="documentType"><option value="receipt">Expense receipt</option><option value="invoice">Income invoice</option><option value="bank_statement">Bank statement</option><option value="payroll_document">Payroll document</option><option value="tax_document">Tax document</option><option value="client_document">Other</option></select></label>
            <label className="grid gap-1 text-sm">Company<select className="field" name="companyId"><option value="">Selected client / personal</option>{accounting.companies.map(item => <option key={item.id} value={item.id}>{item.legal_name}</option>)}</select></label>
          </div>
          <label className="grid gap-1 text-sm font-bold">Camera scan or upload PDF, Excel, CSV, image or Word<input className="field" name="file" type="file" accept="image/*,.pdf,.jpg,.jpeg,.png,.webp,.heic,.tif,.tiff,.doc,.docx,.xls,.xlsx,.csv" required/></label>
          <details className="rounded-md border border-slate-200 p-3">
            <summary className="cursor-pointer font-bold text-exodus-navy">Receipt → Create categorized expense draft</summary>
            <p className="mt-2 text-xs text-exodus-slate">Select Expense receipt above. Enter the receipt details to save a draft under the chosen expense category. Check before submitting; no automatic OCR is used.</p>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" name="createExpense" value="yes"/> Also create an expense draft</label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">Supplier<input name="vendor" className="field"/></label>
              <label className="grid gap-1 text-sm">Expense date<input name="expenseDate" type="date" className="field"/></label>
              <label className="grid gap-1 text-sm">Expense category<select name="category" className="field">{["Advertising","Automobile & Fuel","Bank Charges","Contract Labour","Insurance","Meals","Office Expenses","Professional Fees","Rent","Repairs","Salaries & Wages","Supplies","Telephone & Internet","Travel","Utilities","Other"].map(item => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="grid gap-1 text-sm">Amount ($)<input name="amount" type="number" min="0.01" step="0.01" className="field"/></label>
              <label className="grid gap-1 text-sm">GST ($)<input name="gst" type="number" min="0" step="0.01" defaultValue="0" className="field"/></label>
            </div>
          </details>
          <p className="text-xs text-exodus-slate">On a phone, use the file chooser to take a photo. Receipts are placed in the document review queue; they are not automatically posted as expenses.</p>
          <button type="submit" className="rounded-md bg-exodus-navy px-4 py-3 text-sm font-bold text-white">Upload to selected client</button>
        </form>
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
                      {document.document_type} | {document.company_name} | {document.tax_year ?? "Year not set"}
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-lg font-black text-exodus-navy">Client Payroll</h2>
            <p className="text-sm text-exodus-slate">Add a worker first, then select that worker to record payroll or contractor payments.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/workers-payroll-review/new?clientId=${encodeURIComponent(client.id)}&year=${taxYear}`} className="rounded-md bg-exodus-navy px-4 py-3 text-sm font-bold text-white">+ Add Employee / Contractor</Link>
            <Link href={`/admin/workers-payroll-review?clientId=${encodeURIComponent(client.id)}&year=${taxYear}`} className="rounded-md border border-exodus-navy px-4 py-3 text-sm font-bold text-exodus-navy">Manage Workers &amp; Payments</Link>
          </div>
        </div>
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
  messages: DemoRow[];
  tasks: DemoRow[];
  notes: string;
}> {
  const supabase = await createServerSupabaseClient();
  const [messagesResult, tasksResult, profileResult] = await Promise.all([
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
