-- ===== supabase/migrations/001_init.sql =====
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

-- ===== supabase/migrations/002_rls.sql =====
create or replace function public.current_profile_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.id from public.profiles p where p.auth_user_id = auth.uid() and p.is_active and p.deleted_at is null limit 1;
$$;
create or replace function public.current_role() returns text
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.auth_user_id = auth.uid() and p.is_active and p.deleted_at is null limit 1;
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$ select coalesce(public.current_role() = 'admin', false); $$;
create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$ select public.current_profile_id() is not null; $$;
revoke all on function public.current_profile_id() from public;
revoke all on function public.current_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_active_user() from public;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_user() to authenticated;

create or replace function public.protect_reporter_id() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() and new.reporter_id is distinct from old.reporter_id then
    raise exception 'Pelapor laporan tidak dapat diubah.' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists pelanggaran_protect_reporter on public.pelanggaran;
create trigger pelanggaran_protect_reporter before update on public.pelanggaran for each row execute function public.protect_reporter_id();

create or replace function public.log_violation_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs(user_id, action, target_type, target_id)
  values (public.current_profile_id(), lower(tg_op), 'pelanggaran', coalesce(new.id, old.id));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists pelanggaran_audit on public.pelanggaran;
create trigger pelanggaran_audit after insert or update or delete on public.pelanggaran for each row execute function public.log_violation_change();

drop policy if exists profiles_read_active on public.profiles;
create policy profiles_read_active on public.profiles for select to authenticated using (public.is_active_user());
drop policy if exists pelanggaran_read_active on public.pelanggaran;
create policy pelanggaran_read_active on public.pelanggaran for select to authenticated using (public.is_active_user());
drop policy if exists pelanggaran_insert_self on public.pelanggaran;
create policy pelanggaran_insert_self on public.pelanggaran for insert to authenticated with check (public.is_active_user() and reporter_id = public.current_profile_id());
drop policy if exists pelanggaran_update_owner_or_admin on public.pelanggaran;
create policy pelanggaran_update_owner_or_admin on public.pelanggaran for update to authenticated using (public.is_admin() or (public.is_active_user() and reporter_id = public.current_profile_id())) with check (public.is_admin() or (public.is_active_user() and reporter_id = public.current_profile_id()));
drop policy if exists pelanggaran_delete_admin on public.pelanggaran;
create policy pelanggaran_delete_admin on public.pelanggaran for delete to authenticated using (public.is_admin());
drop policy if exists audit_logs_read_admin on public.audit_logs;
create policy audit_logs_read_admin on public.audit_logs for select to authenticated using (public.is_admin());

-- Izin API diberikan eksplisit; policy RLS tetap menjadi pembatas akses baris.
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.pelanggaran to authenticated;
grant select on public.audit_logs to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-photos', 'student-photos', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg','image/png','image/webp'];
drop policy if exists student_photos_read_active on storage.objects;
create policy student_photos_read_active on storage.objects for select to authenticated using (bucket_id = 'student-photos' and public.is_active_user());
drop policy if exists student_photos_insert_self on storage.objects;
create policy student_photos_insert_self on storage.objects for insert to authenticated with check (bucket_id = 'student-photos' and public.is_active_user() and (storage.foldername(name))[1] = public.current_profile_id()::text);
drop policy if exists student_photos_update_owner on storage.objects;
create policy student_photos_update_owner on storage.objects for update to authenticated using (bucket_id = 'student-photos' and (public.is_admin() or (public.is_active_user() and (storage.foldername(name))[1] = public.current_profile_id()::text))) with check (bucket_id = 'student-photos' and (public.is_admin() or (public.is_active_user() and (storage.foldername(name))[1] = public.current_profile_id()::text)));
drop policy if exists student_photos_delete_owner on storage.objects;
create policy student_photos_delete_owner on storage.objects for delete to authenticated using (bucket_id = 'student-photos' and (public.is_admin() or (public.is_active_user() and (storage.foldername(name))[1] = public.current_profile_id()::text)));

-- ===== supabase/migrations/003_dashboard.sql =====
create or replace function public.dashboard_stats()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'total_reports', (select count(*) from public.pelanggaran),
    'own_reports', (select count(*) from public.pelanggaran where reporter_id = public.current_profile_id()),
    'unique_students', (select count(distinct student_name_normalized) from public.pelanggaran),
    'active_ustaz', (select count(*) from public.profiles where role = 'ustaz' and is_active and deleted_at is null),
    'categories', coalesce((select jsonb_object_agg(category, total) from (select category, count(*) as total from public.pelanggaran group by category) c), '{}'::jsonb),
    'monthly', coalesce((select jsonb_agg(jsonb_build_object('month', month, 'total', total) order by month) from (
      select to_char(date_trunc('month', incident_date), 'YYYY-MM') as month, count(*) as total
      from public.pelanggaran where incident_date >= (current_date - interval '11 months')::date group by 1
    ) m), '[]'::jsonb),
    'by_reporter', coalesce((select jsonb_agg(jsonb_build_object('name', full_name, 'total', total) order by total desc) from (
      select p.full_name, count(v.id) as total from public.profiles p left join public.pelanggaran v on v.reporter_id = p.id
      where p.role = 'ustaz' and p.deleted_at is null group by p.id, p.full_name order by total desc limit 8
    ) r), '[]'::jsonb)
  );
$$;
grant execute on function public.dashboard_stats() to authenticated;

drop function if exists public.ustaz_report_counts();
create function public.ustaz_report_counts()
returns table(profile_id uuid, full_name text, username text, is_active boolean, created_at timestamptz, report_count bigint)
language sql stable security invoker set search_path = '' as $$
  select p.id, p.full_name, p.username, p.is_active, p.created_at, count(v.id)
  from public.profiles p left join public.pelanggaran v on v.reporter_id = p.id
  where public.is_admin() and p.role = 'ustaz' and p.deleted_at is null
  group by p.id order by p.created_at desc;
$$;
grant execute on function public.ustaz_report_counts() to authenticated;

create or replace function public.report_filter_options()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'classes', coalesce((select jsonb_agg(student_class order by student_class) from (select distinct student_class from public.pelanggaran) c), '[]'::jsonb),
    'students', coalesce((select jsonb_agg(student_name order by student_name) from (select distinct on (student_name_normalized) student_name_normalized, student_name from public.pelanggaran order by student_name_normalized, updated_at desc) s), '[]'::jsonb)
  );
$$;
grant execute on function public.report_filter_options() to authenticated;

create or replace function public.student_history_summary(student_key text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'total', count(*),
    'ringan', count(*) filter (where category = 'ringan'),
    'sedang', count(*) filter (where category = 'sedang'),
    'berat', count(*) filter (where category = 'berat')
  ) from public.pelanggaran where student_name_normalized = student_key and public.is_active_user();
$$;
grant execute on function public.student_history_summary(text) to authenticated;


-- ===== supabase/migrations/004_educator_type.sql =====
alter table public.profiles
  add column if not exists educator_type text;

update public.profiles
set educator_type = 'ustadz'
where role = 'ustaz' and educator_type is null;

update public.profiles
set educator_type = 'ustadz'
where educator_type is null;

alter table public.profiles
  alter column educator_type set default 'ustadz',
  alter column educator_type set not null;

alter table public.profiles
  drop constraint if exists profiles_educator_type_check;
alter table public.profiles
  add constraint profiles_educator_type_check
  check (educator_type in ('ustadz', 'ustadzah'));

drop function if exists public.ustaz_report_counts();
create function public.ustaz_report_counts()
returns table(profile_id uuid, full_name text, username text, educator_type text, is_active boolean, created_at timestamptz, report_count bigint)
language sql stable security invoker set search_path = '' as $$
  select p.id, p.full_name, p.username, p.educator_type, p.is_active, p.created_at, count(v.id)
  from public.profiles p left join public.pelanggaran v on v.reporter_id = p.id
  where public.is_admin() and p.role = 'ustaz' and p.deleted_at is null
  group by p.id order by p.created_at desc;
$$;
grant execute on function public.ustaz_report_counts() to authenticated;


-- ===== supabase/migrations/005_student_entry_flow.sql =====
create or replace function public.search_students(query_text text default '')
returns table(student_name text, student_name_normalized text, student_class text, report_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (array_agg(v.student_name order by v.incident_date desc, v.updated_at desc))[1],
    v.student_name_normalized,
    (array_agg(v.student_class order by v.incident_date desc, v.updated_at desc))[1],
    count(*)::bigint
  from public.pelanggaran v
  where public.is_active_user()
    and position(lower(trim(coalesce(query_text, ''))) in v.student_name_normalized) > 0
  group by v.student_name_normalized
  order by (v.student_name_normalized = lower(trim(coalesce(query_text, '')))) desc, count(*) desc, v.student_name_normalized asc
  limit 20;
$$;
grant execute on function public.search_students(text) to authenticated;

create or replace function public.student_violation_counts(student_keys text[])
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(s.student_name_normalized, s.total), '{}'::jsonb)
  from (
    select v.student_name_normalized, count(*)::bigint as total
    from public.pelanggaran v
    where public.is_active_user()
      and v.student_name_normalized = any(coalesce(student_keys, array[]::text[]))
    group by v.student_name_normalized
  ) s;
$$;
grant execute on function public.student_violation_counts(text[]) to authenticated;
