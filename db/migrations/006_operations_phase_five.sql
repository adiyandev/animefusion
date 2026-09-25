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
