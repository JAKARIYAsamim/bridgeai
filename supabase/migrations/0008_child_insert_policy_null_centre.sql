-- child_insert's WITH CHECK compared centre_id = my_centre() with plain `=`,
-- which is never true when both sides are null (independent therapists have
-- no centre). Use the null-safe comparison so they can create children too.
drop policy if exists child_insert on public.children;
create policy child_insert on public.children
  for insert
  with check (
    my_role() = 'therapist'
    and therapist_id = (select auth.uid())
    and centre_id is not distinct from my_centre()
  );
