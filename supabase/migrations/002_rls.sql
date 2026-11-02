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
