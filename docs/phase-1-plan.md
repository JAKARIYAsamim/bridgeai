# BridgeAI — Phase 1 plan (UI only, mock data)

14 Nov 2026 · Source: *BridgeAI — Build Guide (UI first)* and *BridgeAI — PRD*

Phase 1 builds every screen with mock data and fake services. **No Supabase, no Gemini, no API keys.**
Phase 2 starts only when someone types exactly `START BACKEND`.

## Decisions

| Question | Decision |
| --- | --- |
| Who builds | 4 people in parallel, one lane each (A, B, C, D) |
| Scope | **P0** = the demo path and PRD R1–R13. **P1** = the rest of the 31 screens. Nobody starts P1 until the P0 stories in their lane are done. |
| Repo | Same repo. Commit the current work, tag it `demo-backup`, move the prototype to `/legacy-prototype`, put Next.js at the root. |
| Stack | Next.js App Router + TypeScript, Tailwind, shadcn/ui, lucide-react, `next/font` (Inter + Hind Siliguri) |
| Mock persistence | Mock services keep their data in memory and save it to `localStorage`, so a role switch in the same browser keeps state (the parent's "seizure" note shows up for the therapist). Settings has a **Reset demo data** button. |
| Names | Use the guide's cast, not the prototype's: Dr. Nasrin (therapist), Ayesha and Karim (parents), Farhana (centre admin), Hope Therapy Centre, Dhaka. Children: Rafi (4) and Mitu (7). |

## Timeline

| When | Milestone |
| --- | --- |
| **Fri 14 Nov, +3 h** | A1–A3 merged: app runs, tokens exist, **types and service interfaces are frozen**. The other lanes build against them from here on. |
| Fri 14 Nov, end of day | A4 (mock services) merged. Each lane has at least one screen running on mock data. |
| **Sat 15 Nov, 15:00** | All P0 stories merged to `main`. |
| **Sat 15 Nov, 18:00** | Q1: demo story test passes on a phone (360 px) and a laptop (1280 px). Report results, then stop. |
| Sat 15 Nov, evening | P1 stories only if Q1 passed. `START BACKEND` when the team is ready. |
| Sun 16 Nov, 12:00 | Go/no-go from the PRD: the full loop works on the real backend, or we demo the prototype. |

**Risk:** this leaves about 18 hours for Phase 2. If Q1 slips past Saturday evening, cut P1 entirely and protect backend time.

## Ground rules (every story)

1. Screens import from `@/lib/services` only, never from `/lib/services/mock` or the mock data files.
2. Every fake AI call waits 1.5 s and shows a skeleton or step loader.
3. Every AI output shows the blue **AI draft — check before use** banner until the therapist approves it.
4. AI suggestions only use activity IDs from the library.
5. No "type of autism" field anywhere. Diagnosis notes, assessment scores and support level never appear on parent screens.
6. Parent screens: Bangla first, 18 px body text, 48 × 48 px tap targets, primary action at the bottom.
7. **Red only for safety alerts.** No streaks, no crosses, no "missed" labels. Skipped days are shown neutrally.
8. The "Demo data — no real children" banner is visible on every screen.

### Definition of done

- [ ] Works at 360 px (parent screens) or 1280 px (therapist and admin screens), with no horizontal scroll.
- [ ] Has an empty state, a loading state and an error state where they apply.
- [ ] Parent strings are in the lane's i18n file in both `bn` and `en`.
- [ ] No direct mock imports (`grep -r "services/mock" app components` returns nothing).
- [ ] The PR includes a screenshot or short clip of the flow.

## Design: prototype → Tailwind tokens

The guide says to keep the prototype's look, so the prototype's colours win over the guide's fallback colours. Source: [`legacy-prototype/public/app.css`](../public/app.css) `:root`.

| Token | Value | From | Use |
| --- | --- | --- | --- |
| `primary` | `#5856d6` | prototype `--p` | Main buttons, active tab, links |
| `primary-deep` | `#4543c0` | prototype `--deep` | Pressed state |
| `background` | `#f2f1f8` + soft colour wallpaper | prototype `--bg`, `#wall` | Page background |
| `surface` | glass gradient + blur + `--shine` + `--shadow` | prototype `--glass` | Cards, sheets, nav |
| `text` / `text-muted` | `#1c1c1e` / `rgba(60,60,67,.56)` | prototype `--ink` / `--mute` | Body, hints |
| `celebrate` | `#ff9500` | prototype `--orange` | Done ticks, wins, progress ring |
| `info` | `#007aff` | prototype `--blue` | AI draft labels, tips |
| `success` | `#34c759` | prototype `--green` | Approved, resolved |
| `alert` | `#ff2d55` | prototype `--pink` | **Safety alerts only** |

- Card radius 12 px, 8 px spacing grid. Fallback: if `backdrop-filter` isn't supported (some budget Android phones), use a solid white surface.
- Do **not** port `streak()` ([public/app.js:86](../public/app.js#L86)). Do **not** use pink for non-safety badges ([public/app.css:120](../public/app.css#L120), [:197](../public/app.css#L197)). Use `primary` or `celebrate` for those counts.
- Dark mode: define the same tokens for `.dark`.

## Folder ownership (avoids merge conflicts)

```
app/
  (auth)/            A   /, /login, /signup, /join, /forgot
  t/                 B   therapist screens
  t/alerts/          A
  t/children/[id]/feedback/   A
  t/library/         D
  t/children/[id]/report/     D
  p/                 C   parent screens
  p/learn/           D
  c/                 D   centre admin
components/ui/       A   shared primitives (others ask for changes in a PR)
components/therapist B · components/parent C · components/library D
lib/types.ts, lib/services/types.ts, lib/services/index.ts    A (frozen after A3)
lib/services/mock/   A
lib/safety/          A
lib/matching/        B
lib/i18n/{common,therapist,parent,learn}.ts   one file per lane
data/activities.csv, data/activities.json, scripts/   D
```

Rule: if you need to change a file another lane owns, ask that lane's owner in the team chat and let them make the change.

## Lanes at a glance

| Lane | Person (PRD split) | P0 stories | P1 stories |
| --- | --- | --- | --- |
| **A — Foundation, auth, safety** | Person 3 (will own the backend later) | A1–A7, A8 Alerts, A9 Feedback inbox | A10 Sign up / Join / Forgot |
| **B — Therapist** | Person 1 | B1–B7 | B8 Settings |
| **C — Parent** | Person 2 | C1–C6 | C7–C10 |
| **D — Library, report, content** | Person 4 | D1–D3 | D4 Learn, D5 Centre admin |
| **All** | everyone | Q1 demo story test | — |

Sizes, assuming each person works with an AI coding tool: **S** ≈ 1–2 h, **M** ≈ 2–4 h, **L** ≈ 4–6 h.

---

## Lane A — Foundation, auth, safety

A1–A3 block everyone else, so they ship first and stay small. Until A3 lands, the other lanes can start on markup with hard-coded props, and D can start writing cards.

### A1 · Repo prep and app scaffold — P0 · S

- Commit the current prototype changes, tag the commit `demo-backup`, push the tag.
- Move the prototype into `/legacy-prototype` (it must still run with `npm start` from that folder).
- Scaffold Next.js (App Router, TypeScript, ESLint), Tailwind, shadcn/ui and lucide-react at the repo root.
- Load Inter and Hind Siliguri with `next/font`.

**Done when:** `npm run dev` shows a placeholder page; `cd legacy-prototype && npm start` still runs the old app.

### A2 · Design tokens and base components — P0 · M · needs A1

- Put the token table above into `tailwind.config.ts`, including dark mode.
- Build these in `components/ui`, styled like the prototype: Button (primary, soft, ghost; 48 px minimum), Card (glass), Chip, Tabs, BottomSheet, Drawer, Modal, Toast, SkeletonBlock, EmptyState (illustration slot, one sentence, one button), AIDraftBanner (blue bar with Approve and Edit), DemoBanner, StepLoader (steps that tick off one by one), MoodPicker (😀 😐 😟, large).
- Add a `/dev/components` page that shows every component.

**Done when:** the components page looks like the prototype side by side, in light and dark mode.

### A3 · Shared types and service interfaces — P0 · S · needs A1 · **freeze after merge**

- `lib/types.ts`: User (roles therapist, parent, admin), Centre, Child (with a separate `ClinicalRecord` type that parent screens never receive), Caregiver, Goal, Activity (guide template plus `status` and `version`), Roadmap, Phase, PlanItem, ActivityLog, Feedback, Checkin, Report, Alert, InviteCode, Reminder, Story.
- `lib/services/types.ts`: the 8 interfaces from the guide (`authService`, `childService`, `libraryService`, `planService`, `feedbackService`, `aiService`, `reminderService`, `alertService`), using exactly the guide's method names. Every method is async.
- `lib/services/index.ts` exports the active implementation (mock for now).
- Parent-facing methods return a `ParentChildView` type that has no clinical fields. This makes rule 5 a compile-time check.

**Done when:** the types compile, and lanes B, C and D have read them and agreed in the team chat. After that, changes need everyone's agreement.

### A4 · Mock services and mock data — P0 · L · needs A3 (uses D1 output; stub with 3 cards until D1 lands)

- In-memory store saved to `localStorage`, with `resetDemoData()`.
- Seed data from the guide: the centre, 4 users, Rafi with the Flow 3 profile and an approved plan, 14 days of logs and check-ins, 6 feedback items (3 voice with transcripts, 2 photos, 1 text), 1 resolved alert, 1 approved report. Mitu is newly added, with no plan.
- `aiService` returns the guide's example JSON after 1.5 s: `draftPlanFromIntake` returns the Flow 3 draft, `draftReport` returns the Flow 6 report, and `processVoiceNote` returns a fixed transcript and summary.
- `libraryService.listActivities` reads `data/activities.json`. Only `reviewed` cards can be assigned.
- `authService` has demo users and `joinWithCode` checks the code and its 7-day expiry.
- Use short audio and image files in `/public/demo/` for the voice notes and photos.

**Done when:** a scratch page calls every service method and shows the results; reset brings back the seed data.

### A5 · Layout shells, role routing, Welcome and Log in — P0 · M · needs A2, A4

- Therapist shell: left sidebar with Children, Alerts (red badge = unresolved alerts), Library and Settings; becomes a top menu on mobile.
- Parent shell: bottom tab bar with Today, Progress, Learn and Help (icon plus text label); room for the floating mic on Today.
- Admin shell: sidebar with Overview, Therapists and Families.
- Role guard: a parent can't open `/t` or `/c`; a therapist can't open `/p` or `/c`; already logged in redirects to the role's home.
- A-01 Welcome and A-03 Log in (show password, "Email or password is incorrect.", spinner) plus three demo buttons: **Log in as therapist**, **Log in as parent**, **Log in as centre admin**.
- DemoBanner on every shell.

**Done when:** each demo button lands on its home; typing a `/t` URL as a parent redirects.

### A6 · Media capture components — P0 · M · needs A2

Used by smart intake (B3), the feedback sheet (C4), check-in (C5) and the quick voice note (C2).

- `MicButton`: tap to record, tap to stop; shows a timer and a simple waveform; the time limit is a prop (60 s for parents, 5 min for intake). Uses MediaRecorder; if there's no microphone or permission, falls back to "Type instead". Port the logic from [public/app.js:316-384](../public/app.js#L316-L384).
- `MediaPicker`: four equal tiles (Voice, Photo, Video, Text), each with an icon and label.
- Photo and video pick from a file input (`accept`, `capture`); the video limit is a prop (30 s or 60 s).
- `MediaChip`: "Voice note · 2:14", with play and remove.

**Done when:** recording works in Chrome on Android at 360 px and on a laptop; files go to the mock store as object URLs.

### A7 · Safety keyword check and emergency box — P0 · S · needs A3

- `lib/safety/checkText(text)`: a plain-code keyword list (English and Bangla from the guide), case-insensitive, with no AI involved. Unit test: "he had a seizure" matches; "she had a great day" doesn't.
- `alertService.checkText` creates an alert with the child, the quote and the time.
- `EmergencyBox` component: "If your child is injured or has a seizure, call 999 or go to the nearest hospital", plus **Call 999** and **Call the clinic** buttons (in Bangla first). Port the wording and layout from [public/care.js](../public/care.js).

**Done when:** the unit tests pass; C4 and C5 can call `checkText` and show the box.

### A8 · Alerts (T-10) — P0 · S · needs A5, A7

- A list across all children: child, quote, time, source. Unresolved alerts first.
- **Call parent** (`tel:` link) and **Mark resolved** with a note; the sidebar badge count updates.
- Empty state: "No alerts. All quiet."

### A9 · Feedback inbox (T-08) — P0 · M · needs A4, A6

- Newest first; filters for activity, media type and flagged items.
- Each item: activity, caregiver, date, mood face, media player (audio, image, video, text), and a blue AI block with transcript, summary and flag chips.
- **Reply** (text, or voice with MicButton) and **Mark reviewed**. The parent sees the reply on Progress (C7).

### A10 · Sign up, Join with code, Forgot password — P1 · M · needs A5

- A-02: role cards, the form, professions, and the centre step (a centre admin gets a 6-character code; a therapist enters a code or chooses "I work independently"), then the terms tick → T-01 empty state.
- A-04: 6-digit code → "You're joining Rafi's plan with Dr. Nasrin, Hope Therapy Centre." → caregiver details → P-01. Wrong or expired code: "This code didn't work. Ask your therapist for a new one."
- A-05: email field → "Check your email" (mocked).

---

## Lane B — Therapist

### B1 · Therapist home (T-01) — P0 · S · needs A5

- Children list: nickname, age band, current phase, a status chip (No plan yet / Plan live / New feedback), next session date.
- Side panels: today's alerts (link to T-10) and reports due.
- **+ Add child** button. Empty state: "Add your first child".

### B2 · Add child (T-02) and choice screen — P0 · M · needs A5

- Required fields: nickname, date of birth (age band is worked out automatically and can be changed), first session date. Optional fields: gender, caregiver name and phone.
- Collapsed section **Clinical record (therapist only)**: diagnosis notes (free text), assessments (tool, date, score; add rows), co-occurring conditions, safety flags, sensory flags.
- Errors: "Please add the nickname" under the field. On save: toast "Mitu added".
- Choice screen: **Smart intake (recommended)** → T-03, or **Build it myself** → T-06.

### B3 · Smart intake (T-03) — P0 · M · needs A6

- "Tell us about Mitu" with the age band.
- Four input tiles (Voice up to 5 min, Photo up to 5, Text, Video up to 60 s); the inputs appear as chips that can be removed.
- A collapsible "What to mention" checklist.
- **Create draft plan** is disabled until there's at least one input.
- StepLoader: "Reading your notes", "Finding goals", "Choosing activities" → T-04.

### B4 · Review AI draft (T-04): profile, goals, roadmap — P0 · L · needs A4, D1

- AIDraftBanner at the top.
- **Profile**, **Goals** (3–5, each with a domain chip) and **Roadmap** (3 phases, activity cards) sections. Each item has **Accept**, **Edit** and **Remove**.
- A "From your notes" link shows the evidence sentence; goals with no evidence show "Added by AI, no source" in blue.
- Tapping an activity card opens the library drawer from D2, in read mode.
- **Missing information**: the questions, each with an inline answer box, or the therapist can leave them.

### B5 · Swap, regenerate, approve and invite (T-04, T-11) — P0 · M · needs B4

- **Swap** on an activity card offers other `reviewed` cards from the same domain and age band.
- **Regenerate with a comment**: a text box, then the loader; accepted and edited items stay, and only the rest is redrafted (in Phase 1 the mock returns the same JSON, but the UI must keep accepted items).
- **Approve plan** → toast "Mitu's plan is live" → the Invite caregiver modal (T-11): a 6-digit code valid for 7 days, **Copy**, and **Share on WhatsApp** (`https://wa.me/?text=`).
- Nothing reaches the parent screens before approval (`planService.getRoadmap` for a parent returns approved plans only).

### B6 · Child overview (T-05) — P0 · M · needs A4

- Header: nickname, age band, current phase, next session date.
- This week: one small bar per activity (done of planned) plus the most common face. Use neutral bars; no red.
- Last 14 days: simple SVG lines for mood, sleep and meltdowns.
- The latest 3 feedback items (link to T-08). **Ready for next step?** cards (😀 3 times in a week on the same activity).
- Buttons: **Generate report** (T-09), **Edit roadmap** (T-06), **Invite caregiver** (T-11).
- Clinical record panel (therapist only).

### B7 · Roadmap (T-06) and matching rules — P0 · L · needs A4, D2

- Phase tabs (Weeks 1–4, 5–8, 9–12) with the current phase highlighted. One row per goal, with its activity cards (title, slot, difficulty step).
- Card actions: **Swap**, **Remove**, **Change step**, **Move to next phase**.
- **+ Add from library** opens D2's drawer, pre-filtered to the goal's domain and the child's age band, with **Assign to child**.
- `lib/matching/suggest.ts`: the guide's 7 matching rules as a pure function, with a unit test for each rule. `libraryService.suggestActivities` uses it. **Suggest activities** fills empty goals with it.
- An eighth activity shows "Remove one first."
- **Publish changes**, then a change log (who, what, when).
- Empty roadmap state for Mitu ("Build it myself" path).

### B8 · Therapist settings (T-12) — P1 · S

- Profile, language (English / বাংলা), **Reset demo data**, log out.

---

## Lane C — Parent

All parent screens: Bangla first, 360 px, 18 px body text, thumb-reach buttons, no streaks or red.

### C1 · Today (P-02) — P0 · M · needs A5

- Greeting with the parent's name and the date. A calm banner if the plan is paused.
- Activities grouped by routine slot in time order; each card shows the title, slot chip and status (not started, or done with the chosen face).
- An amber progress ring: "৫টির মধ্যে ৩টি আজ" (3 of 5 today).
- An evening card for the daily check-in.
- Empty state: "আজ কোনো কাজ নেই। রাফির সাথে সময়টা উপভোগ করুন!"

### C2 · Quick voice note (floating mic) — P0 · S · needs C1, A6, A7

- A floating mic on Today opens a sheet with MicButton (60 s) and a "Type instead" option → **Send** → `checkText` → EmergencyBox if it matches.

### C3 · Activity detail (P-03) and step viewer (P-04) — P0 · M · needs A4, D1

- P-03: illustration, why it helps (one line), what you need, minutes, a video (or a placeholder), the "If your child gets upset" box, the safety note, any therapist reply, then **শুরু করুন** (Start).
- P-04: full screen, one picture step at a time with a short Bangla sentence, large **Next** and **Back** buttons, step dots, and an optional read-aloud button (`speechSynthesis`, `bn-BD`, hidden if not supported).
- Last screen: "কেমন হলো?" with MoodPicker (required).

### C4 · Feedback sheet (P-05) and confirmation — P0 · M · needs C3, A6, A7

- MediaPicker: Voice (60 s), Photo, Video (30 s), Text, all optional → **পাঠান** (Send).
- Text and the mocked transcript go through `checkText`; if it matches, show EmergencyBox before the confirmation.
- Confirmation: "ধন্যবাদ! ডাক্তার নাসরিন এটি দেখবেন।" → back to Today with the card done.
- Test: done with a face plus a voice note takes **5 taps or fewer, with no typing**.

### C5 · Daily check-in (P-06) — P0 · S · needs A2, A6, A7

- One screen, four rows of large buttons (Mood, Sleep, Meals, Meltdowns), an optional voice note, and **Save**.
- One check-in per day; opening it again edits the same one.

### C6 · Reminders: in-app banner and preview — P0 · S · needs A4

- `reminderService`: about 20 warm Bangla templates that use the child's name (D writes the text). Never more than 3 a day, never for an activity already done, none while paused.
- An in-app banner at the top of Today; tapping it opens that activity.
- A **Preview reminders** screen (linked from parent settings and the dev menu) that lists today's reminders with their times, plus **Send now** to show the banner.

### C7 · Progress (P-07) — P1 · S

- "This week's wins": moments practised together, the activities with the most 😀, and the therapist's replies. No streaks, no missed counts.

### C8 · Help (P-10) — P1 · S · needs A7

- How to use the app, **Call** or **WhatsApp** the clinic, and EmergencyBox. Port the layout from [public/care.js](../public/care.js).

### C9 · Parent onboarding (P-01) — P1 · M

- Four screens: welcome and language → consent (clinic data required; AI and video optional; one line each) → routine time pickers, reminders per day and quiet hours → meet your plan (therapist, goals in plain words, this phase's activities) → **আজই শুরু করুন** (Start today) or **Watch lesson 1 first**.

### C10 · Parent settings (P-11) — P1 · S

- Language, reminder times and count, **Pause plan** (sick, travel or other, for 1–7 days; Today shows the calm banner and reminders stop), and **Invite another caregiver**.

---

## Lane D — Library, report, content

### D1 · 15 activity cards and the import script — P0 · L · start immediately, no dependencies

- `data/activities.csv` with the 15 starter cards in the guide's columns (plus `status` and `version`). SOC-01 is written in full in the guide; write the other 14 the same way, with 3–6 steps each in Bangla and English. Every card gets the shared safety note.
- `scripts/import-activities.ts` + `npm run import:activities`: CSV → `data/activities.json`, validated with zod. It lists the errors (missing Bangla step, unknown domain, missing image).
- Placeholder images at `/public/library/{id}/cover.webp` and `step-n.webp`; a missing image shows a placeholder.
- Mark all 15 `reviewed` for the demo, and add 1 extra `draft` card to show the Draft badge.
- Write the 20 Bangla reminder templates for C6 in `data/reminder-templates.json`.

**Done when:** the import runs clean and A4 can read the JSON. A native Bangla speaker checks the text before the demo.

### D2 · Activity library (T-07) and card drawer — P0 · M · needs A5, D1

- Filter chips (domain, routine slot, age band, communication level, difficulty) plus search; a grid of cards; a Draft badge on draft cards.
- Drawer: the full card, plus a **Parent preview** tab that reuses C3's components, so it shows exactly what the parent sees.
- `<LibraryDrawer mode="browse|assign|read">` with an `onAssign` callback, so B4, B5 and B7 can reuse it. Agree the props with B on day 1.

### D3 · Pre-visit report (T-09) — P0 · L · needs A4

- Date range (defaults to "since the last session") → **Generate report** → StepLoader ("Reading logs", "Listening to voice notes", "Writing the summary").
- AIDraftBanner, then the six parts: summary, completion by activity, patterns, parent quotes (with a play button for the original audio), concerns, and questions for the visit.
- Every part can be edited inline; **Approve** saves it with the date. **Export PDF** uses `window.print()` with a print stylesheet.
- After approval: **Share a summary with the family** shows a short, positive parent version for approval. Only that summary is visible to the parent.

### D4 · Learn (P-08) and story reader (P-09) — P1 · M

- 5 lesson cards (title, a 1-minute video placeholder, 3 picture tips), then the social stories.
- Story reader: swipeable pages, Bangla text, read aloud. Port [public/story.js](../public/story.js) and [public/story-art.js](../public/story-art.js), and add the doctor-visit, haircut and new-school stories.

### D5 · Centre admin (C-01 to C-03) — P1 · M · needs A5

- C-01: families, therapists, weekly logging rate, and families with no logs in 7 days.
- C-02: the therapist list, plus invite (shows the centre code).
- C-03: all families with their last activity date.
- Port the dashboard layout from [public/care.js](../public/care.js).

---

## Q1 · Demo story test — P0 · everyone · Sat 15 Nov 18:00

Run on a real Android phone (360 px) and a laptop (1280 px), after **Reset demo data**.

- [ ] Log in as Dr. Nasrin → open Mitu → smart intake with a voice note and a photo → review → approve → the invite code appears.
- [ ] Log in as Ayesha → Today → Face-to-face bubbles → steps → 😀 → voice note → confirmation; the card shows done.
- [ ] Type "he had a seizure" in feedback → the emergency box shows → the alert appears for Dr. Nasrin with a badge.
- [ ] Log in as Dr. Nasrin → Rafi → Generate report → edit one line → Approve.
- [ ] Nothing red except safety alerts; no streaks; no clinical fields on any parent screen.
- [ ] Every parent screen works at 360 px; every therapist screen works at 1280 px.

When every box is ticked, report the results and **stop**. Phase 2 starts only after `START BACKEND`.

---

## Dependency map

```
A1 ─► A2 ─► A5 ─► B1, B2, D2, A8, D5, A10
  └─► A3 ─► A4 ─► B4, B6, B7, C1, C3, C6, D3, A9
        └─► A7 ─► C2, C4, C5, A8
A2 ─► A6 ─► B3, C2, C4, C5, A9
D1 ─► A4 (real cards), B4, C3, D2
D2 ─► B4, B7     C3 ─► D2 (parent preview)
```

Day-one handshakes: **B + D** agree the `LibraryDrawer` props; **C + D** agree the activity card components D2's parent preview reuses; **everyone** signs off A3.

## How to hand a story to an AI coding tool

Paste the following, in this order:

1. The build guide.
2. This file's sections **Ground rules**, **Definition of done**, **Design** and **Folder ownership**.
3. The one story you're working on.
4. Then this line: *"Build only this story. Use `@/lib/services` and the types in `lib/types.ts`; don't change files outside my lane's folders. When done, list what you built and any decisions you made."*

## Open items

- [ ] A native Bangla speaker checks every parent string and all 15 cards before the demo (D owns).
- [ ] Illustrations: placeholders are fine for Phase 1. Decide by Saturday noon whether real ones are worth the time.
- [ ] Demo media: the team records the voice notes and photos itself (no real children).
