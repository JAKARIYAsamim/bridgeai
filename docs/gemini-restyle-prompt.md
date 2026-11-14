You are working in the BridgeAI repo. It contains two apps:

1. **The old prototype** (repo root: `public/`, `server/`). Plain HTML/CSS/JS. Run it with `npm start` from the repo root → http://localhost:4900. Its look and feel is what we want.
   - `public/app.css` — all styles (colour tokens in `:root`, glass material, phone frame, cards, rows, tiles, nav, sheets, segmented controls, pills, type scale)
   - `public/index.html` — page structure (`.stage` > `.phone` > status bar, `#wall` wallpaper, `#app`)
   - `public/icons.js` — the custom SVG icon set
   - `public/mascots.js` — the two characters
   - `public/motion.js` — all animations and transitions
   - `public/app.js` — parent and doctor screens (functions like `parentHome`, `parentTracker`, `noteScreen`, `settings`, `doctorHome`, `childView`, `summaryTab`, `planTab`, `notesTab`, `menuSheet`, `planSheet`)
   - `public/care.js` — Help, Alerts, one-tap log, centre view
   - `public/story.js`, `public/story-art.js` — story library and reader

2. **The new app** in `web/` (Next.js 16 App Router + TypeScript + Tailwind 4). Run it with `cd web && npm run dev` → http://localhost:3000. Its **functionality** is what we want: 31 screens, login with 3 roles (therapist, parent, centre admin), mock services, and the full demo flow.

## Goal

Make the new app (`web/`) look and feel **exactly** like the old prototype: same UI, UX, design style, colours, fonts, spacing, corner radius, shadows, glass surfaces, moving wallpaper, phone frame, status bar, icons, mascots, animations, navigation style, sheets, cards, rows, tiles and button styles. Someone who knows the old prototype should feel it is the same app with more screens.

**Keep every function of the new app exactly as it is.** Only the presentation changes.

## Hard rules

1. **Do not change any logic or data.** Do not edit anything in `web/lib/` (types, services, mock data, safety check, matching rules, hooks, i18n) or `web/data/`. Keep every route, every service call, every state change, every form field, every button's action, and every loading, empty and error state.
2. **Do not touch the old prototype** (`public/`, `server/`). Only read it. Copy what you need into `web/`.
3. **Port, don't approximate.** Copy the old CSS rules and class names directly (e.g. into `web/app/legacy.css`, imported from `web/app/globals.css`) and use those classes in the React components. Don't eyeball it with Tailwind utilities. Port `icons.js`, `mascots.js` and `motion.js` into React/TS modules under `web/components/legacy/`, keeping the same SVG paths and animation timings.
4. **Phone frame for every role**, as in the old prototype. On a laptop, every screen (parent, therapist and centre admin) shows inside the 390 px phone frame with the status bar and dynamic island, centred on the coloured stage. On a real phone (≤ 520 px wide) it fills the screen, exactly like the old CSS `@media (max-width: 520px)` rules. Wide screens (roadmap, report, library, inbox, centre tables) must be redesigned as phone screens using the old patterns: stacked rows, segmented tabs, bottom sheets instead of side drawers, horizontal chip scrollers.
5. **Navigation like the old app.** Use the old bottom glass `.nav` tab bar with its badge style and the old top bar with round `.hbtn` buttons and the menu sheet. Replace the new therapist/admin sidebar with this. Parent tabs: Today, Progress, Learn, Help. Therapist tabs: Children, Alerts (with count badge), Library, Settings. Centre admin tabs: Overview, Therapists, Families.
6. **Two exceptions from the product guide** (these are functional rules, keep them even where the old prototype differs):
   - No streak counter anywhere (the old `streak()` must not come back).
   - The pink/red colour (`--pink`) only for safety alerts, the Alerts badge and the emergency box. Other badges and dots use the old purple (`--p`) or orange (`--orange`).
7. Keep these visible: the "Demo data — no real children" banner (restyle it as an old-style pill or strip inside the phone, at the top), the blue "AI draft — check before use" banner on AI output, and the emergency box (call 999 / call clinic).
8. Keep Bangla-first parent screens, Bangla font support (`Hind Siliguri` as in the old `--bn` stack), and tap targets of at least 48 px.

## How to do it (in this order)

1. **Read the old prototype first.** Open http://localhost:4900 as a parent and as a doctor and go through every screen. Read `app.css` completely, then `index.html`, `icons.js`, `mascots.js`, `motion.js`, and the screen functions in `app.js`, `care.js` and `story.js`. Write a short list of the old building blocks (class names and what each looks like) before writing code.
2. **Shared layer.** Port the CSS, icons, mascots and motion. Rebuild these new-app files so their output uses the old markup and classes, keeping their props and exports the same so screens don't break:
   - `web/components/ui.tsx` (Button, Card, Chip, FilterChip, Segmented, BottomSheet, Drawer → render as a bottom sheet, Modal, Toast, Skeleton, EmptyState with a mascot, ErrorState, AIDraftBanner, AIBlock, StepLoader, MoodPicker, DemoBanner, Field, ActivityArt, ProgressRing, PageTitle, SectionTitle)
   - `web/components/shells.tsx` (phone frame, status bar, wallpaper, old top bar, old bottom nav for all three roles; keep `RoleGuard` and `HOME` unchanged)
   - `web/components/media.tsx` (mic button and recorder screen like the old `noteScreen` recording UI, with the same timer and waveform style)
   - `web/components/emergency.tsx`, `web/components/activity-view.tsx`, `web/components/library-drawer.tsx`, `web/components/invite-modal.tsx`
   - `web/app/layout.tsx` and `web/app/globals.css`
3. **Screens that exist in the old prototype: copy the old layout exactly.** Parent home → `web/app/p/today`. One-tap log → `web/app/p/checkin`. Note screen → the feedback sheet in `web/app/p/activity/[id]/steps` and the quick voice note. Story library and reader → `web/app/p/learn` and `web/app/p/learn/story/[id]`. Help → `web/app/p/help`. Parent settings → `web/app/p/settings`. Doctor home → `web/app/t`. Child view and its tabs → `web/app/t/children/[id]`, `.../roadmap`, `.../feedback`, `.../report`. Alerts → `web/app/t/alerts`. Centre view → `web/app/c`, `web/app/c/therapists`, `web/app/c/families`.
4. **New screens: build them from the old building blocks only**, so they look native to the old app. These are welcome, login, sign up, join with code, forgot password, add child, smart intake, review AI draft, invite modal, activity library, activity detail, step viewer, progress, onboarding, reminders preview and therapist settings.
5. **Remove** Tailwind utility styling that conflicts with the old look. Tailwind can stay installed, but the visual result must come from the old CSS.

## Check before you finish

- `cd web && npx tsc --noEmit && npx eslint . && npm run build` all pass.
- Put the old app (port 4900) and the new app (port 3000) side by side. Parent home, story reader, Help, Alerts, doctor home and the centre view must be visually indistinguishable apart from added content.
- The demo story still works end to end. Before each run, log in as the therapist and use Settings → Reset demo data.
  1. Log in as therapist (Dr. Nasrin) → open Mitu → smart intake with a voice note and the sample photo → Create draft plan → review → Approve plan → a 6-digit invite code appears.
  2. Log in as parent (Ayesha) → Today → Face-to-face bubbles → Start → steps → 😀 → voice note → the "ধন্যবাদ!" screen → the card shows done on Today.
  3. In an activity's feedback, choose Text and send "he had a seizure" → the emergency box appears → as the therapist, the alert shows on Alerts with a badge.
  4. As the therapist: Rafi → Generate report → edit one line → Approve.
- Parent screens never show diagnosis notes, assessment scores, support level or AI drafts.
- No horizontal scrolling at 360 px wide.

When done, list the files you changed, any screen where you couldn't match the old style exactly and why, and confirm that nothing in `web/lib/` or `web/data/` changed (`git diff --stat web/lib web/data` should be empty).
