import { revalidatePath } from "next/cache";
import { Send } from "lucide-react";
import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getMessageRows } from "@/lib/portal/records";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

async function sendClientMessageAction(formData: FormData) {
  "use server";

  const user = await requireRole(["client"]);
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!subject || !body) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("messages").insert({
    client_id: user.id,
    sender_id: user.id,
    recipient_id: null,
    subject,
    body
  });

  revalidatePath("/portal/messages");
}

export default async function MessagesPage() {
  const rows = await getMessageRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Messages"
        description="Send Exodus Pathways a secure question or update."
        eyebrow="Client portal"
        showExports={false}
      />
      <form action={sendClientMessageAction} className="mobile-panel grid gap-3">
        <h2 className="text-xl font-black text-exodus-navy">New message</h2>
        <input name="subject" className="field" placeholder="Subject" required />
        <textarea name="body" className="field min-h-28" placeholder="Write a secure message." required />
        <button type="submit" className="mobile-action">
          <Send className="h-4 w-4" aria-hidden="true" />
          Send message
        </button>
      </form>
      <AccountingTable
        title="Message Threads"
        columns={[
          { key: "subject", label: "Subject" },
          { key: "from", label: "From" },
          { key: "date", label: "Date" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
