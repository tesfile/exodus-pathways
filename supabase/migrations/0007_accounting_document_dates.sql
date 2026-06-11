alter table public.documents
  add column if not exists document_date date;

alter table public.gst_records
  add column if not exists period_start date,
  add column if not exists period_end date;

create index if not exists documents_client_document_date_idx
  on public.documents(client_id, document_date);

create index if not exists documents_uploaded_at_idx
  on public.documents(created_at);

create index if not exists gst_records_client_period_idx
  on public.gst_records(client_id, tax_year, period_start, period_end);
