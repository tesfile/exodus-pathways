import type { AccountingData } from "@/lib/accounting/data";
import type { WorkersPaymentsData } from "@/lib/workers-payments";

type Line = { date: string; reference: string; account: string; debit: number; credit: number; source: string };
const cent = (n: number | string | null | undefined) => Math.round((Number(n) || 0) * 100);
const fmt = (n: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n / 100);
const groups: Record<string, string> = {
  "Sales Revenue": "Revenue", "GST Collected": "Liability", "GST Recoverable (subject to eligibility)": "Asset",
  "Unclassified Income Clearing": "Asset", "Unclassified Expense Clearing": "Liability",
  "Payroll Net Pay Clearing": "Liability", "CPP Payable — Employee": "Liability", "CPP Payable — Employer": "Liability",
  "EI Payable — Employee": "Liability", "EI Payable — Employer": "Liability", "Payroll Income Tax Payable": "Liability",
  "Wages Expense": "Expense", "Employer CPP/EI Expense": "Expense"
};
export function UnifiedAccountingPreview({ accounting, payroll }: { accounting: AccountingData; payroll: WorkersPaymentsData }) {
  const lines: Line[] = [];
  const warnings: string[] = [];
  const add = (date: string, reference: string, source: string, account: string, debit: number, credit: number) => {
    if (debit || credit) lines.push({ date, reference, source, account, debit, credit });
  };
  for (const item of accounting.income) {
    const amount = cent(item.amount), gst = cent(item.gst_hst_amount);
    if (amount <= 0) continue;
    add(item.entry_date, item.id.slice(0, 8), "Income · " + item.status, "Unclassified Income Clearing", amount + gst, 0);
    add(item.entry_date, item.id.slice(0, 8), "Income · " + item.status, "Sales Revenue", 0, amount);
    add(item.entry_date, item.id.slice(0, 8), "Income · " + item.status, "GST Collected", 0, gst);
  }
  for (const item of accounting.expenses) {
    const amount = cent(item.amount), gst = cent(item.gst_hst_amount);
    if (amount <= 0) continue;
    add(item.expense_date, item.id.slice(0, 8), "Expense · " + item.status, item.category || "Uncategorized Expense", amount, 0);
    add(item.expense_date, item.id.slice(0, 8), "Expense · " + item.status, "GST Recoverable (subject to eligibility)", gst, 0);
    add(item.expense_date, item.id.slice(0, 8), "Expense · " + item.status, "Unclassified Expense Clearing", 0, amount + gst);
  }
  for (const p of payroll.payments.filter(p => p.admin_classification === "T4 Employee")) {
    const gross = cent(p.gross_pay), net = cent(p.net_pay), cpp = cent(p.cpp), ei = cent(p.ei), tax = cent(p.income_tax_deducted);
    const employerCpp = cent(p.payroll_calculator_employer_cpp), employerEi = cent(p.payroll_calculator_employer_ei);
    if (gross <= 0 || gross !== net + cpp + ei + tax) {
      warnings.push("Payroll " + p.id.slice(0, 8) + " has an unreconciled gross/net amount and is excluded.");
      continue;
    }
    const date = p.payment_date, ref = p.id.slice(0, 8), source = "Payroll";
    add(date, ref, source, "Wages Expense", gross, 0);
    add(date, ref, source, "Payroll Net Pay Clearing", 0, net);
    add(date, ref, source, "CPP Payable — Employee", 0, cpp);
    add(date, ref, source, "EI Payable — Employee", 0, ei);
    add(date, ref, source, "Payroll Income Tax Payable", 0, tax);
    add(date, ref, source, "Employer CPP/EI Expense", employerCpp + employerEi, 0);
    add(date, ref, source, "CPP Payable — Employer", 0, employerCpp);
    add(date, ref, source, "EI Payable — Employer", 0, employerEi);
  }
  lines.sort((a,b) => a.date.localeCompare(b.date) || a.reference.localeCompare(b.reference));
  const accounts = new Map<string, { debit: number; credit: number }>();
  for (const line of lines) {
    const a = accounts.get(line.account) || { debit: 0, credit: 0 };
    a.debit += line.debit; a.credit += line.credit; accounts.set(line.account, a);
  }
  const trial = [...accounts].map(([account, totals]) => ({ account, type: groups[account] || "Expense / review", debit: Math.max(0, totals.debit - totals.credit), credit: Math.max(0, totals.credit - totals.debit) }));
  const sumDebit = trial.reduce((n, a) => n + a.debit, 0), sumCredit = trial.reduce((n, a) => n + a.credit, 0);
  const revenue = cent(accounting.totals.income);
  const expenses = accounting.expenses.reduce((n, item) => n + cent(item.amount), 0);
  const wages = payroll.payments.filter(p => p.admin_classification === "T4 Employee" && cent(p.gross_pay) === cent(p.net_pay) + cent(p.cpp) + cent(p.ei) + cent(p.income_tax_deducted)).reduce((n, p) => n + cent(p.gross_pay), 0);
  const employer = payroll.payments.filter(p => p.admin_classification === "T4 Employee" && cent(p.gross_pay) === cent(p.net_pay) + cent(p.cpp) + cent(p.ei) + cent(p.income_tax_deducted)).reduce((n,p) => n + cent(p.payroll_calculator_employer_cpp) + cent(p.payroll_calculator_employer_ei), 0);
  return <div className="grid gap-4">
    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><strong>Combined accounting preview — not posted financial books.</strong> This includes saved income/expense drafts and reconciled T4 payroll. Cash, bank, A/R and A/P are held in unclassified clearing accounts because payment status is not yet captured. Do not use this as a final financial statement or tax return. Payroll is included once, not duplicated as a manual expense.</p>
    {warnings.map(w => <p key={w} className="text-sm text-red-800">{w}</p>)}
    <details id="unified-general-ledger" className="rounded-lg border p-3"><summary className="cursor-pointer font-bold text-blue-950">General Ledger — All saved income, expenses and payroll ({lines.length} lines)</summary>
      <div className="mt-3 max-h-[480px] overflow-auto"><table className="w-full min-w-[750px] text-sm"><thead><tr className="border-b text-left"><th className="p-2">Date</th><th>Source</th><th>Reference</th><th>Account</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead><tbody>{lines.map((line,i) => <tr key={i} className="border-b"><td className="p-2">{line.date}</td><td>{line.source}</td><td>{line.reference}</td><td>{line.account}</td><td className="text-right">{line.debit ? fmt(line.debit) : "—"}</td><td className="text-right">{line.credit ? fmt(line.credit) : "—"}</td></tr>)}</tbody></table></div>
    </details>
    <details id="unified-trial-balance" className="rounded-lg border p-3"><summary className="cursor-pointer font-bold text-blue-950">Trial Balance — All accounts ({trial.length})</summary>
      <div className="mt-3 overflow-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b text-left"><th className="p-2">Account</th><th>Type</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead><tbody>{trial.map(a => <tr key={a.account} className="border-b"><td className="p-2">{a.account}</td><td>{a.type}</td><td className="text-right">{a.debit ? fmt(a.debit) : "—"}</td><td className="text-right">{a.credit ? fmt(a.credit) : "—"}</td></tr>)}</tbody><tfoot><tr className="font-bold"><td className="p-2" colSpan={2}>Total</td><td className="text-right">{fmt(sumDebit)}</td><td className="text-right">{fmt(sumCredit)}</td></tr></tfoot></table></div>
      <p className="mt-2 text-sm">{sumDebit === sumCredit ? "Debits and credits agree for these preview entries." : "Warning: preview is out of balance."}</p>
    </details>
    <details id="unified-financial-statements" className="rounded-lg border p-3"><summary className="cursor-pointer font-bold text-blue-950">Income Statement — Including payroll</summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{[["Revenue (draft-inclusive)",revenue],["Other expense entries",expenses],["Wages",wages],["Employer CPP/EI",employer],["Estimated net income (before other adjustments)",revenue-expenses-wages-employer]].map(([label,value]) => <div key={String(label)} className="flex justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"><span>{label}</span><strong>{fmt(Number(value))}</strong></div>)}</div>
      <p className="mt-2 text-xs text-slate-600">A reliable Balance Sheet requires verified bank balances, receivables, payables, opening balances, and posted journal entries; these are not yet available.</p>
    </details>
  </div>;
}
