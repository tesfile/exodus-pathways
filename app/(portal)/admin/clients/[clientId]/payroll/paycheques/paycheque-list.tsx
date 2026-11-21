"use client";

import { useMemo, useState } from "react";
import { Download, Printer, Search } from "lucide-react";

type Payment={
 id:string;workerId:string;name:string;date:string;
 periodStart:string|null;periodEnd:string|null;gross:number;net:number;
 cpp:number;ei:number;incomeTax:number;payMethod:string;status:string;
};
type Props={year:number;companyName:string;initialWorkerId:string;records:Payment[];employees:Array<{id:string;name:string}>};
const cash=(n:number)=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(n);
const formatted=(d:string)=>d?new Intl.DateTimeFormat("en-CA",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(d+"T00:00:00Z")):"—";
const method=(method:string)=>({
 paper_cheque:"Paper cheque",manual_bank_transfer:"Manual transfer",external_direct_deposit:"External direct deposit"
} as Record<string,string>)[method]??method;
const csv=(v:string)=>'"'+v.replaceAll('"','""')+'"';
const safe=(v:string)=>/^[=+\-@\t\r]/.test(v)?"'"+v:v;
export function PaychequeList({year,companyName,initialWorkerId,records,employees}:Props){
 const [search,setSearch]=useState("");
 const [employeeId,setEmployeeId]=useState(initialWorkerId);
 const [from,setFrom]=useState(year+"-01-01");
 const [to,setTo]=useState(year+"-12-31");
 const [hideAmounts,setHideAmounts]=useState(false);
 const [newestFirst,setNewestFirst]=useState(true);
 const filtered=useMemo(()=>records.filter(p=>(!employeeId||p.workerId===employeeId)
  &&(!search||p.name.toLowerCase().includes(search.toLowerCase()))
  &&p.date>=from&&p.date<=to).sort((a,b)=>newestFirst?b.date.localeCompare(a.date):a.date.localeCompare(b.date)),
 [records,employeeId,search,from,to,newestFirst]);
 const visibleCash=(n:number)=>hideAmounts?"••••":cash(n);
 const totals=filtered.reduce((a,p)=>({gross:a.gross+p.gross,net:a.net+p.net}),{gross:0,net:0});
 const download=()=>{
  const fields=["Pay date","Employee","Pay period start","Pay period end","Gross pay CAD","Net pay CAD","CPP CAD","EI CAD","Income tax CAD","Payment method","Recorded status"];
  const data=filtered.map(p=>[p.date,p.name,p.periodStart??"",p.periodEnd??"",p.gross.toFixed(2),p.net.toFixed(2),p.cpp.toFixed(2),p.ei.toFixed(2),p.incomeTax.toFixed(2),method(p.payMethod),p.status]);
  const text=[fields,...data].map(row=>row.map(value=>csv(safe(String(value)))).join(",")).join("\r\n");
  const blob=new Blob(["\uFEFF",text],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");link.href=url;link.download="kal-paycheques-"+year+".csv";
  document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
 };
 return <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
  <div className="flex flex-wrap items-start justify-between gap-4">
   <div><h1 className="text-3xl font-black text-slate-950">Paycheque list</h1>
    <p className="mt-1 text-sm text-slate-600">{companyName} · Recorded payroll transactions · {year}</p>
    <p className="mt-2 text-xs text-amber-800">These records do not prove that bank payment or CRA remittances were completed.</p>
   </div>
   <div className="flex flex-wrap gap-2 print:hidden">
    <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
     <input type="checkbox" checked={hideAmounts} onChange={e=>setHideAmounts(e.target.checked)} className="accent-emerald-700"/>Privacy
    </label>
    <button type="button" onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"><Printer className="h-4 w-4"/>Print / PDF</button>
    <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-800"><Download className="h-4 w-4"/>Export CSV</button>
   </div>
  </div>
  <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
   <label className="grid gap-2 text-sm font-semibold text-slate-800">Employee
    <select value={employeeId} onChange={e=>setEmployeeId(e.target.value)} className="min-h-11 rounded-lg border border-slate-300 p-2"><option value="">All employees</option>{employees.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select>
   </label>
   <label className="grid gap-2 text-sm font-semibold text-slate-800">From<input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3"/></label>
   <label className="grid gap-2 text-sm font-semibold text-slate-800">To<input type="date" value={to} onChange={e=>setTo(e.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3"/></label>
   <label className="grid gap-2 text-sm font-semibold text-slate-800">Search
    <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3"><Search className="h-4 w-4"/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find an employee" className="min-h-11 w-full outline-none"/></div>
   </label>
  </div>
  <div className="mt-6 overflow-x-auto">
   <table className="w-full min-w-[950px] text-left text-sm">
    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700"><tr>
     <th className="p-3"><button type="button" onClick={()=>setNewestFirst(x=>!x)} className="font-bold hover:underline">Pay date {newestFirst?"↓":"↑"}</button></th>
     <th className="p-3">Employee</th><th className="p-3">Pay period</th><th className="p-3 text-right">Gross pay</th><th className="p-3 text-right">Net pay</th>
     <th className="p-3">Pay method</th><th className="p-3">Recorded status</th>
    </tr></thead>
    <tbody className="divide-y divide-slate-100">{filtered.map(p=><tr key={p.id}>
     <td className="whitespace-nowrap p-3">{formatted(p.date)}</td><td className="p-3 font-semibold text-slate-900">{p.name}</td>
     <td className="whitespace-nowrap p-3 text-slate-600">{p.periodStart||"—"} to {p.periodEnd||"—"}</td>
     <td className="p-3 text-right">{visibleCash(p.gross)}</td><td className="p-3 text-right font-bold">{visibleCash(p.net)}</td>
     <td className="p-3">{method(p.payMethod)}</td><td className="p-3">{p.status}</td>
    </tr>)}
    {!filtered.length?<tr><td colSpan={7} className="p-10 text-center text-slate-500">No recorded paycheques match these filters.</td></tr>:null}</tbody>
    <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-black"><tr><td colSpan={3} className="p-3">Total · {filtered.length} records</td><td className="p-3 text-right">{visibleCash(totals.gross)}</td><td className="p-3 text-right">{visibleCash(totals.net)}</td><td colSpan={2}/></tr></tfoot>
   </table>
  </div>
  <p className="mt-5 text-xs leading-5 text-slate-500">CSV export contains only the filtered payroll transaction fields above. Check access permissions and secure the downloaded file.</p>
 </section>;
}
