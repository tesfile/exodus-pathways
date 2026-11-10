import type { WorkersPaymentsData } from "@/lib/workers-payments";

const cents = (value: number | string | null | undefined) => Math.round((Number(value) || 0) * 100);
const currency = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value / 100);

type Line = { date: string; reference: string; account: string; debit: number; credit: number };
type Balance = { account: string; debit: number; credit: number };

export function PayrollLedger({ data }: { data: WorkersPaymentsData }) {
  const lines: Line[] = [];
  const warnings: string[] = [];
  for (const payment of data.payments.filter(p => p.admin_classification === "T4 Employee")) {
    const gross = cents(payment.gross_pay);
    const cpp = cents(payment.cpp);
    const ei = cents(payment.ei);
    const tax = cents(payment.income_tax_deducted);
    const net = cents(payment.net_pay);
    const employerCpp = cents(payment.payroll_calculator_employer_cpp);
    const employerEi = cents(payment.payroll_calculator_employer_ei);
    const ref = payment.id.slice(0, 8);
    const date = payment.payment_date;
    const deductions = cpp + ei + tax;
    if (gross <= 0 || gross !== deductions + net) {
      warnings.push(`Payroll ${ref} does not reconcile: gross ${currency(gross)}, deductions ${currency(deductions)}, net ${currency(net)}. Excluded from the ledger preview.`);
      continue;
    }
    const push = (account: string, debit: number, credit: number) => {
      if (debit || credit) lines.push({ date, reference: ref, account, debit, credit });
    };
    push("Salaries & Wages Expense", gross, 0);
    push("Net Payroll Clearing (payment status unverified)", 0, net);
    push("CPP Payable — employee", 0, cpp);
    push("EI Payable — employee", 0, ei);
    push("Payroll Income Tax Payable", 0, tax);
    if (employerCpp || employerEi) {
      push("Employer Payroll Contributions Expense", employerCpp + employerEi, 0);
      push("CPP Payable — employer", 0, employerCpp);
      push("EI Payable — employer", 0, employerEi);
    } else {
      warnings.push(`Payroll ${ref}: employer CPP/EI is zero or unavailable; verify before posting.`);
    }
  }
  const totals = new Map<string, Balance>();
  for (const line of lines) {
    const existing = totals.get(line.account) ?? { account: line.account, debit: 0, credit: 0 };
    existing.debit += line.debit;
    existing.credit += line.credit;
    totals.set(line.account, existing);
  }
  const balance = [...totals.values()].map(item => ({
    account: item.account,
    debit: Math.max(0, item.debit - item.credit),
    credit: Math.max(0, item.credit - item.debit)
  }));
  const sumDebit = lines.reduce((n, line) => n + line.debit, 0);
  const sumCredit = lines.reduce((n, line) => n + line.credit, 0);
  return <section className="grid gap-4 rounded-md border border-slate-200 p-4">
    <h3 className="text-lg font-black text-exodus-navy">Payroll → General Ledger & Trial Balance</h3>
    <p className="text-sm text-slate-600">Automatically prepared from saved T4 payroll for this client and year. These are balanced <strong>preview entries, not posted journal records</strong>. Net pay is held in payroll clearing until actual payment is confirmed. Payroll deductions remain liabilities until remitted. Do not enter wages again as a manual expense.</p>
    {warnings.map((warning, i) => <p key={i} className="rounded border border-amber-300 p-2 text-sm">{warning}</p>)}
    {lines.length ? <>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">Date</th><th className="p-2">Payroll ref</th><th className="p-2">Account</th><th className="p-2 text-right">Debit</th><th className="p-2 text-right">Credit</th></tr></thead><tbody>{lines.map((line, i) => <tr className="border-b" key={i}><td className="p-2">{line.date}</td><td className="p-2">{line.reference}</td><td className="p-2">{line.account}</td><td className="p-2 text-right">{line.debit ? currency(line.debit) : "—"}</td><td className="p-2 text-right">{line.credit ? currency(line.credit) : "—"}</td></tr>)}</tbody><tfoot><tr className="font-bold"><td className="p-2" colSpan={3}>Total</td><td className="p-2 text-right">{currency(sumDebit)}</td><td className="p-2 text-right">{currency(sumCredit)}</td></tr></tfoot></table></div>
      <h4 className="font-bold text-exodus-navy">Payroll trial balance (preview)</h4>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="p-2 text-left">Account</th><th className="p-2 text-right">Debit</th><th className="p-2 text-right">Credit</th></tr></thead><tbody>{balance.map(item => <tr className="border-b" key={item.account}><td className="p-2">{item.account}</td><td className="p-2 text-right">{item.debit ? currency(item.debit) : "—"}</td><td className="p-2 text-right">{item.credit ? currency(item.credit) : "—"}</td></tr>)}</tbody></table></div>
      <p className="text-sm font-semibold">{sumDebit === sumCredit ? "Debits and credits agree." : "Warning: journal is out of balance."} This is payroll only, not the full company trial balance.</p>
    </> : <p className="text-sm text-slate-600">No reconciled T4 payroll entries to preview for the selected year.</p>}
  </section>;
}
