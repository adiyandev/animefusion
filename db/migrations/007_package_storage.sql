-- Phase Six — Release & Template Package Storage
create extension if not exists pgcrypto;

alter table releases add column if not exists release_code text;
alter table releases add column if not exists storage_key text;
alter table releases add column if not exists artifact_name text;
alter table releases add column if not exists artifact_size_bytes bigint;
alter table templates add column if not exists template_code text;
alter table templates add column if not exists storage_key text;
alter table templates add column if not exists package_name text;
alter table templates add column if not exists package_size_bytes bigint;

update releases
set release_code='REL-'||upper(substr(replace(id::text,'-',''),1,10))
where release_code is null;

update templates
set template_code='TPL-'||upper(substr(replace(id::text,'-',''),1,10))
where template_code is null;

alter table releases alter column release_code set not null;
alter table templates alter column template_code set not null;

create unique index if not exists idx_releases_release_code on releases(release_code);
create unique index if not exists idx_templates_template_code on templates(template_code);

create index if not exists idx_releases_storage_key on releases(storage_key);
create index if not exists idx_templates_storage_key on templates(storage_key);
