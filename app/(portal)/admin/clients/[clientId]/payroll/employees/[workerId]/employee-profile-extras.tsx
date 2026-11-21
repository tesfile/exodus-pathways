import { addPayrollItem, saveTaxAndPayment, togglePayrollItem } from "./extra-actions";

type Profile = {
  td1_federal_claim: number | null;
  td1_provincial_claim: number | null;
  additional_income_tax: number | null;
  cpp_exempt: boolean | null;
  ei_exempt: boolean | null;
  payment_method: string | null;
} | null;
type Item = {
 id:string;kind:string;item_type:string;item_name:string;calculation:string;
 amount:number;effective_date:string|null;end_date:string|null;active:boolean;
};
const input="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100";
const cash=(n:number)=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(n);
const types:Record<string,{value:string;label:string}[]>={
 additional_pay:[
  {value:"stat_holiday",label:"Stat holiday pay"},{value:"vacation",label:"Vacation pay"},
  {value:"bonus",label:"Bonus"},{value:"commission",label:"Commission"},
  {value:"overtime_adjustment",label:"Overtime adjustment"},
  {value:"taxable_benefit",label:"Taxable benefit"},
  {value:"reimbursement",label:"Expense reimbursement"},{value:"other_pay",label:"Other earnings"}
 ],
 deduction:[
  {value:"health_insurance",label:"Health insurance"},{value:"rrsp",label:"RRSP deduction"},
  {value:"union_dues",label:"Union dues"},{value:"loan_repayment",label:"Loan repayment"},
  {value:"garnishment",label:"Garnishment"},{value:"other_deduction",label:"Other deduction"}
 ],
 contribution:[
  {value:"employer_rrsp",label:"Employer RRSP"},{value:"health_benefit",label:"Employer health benefit"},
  {value:"pension",label:"Employer pension"},{value:"other_contribution",label:"Other contribution"}
 ]
};
function Hidden({clientId,workerId,year}:{clientId:string;workerId:string;year:string}){
 return <><input type="hidden" name="client_id" value={clientId}/><input type="hidden" name="worker_id" value={workerId}/><input type="hidden" name="year" value={year}/></>;
}
function NewItemForm({kind,clientId,workerId,year}:{kind:"deduction"|"contribution"|"additional_pay";clientId:string;workerId:string;year:string}){
 return <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
  <summary className="cursor-pointer text-sm font-bold text-emerald-700">+ Add {kind==="additional_pay"?"pay type":kind}</summary>
  <form action={addPayrollItem} className="mt-4 grid gap-3 sm:grid-cols-2">
   <Hidden clientId={clientId} workerId={workerId} year={year}/>
   <input type="hidden" name="kind" value={kind}/>
   <label className="grid gap-2 text-xs font-semibold text-slate-700">Type
    <select name="item_type" className={input}>{types[kind].map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
   </label>
   <label className="grid gap-2 text-xs font-semibold text-slate-700">Custom name
    <input name="item_name" maxLength={100} required className={input} placeholder="Example: Health plan or Holiday pay"/>
   </label>
   <label className="grid gap-2 text-xs font-semibold text-slate-700">Calculation
    <select name="calculation" className={input}><option value="amount">Fixed amount (CAD)</option><option value="percent">Percentage (%)</option></select>
   </label>
   <label className="grid gap-2 text-xs font-semibold text-slate-700">Rate or amount
    <input name="amount" type="number" min="0" max="1000000" step="0.01" required className={input} placeholder="0.00"/>
   </label>
   <label className="grid gap-2 text-xs font-semibold text-slate-700">Effective date
    <input name="effective_date" type="date" className={input}/>
   </label>
   <label className="grid gap-2 text-xs font-semibold text-slate-700">End date (optional)
    <input name="end_date" type="date" className={input}/>
   </label>
   <div className="sm:col-span-2"><button type="submit" className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">Save {kind==="additional_pay"?"additional pay":kind}</button></div>
   <p className="text-xs leading-5 text-slate-600 sm:col-span-2">Saving an item records its configuration only. It is not automatically included in payroll calculations yet.</p>
  </form>
 </details>;
}
function ItemTable({items,clientId,workerId,year}:{items:Item[];clientId:string;workerId:string;year:string}){
 if(!items.length) return <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">No items recorded yet.</p>;
 return <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm">
  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr>
   <th className="p-3">Name</th><th className="p-3">Amount / rate</th><th className="p-3">Effective</th><th className="p-3">Status</th><th className="p-3">Actions</th>
  </tr></thead><tbody className="divide-y divide-slate-100">
  {items.map(item=><tr key={item.id} className={!item.active?"text-slate-400":""}>
   <td className="p-3 font-semibold">{item.item_name}<span className="mt-1 block text-xs font-normal capitalize text-slate-500">{item.item_type.replaceAll("_"," ")}</span></td>
   <td className="p-3">{item.calculation==="percent"?Number(item.amount).toFixed(2)+"%":cash(Number(item.amount))}</td>
   <td className="p-3">{item.effective_date||"Immediately"}{item.end_date?" to "+item.end_date:""}</td>
   <td className="p-3">{item.active?"Active":"Inactive"}</td>
   <td className="p-3"><form action={togglePayrollItem}><Hidden clientId={clientId} workerId={workerId} year={year}/>
    <input name="item_id" type="hidden" value={item.id}/>
    <input name="active" type="hidden" value={item.active?"false":"true"}/>
    <button type="submit" className="text-sm font-bold text-emerald-700 hover:underline">{item.active?"Deactivate":"Reactivate"}</button>
   </form></td>
  </tr>)}
 </tbody></table></div>;
}
export function EmployeeProfileExtras({profile,items,clientId,workerId,year}:{profile:Profile;items:Item[];clientId:string;workerId:string;year:string}){
 const pays=items.filter(item=>item.kind==="additional_pay");
 const deductions=items.filter(item=>item.kind==="deduction");
 const contributions=items.filter(item=>item.kind==="contribution");
 const paymentMethods:Record<string,string>={
   paper_cheque:"Paper cheque",
   manual_bank_transfer:"Manual bank transfer (outside KAL)",
   external_direct_deposit:"External direct deposit (outside KAL)"
 };
 return <>
  <section id="tax-withholdings" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-xl font-black text-slate-950">Tax withholdings and payment method</h2>
   <p className="mt-2 text-sm text-slate-600">Enter amounts from the employee&apos;s signed federal and provincial TD1 forms. These are settings, not a completed tax calculation.</p>
   <form action={saveTaxAndPayment} className="mt-5 grid gap-5 sm:grid-cols-2">
    <Hidden clientId={clientId} workerId={workerId} year={year}/>
    <label className="grid gap-2 text-sm font-semibold text-slate-800">Federal TD1 claim amount ($)
     <input type="number" min="0" max="1000000" step="0.01" name="td1_federal_claim" className={input} defaultValue={profile?.td1_federal_claim??""} placeholder="Use signed TD1 amount"/>
    </label>
    <label className="grid gap-2 text-sm font-semibold text-slate-800">Provincial TD1 claim amount ($)
     <input type="number" min="0" max="1000000" step="0.01" name="td1_provincial_claim" className={input} defaultValue={profile?.td1_provincial_claim??""} placeholder="Use signed provincial TD1"/>
    </label>
    <label className="grid gap-2 text-sm font-semibold text-slate-800">Additional income tax per pay ($)
     <input type="number" min="0" max="1000000" step="0.01" name="additional_income_tax" className={input} defaultValue={profile?.additional_income_tax??0}/>
    </label>
    <label className="grid gap-2 text-sm font-semibold text-slate-800">Payment method
     <select name="payment_method" defaultValue={profile?.payment_method||"paper_cheque"} className={input}>
      {Object.entries(paymentMethods).map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </select>
    </label>
    <label className="flex items-center gap-3 text-sm font-semibold text-slate-800"><input name="cpp_exempt" type="checkbox" defaultChecked={profile?.cpp_exempt??false} className="h-4 w-4 accent-emerald-700"/> CPP exempt — only if legally eligible</label>
    <label className="flex items-center gap-3 text-sm font-semibold text-slate-800"><input name="ei_exempt" type="checkbox" defaultChecked={profile?.ei_exempt??false} className="h-4 w-4 accent-emerald-700"/> EI exempt — only if legally eligible</label>
    <div className="sm:col-span-2">
     <button type="submit" className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">Save tax and payment settings</button>
     <p className="mt-3 text-xs leading-5 text-amber-800">Choosing a payment method does not connect a bank or transfer money. Do not assume CPP/EI exemptions without supporting evidence.</p>
    </div>
   </form>
  </section>
  <section id="payroll-items" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
   <div><h2 className="text-xl font-black text-slate-950">Additional pay types</h2><p className="mt-1 text-sm text-slate-600">Stat holidays, vacation pay, bonuses, commissions, reimbursements and other earnings.</p></div>
   <div className="mt-4"><ItemTable items={pays} clientId={clientId} workerId={workerId} year={year}/></div>
   <div className="mt-4"><NewItemForm kind="additional_pay" clientId={clientId} workerId={workerId} year={year}/></div>
   <div className="my-7 border-t border-slate-200"/>
   <div><h2 className="text-xl font-black text-slate-950">Deductions and contributions</h2><p className="mt-1 text-sm text-slate-600">Health insurance, RRSP, pension, union dues, garnishments and loan repayments.</p></div>
   <div className="mt-4"><h3 className="mb-3 font-bold text-slate-900">Employee deductions</h3><ItemTable items={deductions} clientId={clientId} workerId={workerId} year={year}/></div>
   <div className="mt-4"><NewItemForm kind="deduction" clientId={clientId} workerId={workerId} year={year}/></div>
   <div className="mt-6"><h3 className="mb-3 font-bold text-slate-900">Employer contributions</h3><ItemTable items={contributions} clientId={clientId} workerId={workerId} year={year}/></div>
   <div className="mt-4"><NewItemForm kind="contribution" clientId={clientId} workerId={workerId} year={year}/></div>
  </section>
 </>;
}
