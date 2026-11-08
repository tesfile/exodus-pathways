"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
function amount(form: FormData, key: string) {
  const raw = text(form, key);
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw new Error("Invalid amount: " + key);
  const value = Number(raw);
  if (!Number.isFinite(value) || value > 9999999999) throw new Error("Amount out of range");
  return value;
}

export async function savePayrollEntry(form: FormData) {
  const admin = await requireRole(["admin"]);
  const clientId = text(form, "client_id");
  const workerId = text(form, "worker_id");
  const date = text(form, "payment_date");
  const start = text(form, "pay_period_start");
  const end = text(form, "pay_period_end");
  const frequency = text(form, "pay_frequency");
  const classification = text(form, "classification");
  if (![clientId, workerId].every(id => uuid.test(id)) || ![date, start, end].every(d => datePattern.test(d)) ||
      start > end || date < start || !["weekly", "biweekly", "semi-monthly", "monthly"].includes(frequency) ||
      !["T4 Employee", "T4A Contractor", "T5018 Subcontractor"].includes(classification)) {
    throw new Error("Invalid payroll entry or pay period");
  }
  const year = Number(date.slice(0, 4));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Server database configuration missing");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: worker, error: workerError } = await db.from("workers")
    .select("id,client_id,company_id,worker_type").eq("id", workerId).eq("client_id", clientId).single();
  if (workerError || !worker || !worker.company_id) throw new Error("Employee or employer company not found");
  const { data: company, error: companyError } = await db.from("companies")
    .select("id").eq("id", worker.company_id).eq("client_id", clientId).single();
  if (companyError || !company) throw new Error("Employer company does not belong to client");

  const gross = amount(form, "gross");
  if (gross <= 0) throw new Error("Gross amount must be greater than zero");
  const isT4 = classification === "T4 Employee";
  if (isT4 && worker.worker_type !== "Employee") throw new Error("This worker is not registered as an employee");
  if (!isT4 && worker.worker_type === "Employee") throw new Error("Change the worker classification before recording contractor payments");

  const cpp = isT4 ? amount(form, "cpp") : 0;
  const ei = isT4 ? amount(form, "ei") : 0;
  const incomeTax = isT4 ? amount(form, "income_tax") : 0;
  const employerCpp = isT4 ? amount(form, "employer_cpp") : 0;
  const employerEi = isT4 ? amount(form, "employer_ei") : 0;
  const gst = isT4 ? 0 : amount(form, "gst");
  if (isT4 && (cpp + ei + incomeTax > gross)) throw new Error("Deductions exceed gross pay");
  const net = isT4 ? Math.round((gross - cpp - ei - incomeTax) * 100) / 100 : Math.round((gross + gst) * 100) / 100;
  const { error } = await db.from("worker_payments").insert({
    worker_id: workerId, client_id: clientId, company_id: company.id, tax_year: year,
    payment_date: date, pay_period_start: start, pay_period_end: end,
    pay_period: start + " to " + end, pay_frequency: frequency,
    amount_paid: isT4 ? gross : net, gross_pay: isT4 ? gross : 0,
    cpp, ei, income_tax_deducted: incomeTax, net_pay: net,
    gst_paid: gst, subcontractor_gst: gst, amount_before_gst: isT4 ? 0 : gross,
    total_paid: net, admin_classification: classification,
    slip_needed: isT4 ? "T4" : classification === "T4A Contractor" ? "T4A" : "T5018",
    t4_box14_employment_income: isT4 ? gross : 0,
    t4_box16_cpp: cpp, t4_box18_ei: ei, t4_box22_income_tax_deducted: incomeTax,
    t4_box24_ei_insurable_earnings: isT4 ? gross : 0,
    t4_box26_cpp_pensionable_earnings: isT4 ? gross : 0,
    t4_net_pay: isT4 ? net : 0,
    payroll_calculator_province: "Alberta",
    payroll_calculator_pay_frequency: frequency,
    payroll_calculator_pay_date: date,
    payroll_calculator_gross_pay: isT4 ? gross : 0,
    payroll_calculator_employer_cpp: employerCpp,
    payroll_calculator_employer_ei: employerEi,
    status: "submitted", review_notes: "Deductions entered manually; verify against CRA PDOC before remittance.",
    reviewed_by: admin.id, reviewed_at: new Date().toISOString()
  });
  if (error) {
    console.error("Save payroll entry failed", error);
    throw new Error("Payroll entry could not be saved: " + error.message);
  }
  revalidatePath("/admin/workers-payroll-review");
  redirect("/admin/workers-payroll-review?clientId=" + encodeURIComponent(clientId) +
    "&year=" + year + "&workerId=" + encodeURIComponent(workerId) + "&workerTab=" +
    (isT4 ? "payroll" : "payments"));
}
