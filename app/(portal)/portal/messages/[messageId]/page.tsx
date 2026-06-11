import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { MessageThreadView } from "@/components/portal/message-thread";
import { getMessageThread } from "@/lib/portal/records";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ messageId: string }>;
};

async function replyToClientThreadAction(formData: FormData) {
  "use server";

  const user = await requireRole(["client"]);
  const messageId = String(formData.get("messageId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!messageId || !body) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { data: original } = await supabase
    .from("messages")
    .select("id,client_id,sender_id,recipient_id,subject")
    .eq("id", messageId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (!original) {
    return;
  }

  await supabase.from("messages").insert({
    client_id: user.id,
    sender_id: user.id,
    recipient_id: original.sender_id === user.id ? original.recipient_id : original.sender_id,
    subject: original.subject,
    body
  });

  revalidatePath(`/portal/messages/${messageId}`);
  revalidatePath("/portal/messages");
}

export default async function ClientMessageDetailPage({ params }: PageProps) {
  const { messageId } = await params;
  const thread = await getMessageThread(messageId);

  if (!thread) {
    notFound();
  }

  return <MessageThreadView thread={thread} backHref="/portal/messages" action={replyToClientThreadAction} />;
}
