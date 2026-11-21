import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";

export const dynamic="force-dynamic";
type Props={params:Promise<{clientId:string;paymentId:string}>,searchParams?:Promise<{year?:string}>};
const uuid=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const cash=(n:number|null|undefined)=>n==null?"Not recorded":new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(Number(n));
const date=(n:string|null|undefined)=>n?new Intl.DateTimeFormat("en-CA",{timeZone:"UTC",day:"2-digit",month:"short",year:"numeric"}).format(new Date(n+"T00:00:00Z")):"Not recorded";
export default async function PayRecordPage({params,searchParams}:Props){
 await requireRole(["admin"]);
 const {clientId,paymentId}=await params,query=await searchParams;
 if(!uuid.test(clientId)||!uuid.test(paymentId))notFound();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw new Error("Payroll database is not configured.");
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:payment,error:paymentError}=await db.from("worker_payments").select(
   "id,client_id,company_id,worker_id,payment_date,pay_period_start,pay_period_end,gross_pay,net_pay,cpp,ei,income_tax_deducted,pay_frequency,hours_worked,vacation_pay,benefits,payment_method,cheque_number,status"
 ).eq("id",paymentId).eq("client_id",clientId).maybeSingle();
 if(paymentError||!payment)notFound();
 const [{data:worker,error:workerError},{data:company,error:companyError}]=await Promise.all([
  db.from("workers").select("worker_name,worker_type").eq("id",payment.worker_id).eq("client_id",clientId).eq("company_id",payment.company_id).maybeSingle(),
  db.from("companies").select("legal_name,trade_name").eq("id",payment.company_id).eq("client_id",clientId).maybeSingle()
 ]);
 if(workerError||!worker||!/employee/i.test(worker.worker_type)||companyError||!company)notFound();
 const year=/^20\d{2}$/.test(query?.year??"")?query!.year!:String(new Date().getFullYear());
 const back="/admin/clients/"+encodeURIComponent(clientId)+"/payroll/paycheques?companyId="+encodeURIComponent(payment.company_id)+"&year="+year;
 return <main className="mx-auto grid max-w-4xl gap-5 print:max-w-full print:gap-2">
  <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
   <Link href={back} className="font-bold text-emerald-700 hover:underline">← Paycheque list</Link>
   <PrintButton/>
  </div>
  <section className="rounded-xl border border-slate-300 bg-white p-8 print:rounded-none print:border-0 print:p-0">
   <div className="flex flex-wrap items-start justify-between gap-5 border-b-2 border-slate-900 pb-6">
    <div><p className="text-xs font-black uppercase tracking-widest text-emerald-700">KAL Payroll</p>
     <h1 className="mt-2 text-3xl font-black text-slate-950">Pay record statement</h1>
     <p className="mt-1 text-sm text-slate-600">Recorded payroll data — confirm before giving to an employee.</p></div>
    <div className="text-right"><p className="font-black text-slate-950">{company.trade_name||company.legal_name}</p>
     <p className="mt-2 text-sm text-slate-600">Pay date: {date(payment.payment_date)}</p>
     <p className="mt-1 text-sm text-slate-600">Cheque #: {payment.cheque_number||"Not recorded"}</p>
    </div>
   </div>
   <div className="grid gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
    <div><h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Employee</h2>
      <p className="mt-2 text-lg font-black">{worker.worker_name}</p>
      <p className="mt-2 text-sm text-slate-600">Pay method: {payment.payment_method||"Not recorded"}</p></div>
    <div><h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Pay period</h2>
      <p className="mt-2 font-bold">{date(payment.pay_period_start)} to {date(payment.pay_period_end)}</p>
      <p className="mt-2 text-sm text-slate-600">Frequency: {payment.pay_frequency||"Not recorded"}</p>
      <p className="mt-1 text-sm text-slate-600">Hours recorded: {payment.hours_worked==null?"Not recorded":Number(payment.hours_worked).toFixed(2)}</p>
    </div>
   </div>
   <div className="mt-6 grid gap-6 sm:grid-cols-2">
    <section><h2 className="border-b border-slate-200 pb-3 text-lg font-black">Earnings</h2>
      <div className="flex justify-between gap-3 py-3"><span>Gross pay</span><strong>{cash(payment.gross_pay)}</strong></div>
      <div className="flex justify-between gap-3 py-3"><span>Recorded vacation pay</span><strong>{cash(payment.vacation_pay)}</strong></div>
      <div className="flex justify-between gap-3 py-3"><span>Recorded benefits</span><strong>{cash(payment.benefits)}</strong></div>
    </section>
    <section><h2 className="border-b border-slate-200 pb-3 text-lg font-black">Employee deductions</h2>
      <div className="flex justify-between gap-3 py-3"><span>CPP</span><strong>{cash(payment.cpp)}</strong></div>
      <div className="flex justify-between gap-3 py-3"><span>EI</span><strong>{cash(payment.ei)}</strong></div>
      <div className="flex justify-between gap-3 py-3"><span>Income tax</span><strong>{cash(payment.income_tax_deducted)}</strong></div>
    </section>
   </div>
   <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-100 p-5">
    <span className="text-lg font-black">Recorded net pay</span><span className="text-3xl font-black">{cash(payment.net_pay)}</span>
   </div>
   <p className="mt-6 text-xs leading-6 text-slate-600">This statement displays existing KAL payroll records. It is not evidence that money was transferred or payroll taxes were remitted. Verify source deductions, earnings, vacation pay and applicable employment standards before treating the statement as final.</p>
  </section>
 </main>;
}
