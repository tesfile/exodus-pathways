"use client";

import { useState } from "react";
import { PayrollEntryPreview } from "@/components/portal/payroll-entry-preview";
import { savePayrollEntry } from "@/app/(portal)/admin/workers-payroll-review/record/actions";
import { calculateAlbertaRegularPayroll2026 } from "@/lib/payroll/alberta-regular-2026";

type Classification = "T4 Employee" | "T4A Contractor" | "T5018 Subcontractor";
export function RecordPayrollForm({ clientId, workerId, today, initialClassification, priorYtd, priorPaymentCount }: {
  clientId: string; workerId: string; today: string; initialClassification: Classification; priorYtd: { cpp: number; cpp2: number; ei: number; pensionableEarnings: number }; priorPaymentCount: number;
}) {
  const [classification, setClassification] = useState<Classification>(initialClassification);
  const [gross, setGross] = useState("");
  const [frequency, setFrequency] = useState("biweekly");
  const [payDate, setPayDate] = useState(today);
  const [calculated, setCalculated] = useState(false);
  const [prior, setPrior] = useState({ cpp: String(priorYtd.cpp), cpp2: String(priorYtd.cpp2), ei: String(priorYtd.ei), pensionableEarnings: String(priorYtd.pensionableEarnings) });
  const [hasPriorPayroll, setHasPriorPayroll] = useState(false);
  const priorReady = Object.values(prior).every(value => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0);
  const [cpp, setCpp] = useState("0");
  const [ei, setEi] = useState("0");
  const [employerCpp, setEmployerCpp] = useState("0");
  const [employerEi, setEmployerEi] = useState("0");
  const [tax, setTax] = useState("0");
  const [federalTd1, setFederalTd1] = useState("16452");
  const [albertaTd1, setAlbertaTd1] = useState("22769");
  function autoCalculate(value: string, freq: string, date: string) {
    setCalculated(false);
    if (!value || Number(value) <= 0 || !date.startsWith("2026-") || !priorReady) return;
    const result = calculateAlbertaRegularPayroll2026(Number(value), freq, {
      cpp: Number(prior.cpp), cpp2: Number(prior.cpp2), ei: Number(prior.ei), pensionableEarnings: Number(prior.pensionableEarnings)
    }, Number(federalTd1), Number(albertaTd1));
    setCpp((result.cpp + result.cpp2).toFixed(2));
    setEi(result.ei.toFixed(2));
    setTax(result.incomeTax.toFixed(2));
    setEmployerCpp(result.employerCpp.toFixed(2));
    setEmployerEi(result.employerEi.toFixed(2));
    setCalculated(true);
  }
  const isEmployee = classification === "T4 Employee";
  const [acknowledged, setAcknowledged] = useState(false);
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
        {priorPaymentCount > 0 && <p className="text-sm font-semibold text-blue-900">{priorPaymentCount} saved T4 payroll record(s) found for this employer in the current year. CPP, EI and pensionable earnings opening balances have been loaded from saved records. Historical CPP2 requires verification.</p>}
        <label className="flex items-center gap-2"><input type="checkbox" checked={hasPriorPayroll || priorPaymentCount > 0} disabled={priorPaymentCount > 0} onChange={e => { setHasPriorPayroll(e.target.checked); setPrior({ cpp: e.target.checked ? "" : "0", cpp2: e.target.checked ? "" : "0", ei: e.target.checked ? "" : "0", pensionableEarnings: e.target.checked ? "" : "0" }); setCalculated(false); }} />This employee has already received pay from this employer in 2026</label>
        <p className="text-sm">{hasPriorPayroll || priorPaymentCount > 0 ? "Review opening year-to-date totals from employer payroll records." : "First pay of 2026: opening year-to-date amounts are zero. No prior payroll amounts need to be entered."}</p>
        {(hasPriorPayroll || priorPaymentCount > 0) && ([["pensionableEarnings", "Pensionable earnings YTD"], ["cpp", "CPP deducted YTD"], ["cpp2", "CPP2 deducted YTD"], ["ei", "EI deducted YTD"]] as const).map(([key, label]) =>
          <label className="grid gap-1" key={key}>{label} ($)
            <input type="number" min="0" step="0.01" required value={prior[key]} onChange={e => { setPrior(previous => ({...previous, [key]: e.target.value})); setCalculated(false); }} className="rounded border p-3"/>
          </label>)}
        <button type="button" className="rounded bg-blue-800 p-3 font-semibold text-white" onClick={() => autoCalculate(gross, frequency, payDate)}>Recalculate CPP / EI with YTD</button>
      </div>
      <label className="grid gap-1">Federal TD1 total claim ($)<input type="number" min="0" step="0.01" value={federalTd1} onChange={e => {setFederalTd1(e.target.value);setCalculated(false);}} className="rounded border p-3" /></label>
      <label className="grid gap-1">Alberta TD1AB total claim ($)<input type="number" min="0" step="0.01" value={albertaTd1} onChange={e => {setAlbertaTd1(e.target.value);setCalculated(false);}} className="rounded border p-3" /></label>
      <label className="md:col-span-2 flex items-start gap-2 text-sm"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} required />I confirm this is standard Alberta regular wages, with no bonus, taxable benefits, CPP exemption, or special tax situation. I will compare deductions with CRA PDOC.</label>
      <div className="md:col-span-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm">2026 CPP and EI are prefilled for a standard Alberta pay period using the year-to-date amounts entered above. Income tax is estimated using CRA T4127 Option 1 for standard regular wages and the TD1 amounts above. Special payroll situations are not supported. Verify all deductions against CRA PDOC before saving. <a href="https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-businesses/payroll-deductions-online-calculator.html" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Open CRA Payroll Deductions Online Calculator (official)</a>.</div>
      {([["cpp", "Employee CPP / CPP2", cpp, setCpp], ["ei", "Employee EI", ei, setEi], ["income_tax", "Income tax withheld (CRA PDOC)", tax, setTax], ["employer_cpp", "Employer CPP / CPP2", employerCpp, setEmployerCpp], ["employer_ei", "Employer EI", employerEi, setEmployerEi]] as const).map(([name, label, value, setter]) =>
        <label className="grid gap-1" key={name}>{label} ($)<input required name={name} type="number" min="0" step="0.01" value={value} onChange={(e) => { setter(e.target.value); setCalculated(false); }} className="rounded border p-3"/></label>
      )}
      {!calculated && <p className="md:col-span-2 text-sm font-semibold text-red-800">Calculate or recalculate payroll before saving. Any change to TD1 or opening YTD requires recalculation.</p>}
      {calculated && <p className="md:col-span-2 text-sm font-semibold text-blue-800">CPP and EI prefilled from gross pay. Income tax was estimated from the TD1 amounts; verify with CRA PDOC.</p>}
    </> : numberField("gst", "GST paid")}
    {isEmployee ? <PayrollEntryPreview classification={classification}/> :
      <div className="md:col-span-2 rounded-lg border bg-slate-50 p-4">
        <strong>Contractor payment preview</strong>
        <p>Amount before GST: ${Number(gross || 0).toFixed(2)}</p>
        <p>GST entered will be added to the payment total on save.</p>
      </div>}
    <p className="md:col-span-2 text-sm text-amber-800">Draft entry only. Saving does not pay anyone, file slips, or remit funds to CRA. Standard Alberta 2026 regular-wage tax estimates are automated but must be verified against CRA PDOC.</p>
    <button type="submit" disabled={isEmployee && (!calculated || !acknowledged)} className="rounded-lg bg-blue-900 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2">Save {isEmployee ? "Payroll Entry" : "Contractor Payment"}</button>
  </form>;
}
