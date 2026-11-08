import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";
import { RecordPayrollForm } from "@/components/portal/record-payroll-form";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ clientId?: string; workerId?: string }> };
export default async function RecordPaymentPage({ searchParams }: Props) {
  await requireRole(["admin"]);
  const { clientId, workerId } = await searchParams;
  if (!clientId || !workerId) notFound();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Server database configuration missing");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: worker, error } = await db.from("workers")
    .select("id,worker_name,worker_type,company_id").eq("client_id", clientId).eq("id", workerId).single();
  if (error || !worker) notFound();
  const isEmployee = worker.worker_type === "Employee";
  const today = new Date().toISOString().slice(0, 10);
  const back = "/admin/workers-payroll-review?clientId=" + encodeURIComponent(clientId);
  return (
    <main className="mx-auto grid max-w-4xl gap-5">
      <Link href={back} className="font-bold text-blue-800">← Workers & Payments</Link>
      <div><h1 className="text-3xl font-bold text-blue-950">Record {isEmployee ? "Payroll" : "Contractor Payment"}</h1>
        <p className="text-slate-600">{worker.worker_name} · {worker.worker_type}</p></div>
      <RecordPayrollForm clientId={clientId} workerId={workerId} today={today} initialClassification={isEmployee ? "T4 Employee" : "T5018 Subcontractor"} />
    </main>
  );
}
