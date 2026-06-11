import { revalidatePath } from "next/cache";
import { Send } from "lucide-react";
import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getClientOptions } from "@/lib/accounting/data";
import { getMessageRows } from "@/lib/portal/records";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

async function sendAdminMessageAction(formData: FormData) {
  "use server";

  const admin = await requireRole(["admin"]);
  const clientId = String(formData.get("clientId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!clientId || !subject || !body) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("messages").insert({
    client_id: clientId,
    sender_id: admin.id,
    recipient_id: clientId,
    subject,
    body
  });

  revalidatePath("/admin/messages");
}

export default async function AdminMessagesPage() {
  const [rows, clients] = await Promise.all([getMessageRows(), getClientOptions()]);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Messages"
        description="Admin message center for client questions, missing document follow-ups, and employee notes."
      />
      <form action={sendAdminMessageAction} className="grid gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr]">
        <h2 className="text-base font-black text-exodus-navy md:col-span-2">New client message</h2>
        <select name="clientId" className="field" required>
          <option value="">Select client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.companyName}
            </option>
          ))}
        </select>
        <input name="subject" className="field" placeholder="Subject" required />
        <textarea name="body" className="field min-h-28 md:col-span-2" placeholder="Write a secure message." required />
        <button type="submit" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-exodus-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-exodus-blue sm:w-max">
          <Send className="h-4 w-4" aria-hidden="true" />
          Send message
        </button>
      </form>
      <AccountingTable
        title="Message Threads"
        columns={[
          { key: "subject", label: "Subject" },
          { key: "client", label: "Client" },
          { key: "from", label: "From" },
          { key: "date", label: "Date" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
