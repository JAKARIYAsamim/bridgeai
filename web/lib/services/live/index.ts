// Phase 2 LIVE services — Supabase-backed, behind the same switch as the mock.
// Runs in the browser with the user's session; Row Level Security enforces access.
//
// Scope (Story 3 "working demo slice"): auth, children, library, roadmap/today,
// logs & check-ins, alerts, and the cheap feedback/report READ paths are live.
// The AI-coupled authoring paths (plan drafting/approval, voice summaries, report
// drafting, reminders) throw a clear "comes in Story 4" error until Gemini lands.
//
// The live DB is Bangla-primary and more normalized than the rich mock types, so a
// few English/cover fields come back empty — that's the accepted degrade for the demo.
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import lessonsJson from "@/data/lessons.json";
import { findSafetyKeyword } from "@/lib/safety";
import { suggest } from "@/lib/matching";
import { supabaseBrowser } from "@/lib/supabase/client";
import type {
  Activity, ActivityLog, Alert, Caregiver, Centre, Checkin, Child, Feedback, Lesson,
  ParentChildView, PlanItem, Report, Roadmap, Role, Story, User,
} from "@/lib/types";
import type {
  AiService, AlertService, AuthService, ChildService, FeedbackService, LibraryService,
  PlanService, ReminderService,
} from "../types";

const LESSONS = lessonsJson as unknown as Lesson[];

// ---------- client + small helpers ----------
let _sb: ReturnType<typeof supabaseBrowser> | null = null;
const sb = () => (_sb ??= supabaseBrowser());

const SOON = (what: string) =>
  new Error(`${what} goes live in Story 4 (AI routes). It's still on the mock for now.`);

// Demo login contract (seeded in Story 2). Public synthetic credentials.
const DEMO_PW = "bridgeai123";
const DEMO_EMAIL: Record<Role, string> = {
  therapist: "therapist@demo.bridgeai.app",
  parent: "parent@demo.bridgeai.app",
  admin: "admin@demo.bridgeai.app",
};
const PHASE_NAMES: [string, string, string] = [
  "Weeks 1–4: Connect and build routines",
  "Weeks 5–8: Build skills",
  "Weeks 9–12: Use skills everywhere",
];

const pad = (n: number) => String(n).padStart(2, "0");
const dkey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const today = () => dkey(new Date());
const must = <T>(v: T | null | undefined, msg: string): T => { if (v == null) throw new Error(msg); return v; };

function friendlyAuthError(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "Email or password is incorrect.";
  if (/already registered|already exists/i.test(msg)) return "An account with this email already exists.";
  return msg;
}
function friendlyCodeError(msg: string) {
  if (/code_used/.test(msg)) return "This code has already been used.";
  if (/code_expired/.test(msg)) return "This code has expired. Ask your therapist for a new one.";
  if (/invalid_code/.test(msg)) return "This code didn't work. Ask your therapist for a new one.";
  return msg;
}

// ---------- row → domain mappers ----------
const toUser = (p: any, email: string): User => ({
  id: p.id, role: p.role, name: p.name, email, centreId: p.centre_id ?? "",
  language: p.language, profession: p.profession ?? undefined,
});
const toCentre = (c: any): Centre => ({
  id: c.id, name: c.name, city: c.city ?? "", code: c.centre_code, phone: "", whatsapp: "",
});
const toChildBase = (r: any): ParentChildView => ({
  id: r.id, centreId: r.centre_id, therapistId: r.therapist_id, nickname: r.nickname,
  dob: r.dob, ageBand: r.age_band, commLevel: r.comm_level ?? undefined,
  sensoryFlags: r.sensory_flags ?? [], safetyFlags: r.safety_flags ?? [], strengths: r.strengths ?? [],
  firstSessionDate: r.first_session_date ?? "", nextSessionDate: r.next_session_date ?? undefined,
  createdAt: r.created_at ?? "",
});
function toChild(r: any): Child {
  const cl = Array.isArray(r.child_clinical) ? r.child_clinical[0] : r.child_clinical;
  return {
    ...toChildBase(r),
    clinical: {
      diagnosisNotes: cl?.diagnosis_notes ?? "", assessments: cl?.assessments ?? [],
      coOccurring: cl?.co_occurring ?? "", supportLevel: cl?.support_level ?? undefined,
    },
  };
}
function toActivity(r: any): Activity {
  const steps = (Array.isArray(r.steps) ? r.steps : []).map((s: any) =>
    typeof s === "string"
      ? { text_bn: s, text_en: "", image: "" }
      : { text_bn: s?.text_bn ?? "", text_en: s?.text_en ?? "", image: s?.image ?? "" });
  return {
    id: r.id, title_en: r.title_en || r.title_bn, title_bn: r.title_bn, domain: r.domain,
    routine_slot: r.routine_slot, age_bands: r.age_bands ?? [], comm_levels: r.comm_levels ?? [],
    difficulty: r.difficulty, minutes: r.minutes ?? 0,
    why_bn: r.why_bn ?? "", why_en: "", needs_bn: r.needs_bn ?? [], needs_en: [], steps,
    success_bn: r.success_bn ?? "", success_en: "", if_upset_bn: r.if_upset_bn ?? "", if_upset_en: "",
    video_url: r.video_url ?? undefined, safety_note_bn: r.safety_note_bn ?? "", safety_note_en: "",
    conflicts_with_flags: r.conflicts_with_flags ?? [], evidence: r.evidence ?? [],
    status: r.status, version: r.version ?? 1, cover: "",
  };
}
const toStory = (r: any): Story => ({
  id: r.id, title_bn: r.title_bn, title_en: r.title_bn, cover: "",
  pages: (Array.isArray(r.pages) ? r.pages : []).map((p: any) => ({
    text_bn: p?.text_bn ?? "", text_en: p?.text_en ?? "", emoji: p?.emoji ?? "", tint: p?.tint ?? "",
  })),
});
const toCaregiver = (r: any): Caregiver => ({
  childId: r.child_id, userId: r.profile_id, relation: r.relation ?? "other",
  routineTimes: {
    wake: "07:00", breakfast: "08:00", lunch: "13:00", bath: "11:00", play: "16:00",
    dinner: "20:00", bedtime: "21:30", ...(r.routine_times ?? {}),
  },
  remindersPerDay: (r.reminders_per_day ?? 2) as 1 | 2 | 3,
  quietHours: r.quiet_hours ?? { from: "22:00", to: "07:00" },
  pausedUntil: r.paused_until ?? undefined, pauseReason: r.pause_reason ?? undefined,
  consent: { clinic: false, ai: false, video: false, ...(r.consent ?? {}) },
  onboarded: true,
});
const toLog = (r: any): ActivityLog => ({
  // activity_logs has no activity_id column — it comes through the plan item (joined when needed)
  id: r.id, childId: r.child_id, planItemId: r.plan_item_id,
  activityId: (Array.isArray(r.plan_items) ? r.plan_items[0] : r.plan_items)?.activity_id ?? "",
  caregiverId: r.caregiver_id, date: r.log_date, mood: r.mood, createdAt: r.created_at ?? "",
});
const meltdownsToDb: Record<string, string> = { none: "none", few: "1_2", many: "3_plus" };
const meltdownsFromDb: Record<string, string> = { none: "none", "1_2": "few", "3_plus": "many" };
const toCheckin = (r: any): Checkin => ({
  id: r.id, childId: r.child_id, caregiverId: r.caregiver_id, date: r.checkin_date,
  mood: r.mood, sleep: r.sleep, meals: r.meals, meltdowns: meltdownsFromDb[r.meltdowns] ?? r.meltdowns,
  voiceUrl: r.voice_path ?? undefined, note: r.note ?? undefined,
});
const toAlert = (r: any): Alert => ({
  id: r.id, childId: r.child_id, source: r.source_table, sourceId: r.source_id ?? undefined,
  matchedText: r.matched_text, keyword: findSafetyKeyword(r.matched_text) ?? "",
  createdAt: r.created_at, resolvedAt: r.resolved_at ?? undefined,
  resolutionNote: r.resolution_note ?? undefined,
});
function toFeedback(r: any): Feedback {
  const ai = Array.isArray(r.feedback_ai) ? r.feedback_ai[0] : r.feedback_ai;
  const replies = (Array.isArray(r.feedback_replies) ? r.feedback_replies : [])
    .slice().sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));
  const reply = replies[0];
  return {
    id: r.id, childId: r.child_id, logId: r.log_id ?? undefined, caregiverId: r.author_id,
    type: r.type, mediaUrl: r.media_path ?? undefined, text: r.text ?? undefined,
    transcript: ai?.transcript ?? undefined, summary_en: ai?.summary_en ?? undefined,
    summary_bn: ai?.summary_bn ?? undefined, flags: ai?.flags ?? [],
    therapistReply: reply?.text ?? undefined, therapistReplyMediaUrl: reply?.media_path ?? undefined,
    repliedAt: reply?.created_at ?? undefined,
    reviewedAt: r.reviewed_at ?? undefined, createdAt: r.created_at,
  };
}
function toReport(r: any): Report {
  const final = r.final ?? {};
  return {
    id: r.id, childId: r.child_id, periodStart: r.period_start, periodEnd: r.period_end,
    draft: final, final, approvedAt: r.approved_at ?? undefined, createdAt: r.approved_at ?? "",
  };
}

// ---------- session helpers ----------
async function currentUserOrNull(): Promise<User | null> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) return null;
  const { data: p } = await sb().from("profiles").select("*").eq("id", user.id).maybeSingle();
  return p ? toUser(p, user.email ?? "") : null;
}
async function requireUser(): Promise<User> {
  return must(await currentUserOrNull(), "Not logged in");
}
async function myCaregiver(): Promise<any> {
  const u = await requireUser();
  const { data } = await sb().from("caregivers").select("*").eq("profile_id", u.id).limit(1).maybeSingle();
  return must(data, "No child linked to this caregiver");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Bangladeshi numbers come in as "01XXXXXXXXX", "8801XXXXXXXXX" or "+8801XXXXXXXXX" —
// normalize to E.164 for Supabase's native phone auth.
function toE164BD(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("880")) return `+${digits}`;
  if (digits.startsWith("0")) return `+880${digits.slice(1)}`;
  return `+${digits}`;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || "Request failed. Please try again.");
  return data as T;
}

// Convert an AI PlanDraft into flat goal/item rows (activities grouped under the
// goal that shares their domain — the live analogue of the mock's roadmapFromDraft).
type RGoal = { id: string; domain: string; text: string; evidence: string | null; source: string };
type RItem = { id: string; phase: 1 | 2 | 3; goalId: string; activityId: string; difficulty: number; active: boolean };
function draftToRows(draft: any, activityDomain: Map<string, string>): { goals: RGoal[]; items: RItem[] } {
  const goals: RGoal[] = (draft.goals ?? []).map((g: any) => ({
    id: g.id, domain: g.domain, text: g.text, evidence: g.evidence ?? null, source: "ai",
  }));
  const items: RItem[] = [];
  (draft.roadmap?.phases ?? []).forEach((p: any, pi: number) => {
    (p.activity_ids ?? []).forEach((aid: string) => {
      const dom = activityDomain.get(aid);
      const goalId = dom === "caregiver_wellbeing" ? "" :
        goals.find((g) => g.domain === dom && (p.goal_ids ?? []).includes(g.id))?.id ??
        goals.find((g) => g.domain === dom)?.id ??
        goals.find((g) => g.domain === "behaviour")?.id ??
        (p.goal_ids ?? [])[0] ?? goals[0]?.id ?? "";
      items.push({ id: `pi_${pi}_${aid}`, phase: (pi + 1) as 1 | 2 | 3, goalId, activityId: aid, difficulty: 1, active: true });
    });
  });
  return { goals, items };
}

// Persist a whole roadmap (goals + items) for a child. One roadmap per child: the
// latest row transitions draft→approved. Temp goal ids are remapped to real UUIDs.
async function persistRoadmap(childId: string, status: "draft" | "approved", currentPhase: number, goals: RGoal[], items: RItem[]): Promise<void> {
  const { data: existing } = await sb().from("roadmaps").select("id, approved_at, start_date").eq("child_id", childId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  let rmId = existing?.id as string | undefined;
  if (!rmId) {
    const { data, error } = await sb().from("roadmaps").insert({ child_id: childId, status, current_phase: currentPhase || 1 }).select("id").single();
    if (error) throw new Error(error.message);
    rmId = data.id;
  } else {
    const upd: any = { status, current_phase: currentPhase || 1 };
    if (status === "approved") { upd.approved_at = existing!.approved_at ?? new Date().toISOString(); upd.start_date = existing!.start_date ?? today(); }
    const { error } = await sb().from("roadmaps").update(upd).eq("id", rmId);
    if (error) throw new Error(error.message);
  }

  const { data: existingGoals } = await sb().from("goals").select("id").eq("child_id", childId);
  const existingIds = new Set((existingGoals ?? []).map((g: any) => g.id));
  const map = new Map<string, string>();
  const kept: string[] = [];
  for (const g of goals) {
    if (UUID_RE.test(g.id) && existingIds.has(g.id)) {
      await sb().from("goals").update({ domain: g.domain, text: g.text, evidence: g.evidence, source: g.source }).eq("id", g.id);
      map.set(g.id, g.id); kept.push(g.id);
    } else {
      const { data, error } = await sb().from("goals").insert({ child_id: childId, domain: g.domain, text: g.text, evidence: g.evidence, source: g.source, status: "active" }).select("id").single();
      if (error) throw new Error(error.message);
      map.set(g.id, data.id); kept.push(data.id);
    }
  }
  const drop = [...existingIds].filter((id) => !kept.includes(id as string)) as string[];
  if (drop.length) await sb().from("goals").delete().in("id", drop);

  await sb().from("plan_items").delete().eq("roadmap_id", rmId);
  const actIds = [...new Set(items.map((i) => i.activityId))];
  const slot = new Map<string, string>();
  if (actIds.length) {
    const { data: acts } = await sb().from("activities").select("id, routine_slot").in("id", actIds);
    (acts ?? []).forEach((a: any) => slot.set(a.id, a.routine_slot));
  }
  const rows = items.filter((i) => slot.has(i.activityId)).map((i) => {
    let goalId: string | null = map.get(i.goalId) ?? (UUID_RE.test(i.goalId) ? i.goalId : null);
    if (goalId && !kept.includes(goalId)) goalId = null;
    return { roadmap_id: rmId, child_id: childId, phase: i.phase, goal_id: goalId, activity_id: i.activityId, routine_slot: slot.get(i.activityId), difficulty: i.difficulty || 1, active: i.active !== false };
  });
  if (rows.length) { const { error } = await sb().from("plan_items").insert(rows); if (error) throw new Error(error.message); }
}

// ---------- auth ----------
export const authService: AuthService = {
  async signUp(input) {
    let centreId: string | null = null;
    if (input.role === "therapist" && !input.independent && input.centreCode) {
      const { data: c } = await sb().from("centres").select("id").eq("centre_code", input.centreCode.toUpperCase()).maybeSingle();
      centreId = c?.id ?? null;
    }
    const { data, error } = await sb().auth.signUp({
      email: input.email, password: input.password,
      options: { data: { role: input.role, name: input.name, centre_id: centreId, profession: input.profession, language: input.language } },
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    // Admin (or independent therapist) starting a fresh centre: create it, then attach.
    if ((input.role === "admin" || input.independent) && input.centreName && data.user) {
      const { data: centre } = await sb().from("centres").insert({ name: input.centreName, city: input.city ?? null }).select("id").maybeSingle();
      if (centre) await sb().from("profiles").update({ centre_id: centre.id }).eq("id", data.user.id);
    }
    return must(await currentUserOrNull(), "Check your email to confirm your account before logging in.");
  },
  async logIn(email, password) {
    // Accepts either an email or a phone number (whatever the account was created with).
    const raw = email.trim();
    const { error } = await sb().auth.signInWithPassword(
      raw.includes("@") ? { email: raw, password } : { phone: toE164BD(raw), password },
    );
    if (error) throw new Error(friendlyAuthError(error.message));
    return must(await currentUserOrNull(), "Email or password is incorrect.");
  },
  async demoLogIn(role) {
    const { error } = await sb().auth.signInWithPassword({ email: DEMO_EMAIL[role], password: DEMO_PW });
    if (error) throw new Error(friendlyAuthError(error.message));
    return must(await currentUserOrNull(), "Demo login failed.");
  },
  async logOut() { await sb().auth.signOut(); },
  async currentUser() { return currentUserOrNull(); },
  async checkCode(code) {
    const { data, error } = await sb().rpc("check_invite_code", { p_code: code.trim() });
    if (error) throw new Error(friendlyCodeError(error.message));
    const d = data as any;
    const child = { ...toChildBase({ id: d.child.id, nickname: d.child.nickname, age_band: d.child.ageBand, centre_id: d.centre.id, therapist_id: d.therapist.id }) };
    const therapist: User = { id: d.therapist.id, role: "therapist", name: d.therapist.name, email: "", centreId: d.centre.id, language: "bn" };
    const centre: Centre = { id: d.centre.id, name: d.centre.name, city: d.centre.city ?? "", code: "", phone: "", whatsapp: "" };
    return { child, therapist, centre };
  },
  async joinWithCode(input) {
    // The "Phone or email" field accepts either. A phone number goes through Supabase's
    // native phone auth (confirmations are off project-wide, so no OTP/SMS is sent) —
    // the email endpoint, and its rate limit, is never touched for phone sign-ups.
    const raw = input.contact.trim();
    const isEmail = raw.includes("@");
    const { error } = await sb().auth.signUp(
      isEmail
        ? { email: raw, password: input.password, options: { data: { role: "parent", name: input.name, language: "bn" } } }
        : { phone: toE164BD(raw), password: input.password, options: { data: { role: "parent", name: input.name, language: "bn" } } },
    );
    if (error) throw new Error(friendlyAuthError(error.message));
    const { error: rErr } = await sb().rpc("redeem_invite_code", { p_code: input.code.trim(), p_relation: input.relation });
    if (rErr) throw new Error(friendlyCodeError(rErr.message));
    return must(await currentUserOrNull(), isEmail
      ? "Check your email to confirm your account before logging in."
      : "Could not sign you in. Please try again.");
  },
  async updateUser(patch) {
    const u = await requireUser();
    const upd: any = {};
    if (patch.name !== undefined) upd.name = patch.name;
    if (patch.language !== undefined) upd.language = patch.language;
    if (patch.profession !== undefined) upd.profession = patch.profession;
    if (Object.keys(upd).length) await sb().from("profiles").update(upd).eq("id", u.id);
    return must(await currentUserOrNull(), "Not logged in");
  },
  async getCentre() {
    const u = await requireUser();
    const { data } = await sb().from("centres").select("*").eq("id", u.centreId).maybeSingle();
    return toCentre(must(data, "Centre not found"));
  },
  async listUsers(role) {
    let q = sb().from("profiles").select("*");
    if (role) q = q.eq("role", role);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []).map((p) => toUser(p, ""));
  },
};

// ---------- children ----------
export const childService: ChildService = {
  async listChildren() {
    const u = await requireUser();
    let q = sb().from("children").select("*, child_clinical(*)");
    if (u.role !== "admin") q = q.eq("therapist_id", u.id);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toChild);
  },
  async getChild(id) {
    const { data, error } = await sb().from("children").select("*, child_clinical(*)").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return toChild(must(data, "Child not found"));
  },
  async getMyChild() {
    const cg = await myCaregiver();
    const { data } = await sb().from("children").select("*").eq("id", cg.child_id).maybeSingle();
    return toChildBase(must(data, "Child not found"));
  },
  async createChild(input) {
    const u = await requireUser();
    const { data: child, error } = await sb().from("children").insert({
      centre_id: u.centreId || null, therapist_id: u.id, nickname: input.nickname.trim(), dob: input.dob,
      age_band: input.ageBand, first_session_date: input.firstSessionDate,
      sensory_flags: input.sensoryFlags ?? [], safety_flags: input.safetyFlags ?? [], strengths: [],
    }).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    const created = must(child, "Could not create child");
    if (input.clinical) {
      await sb().from("child_clinical").insert({
        child_id: created.id, diagnosis_notes: input.clinical.diagnosisNotes ?? null,
        assessments: input.clinical.assessments ?? [], co_occurring: input.clinical.coOccurring ?? null,
        support_level: input.clinical.supportLevel ?? null,
      });
    }
    return toChild({ ...created, child_clinical: input.clinical ? [{
      diagnosis_notes: input.clinical.diagnosisNotes, assessments: input.clinical.assessments,
      co_occurring: input.clinical.coOccurring, support_level: input.clinical.supportLevel,
    }] : [] });
  },
  async updateChild(id, patch) {
    const upd: any = {};
    if (patch.nickname !== undefined) upd.nickname = patch.nickname;
    if (patch.dob !== undefined) upd.dob = patch.dob;
    if (patch.ageBand !== undefined) upd.age_band = patch.ageBand;
    if (patch.commLevel !== undefined) upd.comm_level = patch.commLevel;
    if (patch.sensoryFlags !== undefined) upd.sensory_flags = patch.sensoryFlags;
    if (patch.safetyFlags !== undefined) upd.safety_flags = patch.safetyFlags;
    if (patch.strengths !== undefined) upd.strengths = patch.strengths;
    if (patch.nextSessionDate !== undefined) upd.next_session_date = patch.nextSessionDate;
    if (Object.keys(upd).length) {
      const { error } = await sb().from("children").update(upd).eq("id", id);
      if (error) throw new Error(error.message);
    }
    if (patch.clinical) {
      await sb().from("child_clinical").upsert({
        child_id: id, diagnosis_notes: patch.clinical.diagnosisNotes ?? null,
        assessments: patch.clinical.assessments ?? [], co_occurring: patch.clinical.coOccurring ?? null,
        support_level: patch.clinical.supportLevel ?? null,
      });
    }
    return this.getChild(id);
  },
  async createInviteCode(childId) {
    const u = await requireUser();
    const { data: code, error } = await sb().rpc("create_invite_code", { p_child_id: childId });
    if (error) throw new Error(error.message);
    const { data: row } = await sb().from("invite_codes").select("*").eq("code", code).maybeSingle();
    return {
      code: code as string, childId, createdBy: u.id,
      expiresAt: row?.expires_at ?? daysAgo(-14).toISOString(), usedBy: row?.used_by ?? undefined,
    };
  },
  async getCaregivers(childId) {
    const { data, error } = await sb().from("caregivers").select("*, profiles(*)").eq("child_id", childId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((c: any) => ({ ...toCaregiver(c), user: toUser(c.profiles, "") }));
  },
  async getMyCaregiver() { return toCaregiver(await myCaregiver()); },
  async updateMyCaregiver(patch) {
    const cg = await myCaregiver();
    const upd: any = {};
    if (patch.relation !== undefined) upd.relation = patch.relation;
    if (patch.routineTimes !== undefined) upd.routine_times = patch.routineTimes;
    if (patch.remindersPerDay !== undefined) upd.reminders_per_day = patch.remindersPerDay;
    if (patch.quietHours !== undefined) upd.quiet_hours = patch.quietHours;
    if (patch.consent !== undefined) upd.consent = patch.consent;
    if (patch.pausedUntil !== undefined) upd.paused_until = patch.pausedUntil;
    if (patch.pauseReason !== undefined) upd.pause_reason = patch.pauseReason;
    if (Object.keys(upd).length) {
      const { error } = await sb().from("caregivers").update(upd).eq("child_id", cg.child_id).eq("profile_id", cg.profile_id);
      if (error) throw new Error(error.message);
    }
    return toCaregiver({ ...cg, ...upd });
  },
};

// ---------- library ----------
async function allActivities(): Promise<Activity[]> {
  const { data, error } = await sb().from("activities").select("*").neq("status", "archived");
  if (error) throw new Error(error.message);
  return (data ?? []).map(toActivity);
}
export const libraryService: LibraryService = {
  async listActivities(f = {}) {
    const q = f.search?.toLowerCase().trim();
    return (await allActivities())
      .filter((a) => f.includeDrafts !== false || a.status === "reviewed")
      .filter((a) => !f.domain || a.domain === f.domain)
      .filter((a) => !f.routine_slot || a.routine_slot === f.routine_slot)
      .filter((a) => !f.age_band || a.age_bands.includes(f.age_band) || a.age_bands.includes("parent"))
      .filter((a) => !f.comm_level || a.comm_levels.includes(f.comm_level))
      .filter((a) => !f.difficulty || a.difficulty === f.difficulty)
      .filter((a) => !q || `${a.id} ${a.title_en} ${a.title_bn} ${a.evidence.join(" ")}`.toLowerCase().includes(q));
  },
  async getActivity(id) {
    const { data, error } = await sb().from("activities").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return toActivity(must(data, `Activity ${id} not found`));
  },
  async suggestActivities(childId) {
    const child = await childService.getChild(childId);
    const rm = await planService.getRoadmap(childId);
    if (!rm) return [];
    const phaseItems = rm.items.filter((i) => i.phase === rm.currentPhase);
    return suggest(child as Child, rm.goals, await allActivities(), phaseItems);
  },
  async listStories() {
    const { data, error } = await sb().from("stories").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map(toStory);
  },
  async getStory(id) {
    const { data, error } = await sb().from("stories").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return toStory(must(data, "Story not found"));
  },
  async listLessons() { return LESSONS; }, // no DB table — static content is the same for everyone
};

// ---------- plan ----------
async function loadRoadmap(childId: string, approvedOnly: boolean): Promise<Roadmap | null> {
  let q = sb().from("roadmaps").select("*").eq("child_id", childId);
  if (approvedOnly) q = q.eq("status", "approved");
  const { data: rms } = await q.order("created_at", { ascending: false }).limit(1);
  const rm = rms?.[0];
  if (!rm) return null;
  const [goalsR, itemsR, changesR] = await Promise.all([
    sb().from("goals").select("*").eq("child_id", childId),
    sb().from("plan_items").select("*").eq("roadmap_id", rm.id).order("created_at"),
    sb().from("plan_changes").select("*").eq("child_id", childId).order("created_at"),
  ]);
  return {
    id: rm.id, childId: rm.child_id, status: rm.status, approvedAt: rm.approved_at ?? undefined,
    currentPhase: (rm.current_phase ?? 1) as 1 | 2 | 3, phaseNames: PHASE_NAMES,
    goals: (goalsR.data ?? []).map((g: any) => ({
      id: g.id, childId: g.child_id, domain: g.domain, text: g.text, text_bn: undefined,
      evidence: g.evidence ?? null, source: g.source,
    })),
    items: (itemsR.data ?? []).map((i: any): PlanItem => ({
      id: i.id, roadmapId: i.roadmap_id, phase: i.phase, goalId: i.goal_id ?? "",
      activityId: i.activity_id, difficulty: i.difficulty, active: i.active,
    })),
    changeLog: (changesR.data ?? []).map((c: any) => ({ at: c.created_at, by: c.changed_by ?? "", text: c.summary })),
  };
}
export const planService: PlanService = {
  async getRoadmap(childId) {
    const u = await requireUser();
    return loadRoadmap(childId, u.role === "parent");
  },
  async getToday() {
    const cg = await myCaregiver();
    const rm = await loadRoadmap(cg.child_id, true);
    if (!rm) return [];
    const t = today();
    const seen = new Set<string>();
    const items = rm.items
      .filter((i) => i.phase === rm.currentPhase && i.active)
      .filter((i) => (seen.has(i.activityId) ? false : (seen.add(i.activityId), true)));
    if (!items.length) return [];
    const ids = items.map((i) => i.activityId);
    const [actsR, logsR] = await Promise.all([
      sb().from("activities").select("*").in("id", ids),
      sb().from("activity_logs").select("*").eq("child_id", cg.child_id).eq("log_date", t),
    ]);
    const acts = new Map((actsR.data ?? []).map((a: any) => [a.id, toActivity(a)]));
    const logs = (logsR.data ?? []).map(toLog);
    return items
      .filter((i) => acts.has(i.activityId))
      .map((item) => ({
        item, activity: acts.get(item.activityId)!,
        log: logs.find((l) => l.planItemId === item.id),
      }));
  },
  async saveDraft(childId, draft, kept) {
    const acts = await allActivities();
    const domainOf = new Map(acts.map((a) => [a.id, a.domain]));
    let { goals, items } = draftToRows(draft, domainOf);
    if (kept) {
      // regenerate: keep the goals/items the therapist accepted, redraft the rest
      const existing = await loadRoadmap(childId, false);
      if (existing) {
        const keepG = new Set(kept.goalIds), keepI = new Set(kept.activityIds);
        const keptGoals = existing.goals.filter((g) => keepG.has(g.id)).map((g) => ({ id: g.id, domain: g.domain, text: g.text, evidence: g.evidence, source: g.source }));
        const keptItems = existing.items.filter((i) => keepI.has(i.id)).map((i) => ({ id: i.id, phase: i.phase, goalId: i.goalId, activityId: i.activityId, difficulty: i.difficulty, active: i.active }));
        goals = [...keptGoals, ...goals.filter((g) => !keepG.has(g.id))];
        items = [...keptItems, ...items.filter((i) => !keptItems.some((k) => k.activityId === i.activityId && k.phase === i.phase))];
      }
    }
    await persistRoadmap(childId, "draft", 1, goals, items);
    return must(await loadRoadmap(childId, false), "Could not save draft");
  },
  async approvePlan(childId, roadmap) {
    const u = await requireUser();
    await persistRoadmap(childId, "approved", roadmap.currentPhase ?? 1,
      roadmap.goals.map((g) => ({ id: g.id, domain: g.domain, text: g.text, evidence: g.evidence, source: g.source })),
      roadmap.items.map((i) => ({ id: i.id, phase: i.phase, goalId: i.goalId, activityId: i.activityId, difficulty: i.difficulty, active: i.active })));
    await sb().from("plan_changes").insert({ child_id: childId, changed_by: u.id, summary: "Approved plan" });
    return must(await loadRoadmap(childId, false), "Could not approve plan");
  },
  async publishChanges(childId, roadmap, summary) {
    const u = await requireUser();
    await persistRoadmap(childId, roadmap.status === "draft" ? "draft" : "approved", roadmap.currentPhase ?? 1,
      roadmap.goals.map((g) => ({ id: g.id, domain: g.domain, text: g.text, evidence: g.evidence, source: g.source })),
      roadmap.items.map((i) => ({ id: i.id, phase: i.phase, goalId: i.goalId, activityId: i.activityId, difficulty: i.difficulty, active: i.active })));
    await sb().from("plan_changes").insert({ child_id: childId, changed_by: u.id, summary });
    return must(await loadRoadmap(childId, false), "Could not publish changes");
  },
  async updatePlanItem(childId, itemId, patch) {
    if (patch === null) {
      const { error } = await sb().from("plan_items").delete().eq("id", itemId);
      if (error) throw new Error(error.message);
    } else {
      const upd: any = {};
      if (patch.difficulty !== undefined) upd.difficulty = patch.difficulty;
      if (patch.active !== undefined) upd.active = patch.active;
      if (patch.phase !== undefined) upd.phase = patch.phase;
      if (patch.goalId !== undefined) upd.goal_id = UUID_RE.test(patch.goalId) ? patch.goalId : null;
      if (Object.keys(upd).length) {
        const { error } = await sb().from("plan_items").update(upd).eq("id", itemId);
        if (error) throw new Error(error.message);
      }
    }
    return must(await loadRoadmap(childId, false), "Roadmap not found");
  },
  async addPlanItem(childId, item) {
    const { data: rm } = await sb().from("roadmaps").select("id").eq("child_id", childId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!rm) throw new Error("No roadmap to add to");
    const { data: act } = await sb().from("activities").select("routine_slot").eq("id", item.activityId).maybeSingle();
    const { error } = await sb().from("plan_items").insert({
      roadmap_id: rm.id, child_id: childId, phase: item.phase, activity_id: item.activityId,
      goal_id: item.goalId && UUID_RE.test(item.goalId) ? item.goalId : null,
      routine_slot: act?.routine_slot ?? "any", difficulty: item.difficulty ?? 1, active: item.active !== false,
    });
    if (error) throw new Error(error.message);
    return must(await loadRoadmap(childId, false), "Roadmap not found");
  },
};

// ---------- alerts ----------
export const alertService: AlertService = {
  async checkText(text, childId, source, sourceId) {
    const k = findSafetyKeyword(text);
    if (!k) return null;
    const { data, error } = await sb().from("alerts").insert({
      child_id: childId, matched_text: text, source_table: source, source_id: sourceId ?? "",
    }).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toAlert(data) : null;
  },
  async listAlerts() {
    const { data, error } = await sb().from("alerts").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map(toAlert).sort((a, b) =>
      (a.resolvedAt ? 1 : 0) - (b.resolvedAt ? 1 : 0) || b.createdAt.localeCompare(a.createdAt));
  },
  async resolveAlert(id, note) {
    const u = await requireUser();
    const { data, error } = await sb().from("alerts").update({
      resolved_at: new Date().toISOString(), resolution_note: note, resolved_by: u.id,
    }).eq("id", id).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return toAlert(must(data, "Alert not found"));
  },
};

// ---------- feedback / check-ins / logs / reports ----------
const cutoff = (days: number) => dkey(daysAgo(days));
export const feedbackService: FeedbackService = {
  async logActivity(planItemId, mood) {
    const u = await requireUser();
    const cg = await myCaregiver();
    const { data: pi } = await sb().from("plan_items").select("activity_id").eq("id", planItemId).maybeSingle();
    const t = today();
    // one log per plan item per day — clear any earlier tap, then record this one
    await sb().from("activity_logs").delete().eq("plan_item_id", planItemId).eq("child_id", cg.child_id).eq("log_date", t);
    const { data, error } = await sb().from("activity_logs").insert({
      plan_item_id: planItemId, child_id: cg.child_id, caregiver_id: u.id, log_date: t, mood,
    }).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    // stitch the activity id (from the plan item) onto the returned log
    return toLog({ ...must(data, "Could not save log"), plan_items: { activity_id: pi?.activity_id } });
  },
  async addFeedback(input) {
    const u = await requireUser();
    const cg = await myCaregiver();
    const { data, error } = await sb().from("feedback").insert({
      child_id: cg.child_id, author_id: u.id, log_id: (input as any).logId ?? null,
      type: input.type, text: input.text ?? null, media_path: input.mediaUrl ?? null,
    }).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    const fb = must(data, "Could not save feedback");
    const alert = await alertService.checkText(input.text ?? "", cg.child_id, input.type === "voice" ? "voice_note" : "feedback", fb.id);
    return { feedback: toFeedback({ ...fb, feedback_ai: [], feedback_replies: [] }), alert };
  },
  async listFeedback(childId) {
    const { data, error } = await sb().from("feedback").select("*, feedback_ai(*), feedback_replies(*)").eq("child_id", childId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toFeedback);
  },
  async reply(feedbackId, text, mediaUrl) {
    const u = await requireUser();
    const { data: fb } = await sb().from("feedback").select("child_id").eq("id", feedbackId).maybeSingle();
    await sb().from("feedback_replies").insert({
      feedback_id: feedbackId, child_id: fb?.child_id, author_id: u.id,
      text: text ?? null, media_path: mediaUrl ?? null,
    });
    await sb().from("feedback").update({ reviewed_at: new Date().toISOString() }).eq("id", feedbackId);
    const { data } = await sb().from("feedback").select("*, feedback_ai(*), feedback_replies(*)").eq("id", feedbackId).maybeSingle();
    return toFeedback(must(data, "Feedback not found"));
  },
  async markReviewed(feedbackId) {
    const { data, error } = await sb().from("feedback").update({ reviewed_at: new Date().toISOString() }).eq("id", feedbackId).select("*, feedback_ai(*), feedback_replies(*)").maybeSingle();
    if (error) throw new Error(error.message);
    return toFeedback(must(data, "Feedback not found"));
  },
  async saveCheckin(input) {
    const u = await requireUser();
    const cg = await myCaregiver();
    const t = today();
    await sb().from("daily_checkins").delete().eq("child_id", cg.child_id).eq("checkin_date", t);
    const { data, error } = await sb().from("daily_checkins").insert({
      child_id: cg.child_id, caregiver_id: u.id, checkin_date: t, mood: input.mood,
      sleep: input.sleep, meals: input.meals, meltdowns: meltdownsToDb[input.meltdowns] ?? input.meltdowns,
      voice_path: input.voiceUrl ?? null, note: input.note ?? null,
    }).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    const checkin = toCheckin(must(data, "Could not save check-in"));
    const alert = await alertService.checkText(input.note ?? "", cg.child_id, "checkin", checkin.id);
    return { checkin, alert };
  },
  async listCheckins(childId, days = 14) {
    const { data, error } = await sb().from("daily_checkins").select("*").eq("child_id", childId).gte("checkin_date", cutoff(days)).order("checkin_date");
    if (error) throw new Error(error.message);
    return (data ?? []).map(toCheckin);
  },
  async getTodayCheckin() {
    const cg = await myCaregiver();
    const { data } = await sb().from("daily_checkins").select("*").eq("child_id", cg.child_id).eq("checkin_date", today()).maybeSingle();
    return data ? toCheckin(data) : null;
  },
  async listLogs(childId, days = 14) {
    const { data, error } = await sb().from("activity_logs").select("*, plan_items(activity_id)").eq("child_id", childId).gte("log_date", cutoff(days));
    if (error) throw new Error(error.message);
    return (data ?? []).map(toLog);
  },
  async readyForNextStep(childId) {
    const logs = await this.listLogs(childId, 7);
    const counts: Record<string, number> = {};
    logs.filter((l) => l.mood === "happy").forEach((l) => (counts[l.activityId] = (counts[l.activityId] || 0) + 1));
    const rm = await loadRoadmap(childId, false);
    return Object.keys(counts).filter((k) =>
      counts[k] >= 3 && !!rm?.items.some((i) => i.activityId === k && i.phase === rm.currentPhase && i.difficulty < 3));
  },
  async listReports(childId) {
    const { data, error } = await sb().from("reports").select("*").eq("child_id", childId).order("approved_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toReport);
  },
  async saveReport(report) {
    const u = await requireUser();
    // The screen sends a temp id like "r_xyz"; let the DB mint the real UUID.
    const { data, error } = await sb().from("reports").insert({
      child_id: report.childId, period_start: report.periodStart,
      period_end: report.periodEnd, final: report.final ?? report.draft, approved_by: u.id,
    }).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return toReport(must(data, "Could not save report"));
  },
  async myReplies() {
    const cg = await myCaregiver();
    return (await this.listFeedback(cg.child_id)).filter((f) => f.therapistReply || f.therapistReplyMediaUrl)
      .sort((a, b) => (b.repliedAt || "").localeCompare(a.repliedAt || ""));
  },
  async mySharedSummaries() { return []; }, // parent-shared summaries land with report drafting in Story 4
};

// ---------- AI (Story 4) + reminders (Story 6) ----------
export const aiService: AiService = {
  async draftPlanFromIntake(childId, inputs, comment) {
    return postJson("/api/ai/intake", { childId, inputs, comment });
  },
  async processVoiceNote(file) {
    // `file` is a blob/object URL — fetch it in the browser and base64 it for the route.
    try {
      const blob = await (await fetch(file)).blob();
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = ""; buf.forEach((b) => (bin += String.fromCharCode(b)));
      return await postJson("/api/ai/voice", { audioBase64: btoa(bin), mimeType: blob.type || "audio/webm" });
    } catch {
      return { transcript: "", summary_en: "", summary_bn: "", flags: [] };
    }
  },
  async draftReport(childId, range) {
    return postJson("/api/ai/report", { childId, from: range.from, to: range.to });
  },
};
export const reminderService: ReminderService = {
  async getSchedule() { throw SOON("Reminders"); },
  async previewReminders() { throw SOON("Reminders"); },
  async pausePlan() { throw SOON("Reminders"); },
  async resumePlan() { throw SOON("Reminders"); },
};
