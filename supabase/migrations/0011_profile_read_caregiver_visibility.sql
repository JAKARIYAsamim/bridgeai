-- profile_read allowed seeing another profile only via `centre_id = my_centre()`.
-- Parents never have a centre, and plenty of therapists are independent (no
-- centre either), so that comparison is null = null, which SQL never treats as
-- true. The child-overview page embeds caregivers.profiles(*), and RLS silently
-- nulled that embed out, crashing the client on `.id` of a null profile.
-- Replaced the single centre check with: own profile, same (non-null) centre,
-- or a direct therapist<->caregiver relationship via the children/caregivers
-- tables — which is the actual visibility rule this page needs, regardless of
-- whether either side belongs to a centre.
drop policy if exists profile_read on public.profiles;
create policy profile_read on public.profiles
  for select
  using (
    id = (select auth.uid())
    or (centre_id is not null and centre_id = my_centre())
    or exists (
      select 1 from public.caregivers cg join public.children ch on ch.id = cg.child_id
      where cg.profile_id = profiles.id and ch.therapist_id = (select auth.uid())
    )
    or exists (
      select 1 from public.caregivers cg join public.children ch on ch.id = cg.child_id
      where ch.therapist_id = profiles.id and cg.profile_id = (select auth.uid())
    )
  );
