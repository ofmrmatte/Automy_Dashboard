alter table public.products
  add column if not exists base_price numeric(14, 2),
  add column if not exists billing_mode text,
  add column if not exists notes text;

create index if not exists products_company_status_idx
  on public.products (company_id, status)
  where deleted_at is null;

create index if not exists products_company_created_at_idx
  on public.products (company_id, created_at desc)
  where deleted_at is null;

create index if not exists products_company_category_idx
  on public.products (company_id, lower(category))
  where deleted_at is null and category is not null;
