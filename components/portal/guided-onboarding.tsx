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

export function ServicePreferencesForm({ userId, profile, mode }: ServicePreferencesProps) {
  const [serviceSelection, setServiceSelection] = useState(profile.service_selection ?? "");
  const [immigrationService, setImmigrationService] = useState(profile.immigration_service ?? "");
  const [taxType, setTaxType] = useState(profile.tax_accounting_type ?? "");
  const [selfEmployedType, setSelfEmployedType] = useState(profile.self_employed_type ?? "");
  const [status, setStatus] = useState("");

  const draftProfile: ClientServiceProfile = {
    onboarding_completed: true,
    service_selection: serviceSelection || null,
    immigration_service: immigrationService || null,
    tax_accounting_type: taxType || null,
    self_employed_type: selfEmployedType || null
  };
  const showImmigration = needsImmigration(draftProfile);
  const showTax = needsTaxAccounting(draftProfile);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
    const { error } = await supabase
      .from("client_profiles")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        service_selection: serviceSelection,
        immigration_service: showImmigration ? immigrationService : null,
        tax_accounting_type: showTax ? taxType : null,
        self_employed_type: taxType === "Self-Employed" ? selfEmployedType : null
      })
      .eq("user_id", userId);

    if (error) {
      setStatus(`Could not save services: ${error.message}`);
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
