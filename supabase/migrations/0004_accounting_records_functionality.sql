alter table public.income_entries
  add column if not exists gst_hst_amount numeric(12, 2) not null default 0 check (gst_hst_amount >= 0);

alter type public.expense_category add value if not exists 'Materials';
alter type public.expense_category add value if not exists 'Vehicle';
alter type public.expense_category add value if not exists 'Tools';
alter type public.expense_category add value if not exists 'Rent';
alter type public.expense_category add value if not exists 'Payroll';
alter type public.expense_category add value if not exists 'Supplies';
alter type public.expense_category add value if not exists 'Office';

create index if not exists income_entries_client_year_date_idx
  on public.income_entries(client_id, tax_year, entry_date);

create index if not exists expense_entries_client_year_date_idx
  on public.expense_entries(client_id, tax_year, expense_date);

create index if not exists assets_client_year_idx
  on public.assets(client_id, tax_year);
