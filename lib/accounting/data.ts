import { createServerSupabaseClient, getCurrentUserRecord } from "@/lib/supabase/server";
import type { DemoRow, PortalUser } from "@/lib/types";

export type ClientOption = {
  id: string;
  name: string;
  email: string;
  clientType: string;
  displayName: string;
  companyName: string;
};

type CompanyRow = {
  id: string;
  client_id: string;
  legal_name: string;
  trade_name: string | null;
  business_number: string | null;
  corporation_number?: string | null;
  contact_person?: string | null;
  address?: string | null;
};

type IncomeRow = {
  id: string;
  entry_date: string;
  source: string;
  invoice_number: string | null;
  amount: number | string;
  gst_hst_amount: number | string | null;
  status: string;
  notes: string | null;
  tax_year: number;
};

type ExpenseRow = {
  id: string;
  expense_date: string;
  category: string;
  vendor: string | null;
  description: string | null;
  amount: number | string;
  gst_hst_amount: number | string | null;
  status: string;
  notes: string | null;
  tax_year: number;
};

type ReceiptRow = {
  id: string;
  expense_id: string | null;
  file_name: string;
  vendor: string | null;
  receipt_date: string | null;
  amount: number | string | null;
  status: string;
  tax_year: number;
};

type BankStatementRow = {
  id: string;
  statement_month: string;
  bank_name: string | null;
  account_last_four: string | null;
  file_name: string;
  status: string;
  tax_year: number;
};

type AssetRow = {
  id: string;
  description: string;
  purchase_date: string | null;
  cost: number | string;
  asset_class: string | null;
  status: string;
  tax_year: number;
};

type PayrollRow = {
  id: string;
  period_start: string;
  period_end: string;
  employee_count: number;
  gross_pay: number | string;
  source_deductions: number | string;
  status: string;
  notes: string | null;
  tax_year: number;
};

type GstRecordRow = {
  id: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  gst_collected: number | string;
  gst_paid: number | string;
  status: string;
  tax_year: number;
};

type AccountingYearRow = {
  id: string;
  client_id: string;
  tax_year: number;
  status: string;
  year_end_package_status: string;
};

type DocumentRow = {
  id: string;
  client_id: string;
  bucket: string;
  storage_path: string;
  document_type: string;
  file_name: string;
  status: string;
  document_date: string | null;
  tax_year: number | null;
  review_notes: string | null;
  due_date: string | null;
  created_at: string;
};

export type ClientDocumentRow = DocumentRow & {
  client_name: string;
  download_url: string;
};

export type AccountingData = {
  client: ClientOption;
  taxYear: number;
  companies: CompanyRow[];
  income: IncomeRow[];
  expenses: ExpenseRow[];
  receipts: ReceiptRow[];
  bankStatements: BankStatementRow[];
  assets: AssetRow[];
  payroll: PayrollRow[];
  gstRecords: GstRecordRow[];
  accountingYear: AccountingYearRow | null;
  totals: {
    income: number;
    incomeGst: number;
    expenses: number;
    expenseGst: number;
    payrollGross: number;
    assets: number;
    gstNet: number;
  };
};

export function parseYear(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const year = Number(raw);
  const current = new Date().getFullYear();
  return Number.isInteger(year) && year >= 2000 && year <= current + 2 ? year : current;
}

export function formatMoney(value: number | string | null | undefined) {
  const numberValue = toNumber(value);
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(numberValue);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).formatToParts(new Date(value));
  const byType = new Map(parts.map((part) => [part.type, part.value]));

  return `${byType.get("month")} ${byType.get("day")}, ${byType.get("year")} ${byType.get("hour")}:${byType.get("minute")} ${byType.get("dayPeriod")}`;
}

export function compactDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short"
  }).format(new Date(`${value}T00:00:00`));
}

export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  return typeof value === "number" ? value : Number(value);
}

export async function getClientOptions() {
  const supabase = await createServerSupabaseClient();
  const [{ data: users }, { data: companies }] = await Promise.all([
    supabase.from("users").select("id,email,full_name,display_name,client_type,phone,role").eq("role", "client").order("display_name"),
    supabase.from("companies").select("id,client_id,legal_name,trade_name,business_number,corporation_number,contact_person,address").order("legal_name")
  ]);

  const companyByClient = new Map(
    ((companies ?? []) as CompanyRow[]).map((company) => [company.client_id, company])
  );

  return ((users ?? []) as PortalUser[]).map((user) => {
    const company = companyByClient.get(user.id);
    const displayName = user.display_name || company?.legal_name || user.full_name;
    return {
      id: user.id,
      name: user.full_name,
      email: user.email,
      clientType: user.client_type ?? "individual",
      displayName,
      companyName: displayName
    };
  });
}

export async function getClientOptionForCurrentUser() {
  const user = await getCurrentUserRecord();
  const supabase = await createServerSupabaseClient();
  const { data: company } = await supabase
    .from("companies")
    .select("id,client_id,legal_name,trade_name,business_number,corporation_number,contact_person,address")
    .eq("client_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const companyRow = company as CompanyRow | null;
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    clientType: user.client_type ?? "individual",
    displayName: user.display_name || companyRow?.legal_name || user.full_name,
    companyName: user.display_name || companyRow?.legal_name || user.full_name
  };
}

export async function getClientOptionById(clientId: string) {
  const clients = await getClientOptions();
  return clients.find((client) => client.id === clientId) ?? null;
}

export async function getAccountingData(client: ClientOption, taxYear: number): Promise<AccountingData> {
  const supabase = await createServerSupabaseClient();
  const [
    companiesResult,
    incomeResult,
    expensesResult,
    receiptsResult,
    bankResult,
    assetsResult,
    payrollResult,
    gstResult,
    yearResult
  ] = await Promise.all([
    supabase.from("companies").select("*").eq("client_id", client.id).order("legal_name"),
    supabase
      .from("income_entries")
      .select("id,entry_date,source,invoice_number,amount,gst_hst_amount,status,notes,tax_year")
      .eq("client_id", client.id)
      .eq("tax_year", taxYear)
      .order("entry_date", { ascending: false }),
    supabase
      .from("expense_entries")
      .select("id,expense_date,category,vendor,description,amount,gst_hst_amount,status,notes,tax_year")
      .eq("client_id", client.id)
      .eq("tax_year", taxYear)
      .order("expense_date", { ascending: false }),
    supabase
      .from("receipts")
      .select("id,expense_id,file_name,vendor,receipt_date,amount,status,tax_year")
      .eq("client_id", client.id)
      .eq("tax_year", taxYear)
      .order("created_at", { ascending: false }),
    supabase
      .from("bank_statements")
      .select("id,statement_month,bank_name,account_last_four,file_name,status,tax_year")
      .eq("client_id", client.id)
      .eq("tax_year", taxYear)
      .order("statement_month", { ascending: false }),
    supabase
      .from("assets")
      .select("id,description,purchase_date,cost,asset_class,status,tax_year")
      .eq("client_id", client.id)
      .eq("tax_year", taxYear)
      .order("purchase_date", { ascending: false }),
    supabase
      .from("payroll_records")
      .select("id,period_start,period_end,employee_count,gross_pay,source_deductions,status,notes,tax_year")
      .eq("client_id", client.id)
      .eq("tax_year", taxYear)
      .order("period_start", { ascending: false }),
    supabase
      .from("gst_records")
      .select("id,period_label,period_start,period_end,gst_collected,gst_paid,status,tax_year")
      .eq("client_id", client.id)
      .eq("tax_year", taxYear)
      .order("period_start", { ascending: true, nullsFirst: false }),
    supabase
      .from("accounting_years")
      .select("id,client_id,tax_year,status,year_end_package_status")
      .eq("client_id", client.id)
      .eq("tax_year", taxYear)
      .maybeSingle()
  ]);

  const income = (incomeResult.data ?? []) as IncomeRow[];
  const expenses = (expensesResult.data ?? []) as ExpenseRow[];
  const payroll = (payrollResult.data ?? []) as PayrollRow[];
  const assets = (assetsResult.data ?? []) as AssetRow[];
  const incomeGst = income.reduce((sum, row) => sum + toNumber(row.gst_hst_amount), 0);
  const expenseGst = expenses.reduce((sum, row) => sum + toNumber(row.gst_hst_amount), 0);

  return {
    client,
    taxYear,
    companies: (companiesResult.data ?? []) as CompanyRow[],
    income,
    expenses,
    receipts: (receiptsResult.data ?? []) as ReceiptRow[],
    bankStatements: (bankResult.data ?? []) as BankStatementRow[],
    assets,
    payroll,
    gstRecords: (gstResult.data ?? []) as GstRecordRow[],
    accountingYear: (yearResult.data as AccountingYearRow | null) ?? null,
    totals: {
      income: income.reduce((sum, row) => sum + toNumber(row.amount), 0),
      incomeGst,
      expenses: expenses.reduce((sum, row) => sum + toNumber(row.amount), 0),
      expenseGst,
      payrollGross: payroll.reduce((sum, row) => sum + toNumber(row.gross_pay), 0),
      assets: assets.reduce((sum, row) => sum + toNumber(row.cost), 0),
      gstNet: incomeGst - expenseGst
    }
  };
}

export async function getAdminAccountingData(clientId: string | undefined, taxYear: number) {
  const clients = await getClientOptions();
  const selectedClient = clients.find((client) => client.id === clientId) ?? clients[0] ?? null;

  if (!selectedClient) {
    return {
      clients,
      selectedClient: null,
      taxYear,
      data: null
    };
  }

  return {
    clients,
    selectedClient,
    taxYear,
    data: await getAccountingData(selectedClient, taxYear)
  };
}

export async function getClientAccountingData(taxYear: number) {
  const client = await getClientOptionForCurrentUser();
  return getAccountingData(client, taxYear);
}

export async function getTaxYearRows(): Promise<DemoRow[]> {
  const supabase = await createServerSupabaseClient();
  const clients = await getClientOptions();
  const { data: years } = await supabase
    .from("accounting_years")
    .select("id,client_id,tax_year,status,year_end_package_status")
    .order("tax_year", { ascending: false });

  const yearRows = (years ?? []) as AccountingYearRow[];
  const rowsToLoad =
    yearRows.length > 0
      ? yearRows
      : clients.map((client) => ({
          id: "",
          client_id: client.id,
          tax_year: new Date().getFullYear(),
          status: "No year record",
          year_end_package_status: "not_started"
        }));

  const clientById = new Map(clients.map((client) => [client.id, client]));
  const loadedRows = await Promise.all(
    rowsToLoad.map(async (yearRow) => {
      const client = clientById.get(yearRow.client_id);
      if (!client) {
        return null;
      }
      const data = await getAccountingData(client, yearRow.tax_year);
      return {
        client: client.companyName,
        year: String(yearRow.tax_year),
        income: formatMoney(data.totals.income),
        expenses: formatMoney(data.totals.expenses),
        status: yearRow.status
      };
    })
  );

  const rows: DemoRow[] = [];
  loadedRows.forEach((row) => {
    if (row) {
      rows.push(row);
    }
  });

  return rows;
}

export function incomeTableRows(data: AccountingData): DemoRow[] {
  return data.income.map((row) => ({
    date: formatDate(row.entry_date),
    source: row.source,
    amount: formatMoney(row.amount),
    gst: formatMoney(row.gst_hst_amount),
    invoice: row.invoice_number ?? "-",
    status: row.status
  }));
}

export function expenseTableRows(data: AccountingData): DemoRow[] {
  return data.expenses.map((row) => ({
    date: formatDate(row.expense_date),
    paidTo: row.vendor ?? "-",
    what: row.description ?? "-",
    type: row.category,
    amount: formatMoney(row.amount),
    gst: formatMoney(row.gst_hst_amount),
    status: row.status
  }));
}

export function receiptTableRows(data: AccountingData): DemoRow[] {
  return data.receipts.map((row) => ({
    date: formatDate(row.receipt_date),
    paidTo: row.vendor ?? "-",
    name: row.file_name,
    amount: row.amount === null ? "-" : formatMoney(row.amount),
    status: row.status
  }));
}

export function bankStatementTableRows(data: AccountingData): DemoRow[] {
  return data.bankStatements.map((row) => ({
    month: compactDate(row.statement_month),
    bank: row.bank_name ?? "-",
    account: row.account_last_four ? `****${row.account_last_four}` : "-",
    name: row.file_name,
    status: row.status
  }));
}

export function assetTableRows(data: AccountingData): DemoRow[] {
  return data.assets.map((row) => ({
    date: formatDate(row.purchase_date),
    description: row.description,
    class: row.asset_class ?? "-",
    cost: formatMoney(row.cost),
    status: row.status
  }));
}

export function payrollTableRows(data: AccountingData): DemoRow[] {
  return data.payroll.map((row) => ({
    period: `${formatDate(row.period_start)} - ${formatDate(row.period_end)}`,
    employees: String(row.employee_count),
    gross: formatMoney(row.gross_pay),
    deductions: formatMoney(row.source_deductions),
    status: row.status
  }));
}

export function gstTableRows(data: AccountingData): DemoRow[] {
  const calculatedRows: DemoRow[] = [
    {
      period: `${data.taxYear} calculated`,
      collected: formatMoney(data.totals.incomeGst),
      paid: formatMoney(data.totals.expenseGst),
      net: formatMoney(data.totals.gstNet),
      status: "Calculated from records"
    }
  ];

  const savedRows = data.gstRecords.map((row) => ({
    period: row.period_start || row.period_end
      ? `${formatDate(row.period_start)} - ${formatDate(row.period_end)}`
      : row.period_label,
    collected: formatMoney(row.gst_collected),
    paid: formatMoney(row.gst_paid),
    net: formatMoney(toNumber(row.gst_collected) - toNumber(row.gst_paid)),
    status: row.status
  }));

  return [...calculatedRows, ...savedRows];
}

export function generalLedgerRows(data: AccountingData): DemoRow[] {
  const incomeRows = data.income.map((row) => ({
    transactionDate: row.entry_date,
    date: formatDate(row.entry_date),
    account: "Income",
    description: row.source,
    debit: "-",
    credit: formatMoney(row.amount),
    gst: formatMoney(row.gst_hst_amount)
  }));

  const expenseRows = data.expenses.map((row) => ({
    transactionDate: row.expense_date,
    date: formatDate(row.expense_date),
    account: row.category,
    description: `${row.vendor ?? "Paid"} - ${row.description ?? "Expense"}`,
    debit: formatMoney(row.amount),
    credit: "-",
    gst: formatMoney(row.gst_hst_amount)
  }));

  return [...incomeRows, ...expenseRows].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
}

export function payrollSummaryRows(data: AccountingData): DemoRow[] {
  const employeePeriods = data.payroll.reduce((sum, row) => sum + Number(row.employee_count), 0);
  const deductions = data.payroll.reduce((sum, row) => sum + toNumber(row.source_deductions), 0);

  return [
    {
      item: "Payroll periods",
      value: String(data.payroll.length),
      detail: `${data.taxYear}`
    },
    {
      item: "Employee count total",
      value: String(employeePeriods),
      detail: "Sum of employee counts across payroll records"
    },
    {
      item: "Gross payroll",
      value: formatMoney(data.totals.payrollGross),
      detail: "Total gross pay"
    },
    {
      item: "Source deductions",
      value: formatMoney(deductions),
      detail: "Payroll deductions recorded"
    },
    {
      item: "Estimated net payroll",
      value: formatMoney(data.totals.payrollGross - deductions),
      detail: "Gross payroll less source deductions"
    }
  ];
}

export function reportRows(data: AccountingData): DemoRow[] {
  const ledgerRows = generalLedgerRows(data);
  const trialBalanceDebits = data.totals.expenses + data.totals.assets + data.totals.expenseGst + data.totals.payrollGross;
  const trialBalanceCredits = data.totals.income + data.totals.incomeGst;

  return [
    {
      report: "Trial Balance",
      period: String(data.taxYear),
      records: `${ledgerRows.length} ledger line(s)`,
      total: `Debits ${formatMoney(trialBalanceDebits)} / Credits ${formatMoney(trialBalanceCredits)}`,
      status: "Generated from current records",
      href: `/admin/general-ledger?clientId=${data.client.id}&year=${data.taxYear}`
    },
    {
      report: "General Ledger",
      period: String(data.taxYear),
      records: `${ledgerRows.length} transaction(s)`,
      total: formatMoney(data.totals.income - data.totals.expenses),
      status: "Generated from income and expenses",
      href: `/admin/general-ledger?clientId=${data.client.id}&year=${data.taxYear}`
    },
    {
      report: "GST Summary",
      period: String(data.taxYear),
      records: `${data.income.length + data.expenses.length} GST source row(s)`,
      total: formatMoney(data.totals.gstNet),
      status: "Generated from GST collected and paid",
      href: `/admin/gst?clientId=${data.client.id}&year=${data.taxYear}`
    },
    {
      report: "Payroll Summary",
      period: String(data.taxYear),
      records: `${data.payroll.length} payroll record(s)`,
      total: formatMoney(data.totals.payrollGross),
      status: "Review payroll inside Workers & Payments",
      href: `/admin/clients/${data.client.id}?year=${data.taxYear}#workers-payments`
    },
    {
      report: "T2 Working Papers",
      period: String(data.taxYear),
      records: `${data.income.length + data.expenses.length + data.assets.length} accounting record(s)`,
      total: formatMoney(data.totals.income - data.totals.expenses),
      status: data.accountingYear?.year_end_package_status ?? "not_started",
      href: `/admin/year-end-package?clientId=${data.client.id}&year=${data.taxYear}`
    }
  ];
}

export function missingItemRows(data: AccountingData): DemoRow[] {
  const receiptExpenseIds = new Set(data.receipts.map((receipt) => receipt.expense_id).filter(Boolean));
  const missingReceiptCount = data.expenses.filter((expense) => !receiptExpenseIds.has(expense.id)).length;
  const rows: DemoRow[] = [];

  if (data.bankStatements.length === 0) {
    rows.push({ item: "Missing Bank Statement", detail: `${data.taxYear}`, status: "Needed" });
  }

  if (missingReceiptCount > 0) {
    rows.push({ item: "Missing Receipt", detail: `${missingReceiptCount} expense(s) without matched receipt`, status: "Needed" });
  }

  if (data.gstRecords.length === 0 && (data.totals.incomeGst > 0 || data.totals.expenseGst > 0)) {
    rows.push({ item: "Missing GST Information", detail: "Review calculated GST summary", status: "Review" });
  }

  if (data.payroll.length === 0) {
    rows.push({ item: "Missing Payroll Information", detail: `${data.taxYear}`, status: "If applicable" });
  }

  return rows;
}

export function clientRows(clients: ClientOption[], hrefBase?: string): DemoRow[] {
  return clients.map((client) => ({
    client: client.companyName,
    owner: client.name,
    email: client.email,
    status: "Active",
    ...(hrefBase ? { href: `${hrefBase}/${client.id}` } : {})
  }));
}

export async function getDocumentRowsForScope(clientId?: string): Promise<DemoRow[]> {
  const documents = await getClientDocuments(clientId);

  return documents.map((document) => ({
    name: document.file_name,
    nameHref: document.download_url,
    documentDate: formatDate(document.document_date),
    uploadedDate: formatDateTime(document.created_at),
    status: document.status,
    client: document.client_name,
    type: document.document_type,
    bucket: document.bucket,
    year: document.tax_year ? String(document.tax_year) : "-",
    due: formatDate(document.due_date),
    note: document.review_notes ?? "-"
  }));
}

export async function getClientDocuments(clientId?: string): Promise<ClientDocumentRow[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("documents")
    .select("id,client_id,bucket,storage_path,document_type,file_name,status,document_date,tax_year,review_notes,due_date,created_at")
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const [{ data: documents }, clients] = await Promise.all([query, getClientOptions()]);
  const clientById = new Map(clients.map((client) => [client.id, client.companyName]));

  const rows = await Promise.all(
    ((documents ?? []) as DocumentRow[]).map(async (document) => ({
      ...document,
      client_name: clientById.get(document.client_id) ?? "Client",
      download_url: await createSignedDownloadUrl(document.bucket, document.storage_path)
    }))
  );

  return rows;
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
