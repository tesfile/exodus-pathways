alter table public.expense_entries
  add column if not exists notes text;

alter table public.documents
  add column if not exists due_date date,
  add column if not exists requested_again_at timestamptz,
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

create index if not exists documents_client_status_idx
  on public.documents(client_id, status);

create index if not exists documents_due_date_idx
  on public.documents(due_date);
