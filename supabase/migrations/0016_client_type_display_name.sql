alter table public.users
  add column if not exists client_type text not null default 'individual' check (client_type in ('individual', 'business')),
  add column if not exists display_name text,
  add column if not exists sin_number text;

alter table public.client_profiles
  add column if not exists sin_number text;

alter table public.companies
  add column if not exists corporation_number text,
  add column if not exists contact_person text;

update public.users
set
  client_type = coalesce(client_type, 'individual'),
  display_name = coalesce(nullif(display_name, ''), full_name)
where role = 'client';

create or replace function public.save_client_registration_profile(
  p_client_type text,
  p_full_name text default null,
  p_sin_number text default null,
  p_phone text default null,
  p_address text default null,
  p_legal_business_name text default null,
  p_operating_name text default null,
  p_business_number text default null,
  p_corporation_number text default null,
  p_contact_person text default null,
  p_business_address text default null,
  p_service_selection text default null,
  p_immigration_service text default null,
  p_tax_accounting_type text default null,
  p_self_employed_type text default null,
  p_onboarding_completed boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_type text := case when p_client_type = 'business' then 'business' else 'individual' end;
  next_display_name text;
  existing_company_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (select 1 from public.users where id = current_user_id and role = 'client') then
    raise exception 'Client profile required';
  end if;

  next_display_name := case
    when normalized_type = 'business' then coalesce(nullif(p_legal_business_name, ''), nullif(p_operating_name, ''), nullif(p_contact_person, ''), (select full_name from public.users where id = current_user_id))
    else coalesce(nullif(p_full_name, ''), (select full_name from public.users where id = current_user_id))
  end;

  update public.users
  set
    client_type = normalized_type,
    display_name = next_display_name,
    full_name = case
      when normalized_type = 'individual' then coalesce(nullif(p_full_name, ''), full_name)
      else coalesce(nullif(p_contact_person, ''), full_name)
    end,
    phone = nullif(p_phone, ''),
    sin_number = case when normalized_type = 'individual' then nullif(p_sin_number, '') else null end
  where id = current_user_id;

  insert into public.client_profiles (
    user_id,
    address,
    sin_number,
    onboarding_completed,
    onboarding_completed_at,
    service_selection,
    immigration_service,
    tax_accounting_type,
    self_employed_type
  )
  values (
    current_user_id,
    case when normalized_type = 'individual' then nullif(p_address, '') else null end,
    case when normalized_type = 'individual' then nullif(p_sin_number, '') else null end,
    coalesce(p_onboarding_completed, true),
    case when coalesce(p_onboarding_completed, true) then now() else null end,
    p_service_selection,
    p_immigration_service,
    p_tax_accounting_type,
    p_self_employed_type
  )
  on conflict (user_id) do update
    set
      address = case when normalized_type = 'individual' then nullif(p_address, '') else null end,
      sin_number = case when normalized_type = 'individual' then nullif(p_sin_number, '') else null end,
      onboarding_completed = coalesce(p_onboarding_completed, public.client_profiles.onboarding_completed),
      onboarding_completed_at = case
        when coalesce(p_onboarding_completed, false) then coalesce(public.client_profiles.onboarding_completed_at, now())
        else public.client_profiles.onboarding_completed_at
      end,
      service_selection = p_service_selection,
      immigration_service = p_immigration_service,
      tax_accounting_type = p_tax_accounting_type,
      self_employed_type = p_self_employed_type;

  if normalized_type = 'business' then
    select id
      into existing_company_id
      from public.companies
      where client_id = current_user_id
      order by created_at
      limit 1;

    if existing_company_id is null then
      insert into public.companies (
        client_id,
        legal_name,
        trade_name,
        business_number,
        corporation_number,
        contact_person,
        address
      )
      values (
        current_user_id,
        coalesce(nullif(p_legal_business_name, ''), next_display_name),
        nullif(p_operating_name, ''),
        nullif(p_business_number, ''),
        nullif(p_corporation_number, ''),
        nullif(p_contact_person, ''),
        nullif(p_business_address, '')
      );
    else
      update public.companies
      set
        legal_name = coalesce(nullif(p_legal_business_name, ''), legal_name),
        trade_name = nullif(p_operating_name, ''),
        business_number = nullif(p_business_number, ''),
        corporation_number = nullif(p_corporation_number, ''),
        contact_person = nullif(p_contact_person, ''),
        address = nullif(p_business_address, '')
      where id = existing_company_id;
    end if;
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_type text := case when new.raw_user_meta_data ->> 'client_type' = 'business' then 'business' else 'individual' end;
  next_full_name text;
  next_display_name text;
begin
  next_full_name := case
    when normalized_type = 'business' then coalesce(nullif(new.raw_user_meta_data ->> 'contact_person', ''), nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'New Client')
    else coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'New Client')
  end;

  next_display_name := case
    when normalized_type = 'business' then coalesce(nullif(new.raw_user_meta_data ->> 'legal_business_name', ''), nullif(new.raw_user_meta_data ->> 'display_name', ''), next_full_name)
    else coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), next_full_name)
  end;

  insert into public.users (id, email, full_name, role, phone, client_type, display_name, sin_number)
  values (
    new.id,
    new.email,
    next_full_name,
    'client',
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    normalized_type,
    next_display_name,
    case when normalized_type = 'individual' then nullif(new.raw_user_meta_data ->> 'sin_number', '') else null end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.users.full_name, excluded.full_name),
        phone = coalesce(public.users.phone, excluded.phone),
        client_type = coalesce(public.users.client_type, excluded.client_type),
        display_name = coalesce(nullif(public.users.display_name, ''), excluded.display_name),
        sin_number = coalesce(public.users.sin_number, excluded.sin_number);

  insert into public.client_profiles (user_id, address, sin_number)
  values (
    new.id,
    case when normalized_type = 'individual' then nullif(new.raw_user_meta_data ->> 'address', '') else null end,
    case when normalized_type = 'individual' then nullif(new.raw_user_meta_data ->> 'sin_number', '') else null end
  )
  on conflict (user_id) do update
    set address = coalesce(public.client_profiles.address, excluded.address),
        sin_number = coalesce(public.client_profiles.sin_number, excluded.sin_number);

  if normalized_type = 'business' and nullif(new.raw_user_meta_data ->> 'legal_business_name', '') is not null then
    insert into public.companies (
      client_id,
      legal_name,
      trade_name,
      business_number,
      corporation_number,
      contact_person,
      address
    )
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'legal_business_name', ''), next_display_name),
      nullif(new.raw_user_meta_data ->> 'operating_name', ''),
      nullif(new.raw_user_meta_data ->> 'business_number', ''),
      nullif(new.raw_user_meta_data ->> 'corporation_number', ''),
      nullif(new.raw_user_meta_data ->> 'contact_person', ''),
      nullif(new.raw_user_meta_data ->> 'business_address', '')
    );
  end if;

  return new;
end;
$$;
