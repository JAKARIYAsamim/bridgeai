# BridgeAI — Phase 1 (UI with mock data)

Every screen from the build guide, running on mock data and fake services. No Supabase, no Gemini, no API keys.
**Demo data — no real children.**

## Run it

    cd web
    npm install
    npm run dev

Open http://localhost:3000 → **Log in** → use a demo button (therapist, parent or centre admin).
Demo accounts also log in with email + password `demo1234`: `nasrin@hope.demo`, `ayesha@family.demo`, `farhana@hope.demo`.
Parent invite code for the join flow: `482915`.

Mock data is kept in the browser (`localStorage`), so switching roles in one browser keeps state — a parent's
"he had a seizure" note shows up as an alert for Dr. Nasrin. Two tabs stay in sync. **Therapist → Settings → Reset demo data**
before each rehearsal.

## Where things are

| Path | What |
| --- | --- |
| `lib/types.ts` | Shared domain types. Parent screens get `ParentChildView`, which has no clinical fields. |
| `lib/services/types.ts` | The service interfaces (auth, child, library, plan, feedback, ai, reminder, alert). |
| `lib/services/mock/` | Phase 1 implementations + seed data (Rafi with 14 days of history, Mitu with no plan). |
| `lib/services/index.ts` | The only import screens use. Phase 2 swaps the exports here. |
| `lib/safety.ts` | Safety keyword check in plain code, independent of AI. |
| `lib/matching.ts` | The 7 activity matching rules (used by "Suggest activities"). |
| `data/activities.csv` → `data/activities.json` | Activity library. Edit the CSV, then `npm run import:activities` (validated with zod). |
| `components/` | Shared UI (glass style ported from the prototype), media capture, emergency box, parent activity view. |
| `app/t`, `app/p`, `app/c` | Therapist, parent and centre admin screens. |

The fake `aiService` returns the build guide's example JSON after 1.5 seconds.
