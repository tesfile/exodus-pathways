"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

function field(form: FormData, key: string) { return String(form.get(key) ?? "").trim(); }
const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;

export async function saveEmployee(form: FormData) {
  await requireRole(["admin"]);
  const clientId = field(form, "client_id");
  let companyId = field(form, "company_id");
  const name = field(form, "worker_name");
  const year = /^\d{4}$/.test(field(form, "year")) ? field(form, "year") : String(new Date().getFullYear());
  const errorUrl = `/admin/workers-payroll-review/new?clientId=${encodeURIComponent(clientId)}&year=${year}&error=save`;

  if (!uuid.test(clientId) || (companyId && !uuid.test(companyId)) || !name || name.length > 200) throw new Error("Invalid employee registration.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Supabase staging configuration missing.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: client, error: clientError } = await db.from("users")
    .select("id,role,full_name").eq("id", clientId).maybeSingle();
  if (clientError || !client || client.role !== "client") throw new Error("Invalid client.");

  if (companyId) {
    const { data: company, error: companyError } = await db.from("companies")
      .select("id").eq("id", companyId).eq("client_id", clientId).maybeSingle();
    if (companyError || !company) throw new Error("Company does not belong to the selected client.");
  } else {
    // Reuse an existing company first. Only initialize a minimal employer record
    // if this client genuinely has none, without asking for duplicate setup.
    const { data: existing, error: lookupError } = await db.from("companies")
      .select("id").eq("client_id", clientId).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (lookupError) throw new Error("Unable to look up the client's employer record.");
    if (existing) {
      companyId = existing.id;
    } else {
      const { data: created, error: createError } = await db.from("companies")
        .insert({ client_id: clientId, legal_name: client.full_name || "Client employer" })
        .select("id").single();
      if (createError || !created) {
        console.error("Payroll employer initialization failed:", createError);
        redirect(errorUrl);
      }
      companyId = created.id;
    }
  }

  const workerType = field(form, "worker_type") === "Subcontractor" ? "Subcontractor" : "Employee";
  const { data: created, error } = await db.from("workers").insert({
    client_id: clientId,
    company_id: companyId,
    worker_name: name,
    worker_type: workerType,
    email: field(form, "email") || null,
    phone: field(form, "phone") || null,
    address: field(form, "address") || null,
    notes: field(form, "notes") || null,
  }).select("id").single();
  if (error || !created) {
    console.error("Add employee database error:", error);
    redirect(errorUrl);
  }
  if (workerType === "Employee") {
    // Future hires inherit this client's chosen default schedule without
    // overwriting the schedule of any existing employee.
    const { data: defaults, error: defaultError } = await db.from("kal_payroll_employee_profiles")
      .select("schedule_name,pay_frequency,next_period_end,next_pay_date")
      .eq("client_id", clientId).eq("default_schedule", true).maybeSingle();
    if (defaultError) {
      console.error("Payroll default schedule lookup failed:", defaultError.message);
    } else if (defaults) {
      const { error: scheduleError } = await db.from("kal_payroll_employee_profiles").insert({
        worker_id: created.id, client_id: clientId,
        schedule_name: defaults.schedule_name, pay_frequency: defaults.pay_frequency,
        next_period_end: defaults.next_period_end, next_pay_date: defaults.next_pay_date,
        employment_status: "Active", default_schedule: false
      });
      if (scheduleError) console.error("New employee schedule inheritance failed:", scheduleError.message);
    }
  }
  revalidatePath("/admin/workers-payroll-review");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(workerType === "Employee"
    ? `/admin/clients/${encodeURIComponent(clientId)}/payroll/employees/${encodeURIComponent(created.id)}?year=${year}`
    : `/admin/workers-payroll-review?clientId=${encodeURIComponent(clientId)}&year=${year}&employeeAdded=1`);
}
