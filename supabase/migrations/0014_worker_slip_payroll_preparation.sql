alter table public.worker_payments
  add column if not exists t4_box14_employment_income numeric(12, 2) not null default 0 check (t4_box14_employment_income >= 0),
  add column if not exists t4_box16_cpp numeric(12, 2) not null default 0 check (t4_box16_cpp >= 0),
  add column if not exists t4_box18_ei numeric(12, 2) not null default 0 check (t4_box18_ei >= 0),
  add column if not exists t4_box22_income_tax_deducted numeric(12, 2) not null default 0 check (t4_box22_income_tax_deducted >= 0),
  add column if not exists t4_box24_ei_insurable_earnings numeric(12, 2) not null default 0 check (t4_box24_ei_insurable_earnings >= 0),
  add column if not exists t4_box26_cpp_pensionable_earnings numeric(12, 2) not null default 0 check (t4_box26_cpp_pensionable_earnings >= 0),
  add column if not exists t4_benefits numeric(12, 2) not null default 0 check (t4_benefits >= 0),
  add column if not exists t4_vacation_pay numeric(12, 2) not null default 0 check (t4_vacation_pay >= 0),
  add column if not exists t4_net_pay numeric(12, 2) not null default 0 check (t4_net_pay >= 0),
  add column if not exists t4_ready_status text not null default 'Not Ready',
  add column if not exists payroll_calculator_province text,
  add column if not exists payroll_calculator_pay_frequency text,
  add column if not exists payroll_calculator_pay_date date,
  add column if not exists payroll_calculator_gross_pay numeric(12, 2) not null default 0 check (payroll_calculator_gross_pay >= 0),
  add column if not exists payroll_calculator_td1_federal_amount numeric(12, 2) not null default 0 check (payroll_calculator_td1_federal_amount >= 0),
  add column if not exists payroll_calculator_td1_provincial_amount numeric(12, 2) not null default 0 check (payroll_calculator_td1_provincial_amount >= 0),
  add column if not exists payroll_calculator_cpp_exempt boolean not null default false,
  add column if not exists payroll_calculator_ei_exempt boolean not null default false,
  add column if not exists payroll_calculator_employer_cpp numeric(12, 2) not null default 0 check (payroll_calculator_employer_cpp >= 0),
  add column if not exists payroll_calculator_employer_ei numeric(12, 2) not null default 0 check (payroll_calculator_employer_ei >= 0);

create index if not exists worker_payments_t4_ready_status_idx
  on public.worker_payments(client_id, tax_year, t4_ready_status);
