import { ImmigrationCaseManager } from "@/components/portal/immigration-case-manager";
import { getImmigrationCaseCards, getImmigrationCaseRows } from "@/lib/portal/records";

export default async function EmployeeImmigrationPage() {
  const [cases, rows] = await Promise.all([getImmigrationCaseCards(), getImmigrationCaseRows()]);

  return <ImmigrationCaseManager mode="employee" cases={cases} rows={rows} />;
}
