create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text not null,
  username text not null,
  role text not null check (role in ('admin','ustaz')),
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_uidx on public.profiles (lower(username));
create index if not exists profiles_auth_user_id_idx on public.profiles (auth_user_id);
alter table public.profiles enable row level security;

create table if not exists public.pelanggaran (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  student_name_normalized text not null,
  student_class text not null,
  student_photo_url text,
  category text not null check (category in ('ringan','sedang','berat')),
  description text not null,
  incident_date date not null,
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pelanggaran_student_name_normalized_idx on public.pelanggaran (student_name_normalized);
create index if not exists pelanggaran_student_class_idx on public.pelanggaran (student_class);
create index if not exists pelanggaran_category_idx on public.pelanggaran (category);
create index if not exists pelanggaran_incident_date_idx on public.pelanggaran (incident_date desc);
create index if not exists pelanggaran_reporter_id_idx on public.pelanggaran (reporter_id);
create index if not exists pelanggaran_created_at_idx on public.pelanggaran (created_at desc);
alter table public.pelanggaran enable row level security;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);
alter table public.audit_logs enable row level security;

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create or replace function public.normalize_student_name() returns trigger
language plpgsql set search_path = '' as $$
begin new.student_name_normalized = lower(regexp_replace(trim(new.student_name), '\s+', ' ', 'g')); return new; end;
$$;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists pelanggaran_set_updated_at on public.pelanggaran;
create trigger pelanggaran_set_updated_at before update on public.pelanggaran for each row execute function public.set_updated_at();
drop trigger if exists pelanggaran_normalize_student on public.pelanggaran;
create trigger pelanggaran_normalize_student before insert or update of student_name on public.pelanggaran for each row execute function public.normalize_student_name();
