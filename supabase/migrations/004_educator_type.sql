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
