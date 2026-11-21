"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { saveDraftPayroll } from "./draft-actions";

export type RunPayrollEmployee = {
  id:string;
  name:string;
  payType:"hourly"|"salary";
  hourlyRate:number|null;
  salaryAmount:number|null;
  hoursPerDay:number;
  daysPerWeek:number;
  frequency:string;
  status:string;
  contractEndDate:string|null;
  paymentMethod:string;
  vacationPercent:number;
};
type SavedLine = {
  workerId:string; regularHours:number; hourlyRate:number;
  overtimeHours:number; vacationPay:number; statHolidayPay:number;
  memo:string; paymentMethod:string;
};
type Props = {
  clientId:string; companyId:string; year:number; companyName:string;
  frequency:string; employees:RunPayrollEmployee[];
  initialPeriodStart:string; initialPeriodEnd:string; initialPayDate:string;
  draftId:string; savedLines:SavedLine[];
  priorPay:Record<string,{gross:number;date:string}>;
};
type Fields={hours?:string;rate?:string;overtimeHours?:string;vacationPay?:string;statHolidayPay?:string;memo?:string;paymentMethod?:string};
const money=(n:number)=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(n);
const num=(n:number)=>Number.isFinite(n)&&n>=0;
const dateOk=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+"T00:00:00Z"));
const numberInput="w-24 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none";
const methodLabels:Record<string,string>={
  paper_cheque:"Paper cheque",
  manual_bank_transfer:"Manual transfer",
  external_direct_deposit:"External direct deposit"
};
function workingDays(start:string,end:string,daysPerWeek:number){
 if(!dateOk(start)||!dateOk(end)||end<start)return 0;
 const cursor=new Date(start+"T00:00:00Z"),last=new Date(end+"T00:00:00Z");
 let days=0;
 for(let i=0;cursor<=last&&i<370;i++){
  if((cursor.getUTCDay()+6)%7<daysPerWeek)days++;
  cursor.setUTCDate(cursor.getUTCDate()+1);
 }
 return days;
}
export function PayrollRunGrid({clientId,companyId,year,companyName,frequency,employees,
  initialPeriodStart,initialPeriodEnd,initialPayDate,draftId,savedLines,priorPay}:Props){
 const [payFrequency,setPayFrequency]=useState(frequency);
 const [start,setStart]=useState(initialPeriodStart);
 const [end,setEnd]=useState(initialPeriodEnd);
 const [payDate,setPayDate]=useState(initialPayDate);
 const [search,setSearch]=useState("");
 const [showPreview,setShowPreview]=useState(false);
 const [showCompare,setShowCompare]=useState<string|null>(null);
 const [selectedIds,setSelectedIds]=useState<string[]>(savedLines.length
   ?savedLines.map(line=>line.workerId).filter(id=>employees.some(e=>e.id===id))
   :employees.filter(e=>priorPay[e.id]?.date!==initialPayDate).map(e=>e.id));
 const [overrides,setOverrides]=useState<Record<string,Fields>>(
   Object.fromEntries(savedLines.map(l=>[l.workerId,{
     hours:String(l.regularHours),rate:String(l.hourlyRate),overtimeHours:String(l.overtimeHours),
     vacationPay:String(l.vacationPay),statHolidayPay:String(l.statHolidayPay),
     memo:l.memo,paymentMethod:l.paymentMethod
   }]))
 );
 const [showOnlySelected,setShowOnlySelected]=useState(false);
 const update=(id:string,key:keyof Fields,value:string)=>setOverrides(prev=>({...prev,[id]:{...prev[id],[key]:value}}));
 const reset=()=>setOverrides({});
 const currentValues=(employee:RunPayrollEmployee)=>{
  const edit=overrides[employee.id]??{};
  const standard=dateOk(start)&&dateOk(end)
   ? employee.hoursPerDay*workingDays(start,end,employee.daysPerWeek)
   : employee.hoursPerDay*employee.daysPerWeek*(payFrequency==="biweekly"?2:1);
  const hours=Number(edit.hours??standard.toFixed(2));
  const rate=Number(edit.rate??employee.hourlyRate??0);
  const overtimeHours=Number(edit.overtimeHours??0);
  const vacationPay=Number(edit.vacationPay??0);
  const statHolidayPay=Number(edit.statHolidayPay??0);
  const regularGross=employee.payType==="salary"?Number(employee.salaryAmount??0):hours*rate;
  const draftGross=regularGross+vacationPay+statHolidayPay;
  return {hours,rate,overtimeHours,vacationPay,statHolidayPay,regularGross,draftGross,
    memo:edit.memo??"",paymentMethod:edit.paymentMethod??employee.paymentMethod};
 };
 const rows=employees.map(employee=>({employee,values:currentValues(employee)}));
 const chosen=rows.filter(r=>selectedIds.includes(r.employee.id));
 const visible=rows.filter(r=>r.employee.name.toLowerCase().includes(search.toLowerCase())&&(!showOnlySelected||selectedIds.includes(r.employee.id)));
 const gross=chosen.reduce((sum,r)=>sum+(num(r.values.draftGross)?r.values.draftGross:0),0);
 const totalHours=chosen.reduce((sum,r)=>sum+(num(r.values.hours+r.values.overtimeHours)?r.values.hours+r.values.overtimeHours:0),0);
 const invalidDates=!dateOk(start)||!dateOk(end)||!dateOk(payDate)||start>end||end>payDate||payDate.slice(0,4)!==String(year);
 const hasInvalid=chosen.some(r=>[
   r.values.hours,r.values.rate,r.values.overtimeHours,r.values.vacationPay,r.values.statHolidayPay
  ].some(v=>!num(v))||r.values.hours>1000||r.values.overtimeHours>1000||
  r.values.rate>100000||r.values.vacationPay>1000000||r.values.statHolidayPay>1000000);
 const offContract=chosen.some(r=>Boolean(r.employee.contractEndDate&&end>r.employee.contractEndDate));
 const alreadyPaid=chosen.some(r=>priorPay[r.employee.id]?.date===payDate);
 const canSave=chosen.length>0&&!invalidDates&&!hasInvalid&&!alreadyPaid&&!offContract;
 const serialized=chosen.map(({employee,values})=>({
   workerId:employee.id,regularHours:values.hours,hourlyRate:values.rate,
   overtimeHours:values.overtimeHours,vacationPay:values.vacationPay,
   statHolidayPay:values.statHolidayPay,memo:values.memo,paymentMethod:values.paymentMethod
 }));
 const base="/admin/clients/"+encodeURIComponent(clientId)+"/payroll";
 const settingsUrl=base+"/settings?companyId="+encodeURIComponent(companyId)+"&year="+year;
 const employeeUrl=(id:string)=>base+"/employees/"+encodeURIComponent(id)+"?year="+year;
 function recordUrl(employee:RunPayrollEmployee,hours:number,rate:number){
  const p=new URLSearchParams({clientId,workerId:employee.id,payFrequency,periodStart:start,periodEnd:end,payDate,
   hours:hours.toFixed(2),rate:rate.toFixed(2)});
  return "/admin/workers-payroll-review/record?"+p.toString();
 }
 return <section className="grid gap-5 bg-white pb-10">
  <div className="rounded-xl border border-slate-200 bg-white p-5">
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">KAL Payroll · {companyName}</p>
     <h1 className="mt-2 text-2xl font-black text-slate-950">Run payroll: {payFrequency==="weekly"?"Every week":payFrequency==="biweekly"?"Every other week":payFrequency==="semimonthly"?"Twice a month":"Every month"}</h1>
     <p className="mt-2 text-sm text-slate-600">Choose employees, edit their hours and pay items, and save a draft for later review.</p>
    </div>
    <Link href={settingsUrl} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:border-emerald-600">Manage pay schedules</Link>
   </div>
   <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <label className="grid gap-2 text-sm font-semibold text-slate-800">Pay frequency<select value={payFrequency} onChange={e=>{setPayFrequency(e.target.value);reset();}} className="min-h-11 rounded-lg border border-slate-300 px-3 py-2">
      <option value="weekly">Every week</option><option value="biweekly">Every other week</option><option value="semimonthly">Twice monthly</option><option value="monthly">Every month</option>
    </select></label>
    <label className="grid gap-2 text-sm font-semibold text-slate-800">Period start<input type="date" value={start} onChange={e=>{setStart(e.target.value);reset();}} className="min-h-11 rounded-lg border border-slate-300 px-3 py-2"/></label>
    <label className="grid gap-2 text-sm font-semibold text-slate-800">Period end<input type="date" min={start||undefined} value={end} onChange={e=>{setEnd(e.target.value);reset();}} className="min-h-11 rounded-lg border border-slate-300 px-3 py-2"/></label>
    <label className="grid gap-2 text-sm font-semibold text-slate-800">Pay date<input type="date" min={end||undefined} value={payDate} onChange={e=>setPayDate(e.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3 py-2"/></label>
   </div>
   <p className="mt-3 text-xs leading-5 text-slate-500">Default hours use employee settings. Vacation, statutory holiday, overtime and sick pay require confirmation; a draft is not a calculated paycheque.</p>
  </div>
  {year!==2026?<p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-950">This version has not verified CRA calculations for {year}. Drafts are for preparation only.</p>:null}
  <div className="overflow-hidden rounded-xl border border-slate-200">
   <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-4">
    <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3"><Search className="h-4 w-4 text-slate-500"/><span className="sr-only">Search employees</span>
      <input type="search" placeholder="Find an employee" value={search} onChange={e=>setSearch(e.target.value)} className="min-h-11 w-44 bg-transparent text-sm outline-none"/></label>
    <div className="flex flex-wrap items-center gap-3">
     <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showOnlySelected} onChange={e=>setShowOnlySelected(e.target.checked)} className="h-4 w-4 accent-emerald-700"/>Selected only</label>
     <button type="button" onClick={reset} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800"><SlidersHorizontal className="h-4 w-4"/>Reset hours</button>
    </div>
   </div>
   <div className="overflow-x-auto">
    <table className="w-full min-w-[1300px] text-left text-sm">
     <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-700"><tr>
      <th className="sticky left-0 z-10 min-w-56 bg-slate-50 px-3 py-4"><label className="flex items-center gap-2"><input type="checkbox" checked={employees.length>0&&selectedIds.length===employees.length} onChange={e=>setSelectedIds(e.target.checked?employees.filter(emp=>priorPay[emp.id]?.date!==payDate).map(emp=>emp.id):[])} className="h-4 w-4 accent-emerald-700"/>Employees</label><span className="mt-1 block text-xs font-normal normal-case text-slate-500">Showing {visible.length} of {employees.length}</span></th>
      <th className="px-3 py-4">Regular hrs</th><th className="px-3 py-4">Rate ($)</th><th className="px-3 py-4">Overtime hrs</th><th className="px-3 py-4">Vacation ($)</th><th className="px-3 py-4">Stat pay ($)</th><th className="px-3 py-4">Total hrs</th><th className="px-3 py-4">Draft gross</th><th className="px-3 py-4">Memo</th><th className="px-3 py-4">Pay method</th><th className="px-3 py-4">Action</th>
     </tr></thead>
     <tbody className="divide-y divide-slate-100">
     {visible.map(({employee,values})=>{
       const wasPaid=priorPay[employee.id]?.date===payDate;
       const endAfterContract=Boolean(employee.contractEndDate&&end>employee.contractEndDate);
       const reviewReady=year===2026&&!invalidDates&&!wasPaid&&!endAfterContract&&employee.payType==="hourly"&&values.hours>0&&values.rate>0&&values.overtimeHours===0&&values.vacationPay===0&&values.statHolidayPay===0;
       return <tr key={employee.id} className={wasPaid?"bg-slate-50 text-slate-500":"bg-white"}>
        <td className="sticky left-0 z-10 bg-inherit px-3 py-3">
         <div className="flex items-center gap-3"><input type="checkbox" aria-label={"Include "+employee.name} checked={selectedIds.includes(employee.id)} disabled={wasPaid} onChange={e=>setSelectedIds(old=>e.target.checked?[...old,employee.id]:old.filter(id=>id!==employee.id))} className="h-4 w-4 accent-emerald-700"/>
          <div><Link href={employeeUrl(employee.id)} className="font-bold text-emerald-800 hover:underline">{employee.name}</Link><p className="mt-1 text-xs capitalize text-slate-500">{employee.payType}</p>
          {wasPaid?<p className="mt-1 text-xs font-semibold text-amber-800">Already recorded on {payDate}</p>:null}</div>
         </div>
        </td>
        <td className="px-3 py-3"><input aria-label={"Hours "+employee.name} type="number" min="0" max="1000" step="0.25" disabled={employee.payType==="salary"||wasPaid} value={overrides[employee.id]?.hours??values.hours.toFixed(2)} onChange={e=>update(employee.id,"hours",e.target.value)} className={numberInput}/></td>
        <td className="px-3 py-3"><input aria-label={"Rate "+employee.name} type="number" min="0" max="100000" step="0.01" disabled={employee.payType==="salary"||wasPaid} value={overrides[employee.id]?.rate??String(employee.hourlyRate??0)} onChange={e=>update(employee.id,"rate",e.target.value)} className={numberInput}/></td>
        <td className="px-3 py-3"><input aria-label={"Overtime "+employee.name} type="number" min="0" max="1000" step="0.25" disabled={wasPaid} value={overrides[employee.id]?.overtimeHours??"0"} onChange={e=>update(employee.id,"overtimeHours",e.target.value)} className={numberInput}/></td>
        <td className="px-3 py-3"><input aria-label={"Vacation "+employee.name} type="number" min="0" max="1000000" step="0.01" disabled={wasPaid} value={overrides[employee.id]?.vacationPay??"0"} onChange={e=>update(employee.id,"vacationPay",e.target.value)} className={numberInput}/><p className="mt-1 text-xs text-slate-500">{employee.vacationPercent}% policy</p></td>
        <td className="px-3 py-3"><input aria-label={"Stat holiday "+employee.name} type="number" min="0" max="1000000" step="0.01" disabled={wasPaid} value={overrides[employee.id]?.statHolidayPay??"0"} onChange={e=>update(employee.id,"statHolidayPay",e.target.value)} className={numberInput}/></td>
        <td className="px-3 py-3 font-semibold">{num(values.hours+values.overtimeHours)?(values.hours+values.overtimeHours).toFixed(2)+"h":"Invalid"}</td>
        <td className="px-3 py-3 font-bold">{num(values.draftGross)?money(values.draftGross):"Invalid"}</td>
        <td className="px-3 py-3"><input aria-label={"Memo "+employee.name} maxLength={500} value={values.memo} onChange={e=>update(employee.id,"memo",e.target.value)} className="w-32 rounded-lg border border-slate-300 px-2 py-2 text-sm" placeholder="+ Memo"/></td>
        <td className="px-3 py-3"><select aria-label={"Pay method "+employee.name} value={values.paymentMethod} onChange={e=>update(employee.id,"paymentMethod",e.target.value)} className="w-40 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">{Object.entries(methodLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></td>
        <td className="px-3 py-3">{reviewReady?<Link href={recordUrl(employee,values.hours,values.rate)} className="whitespace-nowrap font-bold text-emerald-700 hover:underline">Review paycheque</Link>:<span className="max-w-44 text-xs text-amber-800">{wasPaid?"Already recorded":endAfterContract?"Final partial period requires review":values.overtimeHours>0?"Review overtime manually":employee.payType==="salary"?"Salary review required":values.vacationPay+values.statHolidayPay>0?"Review additional pay":"Complete pay details"}</span>}</td>
       </tr>;
     })}
     {!visible.length?<tr><td colSpan={11} className="px-3 py-10 text-center text-slate-500">No employees match your selection.</td></tr>:null}
     </tbody>
     <tfoot className="border-t border-slate-200 bg-slate-100 font-black"><tr><td className="px-3 py-4">Total · {chosen.length} employees</td><td/><td/><td/><td/><td/><td className="px-3 py-4">{totalHours.toFixed(2)}h</td><td className="px-3 py-4">{money(gross)}</td><td colSpan={3}/></tr></tfoot>
    </table>
   </div>
   {invalidDates?<p role="alert" className="border-t border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">Choose a valid period and pay date before saving.</p>:null}
   {alreadyPaid?<p role="alert" className="border-t border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">An employee already has a recorded payment on this payday. Deselect that employee to prevent duplicates.</p>:null}
   {offContract?<p role="alert" className="border-t border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">Final partial periods after a contract end date need manual review; deselect those employees from this draft.</p>:null}
   <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5">
    <p className="max-w-xl text-xs leading-5 text-slate-600">Draft gross includes entered regular pay, vacation and statutory pay. Overtime earnings, CPP, CPP2, EI, taxes, net pay and employer contributions are not calculated here.</p>
    <div className="flex flex-wrap gap-3">
     <form action={saveDraftPayroll}>
      <input name="client_id" type="hidden" value={clientId}/><input name="company_id" type="hidden" value={companyId}/>
      <input name="period_start" type="hidden" value={start}/><input name="period_end" type="hidden" value={end}/>
      <input name="pay_date" type="hidden" value={payDate}/><input name="frequency" type="hidden" value={payFrequency}/>
      <input name="draft_id" type="hidden" value={draftId}/><input name="lines" type="hidden" value={JSON.stringify(serialized)}/>
      <button type="submit" disabled={!canSave} className="rounded-lg border border-emerald-700 px-5 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">Save for later</button>
     </form>
     <button type="button" onClick={()=>setShowPreview(true)} disabled={!canSave} className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">Preview for {chosen.length} employees</button>
    </div>
   </div>
  </div>
  {showPreview?<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
   <div role="dialog" aria-modal="true" aria-labelledby="kal-preview-title" className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl bg-white p-6 shadow-2xl">
    <div className="flex items-start justify-between gap-3"><div><h2 id="kal-preview-title" className="text-2xl font-black text-slate-950">Payroll preview · {companyName}</h2><p className="mt-1 text-sm text-slate-600">{start} to {end} · Payday {payDate}</p></div><button aria-label="Close preview" type="button" onClick={()=>setShowPreview(false)}><X className="h-6 w-6"/></button></div>
    <div className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
     <div><p className="text-xs uppercase text-slate-500">Draft gross pay</p><p className="mt-1 text-2xl font-black">{money(gross)}</p></div>
     <div><p className="text-xs uppercase text-slate-500">Employee &amp; employer taxes</p><p className="mt-2 text-sm font-semibold text-amber-800">Not calculated</p></div>
     <div><p className="text-xs uppercase text-slate-500">Total payroll cost</p><p className="mt-2 text-sm font-semibold text-amber-800">Pending CRA calculations</p></div>
    </div>
    <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
     <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase"><tr><th className="p-3">Name</th><th className="p-3">Total hours</th><th className="p-3">Draft gross</th><th className="p-3">Employee deductions</th><th className="p-3">Net pay</th><th className="p-3">Previous recorded gross</th></tr></thead>
     <tbody className="divide-y divide-slate-100">{chosen.map(({employee,values})=><tr key={employee.id}>
      <td className="p-3 font-semibold">{employee.name}</td><td className="p-3">{(values.hours+values.overtimeHours).toFixed(2)}h</td>
      <td className="p-3">{money(values.draftGross)}</td><td className="p-3 text-amber-800">Pending</td><td className="p-3 text-amber-800">Pending</td>
      <td className="p-3">{priorPay[employee.id]?<button type="button" onClick={()=>setShowCompare(showCompare===employee.id?null:employee.id)} className="text-emerald-700 hover:underline">{money(priorPay[employee.id].gross)} · Compare</button>:"No previous pay"}
       {showCompare===employee.id&&priorPay[employee.id]?<p className="mt-2 text-xs">Previously recorded on {priorPay[employee.id].date}. Difference in gross: {money(values.draftGross-priorPay[employee.id].gross)}</p>:null}
      </td></tr>)}</tbody>
    </table></div>
    <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This is a payroll draft, not a completed Canadian paycheque. Review CPP, CPP2, EI, tax, vacation/statutory eligibility and previous payments before recording pay. No bank payment or CRA filing will be sent.</p>
    <div className="mt-5 flex justify-end"><button type="button" onClick={()=>setShowPreview(false)} className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white">Back to payroll</button></div>
   </div>
  </div>:null}
 </section>;
}
