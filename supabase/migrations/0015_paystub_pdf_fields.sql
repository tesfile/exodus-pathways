alter table public.worker_payments
  add column if not exists pay_period_start date,
  add column if not exists pay_period_end date,
  add column if not exists pay_frequency text;

create index if not exists worker_payments_pay_period_idx
  on public.worker_payments(client_id, tax_year, pay_period_start, pay_period_end);
