import { Building2, UserRound } from "lucide-react";
import { ServicePreferencesForm } from "@/components/portal/guided-onboarding";
import { ProfileActions } from "@/components/portal/profile-actions";
import { getClientServiceProfile } from "@/lib/onboarding";
import { getCurrentUserRecord } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await getCurrentUserRecord();
  const serviceProfile = await getClientServiceProfile(user.id);

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Client profile</p>
        <h1 className="mt-2 text-3xl font-black text-exodus-navy">Profile</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-exodus-slate">
          Keep personal, company, contact, and service information current so Exodus Pathways can
          prepare accurate document requests and filings.
        </p>
      </div>

      <form className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
            <h2 className="text-lg font-black text-exodus-navy">Personal details</h2>
          </div>
          <div className="mt-5 grid gap-4">
            <div>
              <label htmlFor="full-name" className="label">
                Full name
              </label>
              <input id="full-name" className="field mt-2" defaultValue={user.full_name} />
            </div>
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input id="email" className="field mt-2" defaultValue={user.email} />
            </div>
            <div>
              <label htmlFor="phone" className="label">
                Phone
              </label>
              <input id="phone" className="field mt-2" placeholder="+1 (000) 000-0000" />
            </div>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-exodus-gold" aria-hidden="true" />
            <h2 className="text-lg font-black text-exodus-navy">Company details</h2>
          </div>
          <div className="mt-5 grid gap-4">
            <div>
              <label htmlFor="company" className="label">
                Company name
              </label>
              <input id="company" className="field mt-2" placeholder="Company legal name" />
            </div>
            <div>
              <label htmlFor="business-number" className="label">
                CRA business number
              </label>
              <input id="business-number" className="field mt-2" placeholder="Optional" />
            </div>
            <div>
              <label htmlFor="services" className="label">
                Services
              </label>
              <input id="services" className="field mt-2" placeholder="Bookkeeping, payroll, tax, immigration" />
            </div>
          </div>
        </section>

        <ProfileActions />
      </form>
      <ServicePreferencesForm userId={user.id} profile={serviceProfile} mode="profile" />
    </div>
  );
}
