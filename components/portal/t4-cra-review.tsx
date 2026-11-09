"use client";

type Entry = { gross: number; cpp: number; ei: number; tax: number; insurable: number; pensionable: number; net: number; payDate: string; ready: string };
const CRA_GUIDE = "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/completing-filing-information-returns/t4-information-employers/t4-slip.html";
const CRA_FORM = "https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t4.html";

export function T4CraReview({ workerName, year, entries, hasSin, hasAddress }: {
  workerName: string; year: number; entries: Entry[]; hasSin: boolean; hasAddress: boolean;
}) {
  const total = (field: keyof Pick<Entry, "gross" | "cpp" | "ei" | "tax" | "insurable" | "pensionable" | "net">) =>
    Math.round(entries.reduce((sum, entry) => sum + entry[field], 0) * 100) / 100;
  const issues: string[] = [];
  if (!entries.length) issues.push("No T4 payroll records exist for this employee.");
  if (!hasSin) issues.push("Employee SIN is missing. Add it in the employee record before finalizing.");
  if (!hasAddress) issues.push("Employee address is missing.");
  if (entries.some(e => !e.payDate || !e.payDate.startsWith(String(year)))) issues.push("At least one payment date is outside the selected calendar year.");
  if (entries.some(e => e.gross < 0 || e.cpp < 0 || e.ei < 0 || e.tax < 0)) issues.push("Negative payroll values require correction.");
  if (entries.some(e => e.gross > 0 && e.cpp === 0 && e.ei === 0 && e.tax === 0)) issues.push("A payroll record has positive earnings but zero CPP, EI and tax. Verify exemptions and source deductions.");
  if (entries.some(e => Math.abs(e.gross - e.cpp - e.ei - e.tax - e.net) > 0.05)) issues.push("At least one net-pay amount does not reconcile with gross pay and statutory deductions (other deductions/benefits may need review).");
  if (entries.some(e => e.ready !== "Ready")) issues.push("Not every payroll record is marked Ready after review.");
  issues.push("CPP2 (box 16A) is not separately tracked in the existing payroll data. Confirm and record CPP2 before filing.");
  issues.push("Employer CRA payroll account, province(s) of employment, dental benefits (box 45), and other applicable T4 boxes require confirmation.");
  return <section className="rounded-md border border-amber-300 bg-amber-50 p-5 text-sm">
    <h3 className="text-lg font-bold text-slate-900">CRA T4 checks — {year}</h3>
    <p className="mt-2">KAL compares {workerName}&apos;s saved payroll records with basic requirements from CRA&apos;s published T4 instructions. This is not a live CRA approval or submission.</p>
    <div className="mt-3 grid grid-cols-2 gap-2 text-slate-900">
      <span>Box 14: ${total("gross").toFixed(2)}</span><span>Box 16: ${total("cpp").toFixed(2)}</span>
      <span>Box 18: ${total("ei").toFixed(2)}</span><span>Box 22: ${total("tax").toFixed(2)}</span>
      <span>Box 24: ${total("insurable").toFixed(2)}</span><span>Box 26: ${total("pensionable").toFixed(2)}</span>
    </div>
    <p className="mt-4 font-bold text-red-800">Final T4 generation blocked: {issues.length} items to review</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>
    <div className="mt-4 flex flex-wrap gap-4">
      <a className="font-bold text-blue-800 underline" href={CRA_GUIDE} target="_blank" rel="noopener noreferrer">CRA T4 box instructions</a>
      <a className="font-bold text-blue-800 underline" href={CRA_FORM} target="_blank" rel="noopener noreferrer">CRA 2026 fillable T4 PDF</a>
    </div>
    <p className="mt-3 text-xs">Rule source: CRA T4 slip instructions, accessed November 2026. A live CRA API connection and CRA filing have not been established.</p>
  </section>;
}
