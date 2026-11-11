"use client";

import { useState } from "react";

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const money = (value: number) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);

export function GstAmountFields() {
  const [mode, setMode] = useState<"before" | "total">("before");
  const [tax, setTax] = useState<"five" | "none">("five");
  const [entered, setEntered] = useState("");
  const value = Number(entered);
  const valid = entered.trim() !== "" && Number.isFinite(value) && value > 0;
  const rate = tax === "five" ? 0.05 : 0;
  const subtotal = valid ? round(mode === "total" ? value / (1 + rate) : value) : 0;
  const gst = valid ? round(mode === "total" ? value - subtotal : subtotal * rate) : 0;
  const total = round(subtotal + gst);
  return <div className="grid gap-3 rounded-lg border border-blue-100 bg-white p-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold text-slate-800">Enter amount as
        <select className="field" value={mode} onChange={event => setMode(event.target.value as "before" | "total")}>
          <option value="before">Before GST</option>
          <option value="total">Total including GST</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-slate-800">GST treatment
        <select className="field" value={tax} onChange={event => setTax(event.target.value as "five" | "none")}>
          <option value="five">GST 5% — taxable</option>
          <option value="none">No GST — zero-rated, exempt or not applicable</option>
        </select>
      </label>
    </div>
    <label className="grid gap-1 text-sm font-semibold text-slate-800">{mode === "before" ? "Amount before GST ($)" : "Total amount paid / invoiced ($)"}
      <input className="field" type="number" min="0.01" step="0.01" value={entered} onChange={event => setEntered(event.target.value)} required placeholder="0.00" />
    </label>
    <input type="hidden" name="amount" value={valid ? subtotal.toFixed(2) : ""} />
    <input type="hidden" name="gst" value={valid ? gst.toFixed(2) : "0.00"} />
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-blue-50 p-3 text-center">
      <div><p className="text-xs text-slate-600">Before GST</p><p className="font-bold text-blue-950">{money(subtotal)}</p></div>
      <div><p className="text-xs text-slate-600">GST {rate ? "5%" : "0%"}</p><p className="font-bold text-blue-950">{money(gst)}</p></div>
      <div><p className="text-xs text-slate-600">Total</p><p className="font-black text-blue-950">{money(total)}</p></div>
    </div>
    <p className="text-xs text-slate-600">Verify the GST amount against the receipt or invoice. GST is not charged on every transaction, and an input tax credit requires eligibility.</p>
  </div>;
}
