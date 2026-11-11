import { createServerSupabaseClient } from "@/lib/supabase/server";
import { addAccount, addOpenItem } from "./accounting-actions";


export async function AccountingFoundation({clientId,taxYear}:{clientId:string;taxYear:number}) {
 const db=await createServerSupabaseClient();
 const [accountsResult,itemsResult]=await Promise.all([
  db.from("kal_accounts").select("id,code,name,type,active").eq("client_id",clientId).order("code"),
  db.from("kal_open_items").select("id,kind,party_name,reference,issue_date,due_date,amount,tax_amount,paid_amount,status").eq("client_id",clientId).gte("issue_date",`${taxYear}-01-01`).lte("issue_date",`${taxYear}-12-31`).order("issue_date",{ascending:false})
 ]);
 if(accountsResult.error||itemsResult.error) return <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm">Chart of Accounts and A/R–A/P require the staging database setup in <code>docs/kal-bookkeeping-phase2-staging.sql</code>. No data has been changed.</div>;
 const accounts=accountsResult.data??[];
 const items=itemsResult.data??[];
 const money=(n:number)=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(n);
 return <div className="grid gap-5">
   <section id="bookkeeping-chart-of-accounts" className="rounded-md border border-slate-200 p-4">
     <h3 className="text-lg font-black text-exodus-navy">Chart of Accounts</h3>
     <p className="mt-2 text-sm text-slate-600">Choose a category, then select an account. The code and account name fill automatically. You can also create a custom account.</p>
     <form action={addAccount} className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
       <input type="hidden" name="clientId" value={clientId}/>
       <label className="grid gap-1 text-sm font-semibold">Select account from category
         <select className="field" name="accountChoice" required defaultValue="asset|1000|Business Bank">
           <optgroup label="Assets — what the business owns">
             {["1000|Business Bank","1010|Cash on Hand","1100|Accounts Receivable","1500|Vehicles","1510|Equipment & Tools","1520|Furniture & Computers","1530|Buildings","1600|GST Recoverable"].map(v=><option key={v} value={`asset|${v}`}>{v.replace("|"," — ")}</option>)}
           </optgroup>
           <optgroup label="Liabilities — what the business owes">
             {["2000|Accounts Payable","2100|Business Loan Payable","2200|GST Payable","2300|Payroll Deductions Payable","2400|Credit Card Payable"].map(v=><option key={v} value={`liability|${v}`}>{v.replace("|"," — ")}</option>)}
           </optgroup>
           <optgroup label="Equity — ownership interest">
             {["3000|Share Capital","3100|Retained Earnings","3200|Shareholder Contributions"].map(v=><option key={v} value={`equity|${v}`}>{v.replace("|"," — ")}</option>)}
           </optgroup>
           <optgroup label="Income">
             {["4000|Service Revenue","4100|Sales Revenue","4200|Other Income"].map(v=><option key={v} value={`income|${v}`}>{v.replace("|"," — ")}</option>)}
           </optgroup>
           <optgroup label="Expenses">
             {["5000|Vehicle Fuel Expense","5100|Vehicle Repairs & Maintenance","5200|Insurance Expense","5300|Salaries & Wages","5400|Employer CPP/EI Expense","5500|Professional Fees","5600|Office Supplies","5700|Rent Expense","5800|Utilities Expense"].map(v=><option key={v} value={`expense|${v}`}>{v.replace("|"," — ")}</option>)}
           </optgroup>
         </select>
       </label>
       <button className="rounded-lg bg-exodus-navy px-4 py-3 text-sm font-bold text-white">Add selected account</button>
     </form>
     <div className="mt-3 grid gap-1 text-sm">{accounts.length?accounts.map(a=><div key={a.id} className="flex justify-between border-b py-2"><span>{a.code} — {a.name}</span><span className="capitalize text-slate-600">{a.type}</span></div>):<p>No accounts yet. Start with Bank, Accounts Receivable, Accounts Payable, Sales, Expenses and Owner Equity.</p>}</div>
   </section>
   <div className="grid gap-4 lg:grid-cols-2">
    {(["receivable","payable"] as const).map(kind=><section id={kind==="receivable"?"bookkeeping-accounts-receivable":"bookkeeping-accounts-payable"} key={kind} className="rounded-md border border-slate-200 p-4">
      <h3 className="text-lg font-black text-exodus-navy">{kind==="receivable"?"Accounts Receivable (A/R)":"Accounts Payable (A/P)"}</h3>
      <p className="text-sm text-slate-600">{kind==="receivable"?"Customer invoices awaiting payment":"Supplier bills awaiting payment"}</p>
      <form action={addOpenItem} className="mt-3 grid gap-3">
        <input type="hidden" name="clientId" value={clientId}/><input type="hidden" name="kind" value={kind}/><p className="text-xs text-slate-600">Selected year: {taxYear}. Enter an issue date in this year.</p>
        <label className="grid gap-1 text-sm">{kind==="receivable"?"Customer / payer":"Supplier / payee"}<input className="field" name="party" required/></label>
        <label className="grid gap-1 text-sm">Address<input className="field" name="address"/></label>
        <label className="grid gap-1 text-sm">Invoice / bill number<input className="field" name="reference" required/></label>
        <div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-sm">Issue date<input className="field" name="date" type="date" required/></label><label className="grid gap-1 text-sm">Due date<input className="field" name="dueDate" type="date"/></label></div>
        <div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-sm">Subtotal ($)<input className="field" name="amount" type="number" min="0.01" step="0.01" required/></label><label className="grid gap-1 text-sm">GST/HST ($)<input className="field" name="tax" type="number" min="0" step="0.01" defaultValue="0"/></label></div>
        <button className="rounded-md bg-exodus-navy px-4 py-3 text-sm font-bold text-white">Save {kind==="receivable"?"Invoice":"Bill"} as Draft</button>
      </form>
      <div className="mt-4 grid gap-2 text-sm">{items.filter(x=>x.kind===kind).map(x=><div key={x.id} className="rounded-md border p-3"><div className="flex justify-between gap-2 font-bold"><span>{x.party_name} · {x.reference}</span><span>{money(Number(x.amount)+Number(x.tax_amount)-Number(x.paid_amount))}</span></div><div className="text-xs text-slate-600">Issued {x.issue_date} · Due {x.due_date??"not set"} · {x.status}</div></div>)}{!items.some(x=>x.kind===kind)?<p>No {kind==="receivable"?"customer invoices":"supplier bills"} saved yet.</p>:null}</div>
    </section>)}
   </div>
   <p className="text-xs text-slate-600">These are draft A/R–A/P records. They do not post journal entries, update bank balances or create tax filings. Payment allocation and posting controls are separate upcoming steps.</p>
 </div>;
}
