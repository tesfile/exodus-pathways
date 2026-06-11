import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getAppointmentRows } from "@/lib/portal/records";

export default async function EmployeeAppointmentsPage() {
  const rows = await getAppointmentRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader title="Appointments" description="Upcoming appointments for assigned clients." />
      <AccountingTable
        title="Appointments"
        columns={[
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
          { key: "client", label: "Client" },
          { key: "type", label: "Type" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
