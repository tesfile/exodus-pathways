-- KAL Accounting & Tax: additive, admin-only payroll employee setup.
-- This table does not modify worker payments, journals or other existing records.
create table if not exists public.kal_payroll_employee_profiles (
  worker_id uuid primary key references public.workers(id) on delete restrict,
  client_id uuid not null references public.users(id) on delete restrict,
  birth_date date,
  hire_date date,
  termination_date date,
  employment_status text not null default 'Active'
    check (employment_status in (
      'Active', 'Paid leave of absence', 'Unpaid leave of absence',
      'Terminated', 'Not on payroll', 'Deceased'
    )),
  work_location text,
  manager_name text,
  department text,
  schedule_name text not null default 'Regular payroll',
  pay_frequency text not null default 'biweekly'
    check (pay_frequency in ('weekly','biweekly','semimonthly','monthly')),
  next_period_end date,
  next_pay_date date,
  default_schedule boolean not null default false,
  -- AES-256-GCM encrypted by the server using PAYROLL_SIN_ENCRYPTION_KEY.
  -- Never write cleartext SIN to workers.sin_or_business_number.
  sin_ciphertext text,
  sin_last4 char(4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kal_payroll_employee_sin_last4_check
    check (sin_last4 is null or sin_last4 ~ '^[0-9]{4}$'),
  constraint kal_payroll_employee_pay_dates_check
    check (next_pay_date is null or next_period_end is null or next_pay_date >= next_period_end)
);

create index if not exists kal_payroll_profiles_client_idx
  on public.kal_payroll_employee_profiles (client_id);
create unique index if not exists kal_payroll_profiles_one_default_per_client
  on public.kal_payroll_employee_profiles (client_id)
  where default_schedule;

alter table public.kal_payroll_employee_profiles enable row level security;
-- No anon/authenticated policies: only the validated server-side administrator
-- using the server-only Supabase secret key can read/write profile information.
revoke all on public.kal_payroll_employee_profiles from anon, authenticated;
grant select, insert, update on public.kal_payroll_employee_profiles to service_role;
