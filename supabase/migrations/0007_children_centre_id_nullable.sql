-- Independent therapists have profiles.centre_id = null (already nullable), but
-- children.centre_id was NOT NULL, so they could never create a child. Relax it
-- to match.
alter table public.children alter column centre_id drop not null;
