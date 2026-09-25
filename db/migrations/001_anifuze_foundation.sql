create extension if not exists pgcrypto;

create table if not exists users (
 id uuid primary key default gen_random_uuid(),
 email text not null unique,
 name text not null,
 password_hash text,
 role text not null default 'customer' check(role in ('customer','admin')),
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
 status text not null default 'pending' check(status in ('pending','paid','cancelled','refunded')),
 currency text not null default 'USD',
 subtotal_cents integer not null default 0 check(subtotal_cents>=0),
 discount_cents integer not null default 0 check(discount_cents>=0),
 total_cents integer not null default 0 check(total_cents>=0),
 payment_provider text,
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
