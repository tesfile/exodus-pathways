create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('admin', 'employee', 'client');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.expense_category as enum (
    'Materials & Supplies',
    'Tools under $500',
    'Equipment / Assets',
    'Fuel',
    'Vehicle Repairs',
    'Insurance',
    'WCB',
    'Rent / Storage',
    'Phone',
    'Meals',
    'Subcontractors',
    'Payroll / Wages',
    'Bank Charges',
    'Professional Fees',
    'Office Expenses',
    'Other'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'client',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  assigned_employee_id uuid references public.users(id) on delete set null,
  intake_status text not null default 'new',
  service_notes text,
  address text,
  province text,
  postal_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  legal_name text not null,
  trade_name text,
  business_number text,
  province text,
  fiscal_year_end date,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.income_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  entry_date date not null,
  source text not null,
  invoice_number text,
  amount numeric(12, 2) not null check (amount >= 0),
  status text not null default 'submitted',
  notes text,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  expense_date date not null,
  category public.expense_category not null default 'Other',
  vendor text,
  description text,
  amount numeric(12, 2) not null check (amount >= 0),
  gst_hst_amount numeric(12, 2) default 0 check (gst_hst_amount >= 0),
  payment_method text,
  status text not null default 'submitted',
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  expense_id uuid references public.expense_entries(id) on delete set null,
  bucket text not null default 'receipts',
  storage_path text not null,
  file_name text not null,
  vendor text,
  receipt_date date,
  amount numeric(12, 2) check (amount is null or amount >= 0),
  status text not null default 'uploaded',
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_statements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  statement_month date not null,
  bank_name text,
  account_last_four text,
  bucket text not null default 'bank-statements',
  storage_path text not null,
  file_name text not null,
  status text not null default 'uploaded',
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  receipt_id uuid references public.receipts(id) on delete set null,
  description text not null,
  purchase_date date,
  cost numeric(12, 2) not null check (cost >= 0),
  asset_class text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  period_start date not null,
  period_end date not null,
  employee_count integer not null default 0 check (employee_count >= 0),
  gross_pay numeric(12, 2) not null default 0 check (gross_pay >= 0),
  source_deductions numeric(12, 2) not null default 0 check (source_deductions >= 0),
  status text not null default 'draft',
  notes text,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.immigration_cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  assigned_employee_id uuid references public.users(id) on delete set null,
  case_type text not null,
  applicant_name text not null,
  status text not null default 'intake',
  milestone text,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  uploaded_by uuid references public.users(id) on delete set null default auth.uid(),
  bucket text not null,
  storage_path text not null,
  document_type text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  status text not null default 'uploaded',
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid references public.users(id) on delete set null,
  subject text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  employee_id uuid references public.users(id) on delete set null,
  appointment_at timestamptz not null,
  appointment_type text not null,
  status text not null default 'requested',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  assigned_to uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open',
  due_date date,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
drop trigger if exists set_client_profiles_updated_at on public.client_profiles;
create trigger set_client_profiles_updated_at before update on public.client_profiles for each row execute function public.set_updated_at();
drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
drop trigger if exists set_income_entries_updated_at on public.income_entries;
create trigger set_income_entries_updated_at before update on public.income_entries for each row execute function public.set_updated_at();
drop trigger if exists set_expense_entries_updated_at on public.expense_entries;
create trigger set_expense_entries_updated_at before update on public.expense_entries for each row execute function public.set_updated_at();
drop trigger if exists set_receipts_updated_at on public.receipts;
create trigger set_receipts_updated_at before update on public.receipts for each row execute function public.set_updated_at();
drop trigger if exists set_bank_statements_updated_at on public.bank_statements;
create trigger set_bank_statements_updated_at before update on public.bank_statements for each row execute function public.set_updated_at();
drop trigger if exists set_assets_updated_at on public.assets;
create trigger set_assets_updated_at before update on public.assets for each row execute function public.set_updated_at();
drop trigger if exists set_payroll_records_updated_at on public.payroll_records;
create trigger set_payroll_records_updated_at before update on public.payroll_records for each row execute function public.set_updated_at();
drop trigger if exists set_immigration_cases_updated_at on public.immigration_cases;
create trigger set_immigration_cases_updated_at before update on public.immigration_cases for each row execute function public.set_updated_at();
drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at before update on public.documents for each row execute function public.set_updated_at();
drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();
drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'New Client'),
    'client'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.users.full_name, excluded.full_name);

  insert into public.client_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

create or replace function public.is_employee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'employee';
$$;

create or replace function public.employee_assigned_to_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_profiles cp
    where cp.user_id = target_client_id
      and cp.assigned_employee_id = auth.uid()
  );
$$;

create or replace function public.can_access_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or auth.uid() = target_client_id
    or public.employee_assigned_to_client(target_client_id);
$$;

create index if not exists client_profiles_user_id_idx on public.client_profiles(user_id);
create index if not exists client_profiles_assigned_employee_idx on public.client_profiles(assigned_employee_id);
create index if not exists companies_client_id_idx on public.companies(client_id);
create index if not exists income_entries_client_id_idx on public.income_entries(client_id);
create index if not exists expense_entries_client_id_idx on public.expense_entries(client_id);
create index if not exists receipts_client_id_idx on public.receipts(client_id);
create index if not exists bank_statements_client_id_idx on public.bank_statements(client_id);
create index if not exists assets_client_id_idx on public.assets(client_id);
create index if not exists payroll_records_client_id_idx on public.payroll_records(client_id);
create index if not exists immigration_cases_client_id_idx on public.immigration_cases(client_id);
create index if not exists documents_client_id_idx on public.documents(client_id);
create index if not exists messages_client_id_idx on public.messages(client_id);
create index if not exists appointments_client_id_idx on public.appointments(client_id);
create index if not exists tasks_client_id_idx on public.tasks(client_id);

alter table public.users enable row level security;
alter table public.client_profiles enable row level security;
alter table public.companies enable row level security;
alter table public.income_entries enable row level security;
alter table public.expense_entries enable row level security;
alter table public.receipts enable row level security;
alter table public.bank_statements enable row level security;
alter table public.assets enable row level security;
alter table public.payroll_records enable row level security;
alter table public.immigration_cases enable row level security;
alter table public.documents enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.tasks enable row level security;

create policy "users_select_own_admin_or_assigned"
  on public.users for select
  using (id = auth.uid() or public.is_admin() or public.employee_assigned_to_client(id));

create policy "users_admin_insert"
  on public.users for insert
  with check (public.is_admin());

create policy "users_admin_update"
  on public.users for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "users_admin_delete"
  on public.users for delete
  using (public.is_admin());

create policy "client_profiles_select_scope"
  on public.client_profiles for select
  using (public.can_access_client(user_id));

create policy "client_profiles_insert_admin"
  on public.client_profiles for insert
  with check (public.is_admin());

create policy "client_profiles_update_staff"
  on public.client_profiles for update
  using (public.is_admin() or public.employee_assigned_to_client(user_id))
  with check (public.is_admin() or public.employee_assigned_to_client(user_id));

create policy "client_profiles_delete_admin"
  on public.client_profiles for delete
  using (public.is_admin());

create policy "companies_select_scope"
  on public.companies for select
  using (public.can_access_client(client_id));

create policy "companies_insert_scope"
  on public.companies for insert
  with check (public.can_access_client(client_id));

create policy "companies_update_scope"
  on public.companies for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "companies_delete_admin"
  on public.companies for delete
  using (public.is_admin());

create policy "income_entries_select_scope"
  on public.income_entries for select
  using (public.can_access_client(client_id));

create policy "income_entries_insert_scope"
  on public.income_entries for insert
  with check (public.can_access_client(client_id));

create policy "income_entries_update_scope"
  on public.income_entries for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "income_entries_delete_admin"
  on public.income_entries for delete
  using (public.is_admin());

create policy "expense_entries_select_scope"
  on public.expense_entries for select
  using (public.can_access_client(client_id));

create policy "expense_entries_insert_scope"
  on public.expense_entries for insert
  with check (public.can_access_client(client_id));

create policy "expense_entries_update_scope"
  on public.expense_entries for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "expense_entries_delete_admin"
  on public.expense_entries for delete
  using (public.is_admin());

create policy "receipts_select_scope"
  on public.receipts for select
  using (public.can_access_client(client_id));

create policy "receipts_insert_scope"
  on public.receipts for insert
  with check (public.can_access_client(client_id));

create policy "receipts_update_scope"
  on public.receipts for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "receipts_delete_admin"
  on public.receipts for delete
  using (public.is_admin());

create policy "bank_statements_select_scope"
  on public.bank_statements for select
  using (public.can_access_client(client_id));

create policy "bank_statements_insert_scope"
  on public.bank_statements for insert
  with check (public.can_access_client(client_id));

create policy "bank_statements_update_scope"
  on public.bank_statements for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "bank_statements_delete_admin"
  on public.bank_statements for delete
  using (public.is_admin());

create policy "assets_select_scope"
  on public.assets for select
  using (public.can_access_client(client_id));

create policy "assets_write_scope"
  on public.assets for all
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "payroll_records_select_scope"
  on public.payroll_records for select
  using (public.can_access_client(client_id));

create policy "payroll_records_write_scope"
  on public.payroll_records for all
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "immigration_cases_select_scope"
  on public.immigration_cases for select
  using (public.can_access_client(client_id));

create policy "immigration_cases_write_scope"
  on public.immigration_cases for all
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "documents_select_scope"
  on public.documents for select
  using (public.can_access_client(client_id));

create policy "documents_insert_scope"
  on public.documents for insert
  with check (public.can_access_client(client_id) and uploaded_by = auth.uid());

create policy "documents_update_scope"
  on public.documents for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "documents_delete_admin"
  on public.documents for delete
  using (public.is_admin());

create policy "messages_select_scope"
  on public.messages for select
  using (public.can_access_client(client_id));

create policy "messages_insert_scope"
  on public.messages for insert
  with check (sender_id = auth.uid() and public.can_access_client(client_id));

create policy "messages_update_recipient_or_admin"
  on public.messages for update
  using (recipient_id = auth.uid() or public.is_admin())
  with check (recipient_id = auth.uid() or public.is_admin());

create policy "appointments_select_scope"
  on public.appointments for select
  using (public.can_access_client(client_id));

create policy "appointments_write_scope"
  on public.appointments for all
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "tasks_select_scope"
  on public.tasks for select
  using (public.can_access_client(client_id));

create policy "tasks_staff_write_scope"
  on public.tasks for all
  using (public.is_admin() or assigned_to = auth.uid() or public.employee_assigned_to_client(client_id))
  with check (public.is_admin() or assigned_to = auth.uid() or public.employee_assigned_to_client(client_id));

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('receipts', 'receipts', false, 52428800),
  ('invoices', 'invoices', false, 52428800),
  ('bank-statements', 'bank-statements', false, 52428800),
  ('immigration-documents', 'immigration-documents', false, 52428800),
  ('tax-documents', 'tax-documents', false, 52428800),
  ('client-documents', 'client-documents', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

create or replace function public.storage_client_id(object_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  first_folder text;
begin
  first_folder := (storage.foldername(object_name))[1];
  if first_folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return first_folder::uuid;
  end if;
  return null;
end;
$$;

create policy "storage_select_client_scope"
  on storage.objects for select
  using (
    bucket_id in ('receipts', 'invoices', 'bank-statements', 'immigration-documents', 'tax-documents', 'client-documents')
    and public.can_access_client(public.storage_client_id(name))
  );

create policy "storage_insert_client_scope"
  on storage.objects for insert
  with check (
    bucket_id in ('receipts', 'invoices', 'bank-statements', 'immigration-documents', 'tax-documents', 'client-documents')
    and public.can_access_client(public.storage_client_id(name))
  );

create policy "storage_update_client_scope"
  on storage.objects for update
  using (
    bucket_id in ('receipts', 'invoices', 'bank-statements', 'immigration-documents', 'tax-documents', 'client-documents')
    and public.can_access_client(public.storage_client_id(name))
  )
  with check (
    bucket_id in ('receipts', 'invoices', 'bank-statements', 'immigration-documents', 'tax-documents', 'client-documents')
    and public.can_access_client(public.storage_client_id(name))
  );

create policy "storage_delete_admin"
  on storage.objects for delete
  using (
    bucket_id in ('receipts', 'invoices', 'bank-statements', 'immigration-documents', 'tax-documents', 'client-documents')
    and public.is_admin()
  );
