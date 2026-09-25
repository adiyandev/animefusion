-- AniFuze Admin Foundation upgrade
-- Safe to run after 001_anifuze_foundation.sql on an existing database.

create extension if not exists pgcrypto;

alter table users drop constraint if exists users_role_check;
alter table users
  add constraint users_role_check
  check(role in ('customer','owner','admin','support','developer','finance'));

alter table orders drop constraint if exists orders_status_check;
alter table orders
  add constraint orders_status_check
  check(status in ('pending','approved','rejected','paid','cancelled','refunded'));

create table if not exists admin_permissions (
 id uuid primary key default gen_random_uuid(),
 role text not null,
 permission text not null,
 unique(role,permission)
);

create table if not exists audit_logs (
 id uuid primary key default gen_random_uuid(),
 actor_user_id uuid references users(id) on delete set null,
 action text not null,
 entity_type text,
 entity_id uuid,
 metadata jsonb not null default '{}'::jsonb,
 ip_address inet,
 user_agent text,
 created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created on audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor on audit_logs(actor_user_id);

insert into admin_permissions(role,permission) values
 ('owner','*'),
 ('admin','customers.read'),
 ('admin','orders.read'),
 ('admin','orders.manage'),
 ('admin','licenses.read'),
 ('admin','support.manage'),
 ('admin','system.read'),
 ('support','customers.read'),
 ('support','support.manage'),
 ('support','orders.read'),
 ('developer','system.read'),
 ('developer','providers.manage'),
 ('developer','releases.manage'),
 ('finance','customers.read'),
 ('finance','orders.read'),
 ('finance','orders.manage')
on conflict(role,permission) do nothing;
