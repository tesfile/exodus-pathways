import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  emptyClientServiceProfile,
  type ClientServiceProfile
} from "@/lib/onboarding-rules";

type ClientProfileRow = ClientServiceProfile & {
  user_id: string;
};

export async function getClientServiceProfile(userId: string): Promise<ClientServiceProfile> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("client_profiles")
    .select("user_id,onboarding_completed,service_selection,immigration_service,tax_accounting_type,self_employed_type")
    .eq("user_id", userId)
    .maybeSingle();

  const row = data as ClientProfileRow | null;
  if (!row) {
    return emptyClientServiceProfile();
  }

  return {
    onboarding_completed: row.onboarding_completed,
    service_selection: row.service_selection,
    immigration_service: row.immigration_service,
    tax_accounting_type: row.tax_accounting_type,
    self_employed_type: row.self_employed_type
  };
}
