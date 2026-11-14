-- Phone sign-ups have no email to fall back to for a default name, which made
-- handle_new_user() violate profiles.name's NOT NULL constraint and 500 the
-- whole signup. Fall back to the phone number, then a generic placeholder.
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
    coalesce(
      nullif(new.raw_user_meta_data->>'name',''),
      split_part(new.email,'@',1),
      new.phone,
      'User'
    ),
    nullif(new.raw_user_meta_data->>'centre_id','')::uuid,
    nullif(new.raw_user_meta_data->>'profession',''),
    coalesce(nullif(new.raw_user_meta_data->>'language',''), 'bn')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
