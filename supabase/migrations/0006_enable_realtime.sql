-- Story 5 — turn on Realtime for the tables the demo screens watch, so a change by
-- one role (a parent's log, a therapist's approval) refreshes the other live.
-- RLS still applies to realtime, so each client only receives rows it may see.
do $$
declare
  t text;
  tables text[] := array[
    'activity_logs','daily_checkins','feedback','feedback_replies',
    'alerts','roadmaps','plan_items','goals','reports'
  ];
begin
  foreach t in array tables loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
