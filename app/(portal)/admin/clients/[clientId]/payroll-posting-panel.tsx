import { createClient } from "@supabase/supabase-js";
import { postClientPayroll } from "./posting-actions";
export async function PayrollPostingPanel({clientId,taxYear}:{clientId:string;taxYear:number}) {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY;
 if(!url||!secret)return null;
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:payments,error}=await db.from("worker_payments").select("id,payment_date,gross_pay,net_pay,cpp,ei,income_tax_deducted,payroll_calculator_employer_cpp,payroll_calculator_employer_ei").eq("client_id",clientId).eq("tax_year",taxYear).eq("admin_classification","T4 Employee").order("payment_date");
 const {data:posted}=await db.from("kal_journals").select("source_id").eq("client_id",clientId).eq("source_kind","payroll");
 const postedIds=new Set((posted||[]).map(x=>x.source_id));
 const money=(n:unknown)=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(Number(n)||0);
 return <details className="rounded-xl border border-blue-200 p-4">
 <summary className="cursor-pointer text-lg font-black text-blue-950">Payroll → Official General Ledger ({(payments||[]).filter(p=>!postedIds.has(p.id)).length} to review)</summary>
 <p className="my-3 text-sm">Saved T4 payroll is not counted in official profit until posted here. Posting records wages, employer CPP/EI, withholding liabilities and net-pay clearing. Confirm amounts against the paystub. Do not enter wages again as a manual expense.</p>
 {error?<p className="text-red-700">Payroll unavailable: {error.message}</p>:null}
 <div className="grid gap-3">{(payments||[]).map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-slate-50 p-3">
 <div className="text-sm"><strong>{p.payment_date}</strong> · Gross {money(p.gross_pay)} · Net {money(p.net_pay)} · Employer CPP/EI {money(Number(p.payroll_calculator_employer_cpp||0)+Number(p.payroll_calculator_employer_ei||0))}<div><a className="text-blue-800 underline" href={`/admin/paystubs/${p.id}`} target="_blank" rel="noreferrer">Paystub PDF</a></div></div>
 {postedIds.has(p.id)?<strong className="text-green-800">Posted to official ledger</strong>:<form action={postClientPayroll}><input type="hidden" name="clientId" value={clientId}/><input type="hidden" name="paymentId" value={p.id}/><input type="hidden" name="taxYear" value={taxYear}/><button className="rounded-lg bg-blue-900 px-4 py-2 font-bold text-white">Post payroll to ledger</button></form>}
 </div>)}</div>
 </details>;
}
