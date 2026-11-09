/**
 * Standard periodic Alberta employee payroll, 2026 (CRA T4127 Option 1).
 * Restricted: regular wages only, full-year CPP eligibility, no bonus, commission,
 * taxable benefits, special deductions, extra withholding, or transfer from Quebec.
 * This is a calculation preview; reconcile against CRA PDOC before finalizing.
 * https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html
 */
import { calculateStandardCppEi2026, type PriorContributions } from "./canada-2026";
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const brackets = (income: number, limits: number[], rates: number[], constants: number[]) => {
  let i = limits.length - 1;
  while (i > 0 && income < limits[i]) i--;
  return income * rates[i] - constants[i];
};
export function calculateAlbertaRegularPayroll2026(
  gross: number, frequency: string, prior: PriorContributions,
  federalTd1 = 16452, albertaTd1 = 22769
) {
  const periods: Record<string, number> = { weekly: 52, biweekly: 26, "semi-monthly": 24, monthly: 12 };
  const p = periods[frequency];
  if (!p || !Number.isFinite(gross) || gross <= 0 ||
      ![federalTd1, albertaTd1].every(v => Number.isFinite(v) && v >= 0)) {
    throw new Error("Invalid payroll inputs");
  }
  const contributions = calculateStandardCppEi2026(gross, frequency, prior);
  const { cpp, cpp2, ei } = contributions;
  // Additional CPP (1% of pensionable pay) and CPP2 reduce taxable income.
  const cppAdditional = round(cpp * (0.01 / 0.0595));
  const annualTaxable = Math.max(0, p * (gross - cppAdditional - cpp2));
  const baseCppAnnual = Math.min(3519.45, p * cpp * (0.0495 / 0.0595));
  const eiAnnual = Math.min(1123.07, p * ei);
  const federalCredit = 0.14 * (federalTd1 + baseCppAnnual + eiAnnual + Math.min(1501, p * gross));
  const albertaBaseCredit = 0.08 * (albertaTd1 + baseCppAnnual + eiAnnual);
  const albertaSupplement = Math.max(0, (albertaBaseCredit - 4896) * 0.25);
  const federalAnnual = Math.max(0, brackets(annualTaxable,
    [0, 58523, 117045, 181440, 258482],
    [0.14, 0.205, 0.26, 0.29, 0.33],
    [0, 3804, 10241, 15685, 26024]) - federalCredit);
  const albertaAnnual = Math.max(0, brackets(annualTaxable,
    [0, 61200, 154259, 185111, 246813, 370220],
    [0.08, 0.10, 0.12, 0.13, 0.14, 0.15],
    [0, 1224, 4309, 6160, 8628, 12331]) - albertaBaseCredit - albertaSupplement);
  const federalTax = round(federalAnnual / p);
  const albertaTax = round(albertaAnnual / p);
  const incomeTax = round(federalTax + albertaTax);
  return { ...contributions, federalTax, albertaTax, incomeTax,
    gross, net: round(gross - cpp - cpp2 - ei - incomeTax),
    remittance: round(cpp + cpp2 + ei + incomeTax + contributions.employerCpp + contributions.employerEi) };
}
