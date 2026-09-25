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
