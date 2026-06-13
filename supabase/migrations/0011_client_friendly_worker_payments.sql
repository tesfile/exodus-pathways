alter table public.workers
  alter column address drop not null;

alter table public.worker_payments
  add column if not exists payment_method text,
  add column if not exists client_worker_type text,
  add column if not exists slip_needed text not null default 'Review Needed',
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_notes text;

create index if not exists worker_payments_slip_needed_idx
  on public.worker_payments(client_id, tax_year, slip_needed);
