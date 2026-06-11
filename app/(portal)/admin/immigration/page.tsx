import { revalidatePath } from "next/cache";
import { ImmigrationCaseManager } from "@/components/portal/immigration-case-manager";
import { getClientOptions } from "@/lib/accounting/data";
import { checklistRowsForProgram } from "@/lib/immigration/case-setup";
import { getImmigrationCaseCards, getImmigrationCaseRows } from "@/lib/portal/records";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

async function createAdminImmigrationCaseAction(formData: FormData) {
  "use server";

  const admin = await requireRole(["admin"]);
  const clientId = String(formData.get("clientId") ?? "");
  const program = String(formData.get("program") ?? "express-entry");
  const applicantName = String(formData.get("applicantName") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!clientId || !applicantName) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { data: createdCase, error } = await supabase
    .from("immigration_cases")
    .insert({
      client_id: clientId,
      case_type: program,
      applicant_name: applicantName,
      status: "intake",
      milestone: "Account Created",
      due_date: dueDate || null,
      notes
    })
    .select("id")
    .single();

  if (error || !createdCase) {
    return;
  }

  await Promise.all([
    supabase.from("immigration_document_checklist").insert(checklistRowsForProgram(createdCase.id, clientId, program)),
    supabase.from("immigration_case_timeline").insert({
      case_id: createdCase.id,
      client_id: clientId,
      event_key: "account_created",
      event_label: "Account Created",
      actor_id: admin.id
    })
  ]);

  revalidatePath("/admin/immigration");
  revalidatePath("/admin/immigration-cases");
}

async function updateAdminImmigrationCaseAction(formData: FormData) {
  "use server";

  await requireRole(["admin"]);
  const caseId = String(formData.get("caseId") ?? "");
  const status = String(formData.get("status") ?? "").trim();
  const milestone = String(formData.get("milestone") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!caseId || !status) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("immigration_cases")
    .update({
      status,
      milestone: milestone || null,
      due_date: dueDate || null,
      notes
    })
    .eq("id", caseId);

  revalidatePath("/admin/immigration");
  revalidatePath("/admin/immigration-cases");
}

export default async function AdminImmigrationPage() {
  const [clients, cases, rows] = await Promise.all([
    getClientOptions(),
    getImmigrationCaseCards(),
    getImmigrationCaseRows()
  ]);

  return (
    <ImmigrationCaseManager
      mode="admin"
      clients={clients}
      cases={cases}
      rows={rows}
      createAction={createAdminImmigrationCaseAction}
      updateAction={updateAdminImmigrationCaseAction}
    />
  );
}
