create table if not exists public.t4_slips (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  tax_year integer not null default extract(year from now())::integer,
  employer_name text,
  employee_name text,
  box_14_employment_income numeric(12, 2),
  box_16_cpp_contributions numeric(12, 2),
  box_18_ei_premiums numeric(12, 2),
  box_22_income_tax_deducted numeric(12, 2),
  extraction_status text not null default 'extracted',
  extraction_method text not null default 'browser_text_regex',
  extracted_text_sample text,
  client_confirmed_at timestamptz,
  client_notes text,
  review_status text not null default 'awaiting_client_confirmation',
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists t4_slips_client_year_idx
  on public.t4_slips(client_id, tax_year);

create index if not exists t4_slips_document_idx
  on public.t4_slips(document_id);

create index if not exists t4_slips_review_status_idx
  on public.t4_slips(review_status);

drop trigger if exists set_t4_slips_updated_at on public.t4_slips;
create trigger set_t4_slips_updated_at before update on public.t4_slips for each row execute function public.set_updated_at();

alter table public.t4_slips enable row level security;

create policy "t4_slips_select_scope"
  on public.t4_slips for select
  using (public.can_access_client(client_id));

create policy "t4_slips_insert_scope"
  on public.t4_slips for insert
  with check (public.can_access_client(client_id));

create policy "t4_slips_update_scope"
  on public.t4_slips for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "t4_slips_delete_admin"
  on public.t4_slips for delete
  using (public.is_admin());
