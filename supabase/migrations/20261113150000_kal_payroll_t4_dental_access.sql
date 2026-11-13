-- T4 box 45 must be reviewed by tax year (the coverage offered on December 31).
-- Null means not yet confirmed; never assume code 1 by default.
create table if not exists public.kal_payroll_t4_dental_access (
  worker_id uuid not null references public.workers(id) on delete restrict,
  client_id uuid not null references public.users(id) on delete restrict,
  tax_year integer not null check (tax_year between 2023 and 2100),
  access_code smallint check (access_code between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (worker_id, tax_year)
);

create index if not exists kal_payroll_t4_dental_client_year_idx
  on public.kal_payroll_t4_dental_access (client_id, tax_year);

alter table public.kal_payroll_t4_dental_access enable row level security;
revoke all on public.kal_payroll_t4_dental_access from anon, authenticated;
grant select, insert, update on public.kal_payroll_t4_dental_access to service_role;
