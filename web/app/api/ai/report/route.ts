// POST /api/ai/report — draft a fortnightly progress report.
// Completion stats are computed deterministically from the DB (reliable, cheap);
// Gemini only writes the prose fields. RLS authorizes the child.
import { NextResponse } from "next/server";
import { geminiJson } from "@/lib/ai/gemini";
import { supabaseServer } from "@/lib/supabase/server";
import type { Mood, ReportDraft } from "@/lib/types";

function topMood(moods: Mood[]): Mood {
  const c: Record<Mood, number> = { happy: 0, neutral: 0, sad: 0 };
  moods.forEach((m) => c[m]++);
  return (Object.keys(c) as Mood[]).sort((a, b) => c[b] - c[a])[0];
}
function dayCount(from: string, to: string) {
  const a = new Date(`${from}T00:00:00`), b = new Date(`${to}T00:00:00`);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export async function POST(request: Request) {
  const { childId, from, to } = (await request.json()) as { childId: string; from: string; to: string };
  if (!childId || !from || !to) return NextResponse.json({ error: "Missing childId/from/to" }, { status: 400 });

  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { data: profile } = await sb.from("profiles").select("language").eq("id", user.id).maybeSingle();
  const langInstruction = profile?.language === "bn"
    ? "Write every free-text field (\"summary\", \"patterns\", \"concerns\", \"questions_for_visit\") in natural, warm Bangla (Bengali script)."
    : "Write every free-text field (\"summary\", \"patterns\", \"concerns\", \"questions_for_visit\") in English.";

  const { data: child } = await sb.from("children").select("nickname").eq("id", childId).maybeSingle();
  if (!child) return NextResponse.json({ error: "Child not found or not allowed" }, { status: 403 });

  const [{ data: rm }, { data: logs }, { data: checkins }, { data: feedback }] = await Promise.all([
    sb.from("roadmaps").select("id, current_phase").eq("child_id", childId).eq("status", "approved").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("activity_logs").select("activity_id, mood, log_date").eq("child_id", childId).gte("log_date", from).lte("log_date", to),
    sb.from("daily_checkins").select("checkin_date, sleep, meals, meltdowns, note").eq("child_id", childId).gte("checkin_date", from).lte("checkin_date", to).order("checkin_date"),
    sb.from("feedback").select("id, text, created_at, feedback_ai(summary_en, flags)").eq("child_id", childId).gte("created_at", from).lte("created_at", `${to}T23:59:59`),
  ]);

  const L = logs ?? [], C = checkins ?? [], F = feedback ?? [];
  let activeIds: string[] = [];
  if (rm) {
    const { data: items } = await sb.from("plan_items").select("activity_id").eq("roadmap_id", rm.id).eq("active", true).eq("phase", rm.current_phase ?? 1);
    activeIds = [...new Set((items ?? []).map((i) => i.activity_id))];
  }
  if (!activeIds.length) activeIds = [...new Set(L.map((l) => l.activity_id))];

  const days = dayCount(from, to);
  const completion = activeIds.map((activity_id) => {
    const theirs = L.filter((l) => l.activity_id === activity_id);
    return { activity_id, planned: days, done: theirs.length, top_mood: topMood(theirs.map((l) => l.mood as Mood)) };
  });
  const parent_quotes = F
    .filter((f) => (f.text || (Array.isArray(f.feedback_ai) ? f.feedback_ai[0] : f.feedback_ai)?.summary_en))
    .filter((f) => !((Array.isArray(f.feedback_ai) ? f.feedback_ai[0] : f.feedback_ai)?.flags ?? []).includes("safety_concern"))
    .slice(0, 2)
    .map((f) => ({ text: (Array.isArray(f.feedback_ai) ? f.feedback_ai[0] : f.feedback_ai)?.summary_en || f.text || "", feedback_id: f.id }));

  const practiceDays = new Set(L.map((l) => l.log_date)).size;
  const prompt = `You are a paediatric therapist writing a short, warm progress note for a family in Bangladesh.
Return ONLY JSON: { "summary": string, "patterns": string[], "concerns": string[], "questions_for_visit": string[] }.
- summary: 2-3 plain sentences a parent can read. Mention they practised on ${practiceDays} of ${days} days.
- patterns: 0-2 observations (e.g. links between poor sleep and harder days). [] if nothing stands out.
- concerns: 0-2 gentle flags (activities often skipped, etc). [] if none.
- questions_for_visit: 1-3 things for the next clinic visit.
- ${langInstruction}
Child: ${child.nickname}. Period: ${from} to ${to}.
Completion (activity_id: done/planned, mood): ${completion.map((c) => `${c.activity_id}: ${c.done}/${c.planned} ${c.top_mood}`).join("; ") || "no activity logged"}.
Daily check-ins: ${JSON.stringify(C)}.`;

  let prose: Pick<ReportDraft, "summary" | "patterns" | "concerns" | "questions_for_visit">;
  try {
    prose = await geminiJson(prompt);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const draft: ReportDraft = {
    period: `${from} to ${to}`,
    summary: prose.summary ?? "",
    completion,
    patterns: prose.patterns ?? [],
    parent_quotes,
    concerns: prose.concerns ?? [],
    questions_for_visit: prose.questions_for_visit ?? [],
  };
  return NextResponse.json(draft);
}
