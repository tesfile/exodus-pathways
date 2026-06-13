import Link from "next/link";
import { Plane, Save } from "lucide-react";
import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { immigrationPrograms } from "@/lib/immigration/programs";
import { formatDate } from "@/lib/accounting/data";
import type { ClientOption } from "@/lib/accounting/data";
import type { DemoRow } from "@/lib/types";
import type { ImmigrationCaseRecord } from "@/lib/portal/records";

type ImmigrationCaseManagerProps = {
  mode: "admin" | "client" | "employee";
  clients?: ClientOption[];
  cases: ImmigrationCaseRecord[];
  rows: DemoRow[];
  createAction?: (formData: FormData) => Promise<void>;
  updateAction?: (formData: FormData) => Promise<void>;
};

function titleFromSlug(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ImmigrationCaseManager({ mode, clients = [], cases, rows, createAction, updateAction }: ImmigrationCaseManagerProps) {
  const isAdmin = mode === "admin";
  const isClient = mode === "client";

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title={isAdmin ? "Immigration Cases" : isClient ? "Immigration" : "Assigned Immigration Cases"}
        description={
          isAdmin
            ? "Create, review, and update real immigration cases from Supabase."
            : isClient
              ? "Start a case, upload documents, and check your status."
              : "Review immigration cases assigned to you."
        }
        eyebrow={isClient ? "Client portal" : "Immigration"}
        showExports={!isClient}
      />

      {createAction ? (
        <form action={createAction} className="mobile-panel grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 md:col-span-2">
            <Plane className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
            <h2 className="text-lg font-black text-exodus-navy">{isAdmin ? "Create client case" : "Start new immigration case"}</h2>
          </div>
          {isAdmin ? (
            <label className="grid gap-2">
              <span className="label">Client</span>
              <select name="clientId" className="field" required>
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="grid gap-2">
            <span className="label">Program</span>
            <select name="program" className="field" defaultValue="express-entry" required>
              {immigrationPrograms.map((program) => (
                <option key={program.slug} value={program.slug}>
                  {titleFromSlug(program.slug)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="label">Applicant name</span>
            <input name="applicantName" className="field" required />
          </label>
          <label className="grid gap-2">
            <span className="label">Due date</span>
            <input name="dueDate" type="date" className="field" />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="label">Notes</span>
            <textarea name="notes" className="field min-h-24" />
          </label>
          <button type="submit" className={isClient ? "mobile-action" : "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-exodus-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-exodus-blue sm:w-max"}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {isAdmin ? "Create case" : "Start case"}
          </button>
        </form>
      ) : null}

      {updateAction && cases.length > 0 ? (
        <section className="grid gap-4">
          <h2 className="text-xl font-black text-exodus-navy">Manage Cases</h2>
          {cases.map((item) => (
            <form key={item.id} action={updateAction} className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
              <input type="hidden" name="caseId" value={item.id} />
              <div className="md:col-span-4">
                <p className="text-base font-black text-exodus-navy">{titleFromSlug(item.case_type)}</p>
                <p className="mt-1 text-sm font-semibold text-exodus-slate">
                  {item.applicant_name} | Created {formatDate(item.created_at.slice(0, 10))}
                </p>
              </div>
              <label className="grid gap-2">
                <span className="label">Status</span>
                <select name="status" className="field" defaultValue={item.status}>
                  <option value="intake">Intake</option>
                  <option value="documents_requested">Documents requested</option>
                  <option value="under_review">Under review</option>
                  <option value="application_preparation">Application preparation</option>
                  <option value="submitted">Submitted</option>
                  <option value="decision_received">Decision received</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="label">Milestone</span>
                <input name="milestone" className="field" defaultValue={item.milestone ?? ""} />
              </label>
              <label className="grid gap-2">
                <span className="label">Due date</span>
                <input name="dueDate" type="date" className="field" defaultValue={item.due_date ?? ""} />
              </label>
              <button type="submit" className="focus-ring self-end rounded-md bg-exodus-navy px-4 py-3 text-sm font-black text-white">
                Save
              </button>
              <label className="grid gap-2 md:col-span-4">
                <span className="label">Notes</span>
                <textarea name="notes" className="field min-h-20" defaultValue={item.notes ?? ""} />
              </label>
            </form>
          ))}
        </section>
      ) : null}

      <AccountingTable
        title={isClient ? "Your Immigration Cases" : "Immigration Cases"}
        columns={[
          { key: "case", label: "Case" },
          ...(isClient ? [] : [{ key: "client", label: "Client" }]),
          { key: "applicant", label: "Applicant" },
          { key: "milestone", label: "Milestone" },
          { key: "status", label: "Status" },
          { key: "due", label: "Due" }
        ]}
        rows={rows}
      />

      {isClient ? (
        <div className="rounded-md border border-exodus-gold/35 bg-white p-5 text-sm font-semibold text-exodus-slate shadow-sm">
          Upload documents below or send a secure message from <Link href="/portal/messages" className="font-black text-exodus-blue underline-offset-4 hover:underline">Messages</Link>.
        </div>
      ) : null}
    </div>
  );
}
