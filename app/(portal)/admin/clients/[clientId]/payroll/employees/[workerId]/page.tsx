import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import { savePayrollEmployeeProfile } from "./actions";
import { PayScheduleEditor } from "./pay-schedule-editor";

export const dynamic = "force-dynamic";
type Props = {
  params: Promise<{ clientId: string; workerId: string }>;
  searchParams?: Promise<{ year?: string; saved?: string; error?: string }>;
};

const statuses = [
  "Active", "Paid leave of absence", "Unpaid leave of absence",
  "Terminated", "Not on payroll", "Deceased"
];
const uuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold text-slate-800">{label}{children}</label>;
}

export default async function EmployeePayrollProfilePage({ params, searchParams }: Props) {
  await requireRole(["admin"]);
  const { clientId, workerId } = await params;
  const query = await searchParams;
  const year = /^20\d{2}$/.test(query?.year ?? "") ? query!.year! : String(new Date().getFullYear());
  if (!uuid.test(clientId) || !uuid.test(workerId)) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Payroll server database configuration is missing.");
  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  const [{ data: worker, error: workerError }, { data: profile, error: profileError }] = await Promise.all([
    db.from("workers").select("id,client_id,worker_type,worker_name,address,phone,email,status")
      .eq("id", workerId).eq("client_id", clientId).maybeSingle(),
    db.from("kal_payroll_employee_profiles")
      .select("birth_date,hire_date,termination_date,employment_status,work_location,manager_name,department,schedule_name,pay_frequency,next_period_end,next_pay_date,default_schedule,sin_last4,pay_type,hourly_rate,salary_amount,default_hours_per_day,default_days_per_week,overtime_multiplier,vacation_percent")
      .eq("worker_id", workerId).eq("client_id", clientId).maybeSingle()
  ]);

  if (workerError || !worker || !/employee/i.test(worker.worker_type)) notFound();
  if (profileError) throw new Error("Employee payroll profiles are not set up in this database.");
  const back = `/admin/clients/${encodeURIComponent(clientId)}?year=${year}&tab=workers-payments`;

  return (
    <main className="mx-auto grid max-w-5xl gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={back} className="text-sm font-bold text-emerald-700 hover:underline">← Back to client Payroll</Link>
          <p className="mt-4 text-xs font-black uppercase tracking-widest text-amber-600">KAL Accounting &amp; Tax</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Employee payroll profile</h1>
          <p className="mt-2 text-sm text-slate-600">{worker.worker_name} · Secure admin-only employee settings</p>
        </div>
      </div>

      {query?.saved === "1" ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Employee profile and pay schedule saved.</p> : null}
      {query?.error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-900">Please check the employee details and dates. No changes were saved for the invalid fields.</p> : null}

      <form action={savePayrollEmployeeProfile} autoComplete="off" className="grid gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-6 md:grid-cols-2">
        <input type="hidden" name="client_id" value={clientId}/>
        <input type="hidden" name="worker_id" value={workerId}/>
        <input type="hidden" name="year" value={year}/>

        <div className="md:col-span-2"><h2 className="text-xl font-black text-slate-900">Personal information</h2><p className="mt-1 text-sm text-slate-600">Legal name, contact information and protected identifiers.</p></div>

        <Field label="Legal full name *"><input className={fieldClass} name="worker_name" required maxLength={200} defaultValue={worker.worker_name}/></Field>
        <Field label="Birthdate"><input className={fieldClass} name="birth_date" type="date" defaultValue={profile?.birth_date ?? ""}/></Field>
        <Field label="Email"><input className={fieldClass} name="email" type="email" maxLength={254} defaultValue={worker.email ?? ""}/></Field>
        <Field label="Phone"><input className={fieldClass} name="phone" type="tel" maxLength={50} defaultValue={worker.phone ?? ""}/></Field>
        <div className="md:col-span-2"><Field label="Home address"><textarea name="address" rows={2} maxLength={500} className={fieldClass} defaultValue={worker.address ?? ""}/></Field></div>

        <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Field label="Social Insurance Number (SIN)">
            <input className={fieldClass} name="sin" type="password" inputMode="numeric"
              maxLength={20} placeholder={profile?.sin_last4 ? `Stored securely ·••••${profile.sin_last4}` : "Enter a valid 9-digit SIN"} />
          </Field>
          <p className="mt-2 text-xs text-slate-700">Leave blank to keep the existing SIN. A new SIN is encrypted on the server and shown only as its last four digits here. It will not be copied into the general worker record.</p>
        </div>

        <div className="md:col-span-2 border-t border-slate-200 pt-5"><h2 className="text-xl font-black text-slate-900">Employment details</h2></div>
        <Field label="Employment status"><select className={fieldClass} name="employment_status" defaultValue={profile?.employment_status ?? (statuses.includes(worker.status) ? worker.status : "Active")}>
          {statuses.map(status => <option key={status} value={status}>{status}</option>)}
        </select></Field>
        <Field label="Hire date"><input className={fieldClass} type="date" name="hire_date" defaultValue={profile?.hire_date ?? ""}/></Field>
        <Field label="Termination date"><input className={fieldClass} type="date" name="termination_date" defaultValue={profile?.termination_date ?? ""}/></Field>
        <Field label="Work location"><input className={fieldClass} name="work_location" maxLength={200} defaultValue={profile?.work_location ?? ""}/></Field>
        <Field label="Department"><input className={fieldClass} name="department" maxLength={200} defaultValue={profile?.department ?? ""}/></Field>
        <Field label="Manager"><input className={fieldClass} name="manager_name" maxLength={200} defaultValue={profile?.manager_name ?? ""}/></Field>

        <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:col-span-2">
          <div><h2 className="text-xl font-black text-slate-900">Pay rate and standard hours</h2>
            <p className="mt-1 text-sm text-slate-600">Hourly employees default to 8 hours per day, 5 days per week. Set their hourly rate before running payroll.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pay type"><select name="pay_type" className={fieldClass} defaultValue={profile?.pay_type ?? "hourly"}>
              <option value="hourly">Hourly</option><option value="salary">Salary</option>
            </select></Field>
            <Field label="Hourly rate ($)"><input type="number" name="hourly_rate" min="0" max="100000" step="0.01" className={fieldClass} defaultValue={profile?.hourly_rate ?? ""} placeholder="Enter for hourly employees" /></Field>
            <Field label="Salary amount per pay period ($)"><input type="number" name="salary_amount" min="0" max="10000000" step="0.01" className={fieldClass} defaultValue={profile?.salary_amount ?? ""} placeholder="Enter for salary employees" /></Field>
            <Field label="Default hours each day"><input type="number" name="default_hours_per_day" min="0.25" max="24" step="0.25" required className={fieldClass} defaultValue={profile?.default_hours_per_day ?? 8} /></Field>
            <Field label="Default days each week"><input type="number" name="default_days_per_week" min="1" max="7" step="1" required className={fieldClass} defaultValue={profile?.default_days_per_week ?? 5} /></Field>
            <Field label="Overtime multiplier (reference only)"><input type="number" name="overtime_multiplier" min="1" max="4" step="0.25" required className={fieldClass} defaultValue={profile?.overtime_multiplier ?? 1.5} /></Field>
            <Field label="Vacation pay percent (reference only)"><input type="number" name="vacation_percent" min="0" max="30" step="0.01" required className={fieldClass} defaultValue={profile?.vacation_percent ?? 4} /></Field>
          </div>
          <p className="text-xs text-slate-500">The payroll run uses regular hours and rate as a draft. Overtime and vacation pay must be reviewed separately under applicable employment standards.</p>
        </section>

        <PayScheduleEditor
          scheduleName={profile?.schedule_name ?? "Regular payroll"}
          initialFrequency={profile?.pay_frequency ?? "biweekly"}
          initialPeriodEnd={profile?.next_period_end ?? ""}
          initialPayDate={profile?.next_pay_date ?? ""}
          initialDefault={profile?.default_schedule ?? false}
        />

        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button type="submit" className="min-h-12 rounded-lg bg-emerald-700 px-6 text-sm font-black text-white hover:bg-emerald-800">Save employee &amp; pay schedule</button>
          <Link href={back} className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
