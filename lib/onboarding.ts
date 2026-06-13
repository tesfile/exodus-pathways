import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  emptyClientServiceProfile,
  type ClientServiceProfile
} from "@/lib/onboarding-rules";

type ClientProfileRow = ClientServiceProfile & {
  user_id: string;
};

type UserRegistrationRow = {
  id: string;
  email: string;
  full_name: string;
  display_name: string | null;
  client_type: "individual" | "business" | null;
  phone: string | null;
  sin_number: string | null;
};

type CompanyRegistrationRow = {
  legal_name: string;
  trade_name: string | null;
  business_number: string | null;
  corporation_number: string | null;
  contact_person: string | null;
  address: string | null;
};

export async function getClientServiceProfile(userId: string): Promise<ClientServiceProfile> {
  const supabase = await createServerSupabaseClient();
  const [{ data }, { data: userData }, { data: companyData }] = await Promise.all([
    supabase
      .from("client_profiles")
      .select("user_id,onboarding_completed,service_selection,immigration_service,tax_accounting_type,self_employed_type,address,sin_number")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("users")
      .select("id,email,full_name,display_name,client_type,phone,sin_number")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("companies")
      .select("legal_name,trade_name,business_number,corporation_number,contact_person,address")
      .eq("client_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
  ]);

  const row = data as ClientProfileRow | null;
  const user = userData as UserRegistrationRow | null;
  const company = companyData as CompanyRegistrationRow | null;
  const empty = emptyClientServiceProfile();

  return {
    ...empty,
    onboarding_completed: row?.onboarding_completed ?? false,
    client_type: user?.client_type ?? "individual",
    display_name: user?.display_name ?? user?.full_name ?? null,
    full_name: user?.full_name ?? null,
    email: user?.email ?? null,
    phone: user?.phone ?? null,
    sin_number: row?.sin_number ?? user?.sin_number ?? null,
    address: row?.address ?? null,
    legal_business_name: company?.legal_name ?? null,
    operating_name: company?.trade_name ?? null,
    business_number: company?.business_number ?? null,
    corporation_number: company?.corporation_number ?? null,
    contact_person: company?.contact_person ?? null,
    business_address: company?.address ?? null,
    service_selection: row?.service_selection ?? null,
    immigration_service: row?.immigration_service ?? null,
    tax_accounting_type: row?.tax_accounting_type ?? null,
    self_employed_type: row?.self_employed_type ?? null
  };
}
