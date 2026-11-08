-- Exodus Pathways foundation.  Kept in public with an exodus_ prefix so it can
-- share this Supabase project without colliding with the KAL portal tables.
create table if not exists public.exodus_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  display_name text,
  role text not null default 'client' check (role in ('admin', 'employee', 'client')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exodus_client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.exodus_users(id) on delete cascade,
  assigned_employee_id uuid references public.exodus_users(id) on delete set null,
  intake_status text not null default 'new' check (intake_status in ('new', 'in_review', 'active', 'closed')),
  service_notes text,
  address text,
  province text,
  postal_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exodus_companies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.exodus_users(id) on delete cascade,
  legal_name text not null,
  trade_name text,
  business_number text,
  province text,
  fiscal_year_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exodus_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.exodus_users(id) on delete cascade,
  uploaded_by uuid not null references public.exodus_users(id) on delete restrict,
  bucket text not null default 'exodus-client-documents',
  storage_path text not null,
  document_type text not null default 'general',
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  status text not null default 'uploaded' check (status in ('uploaded', 'reviewing', 'accepted', 'needs_information')),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create table if not exists public.exodus_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.exodus_users(id) on delete cascade,
  sender_id uuid not null references public.exodus_users(id) on delete restrict,
  recipient_id uuid references public.exodus_users(id) on delete set null,
  subject text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.exodus_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.exodus_users(id) on delete cascade,
  assigned_to uuid references public.exodus_users(id) on delete set null,
  title text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_client', 'complete')),
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exodus_documents_client_created_idx on public.exodus_documents(client_id, created_at desc);
create index if not exists exodus_messages_client_created_idx on public.exodus_messages(client_id, created_at desc);
create index if not exists exodus_tasks_client_status_idx on public.exodus_tasks(client_id, status);

create or replace function public.exodus_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.exodus_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.exodus_users where id = (select auth.uid()) and role = 'admin')
$$;

create or replace function public.exodus_can_access_client(target_client_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select public.exodus_is_admin())
    or target_client_id = (select auth.uid())
    or exists (
      select 1 from public.exodus_client_profiles p
      where p.user_id = target_client_id and p.assigned_employee_id = (select auth.uid())
    )
$$;

-- Creates the signed-in Exodus identity on first use. The named business owner
-- becomes the initial Exodus administrator; later staff are assigned by that admin.
create or replace function public.exodus_ensure_profile()
returns public.exodus_users language plpgsql security definer set search_path = '' as $$
declare profile public.exodus_users;
begin
  if (select auth.uid()) is null then raise exception 'Authentication is required'; end if;
  insert into public.exodus_users (id, email, full_name, display_name, role)
  select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', u.email),
         coalesce(u.raw_user_meta_data ->> 'full_name', u.email),
         case when lower(u.email) = 'tesfilej@gmail.com' then 'admin' else 'client' end
  from auth.users u where u.id = (select auth.uid())
  on conflict (id) do update set email = excluded.email, updated_at = now()
  returning * into profile;
  if profile.role = 'client' then
    insert into public.exodus_client_profiles (user_id) values (profile.id) on conflict (user_id) do nothing;
  end if;
  return profile;
end;
$$;

revoke all on function public.exodus_is_admin() from public;
revoke all on function public.exodus_can_access_client(uuid) from public;
revoke all on function public.exodus_ensure_profile() from public;
grant execute on function public.exodus_is_admin(), public.exodus_can_access_client(uuid), public.exodus_ensure_profile() to authenticated;

drop trigger if exists exodus_users_updated_at on public.exodus_users;
create trigger exodus_users_updated_at before update on public.exodus_users for each row execute function public.exodus_set_updated_at();
drop trigger if exists exodus_client_profiles_updated_at on public.exodus_client_profiles;
create trigger exodus_client_profiles_updated_at before update on public.exodus_client_profiles for each row execute function public.exodus_set_updated_at();
drop trigger if exists exodus_companies_updated_at on public.exodus_companies;
create trigger exodus_companies_updated_at before update on public.exodus_companies for each row execute function public.exodus_set_updated_at();
drop trigger if exists exodus_documents_updated_at on public.exodus_documents;
create trigger exodus_documents_updated_at before update on public.exodus_documents for each row execute function public.exodus_set_updated_at();
drop trigger if exists exodus_tasks_updated_at on public.exodus_tasks;
create trigger exodus_tasks_updated_at before update on public.exodus_tasks for each row execute function public.exodus_set_updated_at();

alter table public.exodus_users enable row level security;
alter table public.exodus_client_profiles enable row level security;
alter table public.exodus_companies enable row level security;
alter table public.exodus_documents enable row level security;
alter table public.exodus_messages enable row level security;
alter table public.exodus_tasks enable row level security;

create policy exodus_users_read on public.exodus_users for select to authenticated using (id = (select auth.uid()) or (select public.exodus_is_admin()));
create policy exodus_users_admin_update on public.exodus_users for update to authenticated using ((select public.exodus_is_admin())) with check ((select public.exodus_is_admin()));
create policy exodus_profiles_scope on public.exodus_client_profiles for all to authenticated using ((select public.exodus_can_access_client(user_id))) with check ((select public.exodus_can_access_client(user_id)));
create policy exodus_companies_scope on public.exodus_companies for all to authenticated using ((select public.exodus_can_access_client(client_id))) with check ((select public.exodus_can_access_client(client_id)));
create policy exodus_documents_scope on public.exodus_documents for all to authenticated using ((select public.exodus_can_access_client(client_id))) with check ((select public.exodus_can_access_client(client_id)) and uploaded_by = (select auth.uid()));
create policy exodus_messages_scope on public.exodus_messages for select to authenticated using ((select public.exodus_can_access_client(client_id)));
create policy exodus_messages_insert on public.exodus_messages for insert to authenticated with check ((select public.exodus_can_access_client(client_id)) and sender_id = (select auth.uid()));
create policy exodus_tasks_scope on public.exodus_tasks for all to authenticated using ((select public.exodus_can_access_client(client_id))) with check ((select public.exodus_can_access_client(client_id)));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exodus-client-documents', 'exodus-client-documents', false, 26214400,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy exodus_storage_read on storage.objects for select to authenticated using (
  bucket_id = 'exodus-client-documents' and public.exodus_can_access_client((storage.foldername(name))[1]::uuid)
);
create policy exodus_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'exodus-client-documents' and owner_id = (select auth.uid())::text and public.exodus_can_access_client((storage.foldername(name))[1]::uuid)
);
create policy exodus_storage_update on storage.objects for update to authenticated using (
  bucket_id = 'exodus-client-documents' and owner_id = (select auth.uid())::text and public.exodus_can_access_client((storage.foldername(name))[1]::uuid)
) with check (
  bucket_id = 'exodus-client-documents' and owner_id = (select auth.uid())::text and public.exodus_can_access_client((storage.foldername(name))[1]::uuid)
);
create policy exodus_storage_delete on storage.objects for delete to authenticated using (
  bucket_id = 'exodus-client-documents' and owner_id = (select auth.uid())::text and public.exodus_can_access_client((storage.foldername(name))[1]::uuid)
);

