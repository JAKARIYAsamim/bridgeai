// POST /api/ai/intake — draft a plan from the therapist's intake notes.
// Server-side so the Gemini key stays secret; RLS on the session client authorizes
// the child. The model may only pick activity ids that exist in the live library.
import { NextResponse } from "next/server";
import { geminiJson } from "@/lib/ai/gemini";
import { supabaseServer } from "@/lib/supabase/server";
import type { IntakeInput, PlanDraft } from "@/lib/types";

export async function POST(request: Request) {
  const { childId, inputs = [], comment = "" } = (await request.json()) as
    { childId: string; inputs?: IntakeInput[]; comment?: string };
  if (!childId) return NextResponse.json({ error: "Missing childId" }, { status: 400 });

  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { data: profile } = await sb.from("profiles").select("language").eq("id", user.id).maybeSingle();
  const langInstruction = profile?.language === "bn"
    ? "Write every free-text field (goal \"text\", \"missing_info\", \"based_on\") in natural, warm Bangla (Bengali script)."
    : "Write every free-text field (goal \"text\", \"missing_info\", \"based_on\") in English.";

  // RLS lets a therapist read only their own children — an empty result means "not allowed".
  const { data: child } = await sb.from("children").select("*, child_clinical(*)").eq("id", childId).maybeSingle();
  if (!child) return NextResponse.json({ error: "Child not found or not allowed" }, { status: 403 });
  const { data: acts } = await sb.from("activities").select("id, title_en, title_bn, domain, routine_slot, age_bands, comm_levels").neq("status", "archived");
  const library = acts ?? [];
  const cl = Array.isArray(child.child_clinical) ? child.child_clinical[0] : child.child_clinical;

  const notes = inputs
    .map((i) => `- [${i.type}] ${i.label ?? ""}${i.text ? `: ${i.text}` : ""}`)
    .join("\n") || "(no notes captured — infer a gentle starter plan from the profile)";

  const prompt = `You are an early-childhood autism therapist in Bangladesh writing a 12-week home plan.
Return ONLY JSON matching this exact shape:
{
  "profile": { "age_band": string, "comm_level": "preverbal"|"words_gestures"|"phrases"|"conversational"|"aac", "support_level": 1|2|3, "sensory_flags": string[], "safety_flags": string[], "strengths": string[] },
  "goals": [ { "id": "g1", "domain": "communication"|"social"|"imitation_play"|"sensory"|"daily_living"|"behaviour"|"motor"|"early_learning"|"caregiver_wellbeing", "text": string, "evidence": string|null } ],
  "roadmap": { "phases": [ { "name": string, "goal_ids": string[], "activity_ids": string[] } ] },
  "missing_info": string[],
  "based_on": string
}
Rules:
- 3 goals to 4 goals, ids "g1","g2",... Keep goal text parent-friendly and concrete.
- EXACTLY 3 phases named "Weeks 1-4: Connect and build routines", "Weeks 5-8: Build skills", "Weeks 9-12: Use skills everywhere".
- activity_ids MUST be chosen ONLY from the library below (use the "id" values). 3 to 6 per phase. Never invent an id.
- 2 to 3 short "missing_info" questions a therapist should still ask the family.
- "based_on" summarizes what the notes contained.
- ${langInstruction}

CHILD PROFILE: nickname=${child.nickname}, age_band=${child.age_band}, comm_level=${child.comm_level ?? "unknown"}, sensory_flags=${JSON.stringify(child.sensory_flags ?? [])}, safety_flags=${JSON.stringify(child.safety_flags ?? [])}, strengths=${JSON.stringify(child.strengths ?? [])}, support_level=${cl?.support_level ?? "unknown"}, diagnosis=${cl?.diagnosis_notes ?? "n/a"}.
INTAKE NOTES:
${notes}
${comment ? `THERAPIST ADJUSTMENT: ${comment}` : ""}
ACTIVITY LIBRARY (pick ids from here): ${JSON.stringify(library)}`;

  let draft: PlanDraft;
  try {
    draft = await geminiJson<PlanDraft>(prompt);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  // Sanitize: drop any invented ids, keep exactly 3 phases, cap per phase.
  const valid = new Set(library.map((a) => a.id));
  const phases = (draft.roadmap?.phases ?? []).slice(0, 3).map((p, i) => ({
    name: p.name || ["Weeks 1-4: Connect and build routines", "Weeks 5-8: Build skills", "Weeks 9-12: Use skills everywhere"][i],
    goal_ids: Array.isArray(p.goal_ids) ? p.goal_ids : [],
    activity_ids: (p.activity_ids ?? []).filter((id) => valid.has(id)).slice(0, 7),
  }));
  while (phases.length < 3) {
    phases.push({ name: ["Weeks 1-4: Connect and build routines", "Weeks 5-8: Build skills", "Weeks 9-12: Use skills everywhere"][phases.length], goal_ids: [], activity_ids: [] });
  }
  draft.roadmap = { phases };
  draft.goals = (draft.goals ?? []).slice(0, 4).map((g, i) => ({ ...g, id: g.id || `g${i + 1}` }));
  draft.missing_info = draft.missing_info ?? [];
  draft.based_on = draft.based_on || `${inputs.length} note${inputs.length === 1 ? "" : "s"}`;

  return NextResponse.json(draft);
}
