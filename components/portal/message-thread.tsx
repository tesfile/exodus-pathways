import Link from "next/link";
import { Send } from "lucide-react";
import type { MessageThread } from "@/lib/portal/records";

type MessageThreadViewProps = {
  thread: MessageThread;
  backHref: string;
  action: (formData: FormData) => Promise<void>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function MessageThreadView({ thread, backHref, action }: MessageThreadViewProps) {
  return (
    <div className="grid gap-6">
      <div>
        <Link href={backHref} className="text-sm font-black text-exodus-blue underline-offset-4 hover:underline">
          Back to messages
        </Link>
        <h1 className="mt-3 text-3xl font-black text-exodus-navy">{thread.message.subject}</h1>
        <p className="mt-2 text-sm font-semibold text-exodus-slate">Secure client message thread</p>
      </div>

      <section className="grid gap-3">
        {thread.rows.map((message) => (
          <article key={message.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-exodus-navy">{message.sender_name}</p>
                {message.sender_email ? <p className="text-xs font-semibold text-exodus-slate">{message.sender_email}</p> : null}
              </div>
              <p className="text-xs font-bold text-exodus-slate">{formatDateTime(message.created_at)}</p>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-exodus-slate">{message.body}</p>
          </article>
        ))}
      </section>

      <form action={action} className="grid gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <input type="hidden" name="messageId" value={thread.message.id} />
        <h2 className="text-base font-black text-exodus-navy">Reply</h2>
        <textarea name="body" className="field min-h-32" placeholder="Write a secure reply." required />
        <button type="submit" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-exodus-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-exodus-blue sm:w-max">
          <Send className="h-4 w-4" aria-hidden="true" />
          Send reply
        </button>
      </form>
    </div>
  );
}
