/** 2026 Alberta standard CPP/EI calculation. Tax withholding is deliberately excluded.
 * Source: CRA T4127 (2026), tables 8.3, 8.6 and 8.7.
 * Assumes no CPP/EI exemptions, no special pay, no reduced EI employer rate,
 * and no prior YTD contributions. Do not use for final payroll without YTD.
 */
export function calculateStandardCppEi2026(gross: number, frequency: string) {
  if (!Number.isFinite(gross) || gross < 0) throw new Error("Invalid gross pay");
  const periods: Record<string, number> = { weekly: 52, biweekly: 26, "semi-monthly": 24, monthly: 12 };
  const count = periods[frequency];
  if (!count) throw new Error("Invalid pay frequency");
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const cpp = round(Math.max(0, Math.min(gross, 74600 / count) - 3500 / count) * 0.0595);
  const cpp2 = round(Math.max(0, Math.min(gross, 85000 / count) - 74600 / count) * 0.04);
  const ei = round(Math.min(gross, 68900 / count) * 0.0163);
  return { cpp, cpp2, ei, employerCpp: round(cpp + cpp2), employerEi: round(ei * 1.4) };
}
