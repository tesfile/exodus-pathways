"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;

export async function saveDentalBenefitsCode(form: FormData) {
  await requireRole(["admin"]);
  const clientId = String(form.get("client_id") ?? "");
  const workerId = String(form.get("worker_id") ?? "");
  const taxYear = Number(form.get("tax_year"));
  const choice = String(form.get("access_code") ?? "");
  if (!uuid.test(clientId) || !uuid.test(workerId) || !Number.isInteger(taxYear) || taxYear < 2024 || taxYear > 2100)
    throw new Error("Invalid employee reference.");
  if (choice !== "" && !["1", "2", "3", "4", "5"].includes(choice))
    throw new Error("Select a valid dental benefits access code.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Payroll database configuration is missing.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: worker, error: workerError } = await db.from("workers")
    .select("id").eq("client_id", clientId).eq("id", workerId).ilike("worker_type", "%employee%").maybeSingle();
  if (workerError || !worker) throw new Error("Employee does not belong to the selected payroll client.");
  const { error } = await db.from("kal_payroll_t4_dental_access")
    .upsert({
      worker_id: workerId,
      client_id: clientId,
      tax_year: taxYear,
      access_code: choice === "" ? null : Number(choice),
      updated_at: new Date().toISOString()
    }, { onConflict: "worker_id,tax_year" });
  if (error) throw new Error("Could not save the T4 dental access code.");
  const destination = `/admin/clients/${encodeURIComponent(clientId)}/payroll/employees/${encodeURIComponent(workerId)}?year=${taxYear}`;
  revalidatePath(destination);
  redirect(destination + "&dentalSaved=1#deductions");
}
