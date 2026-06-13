alter table public.worker_payments
  add column if not exists net_pay numeric(12, 2) not null default 0 check (net_pay >= 0);
