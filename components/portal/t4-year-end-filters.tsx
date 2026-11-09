"use client";

import { useRouter } from "next/navigation";

type Client = { id: string; full_name: string | null };
type Company = { id: string; legal_name: string; trade_name: string | null };

export function T4YearEndFilters({ clients, companies, clientId, companyId, year }: {
  clients: Client[]; companies: Company[]; clientId: string; companyId: string; year: number;
}) {
  const router = useRouter();
  const go = (client: string, company: string, taxYear: number) => {
    const params = new URLSearchParams({ year: String(taxYear) });
    if (client) params.set("clientId", client);
    if (company) params.set("companyId", company);
    router.push("/admin/t4-year-end?" + params.toString());
  };
  return <div className="grid gap-4 rounded-lg border bg-white p-5 md:grid-cols-3">
    <label className="grid gap-2 font-medium">1. Client
      <select className="w-full rounded border p-3 font-normal" value={clientId} onChange={e => go(e.target.value, "", year)}>
        <option value="">Select client</option>
        {clients.map(c => <option key={c.id} value={c.id}>{c.full_name || "Unnamed client"}</option>)}
      </select>
    </label>
    <label className="grid gap-2 font-medium">2. Employer company
      <select className="w-full rounded border p-3 font-normal" value={companyId} disabled={!clientId} onChange={e => go(clientId, e.target.value, year)}>
        <option value="">Select company</option>
        {companies.map(c => <option key={c.id} value={c.id}>{c.trade_name || c.legal_name}</option>)}
      </select>
    </label>
    <label className="grid gap-2 font-medium">3. Tax year
      <select className="w-full rounded border p-3 font-normal" value={year} onChange={e => go(clientId, companyId, Number(e.target.value))}>
        {[2026,2025,2024].map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </label>
  </div>;
}
