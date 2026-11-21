import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import { PaychequeList } from "./paycheque-list";

export const dynamic="force-dynamic";
type Props={params:Promise<{clientId:string}>,searchParams?:Promise<{year?:string;companyId?:string;workerId?:string}>};
const uuid=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
export default async function PaychequesPage({params,searchParams}:Props){
 await requireRole(["admin"]);
 const {clientId}=await params,query=await searchParams;
 if(!uuid.test(clientId))notFound();
 const year=/^20\d{2}$/.test(query?.year??"")?Number(query!.year):new Date().getFullYear();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,secret=process.env.SUPABASE_SECRET_KEY;
 if(!url||!secret)throw new Error("Payroll database is not configured.");
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const [{data:companies,error:cError},{data:workers,error:wError}]=await Promise.all([
  db.from("companies").select("id,legal_name,trade_name").eq("client_id",clientId).order("legal_name"),
  db.from("workers").select("id,worker_name,company_id,worker_type").eq("client_id",clientId).order("worker_name")
 ]);
 if(cError||wError)throw new Error("Unable to load payroll company or employee records.");
 const company=companies?.find(c=>c.id===query?.companyId)??companies?.[0];
 const base="/admin/clients/"+encodeURIComponent(clientId)+"/payroll?year="+year+"&section=employees";
 if(!company)return <main><Link href={base} className="font-bold text-emerald-700">Back to Payroll</Link><p>No employer company is configured.</p></main>;
 const employees=(workers??[]).filter(w=>w.company_id===company.id&&/employee/i.test(w.worker_type));
 const ids=new Set(employees.map(e=>e.id));
 const {data:payments,error:pError}=await db.from("worker_payments")
 .select("id,worker_id,payment_date,pay_period_start,pay_period_end,gross_pay,net_pay,payment_method,status,cheque_number,cpp,ei,income_tax_deducted")
 .eq("client_id",clientId).eq("company_id",company.id).gte("payment_date",year+"-01-01")
 .lte("payment_date",year+"-12-31").order("payment_date",{ascending:false}).limit(2000);
 if(pError)throw new Error("Unable to load recorded payroll payments.");
 const display=(payments??[]).filter(p=>ids.has(p.worker_id)).map(p=>({
  id:p.id,workerId:p.worker_id,name:employees.find(e=>e.id===p.worker_id)?.worker_name??"Employee",
  date:p.payment_date,periodStart:p.pay_period_start,periodEnd:p.pay_period_end,
  gross:Number(p.gross_pay??0),net:Number(p.net_pay??0),
  cpp:Number(p.cpp??0),ei:Number(p.ei??0),incomeTax:Number(p.income_tax_deducted??0),
  payMethod:p.payment_method??"Not recorded",status:p.status??"Not recorded",chequeNumber:p.cheque_number??""
 }));
 return <main className="mx-auto grid max-w-7xl gap-5">
  <Link href={base} className="w-fit text-sm font-bold text-emerald-700 hover:underline">← Back to Employees</Link>
  <div className="rounded-xl border border-slate-200 bg-white p-5">
   <form method="get" className="flex flex-wrap items-end gap-3">
    <input type="hidden" name="year" value={year}/>
    <label className="grid min-w-56 flex-1 gap-2 text-sm font-semibold text-slate-800">Employer company
     <select name="companyId" defaultValue={company.id} className="rounded-lg border border-slate-300 p-3">
      {companies?.map(c=><option key={c.id} value={c.id}>{c.trade_name||c.legal_name}</option>)}
     </select>
    </label>
    <button type="submit" className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white">Choose company</button>
   </form>
  </div>
  <PaychequeList year={year} companyName={company.trade_name||company.legal_name} clientId={clientId} companyId={company.id}
   initialWorkerId={query?.workerId||""}
   records={display}
   employees={employees.map(e=>({id:e.id,name:e.worker_name}))}/>
 </main>;
}
