import { ClientDocumentWorkspace } from "@/components/portal/client-document-workspace";
import { getDocumentRowsForScope } from "@/lib/accounting/data";
import { createServerSupabaseClient, getCurrentUserRecord } from "@/lib/supabase/server";

export default async function DocumentsPage() {
  const user = await getCurrentUserRecord();
  const [rows, supabase] = await Promise.all([
    getDocumentRowsForScope(user.id),
    createServerSupabaseClient()
  ]);
  const { data: companyRows } = await supabase
    .from("companies")
    .select("id,legal_name,trade_name")
    .eq("client_id", user.id)
    .order("legal_name");
  const companies = (companyRows ?? []).map((company) => ({
    id: String(company.id),
    name: String(company.trade_name || company.legal_name)
  }));

  return <ClientDocumentWorkspace companies={companies} taxYear={new Date().getFullYear()} rows={rows} />;
}
