export type ClientServiceProfile = {
  onboarding_completed: boolean;
  client_type: "individual" | "business";
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  sin_number: string | null;
  address: string | null;
  legal_business_name: string | null;
  operating_name: string | null;
  business_number: string | null;
  corporation_number: string | null;
  contact_person: string | null;
  business_address: string | null;
  service_selection: string | null;
  immigration_service: string | null;
  tax_accounting_type: string | null;
  self_employed_type: string | null;
};

export const serviceNeedOptions = [
  "Immigration",
  "Tax & Accounting",
  "Immigration + Tax & Accounting"
];

export const immigrationServiceOptions = [
  "Refugee Sponsorship",
  "Family Sponsorship",
  "Visitor Visa",
  "Study Permit",
  "Work Permit",
  "Express Entry",
  "Citizenship",
  "Other"
];

export const taxAccountingTypeOptions = [
  "Personal Tax (T4 Employee)",
  "Self-Employed",
  "Corporation",
  "GST Only",
  "Bookkeeping & Payroll"
];

export const selfEmployedSubtypeOptions = [
  "Uber",
  "Uber Eats",
  "DoorDash",
  "Construction",
  "Trucking",
  "Other"
];

export function emptyClientServiceProfile(): ClientServiceProfile {
  return {
    onboarding_completed: false,
    client_type: "individual",
    display_name: null,
    full_name: null,
    email: null,
    phone: null,
    sin_number: null,
    address: null,
    legal_business_name: null,
    operating_name: null,
    business_number: null,
    corporation_number: null,
    contact_person: null,
    business_address: null,
    service_selection: null,
    immigration_service: null,
    tax_accounting_type: null,
    self_employed_type: null
  };
}

export function needsImmigration(profile: ClientServiceProfile | null | undefined) {
  return Boolean(profile?.service_selection?.includes("Immigration"));
}

export function needsTaxAccounting(profile: ClientServiceProfile | null | undefined) {
  return Boolean(profile?.service_selection?.includes("Tax & Accounting"));
}

export function isSelfEmployedClient(profile: ClientServiceProfile | null | undefined) {
  return profile?.tax_accounting_type === "Self-Employed";
}

export function filterClientPortalItems<T extends { href: string }>(
  items: T[],
  _profile: ClientServiceProfile | null | undefined
) {
  void _profile;
  return items;
}

export function serviceSummary(profile: ClientServiceProfile | null | undefined) {
  if (!profile?.onboarding_completed) {
    return "Not selected yet";
  }

  const parts: string[] = [];
  if (needsImmigration(profile)) {
    parts.push(`Immigration: ${profile.immigration_service ?? "Not selected"}`);
  }
  if (needsTaxAccounting(profile)) {
    const tax = profile.tax_accounting_type === "Self-Employed" && profile.self_employed_type
      ? `Self-Employed (${profile.self_employed_type})`
      : profile.tax_accounting_type ?? "Not selected";
    parts.push(`Tax: ${tax}`);
  }
  return parts.join(" | ");
}
