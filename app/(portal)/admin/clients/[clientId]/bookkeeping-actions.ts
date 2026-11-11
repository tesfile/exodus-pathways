"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

const categories = ["Advertising","Vehicle Purchase","Equipment Purchase","Furniture Purchase","Vehicle Fuel","Vehicle Repairs & Maintenance","Automobile & Fuel","Bank Charges","Contract Labour","Insurance","Meals","Office Expenses","Office Supplies","Professional Fees","Rent","Repairs","Salaries & Wages","Supplies","Telephone & Internet","Travel","Utilities","Other"];

export async function saveClientBookkeepingEntry(formData: FormData) {
  await requireRole(["admin"]);
  const clientId = String(formData.get("clientId") || "");
  const kind = String(formData.get("kind") || "");
  const year = Number(formData.get("taxYear"));
  const date = String(formData.get("date") || "");
  const party = String(formData.get("party") || "").trim();
  const amount = Number(formData.get("amount"));
  const gst = Number(formData.get("gst") || 0);
  const category = String(formData.get("category") || "Other");
  if (!/^[0-9a-f-]{36}$/i.test(clientId) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number(date.slice(0, 4)) !== year || !party || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(gst) || gst < 0) throw new Error("Enter a valid date, payer/supplier and amount.");
  if (kind !== "income" && kind !== "expense") throw new Error("Invalid entry type.");
  if (kind === "expense" && !categories.includes(category)) throw new Error("Invalid expense category.");
  const db = await createServerSupabaseClient();
  const { data: client } = await db.from("users").select("id").eq("id", clientId).eq("role", "client").maybeSingle();
  if (!client) throw new Error("Client not found.");
  const notes = [String(formData.get("address") || ""),String(formData.get("description") || ""),String(formData.get("notes") || "")].filter(Boolean).join(" | ");
  const payload = kind === "expense"
    ? { client_id: clientId, tax_year: year, expense_date: date, vendor: party, category, description: String(formData.get("description") || ""), amount, gst_hst_amount: gst, status: "draft", notes }
    : { client_id: clientId, tax_year: year, entry_date: date, source: party, invoice_number: String(formData.get("invoice") || ""), amount, gst_hst_amount: gst, status: "draft", notes };
  // Compare against existing records for this client and tax year before inserting.
  // Do not use vendor and amount alone: recurring bills can legitimately match.
  const table = kind === "expense" ? "expense_entries" : "income_entries";
  const base = db.from(table).select("id").eq("client_id", clientId).eq("tax_year", year)
    .eq(kind === "expense" ? "expense_date" : "entry_date", date)
    .eq(kind === "expense" ? "vendor" : "source", party)
    .eq("amount", amount).eq("gst_hst_amount", gst);
  const { data: possibleDuplicates, error: duplicateError } = kind === "expense"
    ? await base.eq("category", category).limit(1)
    : await base.eq("invoice_number", String(formData.get("invoice") || "")).limit(1);
  if (duplicateError) throw new Error("Could not check for duplicate entries: " + duplicateError.message);
  if (possibleDuplicates?.length) {
    redirect(`/admin/clients/${clientId}?tab=bookkeeping&year=${year}&bookkeepingNotice=duplicate#bookkeeping-entry`);
  }
  // Keep each table insert in its own branch so generated Supabase types match the payload.
  const { error } = kind === "expense"
    ? await db.from("expense_entries").insert({ client_id: clientId, tax_year: year, expense_date: date, vendor: party, category, description: String(formData.get("description") || ""), amount, gst_hst_amount: gst, status: "draft", notes })
    : await db.from("income_entries").insert({ client_id: clientId, tax_year: year, entry_date: date, source: party, invoice_number: String(formData.get("invoice") || ""), amount, gst_hst_amount: gst, status: "draft", notes });
  if (error) throw new Error("Unable to save bookkeeping entry: " + error.message);
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/clients/${clientId}?tab=bookkeeping&year=${year}&bookkeepingNotice=saved#bookkeeping-entry`);
}

export async function uploadAdminClientDocument(formData: FormData) {
  const admin = await requireRole(["admin"]);
  const clientId = String(formData.get("clientId") || "");
  const companyId = String(formData.get("companyId") || "");
  const year = Number(formData.get("taxYear"));
  const documentType = String(formData.get("documentType") || "");
  const file = formData.get("file");
  if (!/^[0-9a-f-]{36}$/i.test(clientId) || !Number.isInteger(year) || year < 2000 || year > new Date().getFullYear() + 2) throw new Error("Invalid client or tax year.");
  if (!["receipt","invoice","bank_statement","payroll_document","tax_document","client_document"].includes(documentType)) throw new Error("Invalid document type.");
  if (!(file instanceof File) || !file.size || file.size > 20 * 1024 * 1024 || !/\.(pdf|jpe?g|png|webp|heic|tiff?|docx?|xlsx?|csv)$/i.test(file.name)) throw new Error("Choose a supported file under 20 MB.");
  const db = await createServerSupabaseClient();
  const { data: client } = await db.from("users").select("id").eq("id", clientId).eq("role", "client").maybeSingle();
  if (!client) throw new Error("Client not found.");
  if (companyId) {
    const { data: company } = await db.from("companies").select("id").eq("id", companyId).eq("client_id", clientId).maybeSingle();
    if (!company) throw new Error("Company does not belong to client.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${clientId}/${companyId || "unassigned"}/${year}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await db.storage.from("client-documents").upload(storagePath, file, { upsert: false, contentType: file.type || undefined });
  if (uploadError) throw new Error("Upload failed: " + uploadError.message);
  const { error } = await db.from("documents").insert({client_id: clientId, uploaded_by: admin.id, company_id: companyId || null, bucket: "client-documents", storage_path: storagePath, document_type: documentType, file_name: file.name, mime_type: file.type || null, size_bytes: file.size, tax_year: year, status: "uploaded"});
  if (error) {
    await db.storage.from("client-documents").remove([storagePath]);
    throw new Error("Document record failed: " + error.message);
  }
  if (documentType === "receipt" && String(formData.get("createExpense") || "") === "yes") {
    const vendor = String(formData.get("vendor") || "").trim();
    const category = String(formData.get("category") || "Other");
    const expenseDate = String(formData.get("expenseDate") || "");
    const amount = Number(formData.get("amount"));
    const gst = Number(formData.get("gst") || 0);
    if (!vendor || !categories.includes(category) || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate) || Number(expenseDate.slice(0,4)) !== year || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(gst) || gst < 0) throw new Error("Receipt saved, but expense draft needs valid supplier, category, date and amounts.");
    const { error: expenseError } = await db.from("expense_entries").insert({client_id: clientId, tax_year: year, expense_date: expenseDate, vendor, category, description: "Receipt: " + file.name, amount, gst_hst_amount: gst, status: "draft", notes: "Supporting document: " + storagePath});
    if (expenseError) throw new Error("Receipt saved, but expense draft could not be created: " + expenseError.message);
  }
  revalidatePath(`/admin/clients/${clientId}`);
}
