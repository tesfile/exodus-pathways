"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const read = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

export async function saveCompanyPayrollSettings(form: FormData) {
  await requireRole(["admin"]);
  const clientId = read(form, "client_id");
  const companyId = read(form, "company_id");
  const year = /^20\d{2}$/.test(read(form, "year")) ? read(form, "year") : String(new Date().getFullYear());
  if (!uuid.test(clientId) || !uuid.test(companyId)) throw new Error("Invalid payroll company.");
  const hours = Number(read(form, "default_hours_per_day"));
  const days = Number(read(form, "default_days_per_week"));
  const multiplier = Number(read(form, "overtime_multiplier"));
  const vacation = Number(read(form, "vacation_percent"));
  const frequency = read(form, "default_pay_frequency");
  if (
    !Number.isFinite(hours) || hours <= 0 || hours > 24 ||
    !Number.isInteger(days) || days < 1 || days > 7 ||
    !Number.isFinite(multiplier) || multiplier < 1 || multiplier > 4 ||
    !Number.isFinite(vacation) || vacation < 0 || vacation > 30 ||
    !["weekly", "biweekly", "semimonthly", "monthly"].includes(frequency)
  ) throw new Error("Invalid company payroll settings.");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Server payroll database is not configured.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: company, error: lookupError } = await db.from("companies")
    .select("id").eq("id", companyId).eq("client_id", clientId).maybeSingle();
  if (lookupError || !company) throw new Error("Company does not belong to this client.");

  const { error } = await db.from("kal_company_payroll_settings").upsert({
    company_id: companyId,
    client_id: clientId,
    default_hours_per_day: hours,
    default_days_per_week: days,
    default_pay_frequency: frequency,
    overtime_multiplier: multiplier,
    vacation_percent: vacation,
    updated_at: new Date().toISOString()
  }, { onConflict: "company_id" });
  if (error) throw new Error("Unable to save the company payroll settings.");
  revalidatePath(`/admin/clients/${clientId}/payroll/settings`);
  revalidatePath(`/admin/clients/${clientId}/payroll/run`);
  redirect(`/admin/clients/${encodeURIComponent(clientId)}/payroll/settings?companyId=${encodeURIComponent(companyId)}&year=${year}&saved=1`);
}
