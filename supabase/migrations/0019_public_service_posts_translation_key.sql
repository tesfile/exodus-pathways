alter table public.public_service_posts
  add column if not exists translation_key text;

create index if not exists public_service_posts_translation_key_idx
  on public.public_service_posts (translation_key, language)
  where translation_key is not null;
