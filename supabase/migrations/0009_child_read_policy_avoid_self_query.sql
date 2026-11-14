-- child_read used is_therapist_of(id), which re-queries public.children by its
-- own id. For INSERT ... RETURNING (what PostgREST's .select() generates),
-- Postgres evaluates the SELECT policy on the just-inserted row using the same
-- command's snapshot, which can't see that row yet via a self-referencing
-- sub-select — so the check always failed with "new row violates row-level
-- security policy", even though the WITH CHECK policy had already passed.
-- Comparing therapist_id directly avoids the self-query entirely.
drop policy if exists child_read on public.children;
create policy child_read on public.children
  for select
  using (
    therapist_id = (select auth.uid())
    or public.is_caregiver_of(id)
    or (my_role() = 'admin' and centre_id = my_centre())
  );
