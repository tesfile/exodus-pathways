import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import { saveEmployee } from "./actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ clientId?: string; year?: string; error?: string }> };

export default async function AddEmployeePage({ searchParams }: Props) {
  await requireRole(["admin"]);
  const { clientId, year, error } = await searchParams;
  if (!clientId || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(clientId)) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Supabase server configuration missing.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await db.from("users").select("id,full_name,role").eq("id", clientId).maybeSingle();
  const { data: companies, error: companiesError } = await db.from("companies").select("id,legal_name,trade_name").eq("client_id", clientId).order("legal_name");
  if (profileError || companiesError) throw new Error("Unable to load client companies.");
  if (!profile || profile.role !== "client") notFound();
  const back = `/admin/clients/${encodeURIComponent(clientId)}/payroll?section=employees&year=${encodeURIComponent(year ?? String(new Date().getFullYear()))}`;

  return (
    <main className="mx-auto grid max-w-6xl gap-6">
      <div>
        <Link href={back} className="font-semibold text-blue-800 hover:underline">← Payroll employees</Link>
        <h1 className="mt-4 text-3xl font-black text-slate-950">Add an employee</h1>
        <p className="mt-2 text-slate-600">QuickBooks-style employee setup for {profile.full_name}. Enter SIN and birthdate securely when creating an employee, then finish pay schedule details.</p>
      </div>
      {error ? <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">{
        error === "invalid_sin" ? "Check the nine-digit SIN. It did not pass validation. You may leave SIN blank until the employee provides it." :
        error === "invalid_birthdate" ? "Enter a valid employee birthdate that is not in the future." :
        error === "invalid_pay" ? "Check the hourly or salary amount. Enter a positive amount or leave it blank until pay setup." :
        error === "invalid_name" ? "Enter the employee's legal first and last names." :
        "Employee information could not be saved. Review the details and try again."
      }</p> : null}
        <form action={saveEmployee} autoComplete="off" className="grid gap-6">
          <input type="hidden" name="client_id" value={clientId}/>
          <input type="hidden" name="year" value={year ?? String(new Date().getFullYear())}/>
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 p-6">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 font-bold text-white">1</span>
              <div><h2 className="text-xl font-black text-slate-900">Personal information</h2><p className="text-sm text-slate-500">Legal name, birthdate, SIN and contact details</p></div>
            </div>
            <div className="grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
              {companies && companies.length > 0 ? <label className="grid gap-2 font-semibold md:col-span-2 lg:col-span-3">Employer company
                <select name="company_id" required defaultValue={companies[0].id} className="rounded-lg border border-slate-300 bg-white p-3">
                  {companies.map(c => <option key={c.id} value={c.id}>{c.trade_name || c.legal_name}</option>)}
                </select>
              </label> : <p className="text-sm text-slate-600 md:col-span-2 lg:col-span-3">A basic employer company record will be created if this client does not have one.</p>}
              <label className="grid gap-2 font-semibold">First name *<input name="first_name" required maxLength={80} className="rounded-lg border border-slate-300 p-3"/></label>
              <label className="grid gap-2 font-semibold">Middle name<input name="middle_name" maxLength={80} className="rounded-lg border border-slate-300 p-3"/></label>
              <label className="grid gap-2 font-semibold">Last name *<input name="last_name" required maxLength={80} className="rounded-lg border border-slate-300 p-3"/></label>
              <label className="grid gap-2 font-semibold">Birthdate *<input name="birth_date" type="date" required max={new Date().toISOString().slice(0, 10)} className="rounded-lg border border-slate-300 p-3"/><span className="text-xs font-normal text-slate-500">Required for accurate payroll and CPP eligibility.</span></label>
              <label className="grid gap-2 font-semibold lg:col-span-2">Social Insurance Number (SIN)
                <input name="sin" type="password" inputMode="numeric" autoComplete="off" maxLength={20} placeholder="Nine-digit SIN" className="rounded-lg border border-slate-300 p-3"/>
                <span className="text-xs font-normal leading-5 text-slate-600">Securely encrypted on the server; only the last four digits appear later. If not yet available, leave blank and enter after hiring. For SINs beginning with 9, verify work authorization and expiry.</span>
              </label>
              <label className="grid gap-2 font-semibold">Email<input name="email" type="email" maxLength={254} className="rounded-lg border border-slate-300 p-3"/></label>
              <label className="grid gap-2 font-semibold">Phone<input name="phone" type="tel" maxLength={50} className="rounded-lg border border-slate-300 p-3"/></label>
              <label className="grid gap-2 font-semibold md:col-span-2 lg:col-span-3">Home address<textarea name="address" rows={2} maxLength={500} className="rounded-lg border border-slate-300 p-3"/></label>
            </div>
          </section>
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 p-6">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 font-bold text-white">2</span>
              <div><h2 className="text-xl font-black text-slate-900">Employment details</h2><p className="text-sm text-slate-500">Start date and job information</p></div>
            </div>
            <div className="grid gap-5 p-6 md:grid-cols-2">
              <label className="grid gap-2 font-semibold">Hire date<input name="hire_date" type="date" className="rounded-lg border border-slate-300 p-3"/></label>
              <label className="grid gap-2 font-semibold">Contract end date (optional)<input name="contract_end_date" type="date" className="rounded-lg border border-slate-300 p-3"/><span className="text-xs font-normal text-slate-500">Recurring payroll drafts stop after this employee's contract ends.</span></label>
              <label className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 text-sm font-semibold md:col-span-2"><input name="auto_include" type="checkbox" defaultChecked className="mt-1 h-5 w-5 accent-emerald-700"/><span>Include in recurring payroll drafts <span className="mt-1 block text-xs font-normal text-slate-600">Pay runs are automatically prepared according to the company's schedule, but no money is issued until reviewed.</span></span></label>
              <label className="grid gap-2 font-semibold">Employment status<select name="employment_status" defaultValue="Active" className="rounded-lg border border-slate-300 p-3">
                <option value="Active">Active</option><option value="Not on payroll">Not on payroll yet</option><option value="Paid leave of absence">Paid leave of absence</option><option value="Unpaid leave of absence">Unpaid leave of absence</option>
              </select></label>
              <label className="grid gap-2 font-semibold">Work location<input name="work_location" maxLength={200} className="rounded-lg border border-slate-300 p-3"/></label>
              <label className="grid gap-2 font-semibold">Department<input name="department" maxLength={200} className="rounded-lg border border-slate-300 p-3"/></label>
              <label className="grid gap-2 font-semibold">Manager<input name="manager_name" maxLength={200} className="rounded-lg border border-slate-300 p-3"/></label>
            </div>
          </section>
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 p-6">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 font-bold text-white">3</span>
              <div><h2 className="text-xl font-black text-slate-900">Pay setup</h2><p className="text-sm text-slate-500">You can finish the schedule after saving</p></div>
            </div>
            <div className="grid gap-5 p-6 md:grid-cols-2">
              <label className="grid gap-2 font-semibold">Pay type<select name="pay_type" defaultValue="hourly" className="rounded-lg border border-slate-300 p-3"><option value="hourly">Hourly</option><option value="salary">Salary</option></select></label>
              <label className="grid gap-2 font-semibold">Pay frequency<select name="pay_frequency" defaultValue="biweekly" className="rounded-lg border border-slate-300 p-3"><option value="weekly">Every week</option><option value="biweekly">Every other week</option><option value="semimonthly">Twice a month</option><option value="monthly">Every month</option></select></label>
              <label className="grid gap-2 font-semibold">Hourly rate ($)<input name="hourly_rate" type="number" min="0" max="100000" step="0.01" placeholder="Optional until pay setup" className="rounded-lg border border-slate-300 p-3"/></label>
              <label className="grid gap-2 font-semibold">Salary per pay period ($)<input name="salary_amount" type="number" min="0" max="10000000" step="0.01" placeholder="Optional until pay setup" className="rounded-lg border border-slate-300 p-3"/></label>
              <p className="text-xs leading-5 text-slate-600 md:col-span-2">Save the employee first, then set the next pay date and pay-period end in their profile. Creating an employee does not send money or file with CRA.</p>
            </div>
          </section>
          <div className="flex flex-wrap items-center gap-3"><button type="submit" className="rounded-lg bg-emerald-700 px-7 py-3 font-black text-white hover:bg-emerald-800">Save employee &amp; continue</button><Link href={back} className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800">Cancel</Link></div>
        </form>
    </main>
  );
}
