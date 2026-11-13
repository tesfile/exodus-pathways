-- Additive KAL payroll hourly-rate and company-default configuration.
-- Does not change any saved worker_payments, T4 slips, journals, or accounting balances.
alter table public.kal_payroll_employee_profiles
  add column if not exists pay_type text not null default 'hourly'
    check (pay_type in ('hourly','salary')),
  add column if not exists hourly_rate numeric(12,2)
    check (hourly_rate is null or hourly_rate >= 0),
  add column if not exists salary_amount numeric(12,2)
    check (salary_amount is null or salary_amount >= 0),
  add column if not exists default_hours_per_day numeric(5,2) not null default 8.00
    check (default_hours_per_day > 0 and default_hours_per_day <= 24),
  add column if not exists default_days_per_week smallint not null default 5
    check (default_days_per_week between 1 and 7),
  add column if not exists overtime_multiplier numeric(4,2) not null default 1.50
    check (overtime_multiplier between 1 and 4),
  add column if not exists vacation_percent numeric(5,2) not null default 4.00
    check (vacation_percent between 0 and 30);

create table if not exists public.kal_company_payroll_settings (
  company_id uuid primary key references public.companies(id) on delete restrict,
  client_id uuid not null references public.users(id) on delete restrict,
  default_hours_per_day numeric(5,2) not null default 8.00
    check (default_hours_per_day > 0 and default_hours_per_day <= 24),
  default_days_per_week smallint not null default 5
    check (default_days_per_week between 1 and 7),
  default_pay_frequency text not null default 'biweekly'
    check (default_pay_frequency in ('weekly','biweekly','semimonthly','monthly')),
  overtime_multiplier numeric(4,2) not null default 1.50
    check (overtime_multiplier between 1 and 4),
  vacation_percent numeric(5,2) not null default 4.00
    check (vacation_percent between 0 and 30),
  updated_at timestamptz not null default now()
);
create index if not exists kal_company_payroll_settings_client_idx
  on public.kal_company_payroll_settings (client_id);
alter table public.kal_company_payroll_settings enable row level security;
revoke all on public.kal_company_payroll_settings from anon, authenticated;
grant select, insert, update on public.kal_company_payroll_settings to service_role;
