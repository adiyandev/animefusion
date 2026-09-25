-- AniFuze Phase Two — Commerce, Customers, Products & Payments
create extension if not exists pgcrypto;

create table if not exists products (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 name text not null,
 description text,
 price_cents integer not null default 0 check(price_cents>=0),
 currency text not null default 'USD',
 product_type text not null default 'platform',
 active boolean not null default true,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table orders add column if not exists product_id uuid references products(id) on delete set null;
alter table orders add column if not exists payment_status text not null default 'unpaid';
alter table orders add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check
  check(payment_status in ('unpaid','pending','paid','failed','refunded'));

create index if not exists idx_orders_product on orders(product_id);
create index if not exists idx_orders_payment_status on orders(payment_status);
create index if not exists idx_products_active on products(active);

insert into admin_permissions(role,permission) values
 ('owner','*'),
 ('admin','customers.manage'),
 ('admin','products.read'),
 ('admin','products.manage'),
 ('finance','products.read'),
 ('finance','products.manage')
on conflict(role,permission) do nothing;

insert into products(slug,name,description,price_cents,currency,product_type,active,metadata)
values
 ('complete-package','AniFuze Complete Package','Complete AniFuze anime platform package with website, administration, license, installer, verified delivery and support.',5600,'USD','platform',true,'{"launch_discount_cents":1400}'::jsonb),
 ('midnight-template','Midnight','Dark glass presentation template for AniFuze.',0,'USD','template',true,'{"presentation_only":true}'),
 ('fusion-light-template','Fusion Light','Bright enterprise presentation template for AniFuze.',0,'USD','template',true,'{"presentation_only":true}')
on conflict(slug) do nothing;
