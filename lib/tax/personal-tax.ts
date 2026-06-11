import {
  formatDate,
  formatDateTime,
  formatMoney,
  getClientOptionForCurrentUser,
  getClientOptions,
  toNumber,
  type ClientOption
} from "@/lib/accounting/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DemoRow } from "@/lib/types";

export type PersonalTaxSlip = {
  id: string;
  client_id: string;
  client_name: string;
  tax_year: number;
  slip_type: string;
  payer_name: string | null;
  document_date: string | null;
  uploaded_at: string;
  file_name: string;
  bucket: string;
  storage_path: string;
  status: string;
  notes: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  download_url: string;
};

export type TaxSlipExtraction = {
  id: string;
  slip_id: string;
  box_number: string;
  box_label: string;
  extracted_value: number | string | null;
  confirmed_value: number | string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type PersonalTaxSlipRow = Omit<PersonalTaxSlip, "client_name" | "download_url">;

export async function getPersonalTaxSlips(clientId?: string, taxYear?: number): Promise<PersonalTaxSlip[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("personal_tax_slips")
    .select("id,client_id,tax_year,slip_type,payer_name,document_date,uploaded_at,file_name,bucket,storage_path,status,notes,reviewed_at,review_notes")
    .order("uploaded_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  if (taxYear) {
    query = query.eq("tax_year", taxYear);
  }

  const [{ data }, clients] = await Promise.all([query, getClientOptions()]);
  const clientById = new Map(clients.map((client) => [client.id, client.companyName]));

  return Promise.all(
    ((data ?? []) as PersonalTaxSlipRow[]).map(async (slip) => ({
      ...slip,
      client_name: clientById.get(slip.client_id) ?? "Client",
      download_url: await createSignedDownloadUrl(slip.bucket, slip.storage_path)
    }))
  );
}

export async function getTaxSlipExtractions(slipIds: string[]): Promise<TaxSlipExtraction[]> {
  if (slipIds.length === 0) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("tax_slip_extractions")
    .select("id,slip_id,box_number,box_label,extracted_value,confirmed_value,status,created_at,updated_at")
    .in("slip_id", slipIds)
    .order("box_number", { ascending: true });

  return (data ?? []) as TaxSlipExtraction[];
}

export async function getPersonalTaxClientSummaryRows(taxYear: number): Promise<DemoRow[]> {
  const [clients, slips] = await Promise.all([getClientOptions(), getPersonalTaxSlips(undefined, taxYear)]);
  const slipsByClient = new Map<string, PersonalTaxSlip[]>();

  slips.forEach((slip) => {
    slipsByClient.set(slip.client_id, [...(slipsByClient.get(slip.client_id) ?? []), slip]);
  });

  return clients.map((client) => {
    const clientSlips = slipsByClient.get(client.id) ?? [];
    const readyCount = clientSlips.filter((slip) => slip.status === "ready_for_tax_preparation").length;
    return {
      client: client.companyName,
      href: `/admin/personal-tax?clientId=${client.id}&year=${taxYear}`,
      year: String(taxYear),
      slips: String(clientSlips.length),
      ready: String(readyCount),
      status: clientSlips.length > 0 ? "In progress" : "No slips"
    };
  });
}

export function personalTaxSlipRows(slips: PersonalTaxSlip[]): DemoRow[] {
  return slips.map((slip) => ({
    file: slip.file_name,
    fileHref: slip.download_url,
    client: slip.client_name,
    year: String(slip.tax_year),
    type: slip.slip_type,
    payer: slip.payer_name ?? "-",
    documentDate: formatDate(slip.document_date),
    uploadedDate: formatDateTime(slip.uploaded_at),
    status: displaySlipStatus(slip.status),
    notes: slip.notes ?? "-"
  }));
}

export function taxSlipExtractionRows(extractions: TaxSlipExtraction[]): DemoRow[] {
  return extractions.map((extraction) => ({
    box: extraction.box_number,
    label: extraction.box_label,
    extracted: extraction.extracted_value === null ? "-" : formatMoney(extraction.extracted_value),
    confirmed: extraction.confirmed_value === null ? "-" : formatMoney(extraction.confirmed_value),
    status: displaySlipStatus(extraction.status)
  }));
}

export function displaySlipStatus(status: string) {
  return status
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

async function createSignedDownloadUrl(bucket: string, storagePath: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 300, {
    download: true
  });

  if (error) {
    return "";
  }

  return data.signedUrl;
}

export type SelfEmployedRecord = {
  id: string;
  client_id: string;
  client_name: string;
  tax_year: number;
  business_type: string;
  expense_type: string;
  income_amount: number | string;
  expense_amount: number | string;
  gst_collected: number | string;
  gst_paid: number | string;
  status: string;
  notes: string | null;
  created_at: string;
};

type SelfEmployedRecordRow = Omit<SelfEmployedRecord, "client_name">;

export type SelfEmployedData = {
  client: ClientOption | null;
  taxYear: number;
  records: SelfEmployedRecord[];
  totals: {
    income: number;
    expenses: number;
    netIncome: number;
    gstCollected: number;
    gstPaid: number;
    gstNet: number;
  };
};

export async function getSelfEmployedData(client: ClientOption | null, taxYear: number): Promise<SelfEmployedData> {
  if (!client) {
    return emptySelfEmployedData(null, taxYear);
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("self_employed_records")
    .select("id,client_id,tax_year,business_type,expense_type,income_amount,expense_amount,gst_collected,gst_paid,status,notes,created_at")
    .eq("client_id", client.id)
    .eq("tax_year", taxYear)
    .order("created_at", { ascending: false });

  const records = ((data ?? []) as SelfEmployedRecordRow[]).map((record) => ({
    ...record,
    client_name: client.companyName
  }));

  return buildSelfEmployedData(client, taxYear, records);
}

export async function getClientSelfEmployedData(taxYear: number): Promise<SelfEmployedData> {
  const client = await getClientOptionForCurrentUser();
  return getSelfEmployedData(client, taxYear);
}

export async function getAdminSelfEmployedData(clientId: string | undefined, taxYear: number) {
  const clients = await getClientOptions();
  const selectedClient = clients.find((client) => client.id === clientId) ?? clients[0] ?? null;
  return {
    clients,
    selectedClient,
    taxYear,
    data: await getSelfEmployedData(selectedClient, taxYear)
  };
}

export function selfEmployedRecordRows(data: SelfEmployedData): DemoRow[] {
  return data.records.map((record) => ({
    date: formatDateTime(record.created_at),
    business: record.business_type,
    expenseType: record.expense_type,
    income: formatMoney(record.income_amount),
    expenses: formatMoney(record.expense_amount),
    gstCollected: formatMoney(record.gst_collected),
    gstPaid: formatMoney(record.gst_paid),
    status: displaySlipStatus(record.status)
  }));
}

export function selfEmployedSummaryRows(data: SelfEmployedData): DemoRow[] {
  return [
    { item: "Self-employed income", value: formatMoney(data.totals.income), detail: String(data.taxYear) },
    { item: "Self-employed expenses", value: formatMoney(data.totals.expenses), detail: String(data.taxYear) },
    { item: "Net self-employed income", value: formatMoney(data.totals.netIncome), detail: "Income minus expenses" },
    { item: "GST collected", value: formatMoney(data.totals.gstCollected), detail: String(data.taxYear) },
    { item: "GST paid", value: formatMoney(data.totals.gstPaid), detail: String(data.taxYear) },
    { item: "Net GST", value: formatMoney(data.totals.gstNet), detail: "Collected minus paid" }
  ];
}

function buildSelfEmployedData(client: ClientOption, taxYear: number, records: SelfEmployedRecord[]): SelfEmployedData {
  const income = records.reduce((sum, row) => sum + toNumber(row.income_amount), 0);
  const expenses = records.reduce((sum, row) => sum + toNumber(row.expense_amount), 0);
  const gstCollected = records.reduce((sum, row) => sum + toNumber(row.gst_collected), 0);
  const gstPaid = records.reduce((sum, row) => sum + toNumber(row.gst_paid), 0);

  return {
    client,
    taxYear,
    records,
    totals: {
      income,
      expenses,
      netIncome: income - expenses,
      gstCollected,
      gstPaid,
      gstNet: gstCollected - gstPaid
    }
  };
}

function emptySelfEmployedData(client: ClientOption | null, taxYear: number): SelfEmployedData {
  return {
    client,
    taxYear,
    records: [],
    totals: {
      income: 0,
      expenses: 0,
      netIncome: 0,
      gstCollected: 0,
      gstPaid: 0,
      gstNet: 0
    }
  };
}
