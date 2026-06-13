alter table public.public_service_posts
  drop constraint if exists public_service_posts_category_check;

alter table public.public_service_posts
  add constraint public_service_posts_category_check
  check (category in ('Immigration', 'Accounting', 'Business', 'General'));
