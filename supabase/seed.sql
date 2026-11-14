-- Story 2 — Demo seed data (SYNTHETIC ONLY — no real children's data)
-- Run AFTER 0005_auth.sql. Safe to re-run: fixed IDs + cleanup at the top.
-- Creates 3 login accounts, all with password: bridgeai123
--   therapist@demo.bridgeai.app   (therapist)
--   parent@demo.bridgeai.app      (parent, linked to child "Rafi")
--   admin@demo.bridgeai.app       (centre admin)
--
-- Needs the pgcrypto functions (crypt / gen_salt) — present in Supabase as
-- extensions.crypt / extensions.gen_salt.

-- ───────────────────────── cleanup (reverse dependency order) ─────────────
delete from activity_logs  where child_id in ('d1111111-1111-1111-1111-111111111111','d2222222-2222-2222-2222-222222222222');
delete from daily_checkins where child_id in ('d1111111-1111-1111-1111-111111111111','d2222222-2222-2222-2222-222222222222');
delete from feedback       where child_id in ('d1111111-1111-1111-1111-111111111111','d2222222-2222-2222-2222-222222222222');
delete from plan_items     where child_id in ('d1111111-1111-1111-1111-111111111111','d2222222-2222-2222-2222-222222222222');
delete from roadmaps       where child_id in ('d1111111-1111-1111-1111-111111111111','d2222222-2222-2222-2222-222222222222');
delete from goals          where child_id in ('d1111111-1111-1111-1111-111111111111','d2222222-2222-2222-2222-222222222222');
delete from invite_codes   where child_id in ('d1111111-1111-1111-1111-111111111111','d2222222-2222-2222-2222-222222222222');
delete from caregivers     where child_id in ('d1111111-1111-1111-1111-111111111111','d2222222-2222-2222-2222-222222222222');
delete from child_clinical where child_id in ('d1111111-1111-1111-1111-111111111111','d2222222-2222-2222-2222-222222222222');
delete from children       where id in ('d1111111-1111-1111-1111-111111111111','d2222222-2222-2222-2222-222222222222');
delete from activities     where id like 'demo-act-%';
delete from stories        where id like 'demo-story-%';
-- profiles before centres (profiles.centre_id -> centres)
delete from profiles       where id in ('a1111111-1111-1111-1111-111111111111','a2222222-2222-2222-2222-222222222222','a3333333-3333-3333-3333-333333333333');
delete from centres        where id = '11111111-1111-1111-1111-111111111111';
delete from auth.identities where user_id in ('a1111111-1111-1111-1111-111111111111','a2222222-2222-2222-2222-222222222222','a3333333-3333-3333-3333-333333333333');
delete from auth.users      where id in ('a1111111-1111-1111-1111-111111111111','a2222222-2222-2222-2222-222222222222','a3333333-3333-3333-3333-333333333333');

-- ───────────────────────── centre (BEFORE auth users) ────────────────────
-- Must exist first: the signup trigger inserts each profile with this centre_id.
insert into centres (id, name, city, centre_code)
values ('11111111-1111-1111-1111-111111111111','Hope Centre for Child Development','Dhaka','HOPE01');

-- ───────────────────────── auth users (+ email identities) ───────────────
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
   confirmation_token, recovery_token, email_change, email_change_token_new)
values
  ('00000000-0000-0000-0000-000000000000','a1111111-1111-1111-1111-111111111111','authenticated','authenticated',
   'therapist@demo.bridgeai.app', extensions.crypt('bridgeai123', extensions.gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"therapist","name":"Dr. Ayesha Rahman","centre_id":"11111111-1111-1111-1111-111111111111","profession":"Speech & Language Therapist","language":"en"}'::jsonb,
   '','','',''),
  ('00000000-0000-0000-0000-000000000000','a2222222-2222-2222-2222-222222222222','authenticated','authenticated',
   'admin@demo.bridgeai.app', extensions.crypt('bridgeai123', extensions.gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"admin","name":"Centre Admin","centre_id":"11111111-1111-1111-1111-111111111111","language":"en"}'::jsonb,
   '','','',''),
  ('00000000-0000-0000-0000-000000000000','a3333333-3333-3333-3333-333333333333','authenticated','authenticated',
   'parent@demo.bridgeai.app', extensions.crypt('bridgeai123', extensions.gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"role":"parent","name":"Rafi''s Mother","language":"bn"}'::jsonb,
   '','','','');

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(),'a1111111-1111-1111-1111-111111111111','a1111111-1111-1111-1111-111111111111',
   '{"sub":"a1111111-1111-1111-1111-111111111111","email":"therapist@demo.bridgeai.app","email_verified":true}'::jsonb,'email',now(),now(),now()),
  (gen_random_uuid(),'a2222222-2222-2222-2222-222222222222','a2222222-2222-2222-2222-222222222222',
   '{"sub":"a2222222-2222-2222-2222-222222222222","email":"admin@demo.bridgeai.app","email_verified":true}'::jsonb,'email',now(),now(),now()),
  (gen_random_uuid(),'a3333333-3333-3333-3333-333333333333','a3333333-3333-3333-3333-333333333333',
   '{"sub":"a3333333-3333-3333-3333-333333333333","email":"parent@demo.bridgeai.app","email_verified":true}'::jsonb,'email',now(),now(),now());

-- ───────────────────────── profiles ──────────────────────────────────────
-- Explicit profiles (works whether or not the signup trigger already made them).
insert into profiles (id, role, name, centre_id, profession, language) values
  ('a1111111-1111-1111-1111-111111111111','therapist','Dr. Ayesha Rahman','11111111-1111-1111-1111-111111111111','Speech & Language Therapist','en'),
  ('a2222222-2222-2222-2222-222222222222','admin','Centre Admin','11111111-1111-1111-1111-111111111111',null,'en'),
  ('a3333333-3333-3333-3333-333333333333','parent','Rafi''s Mother',null,null,'bn')
on conflict (id) do update
  set role=excluded.role, name=excluded.name, centre_id=excluded.centre_id,
      profession=excluded.profession, language=excluded.language;

-- ───────────────────────── activity library (6) ──────────────────────────
insert into activities
  (id, title_en, title_bn, domain, routine_slot, age_bands, comm_levels, difficulty, minutes,
   why_bn, needs_bn, steps, success_bn, status)
values
  ('demo-act-1','Name & point','নাম ধরে দেখানো','communication','play','{3_5,6_9}','{preverbal,words_gestures}',1,5,
   'শিশুর শব্দভাণ্ডার বাড়াতে সাহায্য করে','{ছবির কার্ড}','["পরিচিত ছবি দেখান","নাম বলুন","শিশুকে দেখাতে বলুন"]','শিশু নিজে থেকে ছবি দেখায়','reviewed'),
  ('demo-act-2','Copy the clap','তালি নকল করা','imitation_play','morning','{under_3,3_5}','{preverbal}',1,3,
   'অনুকরণের দক্ষতা তৈরি করে','{}','["তালি দিন","থামুন","শিশুকে নকল করতে উৎসাহ দিন"]','শিশু তালি নকল করে','reviewed'),
  ('demo-act-3','First–then card','আগে–পরে কার্ড','behaviour','any','{3_5,6_9,10_plus}','{words_gestures,phrases}',2,5,
   'রুটিন বুঝতে ও মানতে সাহায্য করে','{কার্ড}','["\"আগে\" কাজ দেখান","\"পরে\" পুরস্কার দেখান","কাজ শেষে পুরস্কার দিন"]','শিশু আগে-পরে বোঝে','reviewed'),
  ('demo-act-4','Spoon practice','চামচ অনুশীলন','daily_living','mealtime','{3_5,6_9}','{preverbal,words_gestures}',2,10,
   'নিজে খাওয়ার দক্ষতা তৈরি করে','{চামচ,বাটি}','["হাতে চামচ দিন","হাত ধরে সাহায্য করুন","ধীরে ধীরে সাহায্য কমান"]','শিশু নিজে চামচ ধরে','reviewed'),
  ('demo-act-5','Calm corner','শান্ত কোণ','sensory','bedtime','{under_3,3_5,6_9}','{preverbal,words_gestures,phrases}',1,5,
   'অতিরিক্ত উদ্দীপনা কমিয়ে শান্ত হতে সাহায্য করে','{নরম বালিশ}','["শান্ত জায়গা বেছে নিন","আলো কমান","গভীর শ্বাস নিতে সাহায্য করুন"]','শিশু দ্রুত শান্ত হয়','reviewed'),
  ('demo-act-6','Turn-taking roll','গড়িয়ে দেওয়া খেলা','social','play','{3_5,6_9}','{words_gestures,phrases}',2,8,
   'পালাক্রমে খেলার সামাজিক দক্ষতা তৈরি করে','{বল}','["\"আমার পালা\" বলুন","বল গড়িয়ে দিন","\"তোমার পালা\" বলুন"]','শিশু পালা মেনে খেলে','reviewed');

-- ───────────────────────── stories (2) ───────────────────────────────────
insert into stories (id, title_bn, domain, pages) values
  ('demo-story-1','দাঁত ব্রাশ করা','daily_living',
   '[{"text_bn":"সকালে উঠে আমরা দাঁত ব্রাশ করি","image":null},{"text_bn":"ব্রাশে একটু পেস্ট দিই","image":null},{"text_bn":"উপরে-নিচে ব্রাশ করি","image":null},{"text_bn":"মুখ ধুয়ে ফেলি — শেষ!","image":null}]'::jsonb),
  ('demo-story-2','ডাক্তারের কাছে যাওয়া','social',
   '[{"text_bn":"আজ আমরা ডাক্তারের কাছে যাব","image":null},{"text_bn":"অপেক্ষা করি চেয়ারে বসে","image":null},{"text_bn":"ডাক্তার আমাকে দেখবেন","image":null},{"text_bn":"শেষে বাড়ি ফিরে যাই","image":null}]'::jsonb);

-- ───────────────────────── children ──────────────────────────────────────
insert into children
  (id, centre_id, therapist_id, nickname, dob, age_band, comm_level,
   sensory_flags, safety_flags, strengths, first_session_date, next_session_date)
values
  ('d1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','a1111111-1111-1111-1111-111111111111',
   'Rafi','2020-03-15','3_5','words_gestures','{loud_sound}','{}','{music,puzzles}', current_date - 30, current_date + 4),
  ('d2222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','a1111111-1111-1111-1111-111111111111',
   'Mitu','2017-08-02','6_9','phrases','{}','{}','{drawing}', current_date - 7, current_date + 10);

insert into child_clinical (child_id, diagnosis_notes, support_level, co_occurring) values
  ('d1111111-1111-1111-1111-111111111111','ASD level 2; emerging single words', 2, 'none noted'),
  ('d2222222-2222-2222-2222-222222222222','ASD level 1', 1, null);

-- Parent is a caregiver of Rafi.
insert into caregivers (child_id, profile_id, relation, routine_times, reminders_per_day, consent)
values ('d1111111-1111-1111-1111-111111111111','a3333333-3333-3333-3333-333333333333','mother',
        '{"morning":"08:00","bedtime":"20:30"}'::jsonb, 2, '{"share":true}'::jsonb);

-- Unused invite code for Mitu (to demo the join flow).
insert into invite_codes (code, child_id, created_by, expires_at)
values ('DEMO42','d2222222-2222-2222-2222-222222222222','a1111111-1111-1111-1111-111111111111', now() + interval '14 days');

-- ───────────────────────── goals + approved roadmap for Rafi ─────────────
insert into goals (id, child_id, domain, text, source, status) values
  ('c1111111-1111-1111-1111-111111111111','d1111111-1111-1111-1111-111111111111','communication','Use 5 single words to request','therapist','active'),
  ('c2222222-2222-2222-2222-222222222222','d1111111-1111-1111-1111-111111111111','daily_living','Hold a spoon to self-feed','therapist','active');

insert into roadmaps (id, child_id, status, current_phase, start_date, approved_at)
values ('e1111111-1111-1111-1111-111111111111','d1111111-1111-1111-1111-111111111111','approved',1, current_date - 14, now() - interval '14 days');

insert into plan_items (id, roadmap_id, child_id, phase, goal_id, activity_id, routine_slot, difficulty, active) values
  ('f1111111-1111-1111-1111-111111111111','e1111111-1111-1111-1111-111111111111','d1111111-1111-1111-1111-111111111111',1,'c1111111-1111-1111-1111-111111111111','demo-act-1','play',1,true),
  ('f2222222-2222-2222-2222-222222222222','e1111111-1111-1111-1111-111111111111','d1111111-1111-1111-1111-111111111111',1,'c1111111-1111-1111-1111-111111111111','demo-act-2','morning',1,true),
  ('f3333333-3333-3333-3333-333333333333','e1111111-1111-1111-1111-111111111111','d1111111-1111-1111-1111-111111111111',1,'c2222222-2222-2222-2222-222222222222','demo-act-4','mealtime',2,true);

-- A few parent logs + a check-in so "Today" and the therapist dashboard show data.
insert into activity_logs (plan_item_id, child_id, caregiver_id, log_date, mood) values
  ('f1111111-1111-1111-1111-111111111111','d1111111-1111-1111-1111-111111111111','a3333333-3333-3333-3333-333333333333', current_date - 1,'happy'),
  ('f2222222-2222-2222-2222-222222222222','d1111111-1111-1111-1111-111111111111','a3333333-3333-3333-3333-333333333333', current_date - 1,'neutral'),
  ('f1111111-1111-1111-1111-111111111111','d1111111-1111-1111-1111-111111111111','a3333333-3333-3333-3333-333333333333', current_date - 2,'happy');

insert into daily_checkins (child_id, caregiver_id, checkin_date, mood, sleep, meals, meltdowns, note)
values ('d1111111-1111-1111-1111-111111111111','a3333333-3333-3333-3333-333333333333', current_date - 1,'happy','good','some','none','ভালো দিন ছিল');
