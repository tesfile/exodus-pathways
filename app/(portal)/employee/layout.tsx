import { requireRole } from "@/lib/supabase/server";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["employee"]);

  return children;
}
