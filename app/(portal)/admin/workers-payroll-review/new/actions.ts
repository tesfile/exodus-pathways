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
  const companyId = field(form, "company_id");
  const name = field(form, "worker_name");
  const year = /^\d{4}$/.test(field(form, "year")) ? field(form, "year") : String(new Date().getFullYear());
  const errorUrl = `/admin/workers-payroll-review/new?clientId=${encodeURIComponent(clientId)}&year=${year}&error=save`;

  if (!uuid.test(clientId) || !uuid.test(companyId) || !name || name.length > 200) throw new Error("Invalid employee registration.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Supabase staging configuration missing.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  // Do not trust company IDs from the form: verify company belongs to the selected client.
  const { data: company, error: companyError } = await db.from("companies")
    .select("id").eq("id", companyId).eq("client_id", clientId).maybeSingle();
  if (companyError || !company) throw new Error("Company does not belong to the selected client.");

  const { data: client, error: clientError } = await db.from("users")
    .select("id,role").eq("id", clientId).maybeSingle();
  if (clientError || !client || client.role !== "client") throw new Error("Invalid client.");

  const workerType = field(form, "worker_type") === "Subcontractor" ? "Subcontractor" : "Employee";
  const { error } = await db.from("workers").insert({
    client_id: clientId,
    company_id: companyId,
    worker_name: name,
    worker_type: workerType,
    email: field(form, "email") || null,
    phone: field(form, "phone") || null,
    address: field(form, "address") || null,
    notes: field(form, "notes") || null,
  });
  if (error) {
    console.error("Add employee database error:", error);
    redirect(errorUrl);
  }
  revalidatePath("/admin/workers-payroll-review");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/workers-payroll-review?clientId=${encodeURIComponent(clientId)}&year=${year}&employeeAdded=1`);
}
