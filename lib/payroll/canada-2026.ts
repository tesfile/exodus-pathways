/** 2026 CPP/CPP2/EI for standard Alberta payroll.
 * Annual caps are applied against contributions already deducted by this employer.
 * This module does NOT calculate federal/provincial income tax. See CRA T4127.
 * Special situations (partial-year CPP eligibility, special payments, exemptions,
 * employment changes, reduced employer EI rate) require separate handling.
 * Source: https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html
 */
export type PriorContributions = {
  cpp: number; cpp2: number; ei: number;
  pensionableEarnings: number;
};
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max));
export function calculateStandardCppEi2026(
  gross: number,
  frequency: string,
  prior: PriorContributions = { cpp: 0, cpp2: 0, ei: 0, pensionableEarnings: 0 }
) {
  const periods: Record<string, number> = { weekly: 52, biweekly: 26, "semi-monthly": 24, monthly: 12 };
  const p = periods[frequency];
  if (!p || !Number.isFinite(gross) || gross < 0 ||
      Object.values(prior).some(v => !Number.isFinite(v) || v < 0)) {
    throw new Error("Invalid payroll amount, frequency, or year-to-date values");
  }
  const ympe = 74600, yampe = 85000, mie = 68900;
  const maxCpp = round((ympe - 3500) * 0.0595);
  const maxCpp2 = round((yampe - ympe) * 0.04);
  const maxEi = round(mie * 0.0163);
  const cpp = round(clamp(round(Math.max(0, Math.min(gross, ympe - prior.pensionableEarnings) - 3500 / p) * 0.0595), maxCpp - prior.cpp));
  const eligibleCpp2 = Math.max(0, Math.min(prior.pensionableEarnings + gross, yampe) - Math.max(prior.pensionableEarnings, ympe));
  const cpp2 = round(clamp(round(eligibleCpp2 * 0.04), maxCpp2 - prior.cpp2));
  const ei = round(clamp(round(gross * 0.0163), maxEi - prior.ei));
  return { cpp, cpp2, ei, employerCpp: round(cpp + cpp2), employerEi: round(ei * 1.4) };
}
