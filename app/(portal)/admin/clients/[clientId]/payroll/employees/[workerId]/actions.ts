"use server";

import { createCipheriv, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
const statuses = new Set(["Active", "Paid leave of absence", "Unpaid leave of absence", "Terminated", "Not on payroll", "Deceased"]);
const frequencies = new Set(["weekly", "biweekly", "semimonthly", "monthly"]);
const read = (form: FormData, name: string, max = 200) => String(form.get(name) ?? "").trim().slice(0, max);
const isDate = (value: string) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};
const nullable = (value: string) => value || null;

function validSin(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  const digits = [...value].map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let n = digits[i];
    if (i % 2 === 1) n *= 2;
    sum += n > 9 ? n - 9 : n;
  }
  return sum % 10 === 0;
}

function encryptSin(value: string) {
  const encoded = process.env.PAYROLL_SIN_ENCRYPTION_KEY ?? "";
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("Payroll SIN encryption is not configured on the server.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export async function savePayrollEmployeeProfile(form: FormData) {
  await requireRole(["admin"]);
  const clientId = read(form, "client_id", 40);
  const workerId = read(form, "worker_id", 40);
  const year = /^20\d{2}$/.test(read(form, "year", 4)) ? read(form, "year", 4) : String(new Date().getFullYear());
  if (!isUuid(clientId) || !isUuid(workerId)) throw new Error("Invalid employee reference.");

  const base = `/admin/clients/${encodeURIComponent(clientId)}/payroll/employees/${encodeURIComponent(workerId)}?year=${year}`;
  const invalid = (reason: string): never => redirect(`${base}&error=${encodeURIComponent(reason)}`);
  const status = read(form, "employment_status", 40);
  const frequency = read(form, "pay_frequency", 20);
  const name = read(form, "worker_name");
  const email = read(form, "email", 254);
  const phone = read(form, "phone", 50);
  const address = read(form, "address", 500);
  const birthDate = read(form, "birth_date", 10);
  const hireDate = read(form, "hire_date", 10);
  const terminationDate = read(form, "termination_date", 10);
  const periodEnd = read(form, "next_period_end", 10);
  const payDate = read(form, "next_pay_date", 10);
  const workLocation = read(form, "work_location", 200);
  const managerName = read(form, "manager_name", 200);
  const department = read(form, "department", 200);
  const scheduleName = read(form, "schedule_name", 100) || "Regular payroll";
  const defaultSchedule = form.get("default_schedule") === "on";
  const payType = read(form, "pay_type", 20);
  const hourlyRateText = read(form, "hourly_rate", 30);
  const salaryAmountText = read(form, "salary_amount", 30);
  const hoursPerDayText = read(form, "default_hours_per_day", 20);
  const daysPerWeekText = read(form, "default_days_per_week", 20);
  const overtimeMultiplierText = read(form, "overtime_multiplier", 20);
  const vacationPercentText = read(form, "vacation_percent", 20);
  const hourlyRate = hourlyRateText === "" ? null : Number(hourlyRateText);
  const salaryAmount = salaryAmountText === "" ? null : Number(salaryAmountText);
  const hoursPerDay = Number(hoursPerDayText);
  const daysPerWeek = Number(daysPerWeekText);
  const overtimeMultiplier = Number(overtimeMultiplierText);
  const vacationPercent = Number(vacationPercentText);

  if (!name || !statuses.has(status) || !frequencies.has(frequency)) invalid("invalid_fields");
  if (
    !["hourly", "salary"].includes(payType) ||
    (payType === "hourly" && (hourlyRate === null || hourlyRate <= 0)) ||
    (payType === "salary" && (salaryAmount === null || salaryAmount <= 0)) ||
    (hourlyRate !== null && (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 100000)) ||
    (salaryAmount !== null && (!Number.isFinite(salaryAmount) || salaryAmount < 0 || salaryAmount > 10000000)) ||
    !Number.isFinite(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 24 ||
    !Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7 ||
    !Number.isFinite(overtimeMultiplier) || overtimeMultiplier < 1 || overtimeMultiplier > 4 ||
    !Number.isFinite(vacationPercent) || vacationPercent < 0 || vacationPercent > 30
  ) invalid("invalid_pay_settings");

  if (![birthDate, hireDate, terminationDate, periodEnd, payDate].every(isDate)) invalid("invalid_dates");
  if (birthDate && birthDate > new Date().toISOString().slice(0, 10)) invalid("invalid_birth_date");
  if (payDate && periodEnd && payDate < periodEnd) invalid("pay_date_before_period_end");
  if (terminationDate && hireDate && terminationDate < hireDate) invalid("invalid_termination_date");

  const sinEntry = read(form, "sin", 20);
  const sin = sinEntry.replace(/[ -]/g, "");
  if (sin && !validSin(sin)) invalid("invalid_sin");

  // Compute all cryptographic material before writing any employee data.
  const encryptedSin = sin ? encryptSin(sin) : null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Payroll server database configuration is missing.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: worker, error: workerError } = await db.from("workers")
    .select("id,client_id,worker_type").eq("id", workerId).eq("client_id", clientId).maybeSingle();
  if (workerError || !worker || !/employee/i.test(worker.worker_type)) throw new Error("Employee does not belong to the selected client.");

  const { error: employeeError } = await db.from("workers").update({
    worker_name: name,
    email: nullable(email),
    phone: nullable(phone),
    address: nullable(address),
    status
  }).eq("id", workerId).eq("client_id", clientId);
  if (employeeError) throw new Error("Unable to save employee contact information.");

  if (defaultSchedule) {
    const { error } = await db.from("kal_payroll_employee_profiles")
      .update({ default_schedule: false }).eq("client_id", clientId).neq("worker_id", workerId);
    if (error) throw new Error("Unable to update default schedule.");
  }

  const profile: Record<string, string | number | boolean | null> = {
    worker_id: workerId,
    client_id: clientId,
    birth_date: nullable(birthDate),
    hire_date: nullable(hireDate),
    termination_date: nullable(terminationDate),
    employment_status: status,
    work_location: nullable(workLocation),
    manager_name: nullable(managerName),
    department: nullable(department),
    schedule_name: scheduleName,
    pay_frequency: frequency,
    next_period_end: nullable(periodEnd),
    next_pay_date: nullable(payDate),
    default_schedule: defaultSchedule,
    pay_type: payType,
    hourly_rate: hourlyRate,
    salary_amount: salaryAmount,
    default_hours_per_day: hoursPerDay,
    default_days_per_week: daysPerWeek,
    overtime_multiplier: overtimeMultiplier,
    vacation_percent: vacationPercent,
    updated_at: new Date().toISOString()
  };
  if (encryptedSin) {
    profile.sin_ciphertext = encryptedSin;
    profile.sin_last4 = sin.slice(-4);
  }
  const { error } = await db.from("kal_payroll_employee_profiles").upsert(profile, { onConflict: "worker_id" });
  if (error) throw new Error("Unable to save the employee payroll profile.");

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath(`/admin/clients/${clientId}/payroll/employees/${workerId}`);
  redirect(`${base}&saved=1`);
}
