alter table public.client_profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists service_selection text,
  add column if not exists immigration_service text,
  add column if not exists tax_accounting_type text,
  add column if not exists self_employed_type text;

drop policy if exists "client_profiles_update_own_services" on public.client_profiles;
create policy "client_profiles_update_own_services"
  on public.client_profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  worker_name text not null,
  sin_or_business_number text not null,
  address text not null,
  phone text,
  email text,
  worker_type text not null,
  business_name text,
  gst_number text,
  status text not null default 'active',
  notes text,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.worker_payments (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  tax_year integer not null default extract(year from now())::integer,
  payment_date date not null,
  amount_paid numeric(12, 2) not null default 0 check (amount_paid >= 0),
  gst_paid numeric(12, 2) not null default 0 check (gst_paid >= 0),
  pay_period text,
  invoice_bucket text,
  invoice_storage_path text,
  invoice_file_name text,
  notes text,
  gross_pay numeric(12, 2) not null default 0 check (gross_pay >= 0),
  cpp numeric(12, 2) not null default 0 check (cpp >= 0),
  ei numeric(12, 2) not null default 0 check (ei >= 0),
  income_tax_deducted numeric(12, 2) not null default 0 check (income_tax_deducted >= 0),
  benefits numeric(12, 2) not null default 0 check (benefits >= 0),
  vacation_pay numeric(12, 2) not null default 0 check (vacation_pay >= 0),
  business_name text,
  gst_number text,
  invoice_number text,
  amount_before_gst numeric(12, 2) not null default 0 check (amount_before_gst >= 0),
  subcontractor_gst numeric(12, 2) not null default 0 check (subcontractor_gst >= 0),
  total_paid numeric(12, 2) not null default 0 check (total_paid >= 0),
  status text not null default 'submitted',
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workers_client_company_idx
  on public.workers(client_id, company_id);

create index if not exists workers_client_type_idx
  on public.workers(client_id, worker_type);

create index if not exists worker_payments_client_year_idx
  on public.worker_payments(client_id, tax_year);

create index if not exists worker_payments_worker_year_idx
  on public.worker_payments(worker_id, tax_year);

create index if not exists worker_payments_company_year_idx
  on public.worker_payments(company_id, tax_year);

drop trigger if exists set_workers_updated_at on public.workers;
create trigger set_workers_updated_at before update on public.workers for each row execute function public.set_updated_at();

drop trigger if exists set_worker_payments_updated_at on public.worker_payments;
create trigger set_worker_payments_updated_at before update on public.worker_payments for each row execute function public.set_updated_at();

alter table public.workers enable row level security;
alter table public.worker_payments enable row level security;

drop policy if exists "workers_select_scope" on public.workers;
create policy "workers_select_scope"
  on public.workers for select
  using (public.can_access_client(client_id));

drop policy if exists "workers_insert_scope" on public.workers;
create policy "workers_insert_scope"
  on public.workers for insert
  with check (public.can_access_client(client_id));

drop policy if exists "workers_update_scope" on public.workers;
create policy "workers_update_scope"
  on public.workers for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

drop policy if exists "workers_delete_admin" on public.workers;
create policy "workers_delete_admin"
  on public.workers for delete
  using (public.is_admin());

drop policy if exists "worker_payments_select_scope" on public.worker_payments;
create policy "worker_payments_select_scope"
  on public.worker_payments for select
  using (public.can_access_client(client_id));

drop policy if exists "worker_payments_insert_scope" on public.worker_payments;
create policy "worker_payments_insert_scope"
  on public.worker_payments for insert
  with check (public.can_access_client(client_id));

drop policy if exists "worker_payments_update_scope" on public.worker_payments;
create policy "worker_payments_update_scope"
  on public.worker_payments for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

drop policy if exists "worker_payments_delete_admin" on public.worker_payments;
create policy "worker_payments_delete_admin"
  on public.worker_payments for delete
  using (public.is_admin());
