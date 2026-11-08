"use client";

import { useState } from "react";
import { PayrollEntryPreview } from "@/components/portal/payroll-entry-preview";
import { savePayrollEntry } from "@/app/(portal)/admin/workers-payroll-review/record/actions";
import { calculateStandardCppEi2026 } from "@/lib/payroll/canada-2026";

type Classification = "T4 Employee" | "T4A Contractor" | "T5018 Subcontractor";
export function RecordPayrollForm({ clientId, workerId, today, initialClassification }: {
  clientId: string; workerId: string; today: string; initialClassification: Classification;
}) {
  const [classification, setClassification] = useState<Classification>(initialClassification);
  const [gross, setGross] = useState("");
  const [frequency, setFrequency] = useState("biweekly");
  const [payDate, setPayDate] = useState(today);
  const [calculated, setCalculated] = useState(false);
  const [prior, setPrior] = useState({ cpp: "0", cpp2: "0", ei: "0", pensionableEarnings: "0" });
  const [hasPriorPayroll, setHasPriorPayroll] = useState(false);
  const priorReady = Object.values(prior).every(value => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0);
  const [cpp, setCpp] = useState("0");
  const [ei, setEi] = useState("0");
  const [employerCpp, setEmployerCpp] = useState("0");
  const [employerEi, setEmployerEi] = useState("0");
  const [tax, setTax] = useState("0");
  function autoCalculate(value: string, freq: string, date: string) {
    setCalculated(false);
    if (!value || Number(value) <= 0 || !date.startsWith("2026-") || !priorReady) return;
    const result = calculateStandardCppEi2026(Number(value), freq, {
      cpp: Number(prior.cpp), cpp2: Number(prior.cpp2), ei: Number(prior.ei), pensionableEarnings: Number(prior.pensionableEarnings)
    });
    setCpp((result.cpp + result.cpp2).toFixed(2));
    setEi(result.ei.toFixed(2));
    setEmployerCpp(result.employerCpp.toFixed(2));
    setEmployerEi(result.employerEi.toFixed(2));
    setCalculated(true);
  }
  const isEmployee = classification === "T4 Employee";
  const numberField = (name: string, label: string) => <label className="grid gap-1" key={name}>{label} ($)
    <input required name={name} type="number" min="0" step="0.01" defaultValue="0" className="rounded border p-3"/>
  </label>;
  return <form action={savePayrollEntry} className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
    <input type="hidden" name="client_id" value={clientId}/>
    <input type="hidden" name="worker_id" value={workerId}/>
    <label className="grid gap-1 md:col-span-2 font-semibold">Payment classification
      <select name="classification" value={classification} onChange={(e) => setClassification(e.target.value as Classification)} className="rounded border p-3">
        <option value="T4 Employee">T4 — Employee payroll</option>
        <option value="T4A Contractor">T4A — Contractor / other applicable fees</option>
        <option value="T5018 Subcontractor">T5018 — Construction subcontractor</option>
      </select>
    </label>
    <div className="md:col-span-2 rounded-lg bg-blue-50 p-4">
      <strong>{isEmployee ? "T4 Employee Payroll" : classification}</strong>
      <p className="mt-1 text-sm">{isEmployee ? "Enter gross pay and verify CRA deductions before saving. The preview calculates net pay and remittance from the amounts entered." : "Enter the contractor amount and GST, if applicable. No employee CPP, EI, or payroll tax is deducted here. Confirm the correct information-slip rules before filing."}</p>
    </div>
    <label className="grid gap-1">Pay date<input required name="payment_date" type="date" value={payDate} onChange={(e) => { setPayDate(e.target.value); autoCalculate(gross, frequency, e.target.value); }} className="rounded border p-3"/></label>
    <label className="grid gap-1">Pay frequency<select name="pay_frequency" value={frequency} onChange={(e) => { setFrequency(e.target.value); autoCalculate(gross, e.target.value, payDate); }} className="rounded border p-3"><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="semi-monthly">Semi-monthly</option><option value="monthly">Monthly</option></select></label>
    <label className="grid gap-1">Period start<input required name="pay_period_start" type="date" defaultValue={today} className="rounded border p-3"/></label>
    <label className="grid gap-1">Period end<input required name="pay_period_end" type="date" defaultValue={today} className="rounded border p-3"/></label>
    <label className="grid gap-1">{isEmployee ? "Gross pay" : "Amount before GST"} ($)
      <input required name="gross" type="number" min="0.01" step="0.01" value={gross} onChange={(e) => { setGross(e.target.value); autoCalculate(e.target.value, frequency, payDate); }} className="rounded border p-3"/>
    </label>
    {isEmployee ? <>
      <div className="md:col-span-2 grid gap-3 rounded border border-blue-200 p-4">
        <strong>Previous payroll this year</strong>
        <label className="flex items-center gap-2"><input type="checkbox" checked={hasPriorPayroll} onChange={e => { setHasPriorPayroll(e.target.checked); setPrior({ cpp: e.target.checked ? "" : "0", cpp2: e.target.checked ? "" : "0", ei: e.target.checked ? "" : "0", pensionableEarnings: e.target.checked ? "" : "0" }); setCalculated(false); }} />This employee has already received pay from this employer in 2026</label>
        <p className="text-sm">{hasPriorPayroll ? "Enter the actual opening year-to-date totals from earlier employer payroll records." : "First pay of 2026: opening year-to-date amounts are zero. No prior payroll amounts need to be entered."}</p>
        {hasPriorPayroll && ([["pensionableEarnings", "Pensionable earnings YTD"], ["cpp", "CPP deducted YTD"], ["cpp2", "CPP2 deducted YTD"], ["ei", "EI deducted YTD"]] as const).map(([key, label]) =>
          <label className="grid gap-1" key={key}>{label} ($)
            <input type="number" min="0" step="0.01" required value={prior[key]} onChange={e => { setPrior(previous => ({...previous, [key]: e.target.value})); setCalculated(false); }} className="rounded border p-3"/>
          </label>)}
        <button type="button" className="rounded bg-blue-800 p-3 font-semibold text-white" onClick={() => autoCalculate(gross, frequency, payDate)}>Recalculate CPP / EI with YTD</button>
      </div>
      <div className="md:col-span-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm">2026 CPP and EI are prefilled for a standard Alberta pay period using the year-to-date amounts entered above. Income tax is not yet calculated automatically. These are preliminary amounts and must be checked with CRA PDOC before saving.</div>
      {([["cpp", "Employee CPP / CPP2", cpp, setCpp], ["ei", "Employee EI", ei, setEi], ["income_tax", "Income tax withheld (CRA PDOC)", tax, setTax], ["employer_cpp", "Employer CPP / CPP2", employerCpp, setEmployerCpp], ["employer_ei", "Employer EI", employerEi, setEmployerEi]] as const).map(([name, label, value, setter]) =>
        <label className="grid gap-1" key={name}>{label} ($)<input required name={name} type="number" min="0" step="0.01" value={value} onChange={(e) => setter(e.target.value)} className="rounded border p-3"/></label>
      )}
      {calculated && <p className="md:col-span-2 text-sm font-semibold text-blue-800">CPP and EI prefilled from gross pay. Income tax still requires CRA verification.</p>}
    </> : numberField("gst", "GST paid")}
    {isEmployee ? <PayrollEntryPreview classification={classification}/> :
      <div className="md:col-span-2 rounded-lg border bg-slate-50 p-4">
        <strong>Contractor payment preview</strong>
        <p>Amount before GST: ${Number(gross || 0).toFixed(2)}</p>
        <p>GST entered will be added to the payment total on save.</p>
      </div>}
    <p className="md:col-span-2 text-sm text-amber-800">Draft entry only. Saving does not pay anyone, file slips, or remit funds to CRA. CRA tax calculations are not yet automated.</p>
    <button type="submit" className="rounded-lg bg-blue-900 px-6 py-3 font-bold text-white md:col-span-2">Save {isEmployee ? "Payroll Entry" : "Contractor Payment"}</button>
  </form>;
}
