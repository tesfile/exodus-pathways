import { revalidatePath } from "next/cache";
import { ImmigrationCaseManager } from "@/components/portal/immigration-case-manager";
import { UploadCard } from "@/components/portal/upload-card";
import { checklistRowsForProgram } from "@/lib/immigration/case-setup";
import { getImmigrationCaseCards, getImmigrationCaseRows } from "@/lib/portal/records";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

async function createClientImmigrationCaseAction(formData: FormData) {
  "use server";

  const client = await requireRole(["client"]);
  const program = String(formData.get("program") ?? "express-entry");
  const applicantName = String(formData.get("applicantName") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!applicantName) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { data: createdCase, error } = await supabase
    .from("immigration_cases")
    .insert({
      client_id: client.id,
      case_type: program,
      applicant_name: applicantName,
      status: "intake",
      milestone: "Assessment Started",
      due_date: dueDate || null,
      notes
    })
    .select("id")
    .single();

  if (error || !createdCase) {
    return;
  }

  await Promise.all([
    supabase.from("immigration_document_checklist").insert(checklistRowsForProgram(createdCase.id, client.id, program)),
    supabase.from("immigration_case_timeline").insert({
      case_id: createdCase.id,
      client_id: client.id,
      event_key: "account_created",
      event_label: "Account Created",
      actor_id: client.id
    })
  ]);

  revalidatePath("/portal/immigration-files");
}

export default async function ImmigrationFilesPage() {
  const [cases, rows] = await Promise.all([getImmigrationCaseCards(), getImmigrationCaseRows()]);

  return (
    <div className="grid gap-6">
      <ImmigrationCaseManager
        mode="client"
        cases={cases}
        rows={rows}
        createAction={createClientImmigrationCaseAction}
      />
      <UploadCard bucket="immigration-documents" documentType="immigration_document" title="Upload immigration document" />
    </div>
  );
}
