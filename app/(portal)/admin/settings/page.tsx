import { ShieldCheck } from "lucide-react";

const settings = [
  "Supabase Auth enabled for secure email/password sessions",
  "Row Level Security separates admin, employee, and client access",
  "Storage buckets use client-id folder paths",
  "No credit card collection and no bank login credential collection",
  "Document responsibility disclaimer shown across public and portal surfaces"
];

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Admin settings</p>
        <h1 className="mt-2 text-3xl font-black text-exodus-navy">Settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-exodus-slate">
          Configure portal policies, document categories, service workflows, and security controls.
        </p>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
          <h2 className="text-lg font-black text-exodus-navy">Security baseline</h2>
        </div>
        <div className="mt-5 grid gap-3">
          {settings.map((setting) => (
            <label key={setting} className="flex items-start gap-3 rounded-md bg-exodus-light p-3 text-sm font-semibold text-exodus-navy">
              <input type="checkbox" checked readOnly className="mt-0.5 h-4 w-4 accent-exodus-gold" />
              <span>{setting}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
