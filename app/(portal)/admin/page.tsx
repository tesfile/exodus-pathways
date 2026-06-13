import Link from "next/link";
import {
  AlertCircle,
  BadgeDollarSign,
  CalendarClock,
  FileText,
  MessageSquareText,
  Plane,
  ReceiptText,
  RefreshCw,
  UsersRound
} from "lucide-react";
import { DashboardGrid } from "@/components/portal/dashboard-grid";
import { PortalHero } from "@/components/portal/portal-hero";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DashboardItem } from "@/lib/types";

type ClientRow = {
  id: string;
  email: string;
  full_name: string;
  display_name: string | null;
  created_at: string;
};

type FeedItem = {
  id: string;
  clientId: string;
  clientName: string;
  type: string;
  summary: string;
  timestamp: string;
  href: string;
  action: "Review" | "Open" | "Reply";
  tone: "blue" | "gold" | "green" | "red" | "slate";
};

const quickActions: DashboardItem[] = [
  { title: "Clients", titleKey: "nav.clients", description: "Open the client workspace and manage records.", href: "/admin/clients", metric: "Open" },
  { title: "Documents", titleKey: "nav.documents", description: "Review uploaded receipts, statements, tax, and immigration files.", href: "/admin/documents", metric: "Review" },
  { title: "Workers & Payments", titleKey: "nav.workersPayments", description: "Review workers, payment records, payroll, and slip needs.", href: "/admin/workers-payroll-review", metric: "Review" },
  { title: "Immigration Cases", titleKey: "nav.immigrationCases", description: "Track assessments, documents, IRCC requests, and case status.", href: "/admin/immigration", metric: "Cases" },
  { title: "Messages", titleKey: "nav.messages", description: "Reply to client and employee message threads.", href: "/admin/messages", metric: "Reply" },
  { title: "Reports", titleKey: "nav.reports", description: "Open accounting, GST, payroll, and year-end reports.", href: "/admin/reports", metric: "Reports" }
];

const toneClass: Record<FeedItem["tone"], string> = {
  blue: "bg-blue-50 text-exodus-blue",
  gold: "bg-amber-50 text-amber-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-700"
};

function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function upcomingDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function clientDisplayName(row?: { full_name?: string | null; display_name?: string | null; email?: string | null }) {
  return row?.display_name || row?.full_name || row?.email || "Client";
}

function clientTab(clientId: string, tab: string) {
  return `/admin/clients/${clientId}?tab=${tab}`;
}

async function getAdminFeed() {
  const supabase = await createServerSupabaseClient();
  const todayIso = startOfTodayIso();
  const today = todayDate();
  const upcoming = upcomingDate();

  const [
    clientsResult,
    documentsResult,
    incomeResult,
    expensesResult,
    workerPaymentsResult,
    payrollReviewResult,
    messagesResult,
    immigrationResult,
    remindersResult,
    tasksResult
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id,email,full_name,display_name,created_at")
      .eq("role", "client")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("documents")
      .select("id,client_id,file_name,document_type,status,created_at")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("income_entries")
      .select("id,client_id,source,amount,entry_date,created_at")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("expense_entries")
      .select("id,client_id,vendor,description,amount,expense_date,created_at")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("worker_payments")
      .select("id,client_id,worker_id,amount_paid,payment_method,client_worker_type,slip_needed,status,created_at")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("worker_payments")
      .select("id,client_id,amount_paid,client_worker_type,slip_needed,admin_classification,t4_ready_status,created_at")
      .or("slip_needed.eq.Review Needed,admin_classification.eq.Review Needed,t4_ready_status.eq.Not Ready")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("messages")
      .select("id,client_id,subject,read_at,created_at")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("immigration_cases")
      .select("id,client_id,case_type,applicant_name,status,due_date,updated_at,created_at")
      .or(`updated_at.gte.${todayIso},due_date.gte.${today}`)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("client_reminders")
      .select("id,client_id,title,plain_language_title,reminder_type,status,due_date,created_at")
      .in("status", ["open", "waiting_on_client"])
      .lte("due_date", upcoming)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(8),
    supabase
      .from("client_tasks")
      .select("id,client_id,title,plain_language_title,source_module,status,due_date,created_at")
      .in("status", ["open", "waiting_on_client"])
      .gte("due_date", today)
      .lte("due_date", upcoming)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(8)
  ]);

  const clients = (clientsResult.data ?? []) as ClientRow[];
  const documents = (documentsResult.data ?? []) as Array<{ id: string; client_id: string; file_name: string; document_type: string; status: string; created_at: string }>;
  const income = (incomeResult.data ?? []) as Array<{ id: string; client_id: string; source: string; amount: number; entry_date: string; created_at: string }>;
  const expenses = (expensesResult.data ?? []) as Array<{ id: string; client_id: string; vendor: string | null; description: string | null; amount: number; expense_date: string; created_at: string }>;
  const workerPayments = (workerPaymentsResult.data ?? []) as Array<{ id: string; client_id: string; amount_paid: number; payment_method: string | null; client_worker_type: string | null; slip_needed: string | null; status: string; created_at: string }>;
  const payrollReview = (payrollReviewResult.data ?? []) as Array<{ id: string; client_id: string; amount_paid: number; client_worker_type: string | null; slip_needed: string | null; admin_classification: string | null; t4_ready_status: string | null; created_at: string }>;
  const messages = (messagesResult.data ?? []) as Array<{ id: string; client_id: string; subject: string; read_at: string | null; created_at: string }>;
  const immigration = (immigrationResult.data ?? []) as Array<{ id: string; client_id: string; case_type: string; applicant_name: string; status: string; due_date: string | null; updated_at: string; created_at: string }>;
  const reminders = (remindersResult.data ?? []) as Array<{ id: string; client_id: string; title: string; plain_language_title: string; reminder_type: string; status: string; due_date: string | null; created_at: string }>;
  const tasks = (tasksResult.data ?? []) as Array<{ id: string; client_id: string; title: string; plain_language_title: string; source_module: string; status: string; due_date: string | null; created_at: string }>;

  const clientIds = new Set<string>();
  for (const row of [...documents, ...income, ...expenses, ...workerPayments, ...payrollReview, ...messages, ...immigration, ...reminders, ...tasks]) {
    clientIds.add(row.client_id);
  }
  for (const row of clients) {
    clientIds.add(row.id);
  }

  let clientRows: ClientRow[] = clients;
  if (clientIds.size > 0) {
    const { data } = await supabase
      .from("users")
      .select("id,email,full_name,display_name,created_at")
      .in("id", Array.from(clientIds));
    clientRows = [...clients, ...((data ?? []) as ClientRow[])];
  }

  const clientById = new Map(clientRows.map((client) => [client.id, client]));
  const nameFor = (clientId: string) => clientDisplayName(clientById.get(clientId));

  const feed: FeedItem[] = [
    ...clients.map((client) => ({
      id: `client-${client.id}`,
      clientId: client.id,
      clientName: clientDisplayName(client),
      type: "New client signup",
      summary: `${client.email} created a client account today.`,
      timestamp: client.created_at,
      href: clientTab(client.id, "profile"),
      action: "Open" as const,
      tone: "green" as const
    })),
    ...documents.map((document) => ({
      id: `document-${document.id}`,
      clientId: document.client_id,
      clientName: nameFor(document.client_id),
      type: "New document uploaded",
      summary: `${document.file_name} was uploaded as ${document.document_type}. Status: ${document.status}.`,
      timestamp: document.created_at,
      href: clientTab(document.client_id, "documents"),
      action: "Review" as const,
      tone: "blue" as const
    })),
    ...income.map((entry) => ({
      id: `income-${entry.id}`,
      clientId: entry.client_id,
      clientName: nameFor(entry.client_id),
      type: "New income entry",
      summary: `${entry.source} recorded ${money(entry.amount)} for ${entry.entry_date}.`,
      timestamp: entry.created_at,
      href: clientTab(entry.client_id, "income"),
      action: "Review" as const,
      tone: "green" as const
    })),
    ...expenses.map((entry) => ({
      id: `expense-${entry.id}`,
      clientId: entry.client_id,
      clientName: nameFor(entry.client_id),
      type: "New expense entry",
      summary: `${entry.description || "Purchase"} from ${entry.vendor || "seller"} for ${money(entry.amount)}.`,
      timestamp: entry.created_at,
      href: clientTab(entry.client_id, "expenses"),
      action: "Review" as const,
      tone: "gold" as const
    })),
    ...workerPayments.map((payment) => ({
      id: `worker-payment-${payment.id}`,
      clientId: payment.client_id,
      clientName: nameFor(payment.client_id),
      type: "New worker payment",
      summary: `${money(payment.amount_paid)} paid by ${payment.payment_method || "method not provided"}. Type: ${payment.client_worker_type || "not sure"}.`,
      timestamp: payment.created_at,
      href: clientTab(payment.client_id, "workers-payments"),
      action: "Review" as const,
      tone: "blue" as const
    })),
    ...payrollReview.map((payment) => ({
      id: `payroll-review-${payment.id}`,
      clientId: payment.client_id,
      clientName: nameFor(payment.client_id),
      type: "Payroll review needed",
      summary: `${money(payment.amount_paid)} needs classification. Slip: ${payment.slip_needed || "Review Needed"}. T4 status: ${payment.t4_ready_status || "Not Ready"}.`,
      timestamp: payment.created_at,
      href: clientTab(payment.client_id, "workers-payments"),
      action: "Review" as const,
      tone: "red" as const
    })),
    ...messages.map((message) => ({
      id: `message-${message.id}`,
      clientId: message.client_id,
      clientName: nameFor(message.client_id),
      type: "New message",
      summary: message.subject,
      timestamp: message.created_at,
      href: `/admin/messages/${message.id}`,
      action: "Reply" as const,
      tone: message.read_at ? "slate" as const : "blue" as const
    })),
    ...immigration.map((caseRow) => ({
      id: `immigration-${caseRow.id}`,
      clientId: caseRow.client_id,
      clientName: nameFor(caseRow.client_id),
      type: "Immigration update",
      summary: `${caseRow.case_type} for ${caseRow.applicant_name}. Status: ${caseRow.status}${caseRow.due_date ? `, due ${caseRow.due_date}` : ""}.`,
      timestamp: caseRow.updated_at || caseRow.created_at,
      href: clientTab(caseRow.client_id, "immigration"),
      action: "Open" as const,
      tone: "blue" as const
    })),
    ...reminders.map((reminder) => ({
      id: `reminder-${reminder.id}`,
      clientId: reminder.client_id,
      clientName: nameFor(reminder.client_id),
      type: reminder.reminder_type?.toLowerCase().includes("document") ? "Missing documents" : "Missing items",
      summary: `${reminder.plain_language_title || reminder.title}${reminder.due_date ? `, due ${reminder.due_date}` : ""}.`,
      timestamp: reminder.due_date ? `${reminder.due_date}T12:00:00.000Z` : reminder.created_at,
      href: clientTab(reminder.client_id, "documents"),
      action: "Review" as const,
      tone: "gold" as const
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      clientId: task.client_id,
      clientName: nameFor(task.client_id),
      type: "Upcoming deadline",
      summary: `${task.plain_language_title || task.title}${task.due_date ? ` is due ${task.due_date}` : ""}.`,
      timestamp: task.due_date ? `${task.due_date}T12:00:00.000Z` : task.created_at,
      href: clientTab(task.client_id, "tasks"),
      action: "Open" as const,
      tone: "red" as const
    }))
  ];

  return feed
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 24);
}

export default async function AdminDashboardPage() {
  const feed = await getAdminFeed();

  return (
    <div className="grid gap-6">
      <PortalHero
        eyebrowKey="portal.admin.eyebrow"
        titleKey="portal.admin.title"
        subtitleKey="portal.admin.subtitle"
        badgeKey="common.adminAccess"
      />

      <section className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Admin workspace</p>
            <h2 className="mt-2 text-2xl font-black text-exodus-navy">Today&apos;s Activity Feed</h2>
            <p className="mt-1 text-sm leading-6 text-exodus-slate">
              A live workspace view of client activity, documents, accounting entries, messages, immigration movement, and review items.
            </p>
          </div>
          <Link
            href="/admin/tasks"
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-exodus-navy shadow-sm"
          >
            <RefreshCw className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
            Open Tasks
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="rounded-md border border-slate-200 bg-white shadow-sm">
            {feed.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {feed.map((item) => (
                  <article key={item.id} className="grid gap-3 p-4 transition hover:bg-exodus-light/60 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                    <div className="flex min-w-0 gap-3">
                      <span className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-md ${toneClass[item.tone]}`}>
                        <FeedIcon type={item.type} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-exodus-navy">{item.clientName}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${toneClass[item.tone]}`}>{item.type}</span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-exodus-slate">{item.summary}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{formatDateTime(item.timestamp)}</p>
                      </div>
                    </div>
                    <Link
                      href={item.href}
                      className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-exodus-navy px-4 text-sm font-black text-white shadow-sm transition hover:bg-exodus-blue"
                    >
                      {item.action}
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid place-items-center gap-3 p-10 text-center">
                <AlertCircle className="h-9 w-9 text-exodus-gold" aria-hidden="true" />
                <div>
                  <h3 className="text-xl font-black text-exodus-navy">No activity yet today</h3>
                  <p className="mt-2 text-sm leading-6 text-exodus-slate">
                    New client signups, uploads, entries, messages, reviews, and deadlines will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="grid content-start gap-3">
            <FeedStat label="Feed items" value={feed.length} />
            <FeedStat label="Needs review" value={feed.filter((item) => item.action === "Review").length} />
            <FeedStat label="Messages" value={feed.filter((item) => item.action === "Reply").length} />
          </aside>
        </div>
      </section>

      <section className="grid gap-3">
        <div>
          <p className="eyebrow">Quick actions</p>
          <h2 className="mt-2 text-2xl font-black text-exodus-navy">Open The Main Workspaces</h2>
        </div>
        <DashboardGrid items={quickActions} />
      </section>
    </div>
  );
}

function FeedIcon({ type }: { type: string }) {
  if (type.includes("document") || type.includes("Missing")) {
    return <FileText className="h-5 w-5" aria-hidden="true" />;
  }

  if (type.includes("income")) {
    return <BadgeDollarSign className="h-5 w-5" aria-hidden="true" />;
  }

  if (type.includes("expense")) {
    return <ReceiptText className="h-5 w-5" aria-hidden="true" />;
  }

  if (type.includes("worker") || type.includes("Payroll")) {
    return <UsersRound className="h-5 w-5" aria-hidden="true" />;
  }

  if (type.includes("message")) {
    return <MessageSquareText className="h-5 w-5" aria-hidden="true" />;
  }

  if (type.includes("Immigration")) {
    return <Plane className="h-5 w-5" aria-hidden="true" />;
  }

  if (type.includes("deadline")) {
    return <CalendarClock className="h-5 w-5" aria-hidden="true" />;
  }

  return <UsersRound className="h-5 w-5" aria-hidden="true" />;
}

function FeedStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-exodus-gold">{label}</p>
      <p className="mt-2 text-3xl font-black text-exodus-navy">{value}</p>
    </div>
  );
}
