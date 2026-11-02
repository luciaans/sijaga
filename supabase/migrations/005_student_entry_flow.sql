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
