create or replace function public.report_filter_options()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'classes', coalesce((
      select jsonb_agg(student_class order by student_class)
      from (
        select distinct student_class
        from public.pelanggaran
        where public.is_admin() or reporter_id = public.current_profile_id()
      ) c
    ), '[]'::jsonb),
    'students', coalesce((
      select jsonb_agg(student_name order by student_name)
      from (
        select distinct on (student_name_normalized) student_name_normalized, student_name
        from public.pelanggaran
        where public.is_admin() or reporter_id = public.current_profile_id()
        order by student_name_normalized, updated_at desc
      ) s
    ), '[]'::jsonb)
  );
$$;
grant execute on function public.report_filter_options() to authenticated;

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
    and (public.is_admin() or v.reporter_id = public.current_profile_id())
    and position(lower(trim(coalesce(query_text, ''))) in v.student_name_normalized) > 0
  group by v.student_name_normalized
  order by (v.student_name_normalized = lower(trim(coalesce(query_text, '')))) desc, count(*) desc, v.student_name_normalized asc
  limit 20;
$$;
grant execute on function public.search_students(text) to authenticated;

create or replace function public.prevent_cross_account_student_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.student_name_normalized is not distinct from old.student_name_normalized then
      return new;
    end if;
  end if;

  if not public.is_admin() and exists (
    select 1
    from public.pelanggaran v
    where v.student_name_normalized = new.student_name_normalized
      and v.reporter_id <> public.current_profile_id()
      and v.id <> new.id
  ) then
    raise exception 'Santri ini terdaftar pada akun lain.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists pelanggaran_prevent_cross_account_student on public.pelanggaran;
create trigger pelanggaran_prevent_cross_account_student
before insert or update of student_name on public.pelanggaran
for each row execute function public.prevent_cross_account_student_link();
