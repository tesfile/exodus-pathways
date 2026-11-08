"use client";

import { useState } from "react";
import { PayrollEntryPreview } from "@/components/portal/payroll-entry-preview";
import { savePayrollEntry } from "@/app/(portal)/admin/workers-payroll-review/record/actions";

type Classification = "T4 Employee" | "T4A Contractor" | "T5018 Subcontractor";
export function RecordPayrollForm({ clientId, workerId, today, initialClassification }: {
  clientId: string; workerId: string; today: string; initialClassification: Classification;
}) {
  const [classification, setClassification] = useState<Classification>(initialClassification);
  const [gross, setGross] = useState("");
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
    <label className="grid gap-1">Pay date<input required name="payment_date" type="date" defaultValue={today} className="rounded border p-3"/></label>
    <label className="grid gap-1">Pay frequency<select name="pay_frequency" defaultValue="biweekly" className="rounded border p-3"><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="semi-monthly">Semi-monthly</option><option value="monthly">Monthly</option></select></label>
    <label className="grid gap-1">Period start<input required name="pay_period_start" type="date" defaultValue={today} className="rounded border p-3"/></label>
    <label className="grid gap-1">Period end<input required name="pay_period_end" type="date" defaultValue={today} className="rounded border p-3"/></label>
    <label className="grid gap-1">{isEmployee ? "Gross pay" : "Amount before GST"} ($)
      <input required name="gross" type="number" min="0.01" step="0.01" value={gross} onChange={(e) => setGross(e.target.value)} className="rounded border p-3"/>
    </label>
    {isEmployee ? <>
      {numberField("cpp", "Employee CPP / CPP2")}
      {numberField("ei", "Employee EI")}
      {numberField("income_tax", "Income tax withheld")}
      {numberField("employer_cpp", "Employer CPP / CPP2")}
      {numberField("employer_ei", "Employer EI")}
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
