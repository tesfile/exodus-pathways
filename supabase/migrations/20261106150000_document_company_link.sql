-- Add optional company linkage for new client document uploads. Existing records
-- remain valid with a NULL company_id.
alter table public.documents
  add column if not exists company_id uuid references public.companies(id) on delete set null;

create index if not exists documents_client_company_year_idx
  on public.documents(client_id, company_id, tax_year);

-- Prevent a client from attaching a document to another client's company, even
-- if a browser request is modified outside the application UI.
create or replace function public.validate_document_company_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.company_id is not null and not exists (
    select 1
    from public.companies company
    where company.id = new.company_id
      and company.client_id = new.client_id
  ) then
    raise exception 'The selected company does not belong to this client.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_document_company_owner on public.documents;
create trigger validate_document_company_owner
  before insert or update of company_id, client_id on public.documents
  for each row execute function public.validate_document_company_owner();
