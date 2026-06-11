alter table public.users
  add column if not exists email_verified_at timestamptz,
  add column if not exists two_factor_enabled boolean not null default false,
  add column if not exists invited_by uuid references public.users(id) on delete set null;

alter table public.income_entries add column if not exists tax_year integer not null default extract(year from now())::integer;
alter table public.expense_entries add column if not exists tax_year integer not null default extract(year from now())::integer;
alter table public.receipts add column if not exists tax_year integer not null default extract(year from now())::integer;
alter table public.bank_statements add column if not exists tax_year integer not null default extract(year from now())::integer;
alter table public.assets add column if not exists tax_year integer not null default extract(year from now())::integer;
alter table public.payroll_records add column if not exists tax_year integer not null default extract(year from now())::integer;
alter table public.documents add column if not exists tax_year integer;

create table if not exists public.accounting_years (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  tax_year integer not null,
  status text not null default 'open',
  year_end_package_status text not null default 'not_started',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, tax_year)
);

create table if not exists public.gst_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  tax_year integer not null,
  period_label text not null,
  gst_collected numeric(12, 2) not null default 0 check (gst_collected >= 0),
  gst_paid numeric(12, 2) not null default 0 check (gst_paid >= 0),
  status text not null default 'draft',
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, tax_year, period_label)
);

create table if not exists public.immigration_case_assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.immigration_cases(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (case_id, employee_id)
);

create table if not exists public.immigration_assessments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.immigration_cases(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  program_slug text not null,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id)
);

create table if not exists public.immigration_case_people (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.immigration_cases(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  person_type text not null,
  full_name text not null,
  date_of_birth date,
  country text,
  relationship text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.immigration_document_checklist (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.immigration_cases(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  document_key text not null,
  document_label text not null,
  status text not null default 'missing',
  due_date date,
  document_id uuid references public.documents(id) on delete set null,
  admin_note text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, document_key)
);

create table if not exists public.ircc_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.immigration_cases(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  requested_document text not null,
  due_date date,
  notes text,
  status text not null default 'action_required',
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.immigration_case_timeline (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.immigration_cases(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  event_key text not null,
  event_label text not null,
  event_at timestamptz not null default now(),
  actor_id uuid references public.users(id) on delete set null default auth.uid(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.immigration_tasks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.immigration_cases(id) on delete cascade,
  client_id uuid not null references public.users(id) on delete cascade,
  assigned_to uuid references public.users(id) on delete set null,
  title text not null,
  follow_up_date date,
  deadline date,
  priority text not null default 'normal',
  status text not null default 'open',
  notes text,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  case_id uuid references public.immigration_cases(id) on delete cascade,
  channel text not null default 'email',
  subject text not null,
  body text not null,
  status text not null default 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  client_id uuid references public.users(id) on delete cascade,
  case_id uuid references public.immigration_cases(id) on delete cascade,
  action text not null,
  area text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.staff_assigned_to_case(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.immigration_case_assignments ica
    where ica.case_id = target_case_id
      and ica.employee_id = auth.uid()
  );
$$;

create or replace function public.can_access_case(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.immigration_cases ic
    where ic.id = target_case_id
      and (
        public.is_admin()
        or ic.client_id = auth.uid()
        or ic.assigned_employee_id = auth.uid()
        or public.staff_assigned_to_case(target_case_id)
        or public.employee_assigned_to_client(ic.client_id)
      )
  );
$$;

create index if not exists income_entries_client_year_idx on public.income_entries(client_id, tax_year);
create index if not exists expense_entries_client_year_idx on public.expense_entries(client_id, tax_year);
create index if not exists receipts_client_year_idx on public.receipts(client_id, tax_year);
create index if not exists bank_statements_client_year_idx on public.bank_statements(client_id, tax_year);
create index if not exists payroll_records_client_year_idx on public.payroll_records(client_id, tax_year);
create index if not exists accounting_years_client_year_idx on public.accounting_years(client_id, tax_year);
create index if not exists immigration_case_assignments_case_idx on public.immigration_case_assignments(case_id);
create index if not exists immigration_case_people_case_idx on public.immigration_case_people(case_id);
create index if not exists immigration_document_checklist_case_idx on public.immigration_document_checklist(case_id);
create index if not exists ircc_requests_case_idx on public.ircc_requests(case_id);
create index if not exists immigration_tasks_case_idx on public.immigration_tasks(case_id);
create index if not exists audit_logs_client_idx on public.audit_logs(client_id);

drop trigger if exists set_accounting_years_updated_at on public.accounting_years;
create trigger set_accounting_years_updated_at before update on public.accounting_years for each row execute function public.set_updated_at();
drop trigger if exists set_gst_records_updated_at on public.gst_records;
create trigger set_gst_records_updated_at before update on public.gst_records for each row execute function public.set_updated_at();
drop trigger if exists set_immigration_assessments_updated_at on public.immigration_assessments;
create trigger set_immigration_assessments_updated_at before update on public.immigration_assessments for each row execute function public.set_updated_at();
drop trigger if exists set_immigration_case_people_updated_at on public.immigration_case_people;
create trigger set_immigration_case_people_updated_at before update on public.immigration_case_people for each row execute function public.set_updated_at();
drop trigger if exists set_immigration_document_checklist_updated_at on public.immigration_document_checklist;
create trigger set_immigration_document_checklist_updated_at before update on public.immigration_document_checklist for each row execute function public.set_updated_at();
drop trigger if exists set_ircc_requests_updated_at on public.ircc_requests;
create trigger set_ircc_requests_updated_at before update on public.ircc_requests for each row execute function public.set_updated_at();
drop trigger if exists set_immigration_tasks_updated_at on public.immigration_tasks;
create trigger set_immigration_tasks_updated_at before update on public.immigration_tasks for each row execute function public.set_updated_at();
drop trigger if exists set_notifications_updated_at on public.notifications;
create trigger set_notifications_updated_at before update on public.notifications for each row execute function public.set_updated_at();

alter table public.accounting_years enable row level security;
alter table public.gst_records enable row level security;
alter table public.immigration_case_assignments enable row level security;
alter table public.immigration_assessments enable row level security;
alter table public.immigration_case_people enable row level security;
alter table public.immigration_document_checklist enable row level security;
alter table public.ircc_requests enable row level security;
alter table public.immigration_case_timeline enable row level security;
alter table public.immigration_tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "accounting_years_scope" on public.accounting_years for all
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "gst_records_scope" on public.gst_records for all
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "case_assignments_select_scope" on public.immigration_case_assignments for select
  using (public.can_access_case(case_id));

create policy "case_assignments_admin_write" on public.immigration_case_assignments for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "assessments_scope" on public.immigration_assessments for all
  using (public.can_access_case(case_id))
  with check (public.can_access_case(case_id) and public.can_access_client(client_id));

create policy "case_people_scope" on public.immigration_case_people for all
  using (public.can_access_case(case_id))
  with check (public.can_access_case(case_id) and public.can_access_client(client_id));

create policy "checklist_scope" on public.immigration_document_checklist for all
  using (public.can_access_case(case_id))
  with check (public.can_access_case(case_id) and public.can_access_client(client_id));

create policy "ircc_requests_scope" on public.ircc_requests for all
  using (public.can_access_case(case_id))
  with check (public.can_access_case(case_id) and public.can_access_client(client_id));

create policy "timeline_scope" on public.immigration_case_timeline for all
  using (public.can_access_case(case_id))
  with check (public.can_access_case(case_id) and public.can_access_client(client_id));

create policy "immigration_tasks_scope" on public.immigration_tasks for all
  using (case_id is null and public.can_access_client(client_id) or case_id is not null and public.can_access_case(case_id))
  with check (case_id is null and public.can_access_client(client_id) or case_id is not null and public.can_access_case(case_id));

create policy "notifications_scope" on public.notifications for all
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "audit_logs_select_scope" on public.audit_logs for select
  using (public.is_admin() or (client_id is not null and public.can_access_client(client_id)));

create policy "audit_logs_insert_staff" on public.audit_logs for insert
  with check (auth.uid() is not null);
