"use client";

import { FormEvent, useMemo, useState } from "react";
import { PackagePlus, Save } from "lucide-react";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured
} from "@/lib/supabase/browser";

function todayInputDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export function SmartAssetForm({ taxYear }: { taxYear: number }) {
  const [status, setStatus] = useState("");
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const purchaseDate = String(form.get("purchaseDate") ?? "");
    const description = String(form.get("description") ?? "").trim();
    const assetClass = String(form.get("assetClass") ?? "").trim();
    const cost = Number(form.get("cost") ?? 0);
    const recordYear = Number(purchaseDate.slice(0, 4)) || taxYear;

    if (!purchaseDate || !description || cost <= 0) {
      setStatus("Please complete Purchase Date, Description, and Cost.");
      return;
    }

    if (!configured) {
      setStatus("Supabase is required before saving assets.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("Please sign in before saving.");
      return;
    }

    const { error } = await supabase.from("assets").insert({
      client_id: user.id,
      description,
      purchase_date: purchaseDate,
      cost,
      asset_class: assetClass || null,
      tax_year: recordYear,
      status: "active"
    });

    if (error) {
      setStatus(`Asset could not be saved: ${error.message}`);
      return;
    }

    setStatus("Asset saved.");
    formElement.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <PackagePlus className="h-6 w-6 text-exodus-gold" aria-hidden="true" />
        <h2 className="text-xl font-black text-exodus-navy">Add Asset Purchase</h2>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <div>
          <label htmlFor="asset-purchase-date" className="label">Purchase Date</label>
          <input id="asset-purchase-date" name="purchaseDate" type="date" className="field mt-2" defaultValue={todayInputDate()} required />
        </div>
        <div>
          <label htmlFor="asset-description" className="label">Description</label>
          <input id="asset-description" name="description" className="field mt-2" placeholder="Truck, equipment, computer" required />
        </div>
        <div>
          <label htmlFor="asset-class" className="label">Class</label>
          <input id="asset-class" name="assetClass" className="field mt-2" placeholder="Equipment / vehicle" />
        </div>
        <div>
          <label htmlFor="asset-cost" className="label">Cost</label>
          <input id="asset-cost" name="cost" type="number" min="0" step="0.01" className="field mt-2" placeholder="1500.00" required />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-exodus-navy px-5 text-sm font-black text-white transition hover:bg-exodus-blue">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save Asset
        </button>
        {status ? <p className="text-sm font-bold text-exodus-navy">{status}</p> : null}
      </div>
    </form>
  );
}
