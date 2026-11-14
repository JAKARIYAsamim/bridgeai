-- Story 2 — Auth + invites
-- Apply this in the Supabase SQL editor (or let Claude apply it once the
-- Supabase MCP write tools are allowed). Safe to run more than once.

-- 1) Auto-create a profile row whenever an auth user signs up.
--    Role / name / centre come from the signup metadata; defaults keep it safe.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, centre_id, profession, language)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'role',''), 'parent'),
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    nullif(new.raw_user_meta_data->>'centre_id','')::uuid,
    nullif(new.raw_user_meta_data->>'profession',''),
    coalesce(nullif(new.raw_user_meta_data->>'language',''), 'bn')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Preview an invite code before joining (may be called while signed out).
create or replace function public.check_invite_code(p_code text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_inv invite_codes;
  v_child children;
  v_centre centres;
  v_ther profiles;
begin
  select * into v_inv from invite_codes where code = upper(p_code);
  if not found then raise exception 'invalid_code'; end if;
  if v_inv.used_by is not null then raise exception 'code_used'; end if;
  if v_inv.expires_at < now() then raise exception 'code_expired'; end if;
  select * into v_child from children where id = v_inv.child_id;
  select * into v_centre from centres  where id = v_child.centre_id;
  select * into v_ther   from profiles where id = v_child.therapist_id;
  return jsonb_build_object(
    'child',     jsonb_build_object('id', v_child.id, 'nickname', v_child.nickname, 'ageBand', v_child.age_band),
    'therapist', jsonb_build_object('id', v_ther.id, 'name', v_ther.name),
    'centre',    jsonb_build_object('id', v_centre.id, 'name', v_centre.name, 'city', v_centre.city)
  );
end;
$$;

-- 3) Redeem a code: the signed-in user becomes a caregiver of the child.
create or replace function public.redeem_invite_code(p_code text, p_relation text default 'parent')
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_inv invite_codes;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select * into v_inv from invite_codes where code = upper(p_code) for update;
  if not found then raise exception 'invalid_code'; end if;
  if v_inv.used_by is not null then raise exception 'code_used'; end if;
  if v_inv.expires_at < now() then raise exception 'code_expired'; end if;

  insert into caregivers (child_id, profile_id, relation)
  values (v_inv.child_id, v_uid, coalesce(nullif(p_relation,''),'parent'))
  on conflict (child_id, profile_id) do update set relation = excluded.relation;

  update invite_codes set used_by = v_uid, used_at = now() where code = v_inv.code;
  return v_inv.child_id;
end;
$$;

-- 4) Therapist creates a fresh invite code for one of their children.
create or replace function public.create_invite_code(p_child_id uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
begin
  if not public.is_therapist_of(p_child_id) then
    raise exception 'not_authorized';
  end if;
  loop
    v_code := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from invite_codes where code = v_code);
  end loop;
  insert into invite_codes (code, child_id, created_by)
  values (v_code, p_child_id, v_uid);
  return v_code;
end;
$$;

-- 5) Lock down execute grants (same hardening as the RLS helpers in 0004).
revoke execute on function public.handle_new_user()                 from public;
revoke execute on function public.check_invite_code(text)           from public;
revoke execute on function public.redeem_invite_code(text,text)     from public;
revoke execute on function public.create_invite_code(uuid)          from public;

grant  execute on function public.check_invite_code(text)           to anon, authenticated;
grant  execute on function public.redeem_invite_code(text,text)     to authenticated;
grant  execute on function public.create_invite_code(uuid)          to authenticated;
