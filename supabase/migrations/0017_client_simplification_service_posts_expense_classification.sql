alter table public.expense_entries
  add column if not exists admin_expense_classification text not null default 'Regular expense',
  add column if not exists admin_expense_classification_notes text,
  add column if not exists classified_by uuid references public.users(id) on delete set null,
  add column if not exists classified_at timestamptz;

create index if not exists expense_entries_admin_classification_idx
  on public.expense_entries (client_id, tax_year, admin_expense_classification);

create table if not exists public.public_service_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('Immigration', 'Accounting', 'Business')),
  service_type text not null,
  language text not null default 'en',
  content text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_service_posts_category_idx
  on public.public_service_posts (category, service_type, language);

create index if not exists public_service_posts_published_idx
  on public.public_service_posts (is_published, published_at desc);

alter table public.public_service_posts enable row level security;

drop policy if exists "public_service_posts_read_published" on public.public_service_posts;
create policy "public_service_posts_read_published"
  on public.public_service_posts for select
  using (is_published or public.is_admin());

drop policy if exists "public_service_posts_admin_write" on public.public_service_posts;
create policy "public_service_posts_admin_write"
  on public.public_service_posts for all
  using (public.is_admin())
  with check (public.is_admin());
