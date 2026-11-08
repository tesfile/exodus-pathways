"use client";

import { useState } from "react";

type Totals = { gross: number; cpp: number; ei: number; tax: number; net: number; employerCpp: number; employerEi: number; remittance: number };
const money = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
export function PayrollEntryPreview({ classification }: { classification: string }) {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [error, setError] = useState("");
  const isEmployee = classification === "T4 Employee";
  function calculate(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest("form");
    if (!form) return;
    const data = new FormData(form);
    if (!isEmployee) return;
    const read = (name: string) => {
      const raw = String(data.get(name) ?? "").trim();
      if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw new Error("Enter a valid amount for " + name.replaceAll("_", " "));
      return Number(raw);
    };
    try {
      const gross = read("gross");
      const cpp = read("cpp");
      const ei = read("ei");
      const tax = read("income_tax");
      const employerCpp = read("employer_cpp");
      const employerEi = read("employer_ei");
      if (gross <= 0 || cpp + ei + tax > gross) throw new Error("Check gross pay and deductions");
      const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
      setTotals({ gross, cpp, ei, tax, employerCpp, employerEi, net: round(gross - cpp - ei - tax),
        remittance: round(cpp + ei + tax + employerCpp + employerEi) });
      setError("");
    } catch (e) {
      setTotals(null);
      setError(e instanceof Error ? e.message : "Invalid payroll amounts");
    }
  }
  if (!isEmployee) return null;
  return <div className="md:col-span-2 grid gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
    <div><h2 className="text-lg font-bold text-blue-950">Payroll calculation preview</h2>
      <p className="text-sm text-slate-700">Calculates net pay and remittance totals from the deductions you entered. It does not calculate CRA CPP, EI or income tax rates. Verify those amounts with CRA PDOC first.</p></div>
    <button type="button" onClick={calculate} className="rounded-lg bg-blue-800 px-5 py-3 font-bold text-white">Calculate net pay & remittance</button>
    {error && <p role="alert" className="font-semibold text-red-700">{error}</p>}
    {totals && <div className="grid gap-2 rounded-lg bg-white p-4 sm:grid-cols-2">
      <p>Gross pay: <strong>{money(totals.gross)}</strong></p>
      <p>Employee CPP: <strong>{money(totals.cpp)}</strong></p>
      <p>Employee EI: <strong>{money(totals.ei)}</strong></p>
      <p>Income tax: <strong>{money(totals.tax)}</strong></p>
      <p className="font-bold text-blue-900">Net pay: {money(totals.net)}</p>
      <p>Employer CPP: <strong>{money(totals.employerCpp)}</strong></p>
      <p>Employer EI: <strong>{money(totals.employerEi)}</strong></p>
      <p className="font-bold text-blue-900">CRA remittance total: {money(totals.remittance)}</p>
    </div>}
    <label className="flex items-start gap-3 text-sm text-slate-800"><input type="checkbox" name="deductions_verified" value="yes" required className="mt-1"/>I verified the employee and employer deductions against CRA PDOC and reviewed the payroll amounts.</label>
  </div>;
}
