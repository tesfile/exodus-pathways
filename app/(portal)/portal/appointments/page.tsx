import { revalidatePath } from "next/cache";
import { CalendarPlus } from "lucide-react";
import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getAppointmentRows } from "@/lib/portal/records";
import { createServerSupabaseClient, requireRole } from "@/lib/supabase/server";

async function requestAppointmentAction(formData: FormData) {
  "use server";

  const user = await requireRole(["client"]);
  const appointmentType = String(formData.get("appointmentType") ?? "").trim();
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();

  if (!appointmentType || !preferredDate) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase.from("appointments").insert({
    client_id: user.id,
    appointment_type: appointmentType,
    appointment_at: `${preferredDate}T09:00:00`,
    status: "requested"
  });

  revalidatePath("/portal/appointments");
}

export default async function AppointmentsPage() {
  const rows = await getAppointmentRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Appointments"
        description="View upcoming consultations, bookkeeping reviews, tax planning calls, payroll check-ins, and immigration appointments."
      />
      <form action={requestAppointmentAction} className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor="appointment-type" className="label">
            Appointment type
          </label>
          <select id="appointment-type" name="appointmentType" className="field mt-2" defaultValue="Bookkeeping review" required>
            <option>Bookkeeping review</option>
            <option>Tax consultation</option>
            <option>Payroll review</option>
            <option>Immigration consultation</option>
            <option>Business services call</option>
          </select>
        </div>
        <div>
          <label htmlFor="preferred-date" className="label">
            Preferred date
          </label>
          <input id="preferred-date" name="preferredDate" type="date" className="field mt-2" required />
        </div>
        <button type="submit" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-exodus-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-exodus-blue">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Request
        </button>
      </form>
      <AccountingTable
        title="Appointments"
        columns={[
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
          { key: "type", label: "Type" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
