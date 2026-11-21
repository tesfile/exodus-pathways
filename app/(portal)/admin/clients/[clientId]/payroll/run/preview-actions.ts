"use server";

import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/supabase/server";
import {
  calculate2026AlbertaRegularPay, PayrollCalculationError,
  type Payroll2026Result, type Frequency2026,
} from "@/lib/payroll/cra-2026-alberta";

const idRe=/^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
type PreviewLine={
  workerId:string; regularHours:number; hourlyRate:number;
  overtimeHours:number; vacationPay:number; statHolidayPay:number;
};
export type PayrollCalculatedLine={
  workerId:string;name:string;result:Payroll2026Result|null;issue:string|null;
};
export type PayrollCalculatedPreview={
  calculationYear:number;province:"AB";
  lines:PayrollCalculatedLine[];
  calculatedCount:number;blockedCount:number;totalGross:number|null;
  totalCpp:number|null;totalCpp2:number|null;totalEi:number|null;
  totalIncomeTax:number|null;totalDeductions:number|null;totalNetPay:number|null;
  totalEmployerCpp:number|null;totalEmployerCpp2:number|null;totalEmployerEi:number|null;
  totalEmployerContributions:number|null;totalPayrollCost:number|null;
  information:string[];
};
type Input={
  clientId:string;companyId:string;periodStart:string;periodEnd:string;payDate:string;
  frequency:Frequency2026;lines:PreviewLine[];
};
function validDate(v:string){const d=new Date(v+"T00:00:00Z");return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;}
const dollars=(v:unknown)=>v===null||v===undefined?null:Number(v);
const round=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
const money=(v:unknown)=>v===null||v===undefined?0:Number(v);
const dateDifference=(start:string,end:string)=>(Date.parse(end+"T00:00:00Z")-Date.parse(start+"T00:00:00Z"))/86400000+1;

export async function calculatePayrollPreview2026(input:Input):Promise<PayrollCalculatedPreview>{
 await requireRole(["admin"]);
 if(!input||!idRe.test(input.clientId)||!idRe.test(input.companyId)||
   !validDate(input.periodStart)||!validDate(input.periodEnd)||!validDate(input.payDate)||
   input.periodStart>input.periodEnd||input.payDate<input.periodEnd||
   !["weekly","biweekly","semimonthly","monthly"].includes(input.frequency)||
   !Array.isArray(input.lines)||input.lines.length<1||input.lines.length>200)
   throw new Error("Select a valid employer, period and payday.");
 if(!input.payDate.startsWith("2026-"))
   throw new Error("The verified deduction engine currently supports 2026 only.");
 const d=dateDifference(input.periodStart,input.periodEnd);
 if((input.frequency==="weekly"&&d!==7)||(input.frequency==="biweekly"&&d!==14)||
    (input.frequency==="monthly"&&(input.periodStart.slice(0,7)!==input.periodEnd.slice(0,7)||
     input.periodStart.slice(8)!=="01"||
     input.periodEnd!==new Date(Date.UTC(+input.periodStart.slice(0,4),+input.periodStart.slice(5,7),0)).toISOString().slice(0,10))))
   throw new Error("Pay period dates do not match the company pay frequency. Recheck the scheduled start and end dates.");
 const seen=new Set<string>();
 for(const line of input.lines){
  if(!line||!idRe.test(line.workerId)||seen.has(line.workerId)) throw new Error("Invalid employee selection.");
  seen.add(line.workerId);
  if([line.regularHours,line.hourlyRate,line.overtimeHours,line.vacationPay,line.statHolidayPay]
     .some(n=>!Number.isFinite(n)||n<0||n>1000000))throw new Error("Invalid hours or gross pay values.");
 }
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw new Error("Payroll database credentials are not configured.");
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:company,error:companyError}=await db.from("companies")
   .select("id,province").eq("id",input.companyId).eq("client_id",input.clientId).maybeSingle();
 if(companyError||!company)throw new Error("Employer company was not found.");
 const province=(company.province??"").trim().toUpperCase();
 if(!["AB","ALBERTA"].includes(province))
   throw new Error("Only Alberta payroll is supported by this calculation. Confirm the company's province is Alberta in Company Settings.");
 const ids=input.lines.map(l=>l.workerId);
 const [{data:workers,error:workerError},{data:profiles,error:profileError},{data:payments,error:paymentError},{data:payItems,error:itemError}]=await Promise.all([
  db.from("workers").select("id,worker_name,worker_type").eq("client_id",input.clientId).eq("company_id",input.companyId).in("id",ids),
  db.from("kal_payroll_employee_profiles").select(
   "worker_id,pay_type,salary_amount,pay_frequency,employment_status,birth_date,hire_date,termination_date,contract_end_date,td1_federal_claim,td1_provincial_claim,additional_income_tax,cpp_exempt,ei_exempt,federal_income_tax_exempt,overtime_multiplier,work_location"
  ).eq("client_id",input.clientId).in("worker_id",ids),
  db.from("worker_payments").select(
   "worker_id,payment_date,gross_pay,cpp,cpp2,ei,income_tax_deducted,t4_box26_cpp_pensionable_earnings,t4_box24_ei_insurable_earnings,client_worker_type"
  ).eq("client_id",input.clientId).eq("company_id",input.companyId)
   .gte("payment_date","2026-01-01").lte("payment_date",input.payDate).order("payment_date",{ascending:true}).limit(3000),
  db.from("kal_payroll_employee_items").select("worker_id,item_name,kind,amount,active,effective_date,end_date")
    .eq("client_id",input.clientId).in("worker_id",ids).eq("active",true)
 ]);
 if(workerError||profileError||paymentError||itemError)throw new Error("Unable to load required historical payroll records.");
 if((payments??[]).length>=3000)throw new Error("Too many historical transactions for a complete year-to-date calculation. Reconcile in payroll history first.");
 const workerById=new Map((workers??[]).map(w=>[w.id,w]));
 const profileById=new Map((profiles??[]).map(p=>[p.worker_id,p]));
 type PriorPayment=NonNullable<typeof payments>[number];
 const paymentsByWorker=new Map<string,PriorPayment[]>();
 for(const payment of payments??[]){
  const list=paymentsByWorker.get(payment.worker_id)??[];
  list.push(payment);paymentsByWorker.set(payment.worker_id,list);
 }
 const lines:PayrollCalculatedLine[]=input.lines.map(line=>{
  const worker=workerById.get(line.workerId),profile=profileById.get(line.workerId);
  const blocked=(issue:string):PayrollCalculatedLine=>({
    workerId:line.workerId,name:worker?.worker_name??"Employee",result:null,issue
  });
  if(!worker||!/employee/i.test(worker.worker_type)||!profile)
   return blocked("Employee setup is incomplete or does not belong to this employer.");
  if(profile.employment_status!=="Active")return blocked("Employee is not active on payroll.");
  if((profile.hire_date&&profile.hire_date>input.periodEnd)||
    (profile.termination_date&&profile.termination_date<input.periodStart)||
    (profile.contract_end_date&&profile.contract_end_date<input.periodEnd))
   return blocked("Employment dates or contract end require a partial-period review.");
  if(profile.pay_frequency&&profile.pay_frequency!==input.frequency)
    return blocked("Employee pay frequency differs from this company run. Select the correct pay schedule before calculating income tax.");
  if(profile.hire_date&&profile.hire_date>input.periodStart)
    return blocked("Employee was hired during this pay period. Confirm prorated working hours and special first-pay rules.");
  if(profile.pay_type==="commission")return blocked("Commission-only pay requires the CRA commission calculation method.");
  if(profile.pay_type==="salary"&&line.overtimeHours>0)
    return blocked("Overtime for salaried employees requires review.");
  if(profile.federal_income_tax_exempt)
    return blocked("Income-tax exemption requires documented eligibility and manual review.");
  if(!profile.birth_date)return blocked("Enter the employee's date of birth to establish CPP eligibility.");
  if(profile.work_location&&/\b(BC|QUEBEC|QC|ON|MB|SK|NS|NB|NL|PE|YT|NT|NU)\b/i.test(profile.work_location))
    return blocked("The listed work location may not be in Alberta; confirm province of employment.");
  const items=(payItems??[]).filter(item=>item.worker_id===line.workerId&&
   (!item.effective_date||item.effective_date<=input.payDate)&&(!item.end_date||item.end_date>=input.periodStart));
  if(items.some(item=>Number(item.amount)!==0))
    return blocked("Employee has additional pay/deductions that must be mapped to taxable and pensionable treatment before calculation.");
  const multiplier=Number(profile.overtime_multiplier??1.5);
  if(!Number.isFinite(multiplier)||multiplier<1||multiplier>4)return blocked("Invalid overtime multiplier.");
  const wages=profile.pay_type==="salary"?Number(profile.salary_amount??0):line.regularHours*line.hourlyRate;
  if(!Number.isFinite(wages)||wages<0)return blocked("Enter valid wages.");
  const gross=round(wages+line.overtimeHours*line.hourlyRate*multiplier+line.vacationPay+line.statHolidayPay);
  if(gross<=0)return blocked("Hourly rate or salary is missing; gross pay cannot be zero.");
  const allPrior=paymentsByWorker.get(line.workerId)??[];
  if(allPrior.some(p=>p.payment_date===input.payDate))
   return blocked("A payroll payment is already recorded on this payday; review duplicates.");
  const prior=allPrior.filter(p=>p.payment_date<input.payDate);
  if(prior.some(p=>p.gross_pay===null||p.cpp===null||p.ei===null||
   Number(p.gross_pay)<0))
   return blocked("Historical pay has missing gross/CPP/EI values. Reconcile year-to-date records.");
  if(prior.some(p=>p.client_worker_type&&!/employee/i.test(p.client_worker_type)))
   return blocked("The employee has non-payroll transactions in the same year; reconcile year-to-date records.");
  const ytd={
   cpp:round(prior.reduce((a,p)=>a+money(p.cpp),0)),
   cpp2:round(prior.reduce((a,p)=>a+money(p.cpp2),0)),
   ei:round(prior.reduce((a,p)=>a+money(p.ei),0)),
   pensionable:round(prior.reduce((a,p)=>a+money(p.t4_box26_cpp_pensionable_earnings??p.gross_pay),0)),
   insurable:round(prior.reduce((a,p)=>a+money(p.t4_box24_ei_insurable_earnings??p.gross_pay),0))
  };
  if(ytd.pensionable+gross>74600&&prior.some(p=>p.cpp2===null))
   return blocked("Prior CPP2 amounts were not recorded. Reconcile CPP2 before calculating this pay.");
  try {
   const result=calculate2026AlbertaRegularPay({
    grossPay:gross,payFrequency:input.frequency,payDate:input.payDate,
    federalTd1:dollars(profile.td1_federal_claim),albertaTd1:dollars(profile.td1_provincial_claim),
    additionalTax:money(profile.additional_income_tax),
    cppExempt:Boolean(profile.cpp_exempt),eiExempt:Boolean(profile.ei_exempt),
    federalTaxExempt:false,birthDate:profile.birth_date,ytd
   });
   if(result.netPay<0)return blocked("Deductions exceed earnings. Review TD1 and additional withholding.");
   return {workerId:line.workerId,name:worker.worker_name,result,issue:null};
  }catch(e){return blocked(e instanceof PayrollCalculationError?e.message:"Payroll calculation could not be completed.");}
 });
 const complete=lines.every(l=>l.result!==null);
 const calculated=lines.filter(l=>l.result!==null).map(l=>l.result!);
 const sum=(key:keyof Payroll2026Result)=>complete?round(calculated.reduce((a,v)=>a+Number(v[key]),0)):null;
 return {
  calculationYear:2026,province:"AB",lines,calculatedCount:calculated.length,
  blockedCount:lines.length-calculated.length,
  totalGross:sum("grossPay"),totalCpp:sum("cpp"),totalCpp2:sum("cpp2"),totalEi:sum("ei"),
  totalIncomeTax:sum("incomeTax"),totalDeductions:sum("employeeDeductions"),
  totalNetPay:sum("netPay"),totalEmployerCpp:sum("employerCpp"),
  totalEmployerCpp2:sum("employerCpp2"),totalEmployerEi:sum("employerEi"),
  totalEmployerContributions:sum("employerContributions"),
  totalPayrollCost:sum("totalPayrollCost"),
  information:[
   "CRA T4127 Option 1, 2026 rates and Alberta withholding formulas. Calculations use existing payroll year-to-date records; verify them against CRA PDOC.",
   "Deductions are estimates until historical pay, TD1 forms, CPP age/exemptions and pensionable/insurable earnings are verified.",
   "No bank transfers, payroll submissions, CRA remittances or T4/ROE filing occur from this preview."
  ]
 };
}
