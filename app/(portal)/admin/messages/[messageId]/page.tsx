import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { MessageThreadView } from "@/components/portal/message-thread";
import { getMessageThread } from "@/lib/portal/records";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ messageId: string }>;
};

async function replyToAdminThreadAction(formData: FormData) {
  "use server";

  const admin = await requireRole(["admin"]);
  const messageId = String(formData.get("messageId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!messageId || !body) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { data: original } = await supabase
    .from("messages")
    .select("id,client_id,subject")
    .eq("id", messageId)
    .maybeSingle();

  if (!original) {
    return;
  }

  await supabase.from("messages").insert({
    client_id: original.client_id,
    sender_id: admin.id,
    recipient_id: original.client_id,
    subject: original.subject,
    body
  });

  revalidatePath(`/admin/messages/${messageId}`);
  revalidatePath("/admin/messages");
}

export default async function AdminMessageDetailPage({ params }: PageProps) {
  const { messageId } = await params;
  const thread = await getMessageThread(messageId);

  if (!thread) {
    notFound();
  }

  return <MessageThreadView thread={thread} backHref="/admin/messages" action={replyToAdminThreadAction} />;
}
