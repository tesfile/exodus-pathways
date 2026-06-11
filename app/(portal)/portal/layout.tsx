import { requireRole } from "@/lib/supabase/server";

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["client"]);

  return children;
}
