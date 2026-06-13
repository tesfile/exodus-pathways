import { formatDate, formatDateTime, formatMoney } from "@/lib/accounting/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DemoRow } from "@/lib/types";

export type T4SlipRecord = {
  id: string;
  client_id: string;
  client_name: string;
  document_id: string | null;
  document_name: string;
  document_url: string;
  document_date: string | null;
  uploaded_at: string | null;
  tax_year: number;
  employer_name: string | null;
  employee_name: string | null;
  box_14_employment_income: number | string | null;
  box_16_cpp_contributions: number | string | null;
  box_18_ei_premiums: number | string | null;
  box_22_income_tax_deducted: number | string | null;
  extraction_status: string;
  extraction_method: string;
  client_confirmed_at: string | null;
  client_notes: string | null;
  review_status: string;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
};

type T4SlipRow = Omit<T4SlipRecord, "client_name" | "document_name" | "document_url" | "document_date" | "uploaded_at">;

type DocumentRow = {
  id: string;
  bucket: string;
  storage_path: string;
  file_name: string;
  document_date: string | null;
  created_at: string;
};

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
};

function moneyOrDash(value: number | string | null | undefined) {
  return value === null || value === undefined || value === "" ? "-" : formatMoney(value);
}

export async function getT4SlipRecords(clientId?: string): Promise<T4SlipRecord[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("t4_slips")
    .select(
      "id,client_id,document_id,tax_year,employer_name,employee_name,box_14_employment_income,box_16_cpp_contributions,box_18_ei_premiums,box_22_income_tax_deducted,extraction_status,extraction_method,client_confirmed_at,client_notes,review_status,reviewed_at,review_notes,created_at"
    )
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data: slips } = await query;
  const slipRows = (slips ?? []) as T4SlipRow[];
  const clientIds = Array.from(new Set(slipRows.map((slip) => slip.client_id)));
  const documentIds = Array.from(new Set(slipRows.map((slip) => slip.document_id).filter(Boolean))) as string[];

  let users: UserRow[] = [];
  let documents: DocumentRow[] = [];

  if (clientIds.length > 0) {
    const { data } = await supabase.from("users").select("id,email,full_name,display_name").in("id", clientIds);
    users = (data ?? []) as UserRow[];
  }

  if (documentIds.length > 0) {
    const { data } = await supabase
      .from("documents")
      .select("id,bucket,storage_path,file_name,document_date,created_at")
      .in("id", documentIds);
    documents = (data ?? []) as DocumentRow[];
  }

  const clientsById = new Map(users.map((user) => [user.id, user.display_name || user.full_name || user.email]));
  const documentsById = new Map(documents.map((document) => [document.id, document]));

  return Promise.all(
    slipRows.map(async (slip) => {
      const document = slip.document_id ? documentsById.get(slip.document_id) : undefined;
      return {
        ...slip,
        client_name: clientsById.get(slip.client_id) ?? "Client",
        document_name: document?.file_name ?? "T4 slip",
        document_url: document ? await signedUrl(document.bucket, document.storage_path) : "",
        document_date: document?.document_date ?? null,
        uploaded_at: document?.created_at ?? null
      };
    })
  );
}

export async function getT4SlipRows(clientId?: string): Promise<DemoRow[]> {
  const records = await getT4SlipRecords(clientId);

  return records.map((record) => ({
    document: record.document_name,
    documentHref: record.document_url,
    client: record.client_name,
    year: String(record.tax_year),
    box14: moneyOrDash(record.box_14_employment_income),
    box16: moneyOrDash(record.box_16_cpp_contributions),
    box18: moneyOrDash(record.box_18_ei_premiums),
    box22: moneyOrDash(record.box_22_income_tax_deducted),
    uploaded: formatDateTime(record.uploaded_at),
    documentDate: formatDate(record.document_date),
    status: record.review_status
  }));
}

async function signedUrl(bucket: string, storagePath: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 300, {
    download: true
  });

  if (error) {
    return "";
  }

  return data.signedUrl;
}
