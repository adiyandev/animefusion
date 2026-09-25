-- AniFuze complete database migration
-- Run this single file once in Neon SQL Editor.
-- Safe/idempotent CREATE operations are used throughout.
-- Migration order: 001 -> 002 -> 003 -> 004 -> 005 -> 006.



-- ============================================================
-- db/migrations/001_anifuze_foundation.sql
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists users (
 id uuid primary key default gen_random_uuid(),
 email text not null unique,
 name text not null,
 password_hash text,
 role text not null default 'customer' check(role in ('customer','owner','admin','support','developer','finance')),
 email_verified_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists profiles (
 user_id uuid primary key references users(id) on delete cascade,
 display_name text,
 avatar_url text,
 banner_url text,
 bio text,
 preferences jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);

create table if not exists sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references users(id) on delete cascade,
 token_hash text not null unique,
 expires_at timestamptz not null,
 created_at timestamptz not null default now(),
 last_seen_at timestamptz
);

create table if not exists services (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 name text not null,
 description text,
 version text,
 status text not null default 'ACTIVE',
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists orders (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references users(id) on delete restrict,
 status text not null default 'pending' check(status in ('pending','approved','rejected','paid','cancelled','refunded')),
 currency text not null default 'USD',
 subtotal_cents integer not null default 0 check(subtotal_cents>=0),
 discount_cents integer not null default 0 check(discount_cents>=0),
 total_cents integer not null default 0 check(total_cents>=0),
 payment_provider text,
 payment_method text not null default 'card',
 payment_reference text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists licenses (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references users(id) on delete restrict,
 service_id uuid references services(id) on delete set null,
 order_id uuid references orders(id) on delete set null,
 license_key text not null unique,
 license_type text not null default 'platform',
 status text not null default 'ACTIVE',
 scope text,
 issued_at timestamptz not null default now(),
 expires_at timestamptz,
 metadata jsonb not null default '{}'::jsonb
);

create table if not exists support_cases (
 id uuid primary key default gen_random_uuid(),
 case_number text not null unique,
 user_id uuid not null references users(id) on delete cascade,
 subject text not null,
 status text not null default 'OPEN' check(status in ('OPEN','IN_PROGRESS','WAITING','RESOLVED','CLOSED')),
 priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 closed_at timestamptz
);

create table if not exists support_messages (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references support_cases(id) on delete cascade,
 sender_user_id uuid references users(id) on delete set null,
 body text not null,
 created_at timestamptz not null default now()
);

create table if not exists support_attachments (
 id uuid primary key default gen_random_uuid(),
 message_id uuid not null references support_messages(id) on delete cascade,
 file_name text not null,
 content_type text,
 storage_key text not null,
 size_bytes bigint check(size_bytes>=0),
 created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user on sessions(user_id);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_licenses_user on licenses(user_id);
create index if not exists idx_support_cases_user on support_cases(user_id);
create index if not exists idx_support_messages_case on support_messages(case_id);


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
 ('admin','customers.read'),('admin','orders.read'),('admin','orders.manage'),('admin','licenses.read'),('admin','support.manage'),('admin','system.read'),
 ('support','customers.read'),('support','support.manage'),('support','orders.read'),
 ('developer','system.read'),('developer','providers.manage'),('developer','releases.manage'),
 ('finance','customers.read'),('finance','orders.read'),('finance','orders.manage')
on conflict(role,permission) do nothing;



-- ============================================================
-- db/migrations/002_admin_foundation_upgrade.sql
-- ============================================================

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



-- ============================================================
-- db/migrations/003_commerce_phase_two.sql
-- ============================================================

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



-- ============================================================
-- db/migrations/004_licensing_phase_three.sql
-- ============================================================

-- AniFuze Phase Three — Licensing, Entitlements, Activations & Installations
create extension if not exists pgcrypto;

alter table licenses add column if not exists product_id uuid references products(id) on delete set null;
alter table licenses add column if not exists max_activations integer not null default 1 check(max_activations>0);
alter table licenses add column if not exists activation_count integer not null default 0 check(activation_count>=0);
alter table licenses add column if not exists revoked_at timestamptz;
alter table licenses add column if not exists updated_at timestamptz not null default now();

create table if not exists license_activations (
 id uuid primary key default gen_random_uuid(),
 license_id uuid not null references licenses(id) on delete cascade,
 user_id uuid not null references users(id) on delete cascade,
 installation_id uuid,
 activation_token_hash text not null unique,
 fingerprint_hash text not null,
 label text,
 status text not null default 'ACTIVE' check(status in ('ACTIVE','REVOKED')),
 activated_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 revoked_at timestamptz
);

create table if not exists installations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references users(id) on delete cascade,
 license_id uuid references licenses(id) on delete set null,
 activation_id uuid references license_activations(id) on delete set null,
 domain text,
 version text,
 environment text not null default 'production',
 status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE','SUSPENDED')),
 last_seen_at timestamptz,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table license_activations
  add constraint license_activations_installation_fk
  foreign key (installation_id) references installations(id) on delete set null;

create table if not exists entitlements (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references products(id) on delete cascade,
 license_id uuid not null references licenses(id) on delete cascade,
 entitlement text not null,
 enabled boolean not null default true,
 metadata jsonb not null default '{}'::jsonb,
 unique(license_id,entitlement)
);

create index if not exists idx_license_activations_license on license_activations(license_id);
create index if not exists idx_license_activations_user on license_activations(user_id);
create index if not exists idx_installations_user on installations(user_id);
create index if not exists idx_installations_license on installations(license_id);
create index if not exists idx_entitlements_license on entitlements(license_id);

insert into admin_permissions(role,permission) values
 ('admin','licenses.manage'),
 ('admin','activations.read'),
 ('admin','activations.manage'),
 ('admin','installations.read'),
 ('admin','installations.manage'),
 ('developer','licenses.read'),
 ('developer','licenses.manage'),
 ('developer','activations.read'),
 ('developer','activations.manage'),
 ('support','licenses.read'),
 ('support','activations.read'),
 ('finance','licenses.read')
on conflict(role,permission) do nothing;



-- ============================================================
-- db/migrations/005_platform_phase_four.sql
-- ============================================================

-- AniFuze Phase Four — Platform, Providers, Releases, Delivery & Marketplace
create extension if not exists pgcrypto;

create table if not exists providers (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 name text not null,
 provider_type text not null default 'api' check(provider_type in ('api','embed','direct')),
 endpoint text,
 priority integer not null default 100,
 enabled boolean not null default true,
 health_status text not null default 'unknown' check(health_status in ('unknown','healthy','degraded','offline')),
 config jsonb not null default '{}'::jsonb,
 secret_config jsonb not null default '{}'::jsonb,
 last_checked_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists provider_requests (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid not null references providers(id) on delete cascade,
 user_id uuid references users(id) on delete set null,
 action text not null,
 success boolean not null default false,
 status_code integer,
 latency_ms integer,
 error text,
 created_at timestamptz not null default now()
);

create table if not exists releases (
 id uuid primary key default gen_random_uuid(),
 version text not null unique,
 channel text not null default 'stable' check(channel in ('stable','beta','dev')),
 status text not null default 'draft' check(status in ('draft','ready','published','revoked')),
 checksum_sha256 text,
 signature text,
 release_notes text,
 artifact_url text,
 created_by uuid references users(id) on delete set null,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists release_assets (
 id uuid primary key default gen_random_uuid(),
 release_id uuid not null references releases(id) on delete cascade,
 name text not null,
 asset_type text not null default 'installer',
 url text not null,
 checksum_sha256 text,
 size_bytes bigint,
 created_at timestamptz not null default now()
);

create table if not exists templates (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 name text not null,
 description text,
 version text not null default '1.0.0',
 price_cents integer not null default 0 check(price_cents>=0),
 active boolean not null default true,
 presentation_only boolean not null default true,
 preview_url text,
 package_url text,
 checksum_sha256 text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists template_installations (
 id uuid primary key default gen_random_uuid(),
 template_id uuid not null references templates(id) on delete cascade,
 user_id uuid not null references users(id) on delete cascade,
 version text not null,
 status text not null default 'installed' check(status in ('installed','active','disabled')),
 installed_at timestamptz not null default now(),
 activated_at timestamptz
);

create table if not exists deliveries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references users(id) on delete cascade,
 order_id uuid references orders(id) on delete set null,
 license_id uuid references licenses(id) on delete set null,
 release_id uuid references releases(id) on delete set null,
 template_id uuid references templates(id) on delete set null,
 delivery_type text not null default 'release' check(delivery_type in ('release','template','installer')),
 status text not null default 'pending' check(status in ('pending','authorized','delivered','revoked','failed')),
 download_token_hash text unique,
 download_expires_at timestamptz,
 downloaded_at timestamptz,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create index if not exists idx_providers_priority on providers(priority,enabled);
create index if not exists idx_provider_requests_provider on provider_requests(provider_id,created_at desc);
create index if not exists idx_releases_status on releases(status,created_at desc);
create index if not exists idx_template_installations_user on template_installations(user_id);
create index if not exists idx_deliveries_user on deliveries(user_id,created_at desc);

insert into admin_permissions(role,permission) values
 ('admin','providers.read'),('admin','providers.manage'),
 ('admin','releases.read'),('admin','releases.manage'),
 ('admin','delivery.read'),('admin','delivery.manage'),
 ('admin','templates.read'),('admin','templates.manage'),
 ('developer','providers.read'),('developer','providers.manage'),
 ('developer','releases.read'),('developer','releases.manage'),
 ('developer','delivery.read'),('developer','delivery.manage'),
 ('developer','templates.read'),('developer','templates.manage'),
 ('support','delivery.read'),('support','templates.read')
on conflict(role,permission) do nothing;

insert into templates(slug,name,description,price_cents,metadata)
values
 ('midnight','Midnight','Dark glass presentation template.',0,'{"theme":"dark","style":"glass"}'),
 ('fusion-light','Fusion Light','Bright enterprise presentation template.',0,'{"theme":"light","style":"saas"}')
on conflict(slug) do nothing;



-- ============================================================
-- db/migrations/006_operations_phase_five.sql
-- ============================================================

-- AniFuze Phase Five — Operations, Analytics, Notifications, Security, Settings, Backups & Updates
create extension if not exists pgcrypto;

create table if not exists notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references users(id) on delete cascade,
 title text not null,
 body text not null,
 type text not null default 'system',
 read_at timestamptz,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create table if not exists analytics_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references users(id) on delete set null,
 event_name text not null,
 path text,
 session_id text,
 ip_address inet,
 user_agent text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create table if not exists security_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references users(id) on delete set null,
 event_type text not null,
 severity text not null default 'info' check(severity in ('info','warning','critical')),
 ip_address inet,
 user_agent text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create table if not exists system_settings (
 key text primary key,
 value jsonb not null default '{}'::jsonb,
 secret boolean not null default false,
 updated_by uuid references users(id) on delete set null,
 updated_at timestamptz not null default now()
);

create table if not exists backup_jobs (
 id uuid primary key default gen_random_uuid(),
 status text not null default 'queued' check(status in ('queued','running','completed','failed')),
 backup_type text not null default 'database',
 storage_key text,
 size_bytes bigint,
 checksum_sha256 text,
 error text,
 started_at timestamptz,
 completed_at timestamptz,
 created_by uuid references users(id) on delete set null,
 created_at timestamptz not null default now()
);

create table if not exists update_jobs (
 id uuid primary key default gen_random_uuid(),
 release_id uuid references releases(id) on delete set null,
 status text not null default 'queued' check(status in ('queued','running','completed','failed','cancelled')),
 target text not null default 'platform',
 version_from text,
 version_to text,
 error text,
 started_at timestamptz,
 completed_at timestamptz,
 created_by uuid references users(id) on delete set null,
 created_at timestamptz not null default now()
);

alter table users add column if not exists two_factor_enabled boolean not null default false;
alter table users add column if not exists two_factor_secret text;
alter table users add column if not exists password_changed_at timestamptz;

create index if not exists idx_notifications_user_created on notifications(user_id,created_at desc);
create index if not exists idx_notifications_unread on notifications(user_id,read_at);
create index if not exists idx_analytics_events_created on analytics_events(created_at desc);
create index if not exists idx_analytics_events_name on analytics_events(event_name,created_at desc);
create index if not exists idx_security_events_created on security_events(created_at desc);
create index if not exists idx_security_events_user on security_events(user_id,created_at desc);
create index if not exists idx_backup_jobs_created on backup_jobs(created_at desc);
create index if not exists idx_update_jobs_created on update_jobs(created_at desc);

insert into admin_permissions(role,permission) values
 ('admin','analytics.read'),('admin','notifications.manage'),('admin','security.read'),('admin','security.manage'),
 ('admin','settings.read'),('admin','settings.manage'),('admin','backups.read'),('admin','backups.manage'),('admin','updates.read'),('admin','updates.manage'),
 ('developer','analytics.read'),('developer','security.read'),('developer','settings.read'),('developer','backups.read'),('developer','updates.read'),('developer','updates.manage'),
 ('support','notifications.manage'),('support','security.read')
on conflict(role,permission) do nothing;

insert into system_settings(key,value) values
 ('maintenance_mode','{"enabled":false}'::jsonb),
 ('registration','{"enabled":true}'::jsonb),
 ('default_locale','{"value":"en"}'::jsonb),
 ('security_policy','{"session_days":30,"require_verified_email":false}'::jsonb)
on conflict(key) do nothing;

