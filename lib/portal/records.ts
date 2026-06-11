import { createServerSupabaseClient, getCurrentUserRecord } from "@/lib/supabase/server";
import { formatDate } from "@/lib/accounting/data";
import type { DemoRow, PortalUser } from "@/lib/types";

type UserLite = Pick<PortalUser, "id" | "email" | "full_name" | "role">;

type MessageRecord = {
  id: string;
  client_id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type AppointmentRecord = {
  id: string;
  client_id: string;
  employee_id: string | null;
  appointment_at: string;
  appointment_type: string;
  status: string;
  notes: string | null;
};

type TaskRecord = {
  id: string;
  client_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
};

export type ImmigrationCaseRecord = {
  id: string;
  client_id: string;
  assigned_employee_id: string | null;
  case_type: string;
  applicant_name: string;
  status: string;
  milestone: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
};

type AuditLogRecord = {
  id: string;
  actor_id: string | null;
  action: string;
  area: string;
  created_at: string;
};

type ClientReminderRecord = {
  id: string;
  client_id: string;
  title: string;
  plain_language_title: string;
  status: string;
  due_date: string | null;
  created_by: string | null;
};

type IrccRequestRecord = {
  id: string;
  client_id: string;
  title: string;
  requested_document: string;
  due_date: string | null;
  status: string;
};

export type MessageThread = {
  message: MessageRecord;
  rows: Array<MessageRecord & { sender_name: string; sender_email: string }>;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function titleFromSlug(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getUserMap() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("users").select("id,email,full_name,role");
  return new Map(((data ?? []) as UserLite[]).map((user) => [user.id, user]));
}

async function getClientNameMap() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("users").select("id,email,full_name,role").eq("role", "client");
  return new Map(((data ?? []) as UserLite[]).map((user) => [user.id, user.full_name || user.email]));
}

export async function getMessageRows(clientId?: string): Promise<DemoRow[]> {
  const user = await getCurrentUserRecord();
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("messages")
    .select("id,client_id,sender_id,recipient_id,subject,body,read_at,created_at")
    .order("created_at", { ascending: false });

  if (user.role === "client") {
    query = query.eq("client_id", user.id);
  } else if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const [{ data: messages }, userMap, clientMap] = await Promise.all([query, getUserMap(), getClientNameMap()]);
  const hrefBase = user.role === "admin" ? "/admin/messages" : user.role === "employee" ? "/employee/messages" : "/portal/messages";

  return ((messages ?? []) as MessageRecord[]).map((message) => {
    const sender = userMap.get(message.sender_id);
    const senderName = message.sender_id === user.id ? "You" : sender?.full_name ?? "Exodus Pathways";

    return {
      subject: message.subject,
      from: senderName,
      client: clientMap.get(message.client_id) ?? "Client",
      date: formatDateTime(message.created_at),
      status: message.read_at ? "Read" : "Open",
      href: `${hrefBase}/${message.id}`
    };
  });
}

export async function getMessageThread(messageId: string): Promise<MessageThread | null> {
  const supabase = await createServerSupabaseClient();
  const { data: message } = await supabase
    .from("messages")
    .select("id,client_id,sender_id,recipient_id,subject,body,read_at,created_at")
    .eq("id", messageId)
    .maybeSingle();

  if (!message) {
    return null;
  }

  const original = message as MessageRecord;
  const [{ data: rows }, userMap] = await Promise.all([
    supabase
      .from("messages")
      .select("id,client_id,sender_id,recipient_id,subject,body,read_at,created_at")
      .eq("client_id", original.client_id)
      .eq("subject", original.subject)
      .order("created_at", { ascending: true }),
    getUserMap()
  ]);

  return {
    message: original,
    rows: ((rows ?? []) as MessageRecord[]).map((row) => {
      const sender = userMap.get(row.sender_id);
      return {
        ...row,
        sender_name: sender?.full_name ?? "Exodus Pathways",
        sender_email: sender?.email ?? ""
      };
    })
  };
}

export async function getTaskRows(): Promise<DemoRow[]> {
  const supabase = await createServerSupabaseClient();
  const [{ data: tasks }, userMap, clientMap] = await Promise.all([
    supabase
      .from("tasks")
      .select("id,client_id,assigned_to,title,description,status,due_date")
      .order("due_date", { ascending: true, nullsFirst: false }),
    getUserMap(),
    getClientNameMap()
  ]);

  return ((tasks ?? []) as TaskRecord[]).map((task) => ({
    task: task.title,
    client: clientMap.get(task.client_id) ?? "Client",
    owner: task.assigned_to ? userMap.get(task.assigned_to)?.full_name ?? "Assigned staff" : "-",
    due: formatDate(task.due_date),
    status: task.status
  }));
}

export async function getAppointmentRows(clientId?: string): Promise<DemoRow[]> {
  const user = await getCurrentUserRecord();
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("appointments")
    .select("id,client_id,employee_id,appointment_at,appointment_type,status,notes")
    .order("appointment_at", { ascending: true });

  if (user.role === "client") {
    query = query.eq("client_id", user.id);
  } else if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const [{ data: appointments }, clientMap] = await Promise.all([query, getClientNameMap()]);

  return ((appointments ?? []) as AppointmentRecord[]).map((appointment) => ({
    date: formatDate(appointment.appointment_at.slice(0, 10)),
    time: formatTime(appointment.appointment_at),
    client: clientMap.get(appointment.client_id) ?? "Client",
    type: appointment.appointment_type,
    status: appointment.status
  }));
}

export async function getImmigrationCaseRows(clientId?: string, hrefBase?: string): Promise<DemoRow[]> {
  const user = await getCurrentUserRecord();
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("immigration_cases")
    .select("id,client_id,assigned_employee_id,case_type,applicant_name,status,milestone,due_date,notes,created_at")
    .order("created_at", { ascending: false });

  if (user.role === "client") {
    query = query.eq("client_id", user.id);
  } else if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const [{ data: cases }, clientMap] = await Promise.all([query, getClientNameMap()]);

  return ((cases ?? []) as ImmigrationCaseRecord[]).map((row) => ({
    case: titleFromSlug(row.case_type),
    client: clientMap.get(row.client_id) ?? "Client",
    applicant: row.applicant_name,
    milestone: row.milestone ?? "-",
    status: row.status,
    due: formatDate(row.due_date),
    ...(hrefBase ? { href: `${hrefBase}/${row.id}` } : {})
  }));
}

export async function getImmigrationCaseCards(clientId?: string): Promise<ImmigrationCaseRecord[]> {
  const user = await getCurrentUserRecord();
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("immigration_cases")
    .select("id,client_id,assigned_employee_id,case_type,applicant_name,status,milestone,due_date,notes,created_at")
    .order("created_at", { ascending: false });

  if (user.role === "client") {
    query = query.eq("client_id", user.id);
  } else if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data } = await query;
  return (data ?? []) as ImmigrationCaseRecord[];
}

export async function getAuditLogRows(): Promise<DemoRow[]> {
  await getCurrentUserRecord();
  const supabase = await createServerSupabaseClient();
  const [{ data: logs }, userMap] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("id,actor_id,action,area,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    getUserMap()
  ]);

  return ((logs ?? []) as AuditLogRecord[]).map((log) => ({
    date: formatDateTime(log.created_at),
    actor: log.actor_id ? userMap.get(log.actor_id)?.full_name ?? "User" : "System",
    action: log.action,
    area: log.area,
    status: "Logged"
  }));
}

export async function getEmployeeRows(): Promise<DemoRow[]> {
  const supabase = await createServerSupabaseClient();
  const [{ data: users }, { data: profiles }] = await Promise.all([
    supabase.from("users").select("id,email,full_name,role").in("role", ["admin", "employee"]).order("full_name"),
    supabase.from("client_profiles").select("assigned_employee_id")
  ]);

  const assignedCounts = new Map<string, number>();
  (profiles ?? []).forEach((profile) => {
    const assignedId = (profile as { assigned_employee_id: string | null }).assigned_employee_id;
    if (assignedId) {
      assignedCounts.set(assignedId, (assignedCounts.get(assignedId) ?? 0) + 1);
    }
  });

  return ((users ?? []) as UserLite[]).map((user) => ({
    name: user.full_name,
    email: user.email,
    role: user.role,
    assigned: user.role === "admin" ? "All clients" : `${assignedCounts.get(user.id) ?? 0} client(s)`,
    status: "Active"
  }));
}

export async function getFollowUpRows(): Promise<DemoRow[]> {
  const supabase = await createServerSupabaseClient();
  const [{ data: reminders }, userMap, clientMap] = await Promise.all([
    supabase
      .from("client_reminders")
      .select("id,client_id,title,plain_language_title,status,due_date,created_by")
      .order("due_date", { ascending: true, nullsFirst: false }),
    getUserMap(),
    getClientNameMap()
  ]);

  return ((reminders ?? []) as ClientReminderRecord[]).map((reminder) => ({
    client: clientMap.get(reminder.client_id) ?? "Client",
    item: reminder.plain_language_title || reminder.title,
    follow: formatDate(reminder.due_date),
    staff: reminder.created_by ? userMap.get(reminder.created_by)?.full_name ?? "Staff" : "-",
    status: reminder.status
  }));
}

export async function getIrccRequestRows(): Promise<DemoRow[]> {
  const supabase = await createServerSupabaseClient();
  const [{ data: requests }, clientMap] = await Promise.all([
    supabase
      .from("ircc_requests")
      .select("id,client_id,title,requested_document,due_date,status")
      .order("due_date", { ascending: true, nullsFirst: false }),
    getClientNameMap()
  ]);

  return ((requests ?? []) as IrccRequestRecord[]).map((request) => ({
    client: clientMap.get(request.client_id) ?? "Client",
    title: request.title,
    document: request.requested_document,
    due: formatDate(request.due_date),
    status: request.status
  }));
}
