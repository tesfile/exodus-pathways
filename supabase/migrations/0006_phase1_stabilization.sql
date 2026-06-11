alter table public.expense_entries
  add column if not exists notes text,
  add column if not exists tax_year integer not null default extract(year from now())::integer,
  add column if not exists gst_hst_amount numeric(12, 2) not null default 0 check (gst_hst_amount >= 0);

alter table public.expense_entries
  alter column category type text using category::text,
  alter column category set default 'Other';

alter table public.income_entries
  add column if not exists gst_hst_amount numeric(12, 2) not null default 0 check (gst_hst_amount >= 0),
  add column if not exists tax_year integer not null default extract(year from now())::integer;

alter table public.receipts
  add column if not exists tax_year integer not null default extract(year from now())::integer;

alter table public.bank_statements
  add column if not exists tax_year integer not null default extract(year from now())::integer;

alter table public.documents
  add column if not exists tax_year integer,
  add column if not exists due_date date,
  add column if not exists requested_again_at timestamptz,
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create index if not exists income_entries_client_year_date_idx
  on public.income_entries(client_id, tax_year, entry_date);

create index if not exists expense_entries_client_year_date_idx
  on public.expense_entries(client_id, tax_year, expense_date);

create index if not exists receipts_client_year_idx
  on public.receipts(client_id, tax_year);

create index if not exists bank_statements_client_year_idx
  on public.bank_statements(client_id, tax_year);

create index if not exists documents_client_year_idx
  on public.documents(client_id, tax_year);
