"use client";
import { useState } from "react";

const catalog = {
  asset: [["1000","Business Bank"],["1010","Cash on Hand"],["1100","Accounts Receivable"],["1500","Vehicles"],["1510","Equipment & Tools"],["1520","Furniture & Computers"],["1530","Buildings"],["1540","Accumulated Depreciation"],["1600","GST Recoverable"]],
  liability: [["2000","Accounts Payable"],["2100","Business Loan Payable"],["2200","GST Payable"],["2300","Payroll Deductions Payable"],["2400","Credit Card Payable"]],
  equity: [["3000","Share Capital"],["3100","Retained Earnings"],["3200","Shareholder Contributions"],["3300","Shareholder Loan"]],
  income: [["4000","Service Revenue"],["4100","Sales Revenue"],["4200","Other Income"]],
  expense: [["5000","Vehicle Fuel Expense"],["5100","Vehicle Repairs & Maintenance"],["5200","Insurance Expense"],["5300","Salaries & Wages"],["5400","Employer CPP/EI Expense"],["5500","Professional Fees"],["5600","Office Supplies"],["5700","Rent Expense"],["5800","Utilities Expense"]]
} as const;
type AccountType = keyof typeof catalog;
export function AccountPicker() {
  const [type,setType] = useState<AccountType>("asset");
  const [choice,setChoice] = useState<string>("1000");
  const [customCode,setCustomCode] = useState("");
  const [customName,setCustomName] = useState("");
  const options: ReadonlyArray<readonly [string,string]> = catalog[type];
  const selected = options.find(x=>x[0]===choice) ?? options[0];
  const isCustom = choice==="custom";
  return <>
    <label className="grid gap-1 text-sm font-semibold">Account category
      <select className="field" name="type" value={type} onChange={e=>{const next=e.target.value as AccountType;setType(next);setChoice(catalog[next][0][0]);}}>
        <option value="asset">Assets — what the business owns</option>
        <option value="liability">Liabilities — what the business owes</option>
        <option value="equity">Equity — owners&apos; interest</option>
        <option value="income">Income — money earned</option>
        <option value="expense">Expenses — business costs</option>
      </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Choose account
      <select className="field" value={choice} onChange={e=>setChoice(e.target.value)}>
        {options.map(([code,name])=><option key={code} value={code}>{code} — {name}</option>)}
        <option value="custom">+ Create a different account</option>
      </select>
    </label>
    {isCustom ? <div className="grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">Custom code<input className="field" value={customCode} onChange={e=>setCustomCode(e.target.value)} placeholder="e.g. 1590" required/></label>
      <label className="grid gap-1 text-sm">Account name<input className="field" value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="Account name" required/></label>
    </div> : <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-950">Selected: <strong>{selected[0]} — {selected[1]}</strong>. The code and name will be filled automatically.</p>}
    <input type="hidden" name="code" value={isCustom?customCode:selected[0]}/>
    <input type="hidden" name="name" value={isCustom?customName:selected[1]}/>
  </>;
}
