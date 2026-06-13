"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, ReceiptText, Save, UploadCloud } from "lucide-react";
import { defaultExpenseTypes, paidToDefaults } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
import {
  createBrowserSupabaseClient,
  isBrowserSupabaseConfigured
} from "@/lib/supabase/browser";

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function todayInputDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export function SmartExpenseForm({ taxYear }: { taxYear: number }) {
  const { t } = useT();
  const searchParams = useSearchParams();
  const quickType = searchParams.get("type") ?? "";
  const [paidToOptions, setPaidToOptions] = useState<string[]>(paidToDefaults);
  const [typeOptions, setTypeOptions] = useState<string[]>(defaultExpenseTypes.map((type) => type.value));
  const [paidTo, setPaidTo] = useState("");
  const [newPaidTo, setNewPaidTo] = useState("");
  const [expenseType, setExpenseType] = useState(quickType || "Materials");
  const [newType, setNewType] = useState("");
  const [status, setStatus] = useState("");
  const configured = useMemo(() => isBrowserSupabaseConfigured(), []);

  useEffect(() => {
    if (!configured) {
      return;
    }

    async function loadDirectories() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const [{ data: paidToRows }, { data: typeRows }] = await Promise.all([
        supabase.from("paid_to_directory").select("name").eq("client_id", user.id).order("name"),
        supabase
          .from("expense_types")
          .select("name")
          .or(`client_id.eq.${user.id},client_id.is.null`)
          .order("name")
      ]);

      setPaidToOptions((current) => unique([...current, ...(paidToRows?.map((row) => row.name as string) ?? [])]));
      setTypeOptions((current) => unique([...current, ...(typeRows?.map((row) => row.name as string) ?? [])]));
    }

    void loadDirectories();
  }, [configured]);

  async function saveDirectoryValues(clientId: string, paidToName: string, typeName: string) {
    const supabase = createBrowserSupabaseClient();
    const [paidToResult, typeResult] = await Promise.all([
      supabase
        .from("paid_to_directory")
        .upsert(
          {
            client_id: clientId,
            name: paidToName,
            normalized_name: normalizeName(paidToName),
            use_count: 1,
            last_used_at: new Date().toISOString()
          },
          { onConflict: "client_id,normalized_name" }
        ),
      supabase
        .from("expense_types")
        .upsert(
          {
            client_id: clientId,
            name: typeName,
            normalized_name: normalizeName(typeName)
          },
          { onConflict: "client_id,normalized_name" }
        )
    ]);

    if (paidToResult.error || typeResult.error) {
      throw new Error(paidToResult.error?.message ?? typeResult.error?.message ?? "Directory save failed.");
    }
  }

  function updateDirectoryOptions(paidToName: string, typeName: string) {
    const nextPaidTo = unique([...paidToOptions, paidToName]);
    const nextTypes = unique([...typeOptions, typeName]);
    setPaidToOptions(nextPaidTo);
    setTypeOptions(nextTypes);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const finalPaidTo = paidTo === "__new__" ? newPaidTo : paidTo;
    const finalType = expenseType === "__new__" ? newType : expenseType;
    const transactionDate = String(form.get("transactionDate") ?? "");
    const transactionYear = Number(transactionDate.slice(0, 4)) || taxYear;
    const what = String(form.get("what") ?? "");
    const amount = Number(form.get("amount") ?? 0);
    const gst = Number(form.get("gst") ?? 0);
    const notes = String(form.get("notes") ?? "");
    const receipt = (form.get("receipt") || form.get("cameraReceipt")) as File | null;

    if (!transactionDate || !finalPaidTo || !finalType || !what || amount <= 0) {
      setStatus("Please complete Expense Date, Paid To, What, Type, and Amount.");
      return;
    }

    if (!configured) {
      setStatus("Supabase is required before saving expenses.");
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

    let directoryWarning = "";
    try {
      await saveDirectoryValues(user.id, finalPaidTo, finalType);
    } catch (error) {
      directoryWarning = error instanceof Error ? error.message : "Saved names could not be updated.";
    }

    const { data: expense, error: expenseError } = await supabase
      .from("expense_entries")
      .insert({
        client_id: user.id,
        expense_date: transactionDate,
        category: finalType,
        vendor: finalPaidTo,
        description: what,
        amount,
        gst_hst_amount: gst,
        tax_year: transactionYear,
        status: "submitted",
        notes
      })
      .select("id")
      .single();

    if (expenseError) {
      setStatus(`Expense could not be saved: ${expenseError.message}`);
      return;
    }

    if (receipt && receipt.size > 0) {
      const safeName = receipt.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const receiptPath = `${user.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("receipts").upload(receiptPath, receipt, {
        cacheControl: "3600",
        upsert: false
      });

      if (uploadError) {
        updateDirectoryOptions(finalPaidTo, finalType);
        setStatus(`Expense saved, but receipt upload failed: ${uploadError.message}`);
        formElement.reset();
        setPaidTo("");
        setNewPaidTo("");
        setNewType("");
        return;
      }

      const { error: receiptError } = await supabase.from("receipts").insert({
        client_id: user.id,
        expense_id: expense?.id,
        bucket: "receipts",
        storage_path: receiptPath,
        file_name: receipt.name,
        vendor: finalPaidTo,
        receipt_date: transactionDate,
        amount,
        tax_year: transactionYear,
        status: "uploaded"
      });

      if (receiptError) {
        updateDirectoryOptions(finalPaidTo, finalType);
        setStatus(`Expense saved, but receipt record failed: ${receiptError.message}`);
        formElement.reset();
        setPaidTo("");
        setNewPaidTo("");
        setNewType("");
        return;
      }

      const { error: documentError } = await supabase.from("documents").insert({
        client_id: user.id,
        uploaded_by: user.id,
        bucket: "receipts",
        storage_path: receiptPath,
        document_type: "receipt",
        file_name: receipt.name,
        mime_type: receipt.type || "application/octet-stream",
        size_bytes: receipt.size,
        document_date: transactionDate,
        tax_year: transactionYear,
        status: "uploaded"
      });

      if (documentError) {
        updateDirectoryOptions(finalPaidTo, finalType);
        setStatus(`Expense saved, but document record failed: ${documentError.message}`);
        formElement.reset();
        setPaidTo("");
        setNewPaidTo("");
        setNewType("");
        return;
      }
    }

    updateDirectoryOptions(finalPaidTo, finalType);
    setStatus(directoryWarning ? `${t("expense.form.saved")} Saved list update failed: ${directoryWarning}` : t("expense.form.saved"));
    formElement.reset();
    setPaidTo("");
    setNewPaidTo("");
    setNewType("");
  }

  return (
    <form onSubmit={handleSubmit} className="mobile-panel">
      <div className="flex items-center gap-3">
        <ReceiptText className="h-6 w-6 text-exodus-gold" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-black text-exodus-navy">Add what you paid</h2>
          <p className="mt-1 text-sm leading-6 text-exodus-slate">Take a picture or upload a receipt if you have one.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <section className="grid gap-4 rounded-md bg-exodus-light p-4 lg:grid-cols-2">
          <h3 className="text-base font-black text-exodus-navy lg:col-span-2">1. What did you buy?</h3>
        <div>
          <label htmlFor="expense-date" className="label">
            Expense Date
          </label>
          <input id="expense-date" name="transactionDate" type="date" className="field mt-2" defaultValue={todayInputDate()} required />
        </div>

        <div>
          <label htmlFor="paid-to" className="label">
            {t("expense.form.paidTo")}
          </label>
          <select id="paid-to" className="field mt-2" value={paidTo} onChange={(event) => setPaidTo(event.target.value)} required>
            <option value="">{t("expense.form.placeholderPaidTo")}</option>
            {paidToOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value="__new__">{t("common.addNew")}</option>
          </select>
          {paidTo === "__new__" ? (
            <input className="field mt-2" value={newPaidTo} onChange={(event) => setNewPaidTo(event.target.value)} placeholder="ABC Roofing Supply" />
          ) : null}
        </div>

        <div>
          <label htmlFor="what" className="label">
            {t("expense.form.what")}
          </label>
          <input id="what" name="what" className="field mt-2" placeholder={t("expense.form.placeholderWhat")} required />
        </div>

        <div>
          <label htmlFor="type" className="label">
            {t("expense.form.type")}
          </label>
          <select id="type" className="field mt-2" value={expenseType} onChange={(event) => setExpenseType(event.target.value)} required>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {defaultExpenseTypes.find((type) => type.value === option)?.labelKey
                  ? t(defaultExpenseTypes.find((type) => type.value === option)!.labelKey)
                  : option}
              </option>
            ))}
            <option value="__new__">{t("common.addNew")}</option>
          </select>
          {expenseType === "__new__" ? (
            <input className="field mt-2" value={newType} onChange={(event) => setNewType(event.target.value)} placeholder={t("type.other")} />
          ) : null}
        </div>
        </section>

        <section className="grid gap-4 rounded-md bg-exodus-light p-4 lg:grid-cols-2">
          <h3 className="text-base font-black text-exodus-navy lg:col-span-2">2. Amount and receipt</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="amount" className="label">
              {t("expense.form.amount")}
            </label>
            <input id="amount" name="amount" type="number" min="0" step="0.01" className="field mt-2" placeholder="250.00" required />
          </div>
          <div>
            <label htmlFor="gst" className="label">
              {t("expense.form.gst")}
            </label>
            <input id="gst" name="gst" type="number" min="0" step="0.01" className="field mt-2" placeholder="12.50" />
          </div>
        </div>

        <div>
          <label htmlFor="receipt" className="label">
            {t("expense.form.receipt")}
          </label>
          <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-exodus-light px-4 text-sm font-black text-exodus-navy">
            <UploadCloud className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
            {t("common.upload")}
            <input id="receipt" name="receipt" type="file" accept="image/*,.pdf" className="sr-only" />
          </label>
        </div>

        <div>
          <span className="label">{t("common.takePicture")}</span>
          <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-exodus-navy shadow-sm">
            <Camera className="h-4 w-4 text-exodus-gold" aria-hidden="true" />
            {t("common.takePicture")}
            <input name="cameraReceipt" type="file" accept="image/*" capture="environment" className="sr-only" />
          </label>
        </div>
        </section>

        <section className="grid gap-4 rounded-md bg-exodus-light p-4">
          <label htmlFor="notes" className="label">
            3. Notes
          </label>
          <textarea id="notes" name="notes" className="field mt-2 min-h-24" placeholder={t("expense.form.placeholderNotes")} />
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="mobile-action">
          <Save className="h-4 w-4" aria-hidden="true" />
          {t("expense.form.save")}
        </button>
        {status ? <p className="text-sm font-bold text-exodus-navy">{status}</p> : null}
      </div>
    </form>
  );
}
