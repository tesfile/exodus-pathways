import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import { updateClient } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditClientProfilePage({ params, searchParams }: Props) {
  await requireRole(["admin"]);
  const { clientId } = await params;
  const { error } = await searchParams;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(clientId)) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Database configuration is missing.");

  const db = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [{ data: user, error: userError }, { data: company, error: companyError }] = await Promise.all([
    db.from("users").select("id,role,full_name,phone,email").eq("id", clientId).maybeSingle(),
    db.from("companies").select("legal_name,trade_name,business_number,gst_hst_number,corporation_number,phone,email,contact_person,address,province").eq("client_id", clientId).order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);
  if (userError || companyError) throw new Error("Unable to load client profile.");
  if (!user || user.role !== "client") notFound();

  const fields = [
    { name: "legal_name", label: "Legal Business Name", value: company?.legal_name ?? "", required: true },
    { name: "trade_name", label: "Operating / Trade Name", value: company?.trade_name ?? "" },
    { name: "business_number", label: "CRA Business Number (BN)", value: company?.business_number ?? "" },
    { name: "corporation_number", label: "Corporation Number", value: company?.corporation_number ?? "" },
    { name: "gst_hst_number", label: "GST/HST Registration Number", value: company?.gst_hst_number ?? "" },
    { name: "address", label: "Business Address", value: company?.address ?? "" },
    { name: "province", label: "Province / Territory", value: company?.province ?? "" },
    { name: "phone", label: "Business Telephone", value: company?.phone ?? "", type: "tel" },
    { name: "email", label: "Business Email", value: company?.email ?? "", type: "email" },
    { name: "contact_person", label: "Business Contact Person", value: company?.contact_person ?? "" },
    { name: "full_name", label: "Client Contact Name", value: user.full_name ?? "", required: true },
    { name: "client_phone", label: "Client Contact Telephone", value: user.phone ?? "", type: "tel" },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-exodus-blue">Client Profile</p>
          <h1 className="text-3xl font-black text-exodus-navy">Edit Business Profile</h1>
          <p className="mt-2 text-sm text-slate-600">Update contact and registration information. Accounting and payroll records are not changed.</p>
        </div>
        <Link className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-exodus-navy" href={`/admin/clients/${clientId}?tab=profile`}>Back to Profile</Link>
      </div>
      {error ? <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">Unable to save the profile. Please check the information and try again. ({error})</p> : null}
      <form action={updateClient} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="client_id" value={clientId} />
        <div className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className={`grid gap-2 ${field.name === "address" ? "md:col-span-2" : ""}`}>
              <span className="text-sm font-bold text-slate-800">{field.label}{field.required ? " *" : ""}</span>
              <input className="field w-full" name={field.name} type={field.type ?? "text"} defaultValue={field.value} required={field.required} maxLength={300} autoComplete="off" />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 border-t pt-5">
          <button type="submit" className="rounded-lg bg-exodus-navy px-6 py-3 font-black text-white">Save Business Profile</button>
          <Link className="rounded-lg border px-6 py-3 font-bold text-slate-700" href={`/admin/clients/${clientId}?tab=profile`}>Cancel</Link>
        </div>
      </form>
    </main>
  );
}
