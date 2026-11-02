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
