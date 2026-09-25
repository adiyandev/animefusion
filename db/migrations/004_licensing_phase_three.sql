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
