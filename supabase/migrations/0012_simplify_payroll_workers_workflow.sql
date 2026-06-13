alter table public.workers
  alter column sin_or_business_number drop not null,
  alter column address drop not null;

alter table public.worker_payments
  add column if not exists invoice_provided text,
  add column if not exists admin_classification text not null default 'Review Needed';

create index if not exists worker_payments_admin_classification_idx
  on public.worker_payments(client_id, tax_year, admin_classification);
