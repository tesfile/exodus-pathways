"use client";

import { useState } from "react";

type Period = { id: string; start: string; end: string; payDate: string; earnings: number; insurableHours: number | null };
type Props = { workerName: string; companyName: string; periods: Period[] };
const money = (n: number) => n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export function RoeWorksheet({ workerName, companyName, periods }: Props) {
  const [firstDay, setFirstDay] = useState("");
  const [lastDay, setLastDay] = useState("");
  const [finalPeriod, setFinalPeriod] = useState(periods[0]?.end ?? "");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [payrollAccount, setPayrollAccount] = useState("");
  const [hours, setHours] = useState<Record<string, string>>(() => Object.fromEntries(periods.filter(p => p.insurableHours !== null).map(p => [p.id, String(p.insurableHours)])));
  const [otherPayments, setOtherPayments] = useState("");
  const [saved, setSaved] = useState(false);
  const validHours = periods.every(p => hours[p.id] !== undefined && hours[p.id].trim() !== "" && Number.isFinite(Number(hours[p.id])) && Number(hours[p.id]) >= 0);
  const totalHours = periods.reduce((sum, p) => sum + (Number(hours[p.id]) || 0), 0);
  const totalEarnings = periods.reduce((sum, p) => sum + p.earnings, 0);
  const complete = Boolean(firstDay && lastDay && finalPeriod && reason && payrollAccount && validHours);
  const draft = {
    documentType: "ROE preparation worksheet — not a submitted or official ROE",
    employee: workerName, employer: companyName, payrollAccount,
    firstDayWorked: firstDay, lastDayForWhichPaid: lastDay,
    finalPayPeriodEnding: finalPeriod, reason, comments, otherPayments,
    periods: periods.map(p => ({ ...p, insurableHours: hours[p.id] === undefined ? null : Number(hours[p.id]) })),
    displayedPeriodTotals: { earnings: totalEarnings, hours: totalHours },
    caution: "Saved periods may not cover the required ROE lookback. Validate Block 15A/15B/15C, reason and separation payments under Service Canada rules."
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roe-preparation-" + workerName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".json";
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  };
  return <section className="grid gap-4">
    <div>
      <h3 className="text-lg font-black text-exodus-navy">Prepare Record of Employment</h3>
      <p className="mt-2 text-sm text-slate-600">Existing payroll amounts are loaded below. Enter missing details and download your worksheet. This is not an issued ROE.</p>
    </div>
    <div className="grid gap-4 rounded-md border p-4 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold">Employer<input className="field" value={companyName} readOnly /></label>
      <label className="grid gap-1 text-sm font-semibold">Employee<input className="field" value={workerName} readOnly /></label>
      <label className="grid gap-1 text-sm font-semibold">CRA payroll account (RP)<input className="field" value={payrollAccount} onChange={e=>setPayrollAccount(e.target.value)} placeholder="9-digit BN + RP0001" /></label>
      <label className="grid gap-1 text-sm font-semibold">Reason for issuing ROE<select className="field" value={reason} onChange={e=>setReason(e.target.value)}><option value="">Choose reason</option><option value="A">A — Shortage of work</option><option value="B">B — Strike or lockout</option><option value="D">D — Illness or injury</option><option value="E">E — Quit</option><option value="F">F — Maternity</option><option value="G">G — Retirement</option><option value="H">H — Work sharing</option><option value="J">J — Apprentice training</option><option value="K">K — Other</option><option value="M">M — Dismissal</option><option value="N">N — Leave of absence</option><option value="P">P — Parental</option><option value="Z">Z — Compassionate care / family caregiver</option></select></label>
      <label className="grid gap-1 text-sm font-semibold">First day worked<input type="date" className="field" value={firstDay} onChange={e=>setFirstDay(e.target.value)} /></label>
      <label className="grid gap-1 text-sm font-semibold">Last day for which paid<input type="date" className="field" value={lastDay} onChange={e=>setLastDay(e.target.value)} /></label>
      <label className="grid gap-1 text-sm font-semibold">Final pay period ending<input type="date" className="field" value={finalPeriod} onChange={e=>setFinalPeriod(e.target.value)} /></label>
      <label className="grid gap-1 text-sm font-semibold">Other payments on separation<input className="field" value={otherPayments} onChange={e=>setOtherPayments(e.target.value)} placeholder="Vacation pay, severance, etc." /></label>
      <label className="grid gap-1 text-sm font-semibold md:col-span-2">Comments<textarea className="field min-h-20" value={comments} onChange={e=>setComments(e.target.value)} /></label>
    </div>
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm"><thead className="bg-slate-100"><tr><th className="p-3 text-left">Pay period</th><th className="p-3 text-left">Pay date</th><th className="p-3 text-right">Insurable earnings</th><th className="p-3 text-left">Insurable hours (saved / editable)</th></tr></thead><tbody>{periods.map(p=><tr key={p.id} className="border-t"><td className="p-3">{p.start || "Missing"} to {p.end || "Missing"}</td><td className="p-3">{p.payDate}</td><td className="p-3 text-right">{money(p.earnings)}</td><td className="p-3"><input type="number" min="0" step="0.01" className="field w-32" aria-label={"Insurable hours for "+p.payDate} value={hours[p.id] ?? ""} onChange={e=>setHours(v=>({...v,[p.id]:e.target.value}))} placeholder="Hours" /></td></tr>)}</tbody></table>
    </div>
    <p className="text-sm font-semibold">Loaded payroll totals: {money(totalEarnings)} insurable earnings and {totalHours.toFixed(2)} saved or entered hours across {periods.length} records.</p>
    <p className="text-sm text-amber-900">Important: These are only the records loaded for the selected tax year. ROE insurable hours, earnings and Block 15C may require additional prior-year periods and adjustments. Do not use these totals as final ROE blocks without reconciliation.</p>
    <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={download} className="rounded-md bg-blue-900 px-5 py-3 font-bold text-white">Download ROE worksheet</button><span className="text-sm text-slate-600">{complete ? "Required worksheet fields completed. Review before official filing." : "Some details still need to be entered."}</span></div>
    {saved ? <p className="text-sm text-green-800">Worksheet downloaded to your device. It has not been submitted or saved to the company database.</p> : null}
  </section>;
}
