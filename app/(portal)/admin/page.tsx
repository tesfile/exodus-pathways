import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole(["admin"]);
  redirect("/admin/payroll");
}
