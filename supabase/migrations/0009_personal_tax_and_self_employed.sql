insert into storage.buckets (id, name, public, file_size_limit)
values ('tax-slips', 'tax-slips', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

create table if not exists public.personal_tax_slips (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  tax_year integer not null default extract(year from now())::integer,
  slip_type text not null,
  payer_name text,
  document_date date,
  uploaded_at timestamptz not null default now(),
  file_name text not null,
  bucket text not null default 'tax-slips',
  storage_path text not null,
  status text not null default 'waiting_for_review',
  notes text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_slip_extractions (
  id uuid primary key default gen_random_uuid(),
  slip_id uuid not null references public.personal_tax_slips(id) on delete cascade,
  box_number text not null,
  box_label text not null,
  extracted_value numeric(12, 2),
  confirmed_value numeric(12, 2),
  status text not null default 'not_extracted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slip_id, box_number)
);

create table if not exists public.self_employed_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  tax_year integer not null default extract(year from now())::integer,
  business_type text not null,
  expense_type text not null default 'Other',
  income_amount numeric(12, 2) not null default 0 check (income_amount >= 0),
  expense_amount numeric(12, 2) not null default 0 check (expense_amount >= 0),
  gst_collected numeric(12, 2) not null default 0 check (gst_collected >= 0),
  gst_paid numeric(12, 2) not null default 0 check (gst_paid >= 0),
  status text not null default 'submitted',
  notes text,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_tax_slips_client_year_idx
  on public.personal_tax_slips(client_id, tax_year);

create index if not exists personal_tax_slips_status_idx
  on public.personal_tax_slips(status);

create index if not exists tax_slip_extractions_slip_idx
  on public.tax_slip_extractions(slip_id);

create index if not exists self_employed_records_client_year_idx
  on public.self_employed_records(client_id, tax_year);

drop trigger if exists set_personal_tax_slips_updated_at on public.personal_tax_slips;
create trigger set_personal_tax_slips_updated_at before update on public.personal_tax_slips for each row execute function public.set_updated_at();

drop trigger if exists set_tax_slip_extractions_updated_at on public.tax_slip_extractions;
create trigger set_tax_slip_extractions_updated_at before update on public.tax_slip_extractions for each row execute function public.set_updated_at();

drop trigger if exists set_self_employed_records_updated_at on public.self_employed_records;
create trigger set_self_employed_records_updated_at before update on public.self_employed_records for each row execute function public.set_updated_at();

create or replace function public.can_access_personal_tax_slip(target_slip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.personal_tax_slips pts
    where pts.id = target_slip_id
      and public.can_access_client(pts.client_id)
  );
$$;

alter table public.personal_tax_slips enable row level security;
alter table public.tax_slip_extractions enable row level security;
alter table public.self_employed_records enable row level security;

drop policy if exists "personal_tax_slips_select_scope" on public.personal_tax_slips;
create policy "personal_tax_slips_select_scope"
  on public.personal_tax_slips for select
  using (public.can_access_client(client_id));

drop policy if exists "personal_tax_slips_insert_scope" on public.personal_tax_slips;
create policy "personal_tax_slips_insert_scope"
  on public.personal_tax_slips for insert
  with check (public.can_access_client(client_id));

drop policy if exists "personal_tax_slips_update_scope" on public.personal_tax_slips;
create policy "personal_tax_slips_update_scope"
  on public.personal_tax_slips for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

drop policy if exists "personal_tax_slips_delete_admin" on public.personal_tax_slips;
create policy "personal_tax_slips_delete_admin"
  on public.personal_tax_slips for delete
  using (public.is_admin());

drop policy if exists "tax_slip_extractions_select_scope" on public.tax_slip_extractions;
create policy "tax_slip_extractions_select_scope"
  on public.tax_slip_extractions for select
  using (public.can_access_personal_tax_slip(slip_id));

drop policy if exists "tax_slip_extractions_insert_scope" on public.tax_slip_extractions;
create policy "tax_slip_extractions_insert_scope"
  on public.tax_slip_extractions for insert
  with check (public.can_access_personal_tax_slip(slip_id));

drop policy if exists "tax_slip_extractions_update_scope" on public.tax_slip_extractions;
create policy "tax_slip_extractions_update_scope"
  on public.tax_slip_extractions for update
  using (public.can_access_personal_tax_slip(slip_id))
  with check (public.can_access_personal_tax_slip(slip_id));

drop policy if exists "tax_slip_extractions_delete_admin" on public.tax_slip_extractions;
create policy "tax_slip_extractions_delete_admin"
  on public.tax_slip_extractions for delete
  using (public.is_admin());

drop policy if exists "self_employed_records_select_scope" on public.self_employed_records;
create policy "self_employed_records_select_scope"
  on public.self_employed_records for select
  using (public.can_access_client(client_id));

drop policy if exists "self_employed_records_insert_scope" on public.self_employed_records;
create policy "self_employed_records_insert_scope"
  on public.self_employed_records for insert
  with check (public.can_access_client(client_id));

drop policy if exists "self_employed_records_update_scope" on public.self_employed_records;
create policy "self_employed_records_update_scope"
  on public.self_employed_records for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

drop policy if exists "self_employed_records_delete_admin" on public.self_employed_records;
create policy "self_employed_records_delete_admin"
  on public.self_employed_records for delete
  using (public.is_admin());

drop policy if exists "storage_select_tax_slips_scope" on storage.objects;
create policy "storage_select_tax_slips_scope"
  on storage.objects for select
  using (
    bucket_id = 'tax-slips'
    and public.can_access_client(public.storage_client_id(name))
  );

drop policy if exists "storage_insert_tax_slips_scope" on storage.objects;
create policy "storage_insert_tax_slips_scope"
  on storage.objects for insert
  with check (
    bucket_id = 'tax-slips'
    and public.can_access_client(public.storage_client_id(name))
  );

drop policy if exists "storage_update_tax_slips_scope" on storage.objects;
create policy "storage_update_tax_slips_scope"
  on storage.objects for update
  using (
    bucket_id = 'tax-slips'
    and public.can_access_client(public.storage_client_id(name))
  )
  with check (
    bucket_id = 'tax-slips'
    and public.can_access_client(public.storage_client_id(name))
  );

drop policy if exists "storage_delete_tax_slips_admin" on storage.objects;
create policy "storage_delete_tax_slips_admin"
  on storage.objects for delete
  using (
    bucket_id = 'tax-slips'
    and public.is_admin()
  );
