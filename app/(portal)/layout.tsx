import { PortalShell } from "@/components/portal/portal-shell";
import { getCurrentUserRecord } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserRecord();
  return <PortalShell user={user}>{children}</PortalShell>;
}
