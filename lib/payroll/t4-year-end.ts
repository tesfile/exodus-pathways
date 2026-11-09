/**
 * T4 annual payroll rollup. This is a calculation utility, NOT a CRA filing file.
 * Call with records for ONE employer, ONE employee, ONE calendar tax year.
 * Amounts must come from verified T4 employee payroll records.
 */
export type T4PayrollRecord = {
  t4_box14_employment_income?: number | string | null;
  t4_box16_cpp?: number | string | null;
  t4_box18_ei?: number | string | null;
  t4_box22_income_tax_deducted?: number | string | null;
  t4_box24_ei_insurable_earnings?: number | string | null;
  t4_box26_cpp_pensionable_earnings?: number | string | null;
};
const cents = (value: unknown) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) throw new Error("Invalid payroll amount in T4 records");
  return Math.round((number + Number.EPSILON) * 100);
};
export function summarizeT4Payroll(records: T4PayrollRecord[]) {
  const total = {
    box14: 0, box16: 0, box18: 0, box22: 0, box24: 0, box26: 0
  };
  for (const record of records) {
    total.box14 += cents(record.t4_box14_employment_income);
    total.box16 += cents(record.t4_box16_cpp);
    total.box18 += cents(record.t4_box18_ei);
    total.box22 += cents(record.t4_box22_income_tax_deducted);
    total.box24 += cents(record.t4_box24_ei_insurable_earnings);
    total.box26 += cents(record.t4_box26_cpp_pensionable_earnings);
  }
  return {
    box14: total.box14 / 100,
    box16: total.box16 / 100,
    box18: total.box18 / 100,
    box22: total.box22 / 100,
    box24: total.box24 / 100,
    box26: total.box26 / 100,
    payrollRecordCount: records.length
  };
}
