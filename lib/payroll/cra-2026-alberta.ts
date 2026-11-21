/**
 * 2026 regular salary/wage payroll calculation (Alberta only).
 * CRA T4127 122nd (Jan) + 123rd (July) 2026 Option 1 formulas.
 *
 * References:
 * https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul.html
 * https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/payroll-deductions-t4127-payroll-deductions-formulas/t4127-jan-122nd-edition-effective-january-1-2026/t4127-jan-payroll-deductions-formulas-computer-programs.html
 *
 * Excludes Quebec, commission formulas, non-periodic bonuses, taxable benefits,
 * RPP/RRSP adjustments, mid-year transfers, employer EI reduced rates, CPT30,
 * split pay periods, and non-standard employee circumstances.
 * Never auto-release payments or CRA submissions based on this preview.
 */
export type Frequency2026="weekly"|"biweekly"|"semimonthly"|"monthly";
export type Payroll2026Input={
  grossPay:number;
  payFrequency:Frequency2026;
  payDate:string;
  federalTd1:number|null;
  albertaTd1:number|null;
  additionalTax:number;
  cppExempt:boolean;
  eiExempt:boolean;
  federalTaxExempt:boolean;
  birthDate:string|null;
  ytd:{
    cpp:number;cpp2:number;ei:number;pensionable:number;insurable:number;
  };
};
export type Payroll2026Result={
  year:2026;
  province:"AB";
  cpp:number;cpp2:number;ei:number;
  federalTax:number;albertaTax:number;incomeTax:number;
  employeeDeductions:number;netPay:number;
  employerCpp:number;employerCpp2:number;employerEi:number;
  employerContributions:number;totalPayrollCost:number;
  grossPay:number;annualTaxableIncome:number;payPeriods:number;
  federalTd1Used:number;albertaTd1Used:number;
  source:"CRA T4127 2026 option 1";
};
export class PayrollCalculationError extends Error {
 constructor(message:string){super(message);this.name="PayrollCalculationError";}
}
const round=(v:number)=>Math.round((v+Number.EPSILON)*100)/100;
const truncatedCents=(v:number)=>Math.floor((v+Number.EPSILON)*100)/100;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const periods:Record<Frequency2026,number>={weekly:52,biweekly:26,semimonthly:24,monthly:12};
function dateOk(s:string){const d=new Date(s+"T00:00:00Z");return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
function bracket(value:number,points:number[],rates:number[],constants:number[]){
 let index=points.length-1;
 for(let i=0;i<points.length-1;i++){if(value<points[i+1]){index=i;break;}}
 return value*rates[index]-constants[index];
}
function federalBpa(annualTaxable:number){
 if(annualTaxable<=181440)return 16452;
 if(annualTaxable>=258482)return 14829;
 return round(16452-(annualTaxable-181440)*(1623/77042));
}
function cppEligibleOn(payDate:string,birthDate:string){
 const payMonth=payDate.slice(0,7);
 const bornMonth=birthDate.slice(0,7);
 const bornYear=Number(birthDate.slice(0,4)),bornMo=Number(birthDate.slice(5,7));
 const begins=(bornYear+18)+"-"+String(bornMo).padStart(2,"0");
 const end=(bornYear+70)+"-"+String(bornMo).padStart(2,"0");
 // CPP starts in the month following the employee's 18th birthday, ends after month turning 70.
 return payMonth>begins&&payMonth<=end&&bornMonth<payMonth;
}
export function calculate2026AlbertaRegularPay(input:Payroll2026Input):Payroll2026Result {
 if(!dateOk(input.payDate)||!input.payDate.startsWith("2026-"))
  throw new PayrollCalculationError("This calculation only supports pay dates in 2026.");
 const P=periods[input.payFrequency];
 if(!P)throw new PayrollCalculationError("Unsupported pay frequency.");
 if(!input.birthDate||!dateOk(input.birthDate)||input.birthDate>input.payDate)
  throw new PayrollCalculationError("Enter a valid employee birth date to check CPP eligibility.");
 for(const value of [input.grossPay,input.additionalTax,input.ytd.cpp,input.ytd.cpp2,input.ytd.ei,input.ytd.pensionable,input.ytd.insurable]){
  if(!Number.isFinite(value)||value<0||value>10000000)throw new PayrollCalculationError("Invalid pay or year-to-date information.");
 }
 if(input.grossPay<=0)throw new PayrollCalculationError("Enter a positive gross wage before calculating payroll.");
 if(input.federalTd1!==null&&(!Number.isFinite(input.federalTd1)||input.federalTd1<0))throw new PayrollCalculationError("Invalid federal TD1 amount.");
 if(input.albertaTd1!==null&&(!Number.isFinite(input.albertaTd1)||input.albertaTd1<0))throw new PayrollCalculationError("Invalid Alberta TD1 amount.");
 const eligible=!input.cppExempt&&cppEligibleOn(input.payDate,input.birthDate);
 const ageYear=Number(input.birthDate.slice(0,4));
 const birthMonth=Number(input.birthDate.slice(5,7));
 const turn18Year=ageYear+18,turn70Year=ageYear+70;
 const PM=turn18Year===2026?12-birthMonth:turn70Year===2026?birthMonth:12;
 const maxCpp=round(4230.45*(PM/12));
 const maxCpp2=round(416*(PM/12));
 const maxBaseCpp=round(3519.45*(PM/12));
 // CRA Chapter 6, basic exemption truncated (not rounded) to 2 decimal places.
 const cppBasicExemption=truncatedCents(3500/P);
 const C=eligible?round(clamp(Math.min(
  maxCpp-input.ytd.cpp,
  0.0595*Math.max(0,input.grossPay-cppBasicExemption)
 ),0,maxCpp)):0;
 // The second CPP contribution is based on accumulated pensionable wages with this employer.
 const W=Math.max(input.ytd.pensionable,74600);
 const C2=eligible?round(clamp(Math.min(
  maxCpp2-input.ytd.cpp2,
  0.04*Math.max(0,input.ytd.pensionable+input.grossPay-W)
 ),0,maxCpp2)):0;
 const EI=input.eiExempt?0:round(clamp(Math.min(1123.07-input.ytd.ei,0.0163*input.grossPay),0,1123.07));
 // First additional CPP and CPP2 are deductible in computing taxable income.
 const F5=round(C*(0.01/0.0595)+C2);
 const A=Math.max(0,P*(input.grossPay-F5));
 const TC=input.federalTd1===null?federalBpa(A):input.federalTd1;
 const TCP=input.albertaTd1===null?22769:input.albertaTd1;
 // K2/K2P credits for BASE CPP and EI, with current-year annual caps.
 const baseRatio=0.0495/0.0595;
 const annualBaseCPP=Math.min(maxBaseCpp,Math.max(P*C*baseRatio,input.ytd.cpp*baseRatio));
 const annualEI=Math.min(1123.07,Math.max(P*EI,input.ytd.ei));
 const K2=0.14*(annualBaseCPP+annualEI);
 const K2P=0.08*(annualBaseCPP+annualEI);
 const K4=Math.min(0.14*P*input.grossPay,0.14*1501);
 const federalBracket=bracket(A,[0,58523,117045,181440,258482],[.14,.205,.26,.29,.33],[0,3804,10241,15685,26024]);
 const provincialBracket=bracket(A,[0,61200,154259,185111,246813,370220],[.08,.10,.12,.13,.14,.15],[0,1224,4309,6160,8628,12331]);
 const K5P=Math.max(0,((0.08*TCP)+K2P-4896)*0.25);
 const T3=Math.max(0,federalBracket-0.14*TC-K2-K4);
 const T4=Math.max(0,provincialBracket-0.08*TCP-K2P-K5P);
 if(input.federalTaxExempt)throw new PayrollCalculationError("Documented income-tax exemption needs a special review before automatic calculation.");
 const federalTax=round(T3/P);
 const albertaTax=round(T4/P);
 const incomeTax=round((T3+T4)/P+input.additionalTax);
 const employeeDeductions=round(C+C2+EI+incomeTax);
 const netPay=round(input.grossPay-employeeDeductions);
 const employerCpp=C,employerCpp2=C2,employerEi=round(EI*1.4);
 const employerContributions=round(employerCpp+employerCpp2+employerEi);
 return {year:2026,province:"AB",cpp:C,cpp2:C2,ei:EI,federalTax,albertaTax,incomeTax,
  employeeDeductions,netPay,employerCpp,employerCpp2,employerEi,employerContributions,
  totalPayrollCost:round(input.grossPay+employerContributions),grossPay:round(input.grossPay),
  annualTaxableIncome:round(A),payPeriods:P,federalTd1Used:round(TC),albertaTd1Used:round(TCP),
  source:"CRA T4127 2026 option 1"};
}
