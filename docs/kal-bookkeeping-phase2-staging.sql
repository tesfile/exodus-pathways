-- Run in STAGING Supabase SQL editor only. Do not apply to production.
create table if not exists public.kal_accounts (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.users(id),
 code text not null,
 name text not null,
 type text not null check (type in ('asset','liability','equity','income','expense')),
 subtype text,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(client_id, code),
 unique(id,client_id)
);
create table if not exists public.kal_open_items (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.users(id),
 kind text not null check (kind in ('receivable','payable')),
 party_name text not null,
 party_address text,
 reference text not null,
 issue_date date not null,
 due_date date,
 amount numeric(14,2) not null check (amount > 0),
 tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
 paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0 and paid_amount <= amount + tax_amount),
 status text not null default 'draft' check (status in ('draft','approved','void')),
 notes text,
 created_at timestamptz not null default now(),
 unique(client_id,kind,reference)
);
create index if not exists kal_open_items_client_kind_idx on public.kal_open_items(client_id,kind);
create table if not exists public.kal_journals (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.users(id),
 entry_date date not null,
 reference text,
 memo text,
 status text not null default 'draft' check(status in ('draft','posted','reversed')),
 created_at timestamptz not null default now(),
 unique(id,client_id)
);
create table if not exists public.kal_journal_lines (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.users(id),
 journal_id uuid not null,
 account_id uuid not null,
 debit numeric(14,2) not null default 0 check(debit >= 0),
 credit numeric(14,2) not null default 0 check(credit >= 0),
 check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0)),
 foreign key(journal_id,client_id) references public.kal_journals(id,client_id),
 foreign key(account_id,client_id) references public.kal_accounts(id,client_id)
);
create index if not exists kal_journal_lines_client_idx on public.kal_journal_lines(client_id,journal_id);
alter table public.kal_accounts enable row level security;
alter table public.kal_open_items enable row level security;
alter table public.kal_journals enable row level security;
alter table public.kal_journal_lines enable row level security;
-- Admin-only RLS. Database role is checked, not editable JWT metadata.
create policy kal_accounts_admin on public.kal_accounts for all to authenticated using (exists (select 1 from public.users u where u.id=auth.uid() and u.role='admin')) with check (exists (select 1 from public.users u where u.id=auth.uid() and u.role='admin'));
create policy kal_open_items_admin on public.kal_open_items for all to authenticated using (exists (select 1 from public.users u where u.id=auth.uid() and u.role='admin')) with check (exists (select 1 from public.users u where u.id=auth.uid() and u.role='admin'));
create policy kal_journals_admin on public.kal_journals for all to authenticated using (exists (select 1 from public.users u where u.id=auth.uid() and u.role='admin')) with check (exists (select 1 from public.users u where u.id=auth.uid() and u.role='admin'));
create policy kal_journal_lines_admin on public.kal_journal_lines for all to authenticated using (exists (select 1 from public.users u where u.id=auth.uid() and u.role='admin')) with check (exists (select 1 from public.users u where u.id=auth.uid() and u.role='admin'));
grant select,insert,update,delete on public.kal_accounts, public.kal_open_items, public.kal_journals, public.kal_journal_lines to authenticated;
revoke all on public.kal_accounts, public.kal_open_items, public.kal_journals, public.kal_journal_lines from anon;
