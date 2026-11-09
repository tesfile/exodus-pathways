import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import { summarizeT4Payroll, type T4PayrollRecord } from "@/lib/payroll/t4-year-end";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ clientId?: string; companyId?: string; year?: string }> };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const money = (value: number) => value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export default async function T4YearEndPage({ searchParams }: Props) {
  await requireRole(["admin"]);
  const { clientId, companyId, year: requestedYear } = await searchParams;
  const year = Number(requestedYear ?? "2026");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("Invalid tax year");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing server database configuration");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: clients, error: clientsError } = await db.from("users").select("id,full_name").eq("role", "client").order("full_name");
  if (clientsError) throw new Error("Unable to load clients");
  const selectedClient = clientId && uuid.test(clientId) && clients?.some(c => c.id === clientId) ? clientId : "";
  const { data: companies, error: companiesError } = selectedClient
    ? await db.from("companies").select("id,legal_name,trade_name").eq("client_id", selectedClient).order("legal_name")
    : { data: [], error: null };
  if (companiesError) throw new Error("Unable to load employer companies");
  const selectedCompany = companyId && uuid.test(companyId) && companies?.some(c => c.id === companyId) ? companyId : "";
  let entries: Array<T4PayrollRecord & { worker_id: string }> = [];
  let workers: Array<{ id: string; worker_name: string }> = [];
  if (selectedClient && selectedCompany) {
    const [paymentsResult, workersResult] = await Promise.all([
      db.from("worker_payments")
        .select("worker_id,t4_box14_employment_income,t4_box16_cpp,t4_box18_ei,t4_box22_income_tax_deducted,t4_box24_ei_insurable_earnings,t4_box26_cpp_pensionable_earnings")
        .eq("client_id", selectedClient).eq("company_id", selectedCompany)
        .eq("admin_classification", "T4 Employee").eq("tax_year", year)
        .order("worker_id").range(0, 9999),
      db.from("workers").select("id,worker_name").eq("client_id", selectedClient).eq("company_id", selectedCompany)
    ]);
    if (paymentsResult.error || workersResult.error) throw new Error("Unable to load year-end payroll");
    entries = paymentsResult.data ?? [];
    workers = workersResult.data ?? [];
    if (entries.length === 10000) throw new Error("More than 10,000 payroll records: export requires pagination");
  }
  const byWorker = new Map<string, T4PayrollRecord[]>();
  for (const entry of entries) byWorker.set(entry.worker_id, [...(byWorker.get(entry.worker_id) ?? []), entry]);
  const summaries = [...byWorker].map(([id, records]) => ({
    id, name: workers.find(w => w.id === id)?.worker_name ?? "Employee record missing",
    ...summarizeT4Payroll(records)
  })).sort((a, b) => a.name.localeCompare(b.name));
  const totals = summarizeT4Payroll(entries);
  const link = (client: string, company: string) => "/admin/t4-year-end?clientId=" + encodeURIComponent(client) +
    "&companyId=" + encodeURIComponent(company) + "&year=" + year;

  return <main className="mx-auto max-w-6xl space-y-6 p-5">
    <Link href="/admin/workers-payroll-review" className="text-blue-800 underline">← Workers & Payroll</Link>
    <h1 className="text-3xl font-bold text-blue-950">T4 Year-End Review — {year}</h1>
    <p className="text-slate-700">Review annual T4 amounts by employer and employee. This is a draft review, not a CRA T4 slip, T4 Summary, or submitted return.</p>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2">Client
        <select className="rounded border p-3" value={selectedClient} onChange={undefined} disabled>
          <option value={selectedClient}>{clients?.find(c => c.id === selectedClient)?.full_name ?? "Select below"}</option>
        </select>
        <div className="flex flex-wrap gap-2 text-sm">{clients?.map(c => <Link key={c.id} href={link(c.id, "")} className="rounded border px-2 py-1 text-blue-800">{c.full_name}</Link>)}</div>
      </label>
      <div><p className="mb-2">Employer company</p><div className="flex flex-wrap gap-2 text-sm">{companies?.map(c => <Link key={c.id} href={link(selectedClient, c.id)} className={`rounded border px-3 py-2 ${c.id === selectedCompany ? "bg-blue-900 text-white" : "text-blue-800"}`}>{c.trade_name || c.legal_name}</Link>)}</div></div>
    </div>
    {selectedCompany ? <>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr>{["Employee","Pay records","Box 14 Gross","Box 16 CPP","Box 18 EI","Box 22 Tax","Box 24 Insurable","Box 26 Pensionable"].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>{summaries.map(s => <tr key={s.id} className="border-t"><td className="p-3">{s.name}</td><td className="p-3">{s.payrollRecordCount}</td>{[s.box14,s.box16,s.box18,s.box22,s.box24,s.box26].map((n,i) => <td key={i} className="p-3 tabular-nums">{money(n)}</td>)}</tr>)}
            <tr className="border-t-2 font-bold"><td className="p-3">Employer total</td><td className="p-3">{totals.payrollRecordCount}</td>{[totals.box14,totals.box16,totals.box18,totals.box22,totals.box24,totals.box26].map((n,i) => <td key={i} className="p-3 tabular-nums">{money(n)}</td>)}</tr>
          </tbody></table>
      </div>
      <p className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-900">Before T4 filing: reconcile all payroll records, CPP2, taxable benefits, pension adjustments, SINs, employer CRA payroll number and remittances. Do not file these totals without review. SIN collection and CRA XML filing are not implemented yet.</p>
    </> : <p>Select a client and employer company to review annual payroll totals.</p>}
  </main>;
}
