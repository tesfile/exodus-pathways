"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Save } from "lucide-react";
import {
  immigrationServiceOptions,
  needsImmigration,
  needsTaxAccounting,
  selfEmployedSubtypeOptions,
  serviceNeedOptions,
  serviceSummary,
  taxAccountingTypeOptions,
  type ClientServiceProfile
} from "@/lib/onboarding-rules";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type ServicePreferencesProps = {
  userId: string;
  profile: ClientServiceProfile;
  mode: "onboarding" | "profile";
};

export function GuidedOnboarding(props: Omit<ServicePreferencesProps, "mode">) {
  return <ServicePreferencesForm {...props} mode="onboarding" />;
}

export function ServicePreferencesForm({ profile, mode }: ServicePreferencesProps) {
  const [clientType, setClientType] = useState<"individual" | "business">(profile.client_type ?? "individual");
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [sinNumber, setSinNumber] = useState(profile.sin_number ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [legalBusinessName, setLegalBusinessName] = useState(profile.legal_business_name ?? "");
  const [operatingName, setOperatingName] = useState(profile.operating_name ?? "");
  const [businessNumber, setBusinessNumber] = useState(profile.business_number ?? "");
  const [corporationNumber, setCorporationNumber] = useState(profile.corporation_number ?? "");
  const [contactPerson, setContactPerson] = useState(profile.contact_person ?? profile.full_name ?? "");
  const [businessAddress, setBusinessAddress] = useState(profile.business_address ?? "");
  const [serviceSelection, setServiceSelection] = useState(profile.service_selection ?? "");
  const [immigrationService, setImmigrationService] = useState(profile.immigration_service ?? "");
  const [taxType, setTaxType] = useState(profile.tax_accounting_type ?? "");
  const [selfEmployedType, setSelfEmployedType] = useState(profile.self_employed_type ?? "");
  const [status, setStatus] = useState("");

  const draftProfile: ClientServiceProfile = {
    ...profile,
    onboarding_completed: true,
    client_type: clientType,
    display_name: clientType === "business" ? legalBusinessName : fullName,
    full_name: clientType === "business" ? contactPerson : fullName,
    email: profile.email,
    phone,
    sin_number: clientType === "individual" ? sinNumber : null,
    address: clientType === "individual" ? address : null,
    legal_business_name: clientType === "business" ? legalBusinessName : null,
    operating_name: clientType === "business" ? operatingName : null,
    business_number: clientType === "business" ? businessNumber : null,
    corporation_number: clientType === "business" ? corporationNumber : null,
    contact_person: clientType === "business" ? contactPerson : null,
    business_address: clientType === "business" ? businessAddress : null,
    service_selection: serviceSelection || null,
    immigration_service: immigrationService || null,
    tax_accounting_type: taxType || null,
    self_employed_type: selfEmployedType || null
  };
  const showImmigration = needsImmigration(draftProfile);
  const showTax = needsTaxAccounting(draftProfile);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (clientType === "individual" && (!fullName || !phone || !address)) {
      setStatus("Enter your full name, phone, and address.");
      return;
    }

    if (clientType === "business" && (!legalBusinessName || !contactPerson || !phone || !businessAddress)) {
      setStatus("Enter the legal business name, contact person, phone, and business address.");
      return;
    }

    if (!serviceSelection) {
      setStatus("Choose what you need help with.");
      return;
    }

    if (showImmigration && !immigrationService) {
      setStatus("Choose an immigration service.");
      return;
    }

    if (showTax && !taxType) {
      setStatus("Choose a tax or accounting type.");
      return;
    }

    if (taxType === "Self-Employed" && !selfEmployedType) {
      setStatus("Choose the self-employed work type.");
      return;
    }

    setStatus("Saving...");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.rpc("save_client_registration_profile", {
      p_client_type: clientType,
      p_full_name: fullName,
      p_sin_number: sinNumber,
      p_phone: phone,
      p_address: address,
      p_legal_business_name: legalBusinessName,
      p_operating_name: operatingName,
      p_business_number: businessNumber,
      p_corporation_number: corporationNumber,
      p_contact_person: contactPerson,
      p_business_address: businessAddress,
      p_service_selection: serviceSelection,
      p_immigration_service: showImmigration ? immigrationService : null,
      p_tax_accounting_type: showTax ? taxType : null,
      p_self_employed_type: taxType === "Self-Employed" ? selfEmployedType : null,
      p_onboarding_completed: true
    });

    if (error) {
      setStatus(`Could not save profile: ${error.message}`);
      return;
    }

    setStatus("Saved.");
    window.location.href = mode === "profile" ? "/portal/profile" : "/portal";
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      {mode === "onboarding" ? (
        <div>
          <p className="eyebrow">First login</p>
          <h1 className="mt-2 text-3xl font-black text-exodus-navy">Welcome to Exodus Pathways</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-exodus-slate">
            What do you need help with? Choose the service that fits you today. You can change this later from Profile.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
            <h2 className="text-xl font-black text-exodus-navy">Service preferences</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-exodus-slate">Current selection: {serviceSummary(profile)}</p>
        </div>
      )}

      <section className="grid gap-3">
        <h2 className="text-lg font-black text-exodus-navy">Are you registering as:</h2>
        <OptionGrid options={["Individual", "Business / Corporation"]} value={clientType === "business" ? "Business / Corporation" : "Individual"} onChange={(value) => setClientType(value === "Business / Corporation" ? "business" : "individual")} />
      </section>

      {clientType === "individual" ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-black text-exodus-navy">Individual profile</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Full Name" value={fullName} onChange={setFullName} />
            <TextField label="SIN optional" value={sinNumber} onChange={setSinNumber} required={false} />
            <TextField label="Phone" value={phone} onChange={setPhone} />
            <TextField label="Email" value={profile.email ?? ""} onChange={() => undefined} disabled />
            <TextField label="Address" value={address} onChange={setAddress} className="md:col-span-2" />
          </div>
        </section>
      ) : (
        <section className="grid gap-3">
          <h2 className="text-lg font-black text-exodus-navy">Business / Corporation profile</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Legal Business Name" value={legalBusinessName} onChange={setLegalBusinessName} />
            <TextField label="Operating Name optional" value={operatingName} onChange={setOperatingName} required={false} />
            <TextField label="Business Number BN optional" value={businessNumber} onChange={setBusinessNumber} required={false} />
            <TextField label="Corporation Number optional" value={corporationNumber} onChange={setCorporationNumber} required={false} />
            <TextField label="Contact Person" value={contactPerson} onChange={setContactPerson} />
            <TextField label="Phone" value={phone} onChange={setPhone} />
            <TextField label="Email" value={profile.email ?? ""} onChange={() => undefined} disabled />
            <TextField label="Business Address" value={businessAddress} onChange={setBusinessAddress} className="md:col-span-2" />
          </div>
        </section>
      )}

      <section className="grid gap-3">
        <h2 className="text-lg font-black text-exodus-navy">What do you need help with?</h2>
        <OptionGrid options={serviceNeedOptions} value={serviceSelection} onChange={setServiceSelection} />
      </section>

      {showImmigration ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-black text-exodus-navy">What immigration service do you need?</h2>
          <OptionGrid options={immigrationServiceOptions} value={immigrationService} onChange={setImmigrationService} />
        </section>
      ) : null}

      {showTax ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-black text-exodus-navy">What type of taxpayer are you?</h2>
          <OptionGrid options={taxAccountingTypeOptions} value={taxType} onChange={setTaxType} />
        </section>
      ) : null}

      {taxType === "Self-Employed" ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-black text-exodus-navy">What type of self-employed work?</h2>
          <OptionGrid options={selfEmployedSubtypeOptions} value={selfEmployedType} onChange={setSelfEmployedType} />
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-exodus-navy px-5 text-sm font-black text-white transition hover:bg-exodus-blue">
          {mode === "profile" ? <Save className="h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          {mode === "profile" ? "Save Service Preferences" : "Continue"}
        </button>
        {status ? <p className="text-sm font-bold text-exodus-navy">{status}</p> : null}
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = true,
  disabled = false,
  className = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="label">{label}</span>
      <input
        className="field"
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function OptionGrid({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`focus-ring min-h-14 rounded-md border px-4 py-3 text-left text-sm font-black transition ${
              selected
                ? "border-exodus-gold bg-exodus-navy text-white shadow-sm"
                : "border-slate-200 bg-exodus-light text-exodus-navy hover:border-exodus-blue/40"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
