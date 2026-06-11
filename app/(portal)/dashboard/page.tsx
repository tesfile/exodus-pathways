import { redirect } from "next/navigation";
import { requireRole } from "@/lib/supabase/server";

export default async function DashboardAliasPage() {
  await requireRole(["client"]);
  redirect("/portal");
}
