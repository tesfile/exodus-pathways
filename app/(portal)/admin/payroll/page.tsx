import { getClientOptions } from "@/lib/accounting/data";
import { requireRole } from "@/lib/supabase/server";
import { CompanyPayrollPicker } from "./company-payroll-picker";

export const dynamic = "force-dynamic";

export default async function AdminPayrollHomePage() {
  await requireRole(["admin"]);
  const clients = await getClientOptions();
  const companies = clients.map(client => ({
    id: client.id,
    companyName: client.companyName || client.name || "Payroll company",
    ownerName: client.name || "",
  }));
  return <CompanyPayrollPicker companies={companies} year={new Date().getFullYear()} />;
}
