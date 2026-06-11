import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { getEmployeeRows } from "@/lib/portal/records";

export default async function EmployeesPage() {
  const rows = await getEmployeeRows();

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Employees"
        description="Manage employees, roles, and assigned client access. Employees only see assigned clients through Row Level Security."
      />
      <AccountingTable
        title="Employees"
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "assigned", label: "Assigned clients" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}
