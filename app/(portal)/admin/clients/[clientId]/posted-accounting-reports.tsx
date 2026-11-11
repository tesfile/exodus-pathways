import { createClient } from "@supabase/supabase-js";

const money = (n:number)=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(n/100);
const cents=(n:unknown)=>Math.round(Number(n||0)*100);
export async function PostedAccountingReports({clientId,taxYear}:{clientId:string;taxYear:number}) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY;
  if(!url||!secret) return <p className="text-red-800">Posted reports unavailable: server configuration missing.</p>;
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const start=`${taxYear}-01-01`,end=`${taxYear+1}-01-01`;
  const {data:journals,error:jError}=await db.from("kal_journals").select("id,entry_date,reference,memo,status").eq("client_id",clientId).eq("status","posted").gte("entry_date",start).lt("entry_date",end).order("entry_date");
  if(jError)return <p className="text-red-800">Posted reports unavailable: {jError.message}</p>;
  const {data:accounts,error:aError}=await db.from("kal_accounts").select("id,code,name,type").eq("client_id",clientId);
  if(aError)return <p className="text-red-800">Accounts unavailable: {aError.message}</p>;
  const ids=(journals||[]).map(j=>j.id);
  const {data:lines,error:lError}=ids.length?await db.from("kal_journal_lines").select("journal_id,account_id,debit,credit").eq("client_id",clientId).in("journal_id",ids):{data:[],error:null};
  if(lError)return <p className="text-red-800">Journal lines unavailable: {lError.message}</p>;
  const byAccount=new Map((accounts||[]).map(a=>[a.id,a]));
  const byJournal=new Map((journals||[]).map(j=>[j.id,j]));
  const totals=new Map<string,{code:string,name:string,type:string,debit:number,credit:number}>();
  const ledger=(lines||[]).map(line=>{
    const account=byAccount.get(line.account_id),journal=byJournal.get(line.journal_id);
    const debit=cents(line.debit),credit=cents(line.credit);
    if(account){const current=totals.get(account.id)||{code:account.code,name:account.name,type:account.type,debit:0,credit:0};current.debit+=debit;current.credit+=credit;totals.set(account.id,current);}
    return {date:journal?.entry_date||"",ref:journal?.reference||"",name:account?.name||"Unknown account",debit,credit};
  }).sort((a,b)=>a.date.localeCompare(b.date));
  const trial=[...totals.values()].sort((a,b)=>a.code.localeCompare(b.code)).map(a=>({...a,net:a.debit-a.credit}));
  const debitTotal=trial.reduce((n,a)=>n+Math.max(a.net,0),0),creditTotal=trial.reduce((n,a)=>n+Math.max(-a.net,0),0);
  const revenue=trial.filter(a=>a.type==="income").reduce((n,a)=>n-a.net,0);
  const expense=trial.filter(a=>a.type==="expense").reduce((n,a)=>n+a.net,0);
  const assets=trial.filter(a=>a.type==="asset").reduce((n,a)=>n+a.net,0);
  const liabilities=trial.filter(a=>a.type==="liability").reduce((n,a)=>n-a.net,0);
  const equity=trial.filter(a=>a.type==="equity").reduce((n,a)=>n-a.net,0);
  const netIncome=revenue-expense;
  return <section className="grid gap-3">
    <h3 className="text-lg font-black text-blue-950">Official posted journals — {taxYear}</h3>
    <p className="text-sm text-slate-600">These reports use posted journal lines only. Drafts and unposted payroll are excluded. Opening balances, depreciation, GST remittances and year-end adjustments may still be required.</p>
    <details className="rounded-lg border p-3"><summary className="cursor-pointer font-bold">Posted General Ledger ({ledger.length} lines)</summary><div className="mt-3 max-h-[450px] overflow-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr><th>Date</th><th>Reference</th><th>Account</th><th>Debit</th><th>Credit</th></tr></thead><tbody>{ledger.map((x,i)=><tr key={i} className="border-t"><td>{x.date}</td><td>{x.ref}</td><td>{x.name}</td><td>{x.debit?money(x.debit):"—"}</td><td>{x.credit?money(x.credit):"—"}</td></tr>)}</tbody></table></div></details>
    <details className="rounded-lg border p-3"><summary className="cursor-pointer font-bold">Posted Trial Balance ({trial.length} accounts)</summary><div className="mt-3 overflow-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Debit</th><th>Credit</th></tr></thead><tbody>{trial.map(a=><tr key={a.code} className="border-t"><td>{a.code}</td><td>{a.name}</td><td>{a.type}</td><td>{a.net>0?money(a.net):"—"}</td><td>{a.net<0?money(-a.net):"—"}</td></tr>)}</tbody><tfoot><tr className="border-t font-bold"><td colSpan={3}>Total</td><td>{money(debitTotal)}</td><td>{money(creditTotal)}</td></tr></tfoot></table></div><p className="mt-2 text-sm">{debitTotal===creditTotal?"Posted debits and credits agree.":"Warning: posted journal balance mismatch."}</p></details>
    <details className="rounded-lg border p-3"><summary className="cursor-pointer font-bold">Posted Income Statement</summary><div className="mt-3 grid gap-2 text-sm"><p>Revenue: <strong>{money(revenue)}</strong></p><p>Expenses: <strong>{money(expense)}</strong></p><p>Net income (before adjustments): <strong>{money(netIncome)}</strong></p></div></details>
    <details className="rounded-lg border p-3"><summary className="cursor-pointer font-bold">Posted Balance Sheet — preliminary</summary><div className="mt-3 grid gap-2 text-sm"><p>Assets: <strong>{money(assets)}</strong></p><p>Liabilities: <strong>{money(liabilities)}</strong></p><p>Equity before current-year income: <strong>{money(equity)}</strong></p><p>Current-year net income: <strong>{money(netIncome)}</strong></p><p>Liabilities + equity + net income: <strong>{money(liabilities+equity+netIncome)}</strong></p></div><p className="mt-2 text-xs text-amber-800">This is a year-to-date movement summary, not a complete balance sheet until opening balances and prior years are included.</p></details>
  </section>;
}
