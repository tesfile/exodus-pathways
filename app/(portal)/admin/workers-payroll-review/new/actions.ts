"use server";

import { createClient } from "@supabase/supabase-js";
import { createCipheriv, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

function field(form: FormData, key: string) { return String(form.get(key) ?? "").trim(); }
const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;

const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const valueDate = new Date(value + "T00:00:00Z");
  return !Number.isNaN(valueDate.valueOf()) && valueDate.toISOString().slice(0, 10) === value;
};
function validSin(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  let checksum = 0;
  for (let i = 0; i < value.length; i += 1) {
    let digit = Number(value[i]);
    if (i % 2 === 1) digit *= 2;
    checksum += digit > 9 ? digit - 9 : digit;
  }
  return checksum % 10 === 0;
}
function encryptSin(value: string) {
  const key = Buffer.from(process.env.PAYROLL_SIN_ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("Server payroll SIN encryption key is not configured.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}
const optional = (value: string) => value || null;
const statuses = new Set(["Active", "Not on payroll", "Paid leave of absence", "Unpaid leave of absence"]);
const frequencies = new Set(["weekly", "biweekly", "semimonthly", "monthly"]);


export async function saveEmployee(form: FormData) {
  await requireRole(["admin"]);
  const clientId = field(form, "client_id");
  let companyId = field(form, "company_id");
  const firstName = field(form, "first_name");
  const middleName = field(form, "middle_name");
  const lastName = field(form, "last_name");
  const name = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
  const year = /^20\d{2}$/.test(field(form, "year")) ? field(form, "year") : String(new Date().getFullYear());
  const errorUrlBase = "/admin/workers-payroll-review/new?clientId=" + encodeURIComponent(clientId) + "&year=" + year;
  const errorUrl = errorUrlBase + "&error=save";
  const invalid = (reason: string): never => redirect(errorUrlBase + "&error=" + encodeURIComponent(reason));

  if (!uuid.test(clientId) || (companyId && !uuid.test(companyId))) throw new Error("Invalid payroll company.");
  if (!firstName || !lastName || firstName.length > 80 || lastName.length > 80 || middleName.length > 80 || name.length > 200) invalid("invalid_name");

  const birthDate = field(form, "birth_date");
  const hireDate = field(form, "hire_date");
  const contractEndDate = field(form, "contract_end_date");
  const autoInclude = form.get("auto_include") === "on";
  const sin = field(form, "sin").replace(/[ -]/g, "");
  if (!isValidDate(birthDate) || birthDate > new Date().toISOString().slice(0, 10)) invalid("invalid_birthdate");
  if (hireDate && !isValidDate(hireDate)) invalid("invalid_dates");
  if (contractEndDate && (!isValidDate(contractEndDate) || (hireDate && contractEndDate < hireDate))) invalid("invalid_dates");
  if (sin && !validSin(sin)) invalid("invalid_sin");
  const encryptedSin = sin ? encryptSin(sin) : null;

  const employmentStatus = field(form, "employment_status") || "Active";
  const payType = field(form, "pay_type") || "hourly";
  const payFrequency = field(form, "pay_frequency") || "biweekly";
  const hourlyText = field(form, "hourly_rate");
  const salaryText = field(form, "salary_amount");
  const hourlyRate = hourlyText ? Number(hourlyText) : null;
  const salaryAmount = salaryText ? Number(salaryText) : null;
  if (!statuses.has(employmentStatus) || !frequencies.has(payFrequency) || !["hourly", "salary"].includes(payType)) invalid("invalid_fields");
  if ((hourlyRate !== null && (!Number.isFinite(hourlyRate) || hourlyRate <= 0 || hourlyRate > 100000)) ||
      (salaryAmount !== null && (!Number.isFinite(salaryAmount) || salaryAmount <= 0 || salaryAmount > 10000000))) invalid("invalid_pay");
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

  const workerType = "Employee"; // Payroll onboarding is for employees only.
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
  // Store the birthdate and encrypted SIN only in the protected payroll profile.
  // Never copy the SIN to the general workers table or a client-visible field.
  const [{ data: scheduleDefaults, error: scheduleError }, { data: companySettings, error: settingsError }] = await Promise.all([
    db.from("kal_payroll_employee_profiles")
      .select("schedule_name,next_period_end,next_pay_date")
      .eq("client_id", clientId).eq("default_schedule", true).limit(1).maybeSingle(),
    db.from("kal_company_payroll_settings")
      .select("default_hours_per_day,default_days_per_week,overtime_multiplier,vacation_percent")
      .eq("company_id", companyId).eq("client_id", clientId).maybeSingle()
  ]);
  if (scheduleError || settingsError) {
    await db.from("workers").delete().eq("id", created.id).eq("client_id", clientId);
    redirect(errorUrl);
  }
  const payrollProfile: Record<string, string | number | boolean | null> = {
    worker_id: created.id,
    client_id: clientId,
    birth_date: birthDate,
    hire_date: optional(hireDate),
    contract_end_date: optional(contractEndDate),
    auto_include: autoInclude,
    employment_status: employmentStatus,
    work_location: optional(field(form, "work_location").slice(0, 200)),
    department: optional(field(form, "department").slice(0, 200)),
    manager_name: optional(field(form, "manager_name").slice(0, 200)),
    schedule_name: scheduleDefaults?.schedule_name ?? "Regular payroll",
    pay_frequency: payFrequency,
    next_period_end: scheduleDefaults?.next_period_end ?? null,
    next_pay_date: scheduleDefaults?.next_pay_date ?? null,
    default_schedule: false,
    pay_type: payType,
    hourly_rate: payType === "hourly" ? hourlyRate : null,
    salary_amount: payType === "salary" ? salaryAmount : null,
    default_hours_per_day: Number(companySettings?.default_hours_per_day ?? 8),
    default_days_per_week: Number(companySettings?.default_days_per_week ?? 5),
    overtime_multiplier: Number(companySettings?.overtime_multiplier ?? 1.5),
    vacation_percent: Number(companySettings?.vacation_percent ?? 4)
  };
  if (encryptedSin) {
    payrollProfile.sin_ciphertext = encryptedSin;
    payrollProfile.sin_last4 = sin.slice(-4);
  }
  const { error: payrollError } = await db.from("kal_payroll_employee_profiles")
    .upsert(payrollProfile, { onConflict: "worker_id" });
  if (payrollError) {
    // A failed profile write should not leave a newly added, incomplete employee.
    const { error: cleanupError } = await db.from("workers").delete().eq("id", created.id).eq("client_id", clientId);
    if (cleanupError) throw new Error("Employee payroll profile could not be saved. Please contact the administrator.");
    redirect(errorUrl);
  }
  revalidatePath("/admin/workers-payroll-review");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath(`/admin/clients/${clientId}/payroll`);
  redirect("/admin/clients/" + encodeURIComponent(clientId) + "/payroll/employees/" + encodeURIComponent(created.id) + "?year=" + year + "&created=1");
}
