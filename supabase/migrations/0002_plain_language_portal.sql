alter type public.expense_category add value if not exists 'Materials';
alter type public.expense_category add value if not exists 'Vehicle';
alter type public.expense_category add value if not exists 'Tools';
alter type public.expense_category add value if not exists 'Rent';
alter type public.expense_category add value if not exists 'Payroll';
alter type public.expense_category add value if not exists 'Supplies';
alter type public.expense_category add value if not exists 'Office';

alter table public.documents
  add column if not exists ai_scan_status text not null default 'not_started',
  add column if not exists ai_scan_result jsonb not null default '{}'::jsonb;

alter table public.immigration_cases
  add column if not exists workflow_stage text,
  add column if not exists automation_metadata jsonb not null default '{}'::jsonb;

create table if not exists public.expense_types (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  is_default boolean not null default false,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(name)) > 0),
  check (length(trim(normalized_name)) > 0),
  unique (client_id, normalized_name)
);

create unique index if not exists expense_types_default_unique_idx
  on public.expense_types (normalized_name)
  where client_id is null;

create unique index if not exists expense_types_client_unique_idx
  on public.expense_types (client_id, normalized_name)
  where client_id is not null;

create table if not exists public.paid_to_directory (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  use_count integer not null default 0 check (use_count >= 0),
  last_used_at timestamptz,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(name)) > 0),
  check (length(trim(normalized_name)) > 0),
  unique (client_id, normalized_name)
);

create table if not exists public.client_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  assigned_to uuid references public.users(id) on delete set null,
  title text not null,
  plain_language_title text not null,
  source_module text not null default 'general',
  status text not null default 'open',
  due_date date,
  automation_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists client_tasks_no_duplicate_open_idx
  on public.client_tasks (client_id, source_module, automation_key)
  where status in ('open', 'waiting_on_client') and automation_key is not null;

create table if not exists public.client_reminders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  reminder_type text not null,
  title text not null,
  plain_language_title text not null,
  details text,
  status text not null default 'open',
  due_date date,
  channel text not null default 'portal',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists client_reminders_no_duplicate_open_idx
  on public.client_reminders (client_id, reminder_type, coalesce(due_date, date '1900-01-01'))
  where status in ('open', 'waiting_on_client');

drop trigger if exists set_expense_types_updated_at on public.expense_types;
create trigger set_expense_types_updated_at before update on public.expense_types for each row execute function public.set_updated_at();

drop trigger if exists set_paid_to_directory_updated_at on public.paid_to_directory;
create trigger set_paid_to_directory_updated_at before update on public.paid_to_directory for each row execute function public.set_updated_at();

drop trigger if exists set_client_tasks_updated_at on public.client_tasks;
create trigger set_client_tasks_updated_at before update on public.client_tasks for each row execute function public.set_updated_at();

drop trigger if exists set_client_reminders_updated_at on public.client_reminders;
create trigger set_client_reminders_updated_at before update on public.client_reminders for each row execute function public.set_updated_at();

alter table public.expense_types enable row level security;
alter table public.paid_to_directory enable row level security;
alter table public.client_tasks enable row level security;
alter table public.client_reminders enable row level security;

create policy "expense_types_select_scope"
  on public.expense_types for select
  using (client_id is null or public.can_access_client(client_id));

create policy "expense_types_insert_scope"
  on public.expense_types for insert
  with check (client_id is not null and public.can_access_client(client_id));

create policy "expense_types_update_scope"
  on public.expense_types for update
  using (client_id is not null and public.can_access_client(client_id))
  with check (client_id is not null and public.can_access_client(client_id));

create policy "expense_types_delete_admin"
  on public.expense_types for delete
  using (public.is_admin());

create policy "paid_to_directory_select_scope"
  on public.paid_to_directory for select
  using (public.can_access_client(client_id));

create policy "paid_to_directory_insert_scope"
  on public.paid_to_directory for insert
  with check (public.can_access_client(client_id));

create policy "paid_to_directory_update_scope"
  on public.paid_to_directory for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "paid_to_directory_delete_admin"
  on public.paid_to_directory for delete
  using (public.is_admin());

create policy "client_tasks_select_scope"
  on public.client_tasks for select
  using (public.can_access_client(client_id));

create policy "client_tasks_insert_scope"
  on public.client_tasks for insert
  with check (public.can_access_client(client_id));

create policy "client_tasks_update_scope"
  on public.client_tasks for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "client_tasks_delete_admin"
  on public.client_tasks for delete
  using (public.is_admin());

create policy "client_reminders_select_scope"
  on public.client_reminders for select
  using (public.can_access_client(client_id));

create policy "client_reminders_insert_scope"
  on public.client_reminders for insert
  with check (public.can_access_client(client_id));

create policy "client_reminders_update_scope"
  on public.client_reminders for update
  using (public.can_access_client(client_id))
  with check (public.can_access_client(client_id));

create policy "client_reminders_delete_admin"
  on public.client_reminders for delete
  using (public.is_admin());

insert into public.expense_types (client_id, name, normalized_name, is_default)
values
  (null, 'Materials', 'materials', true),
  (null, 'Fuel', 'fuel', true),
  (null, 'Vehicle', 'vehicle', true),
  (null, 'Tools', 'tools', true),
  (null, 'Rent', 'rent', true),
  (null, 'Phone', 'phone', true),
  (null, 'Payroll', 'payroll', true),
  (null, 'Insurance', 'insurance', true),
  (null, 'WCB', 'wcb', true),
  (null, 'Meals', 'meals', true),
  (null, 'Supplies', 'supplies', true),
  (null, 'Office', 'office', true),
  (null, 'Other', 'other', true)
on conflict do nothing;
