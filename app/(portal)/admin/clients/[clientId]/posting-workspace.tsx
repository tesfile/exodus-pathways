import type { AccountingData } from "@/lib/accounting/data";
import { postClientBookkeepingEntry } from "./posting-actions";

const money = (n: number | string | null | undefined) => new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(Number(n)||0);
const supported = new Set(["vehicle purchase","equipment purchase","furniture purchase","vehicle fuel","vehicle repairs & maintenance","insurance","professional fees","office supplies","rent","utilities"]);
export function PostingWorkspace({accounting,clientId,taxYear}:{accounting:AccountingData;clientId:string;taxYear:number}) {
  const rows = [
    ...accounting.income.filter(x=>x.status==="draft").map(x=>({id:x.id,kind:"income",date:x.entry_date,party:x.source,category:"Service Revenue",amount:x.amount,gst:x.gst_hst_amount,canPost:true})),
    ...accounting.expenses.filter(x=>x.status==="draft").map(x=>({id:x.id,kind:"expense",date:x.expense_date,party:x.vendor,category:x.category,amount:x.amount,gst:x.gst_hst_amount,canPost:supported.has(x.category.trim().toLowerCase())}))
  ];
  const keys=new Map<string,number>();
  for(const x of rows) {const k=[x.kind,x.date,x.party?.trim().toLowerCase(),x.category?.trim().toLowerCase(),x.amount,x.gst].join("|");keys.set(k,(keys.get(k)||0)+1);}
  return <details className="rounded-xl border border-blue-200 p-4">
    <summary className="cursor-pointer text-lg font-black text-blue-950">Review &amp; Post Transactions — {rows.length} drafts</summary>
    <p className="my-3 text-sm text-slate-700">Posting creates permanent double-entry journal records. Verify the receipt, classification, payment status and GST before posting. Unmapped categories and possible duplicates are blocked here until reviewed.</p>
    <div className="grid gap-3">{rows.map(x=>{
      const k=[x.kind,x.date,x.party?.trim().toLowerCase(),x.category?.trim().toLowerCase(),x.amount,x.gst].join("|");
      const duplicate=(keys.get(k)||0)>1;
      return <div key={x.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap justify-between gap-2"><strong>{x.kind==="income"?"Income":"Purchase"} · {x.party||"Unknown"}</strong><span className="text-sm">{x.date} · {money(x.amount)} + GST {money(x.gst)}</span></div>
        <p className="my-2 text-sm text-slate-700">Account: {x.category}</p>
        {duplicate?<p className="text-sm font-bold text-amber-800">Possible duplicate — review these records before posting.</p>:null}
        {!x.canPost?<p className="text-sm font-bold text-amber-800">Category needs an explicit Chart of Accounts mapping before posting.</p>:null}
        {x.canPost&&!duplicate?<form action={postClientBookkeepingEntry} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="clientId" value={clientId}/><input type="hidden" name="taxYear" value={taxYear}/><input type="hidden" name="sourceId" value={x.id}/><input type="hidden" name="kind" value={x.kind}/>
          <label className="grid gap-1 text-sm">Payment status<select name="settlement" required defaultValue=""><option value="" disabled>Choose payment status</option><option value="bank">Paid / received — Business Bank</option><option value="cash">Paid / received — Cash</option><option value="unpaid">Unpaid — {x.kind==="income"?"Accounts Receivable":"Accounts Payable"}</option></select></label>
          {x.kind==="expense"&&Number(x.gst)>0?<label className="flex items-center gap-2 text-sm"><input type="checkbox" name="gstVerified" value="yes" required/>I verified GST input tax credit eligibility</label>:<span className="text-xs text-slate-600">Check the supporting document first.</span>}
          <button className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white">Save &amp; Post</button>
        </form>:null}
      </div>;
    })}</div>
  </details>;
}
