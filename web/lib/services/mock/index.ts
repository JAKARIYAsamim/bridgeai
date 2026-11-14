// Phase 1 mock services. Same method names as the Phase 2 Supabase/Gemini versions.
"use client";
import activitiesJson from "@/data/activities.json";
import lessonsJson from "@/data/lessons.json";
import remindersJson from "@/data/reminder-templates.json";
import storiesJson from "@/data/stories.json";
import { nameIn } from "@/lib/labels";
import { suggest } from "@/lib/matching";
import { findSafetyKeyword } from "@/lib/safety";
import type {
  Activity, Alert, Caregiver, Checkin, Child, Feedback, Lesson, ParentChildView, PlanItem, Reminder,
  ReminderTemplate, Report, Roadmap, Story, User,
} from "@/lib/types";
import type {
  AiService, AlertService, AuthService, ChildService, FeedbackService, LibraryService, PlanService, ReminderService,
} from "../types";
import { daysAgo, dkey, EXAMPLE_PLAN_DRAFT, EXAMPLE_REPORT, roadmapFromDraft } from "./seed";
import { clone, commit, getDB, uid, wait } from "./store";

const ACTIVITIES = activitiesJson as unknown as Activity[];
const STORIES = storiesJson as unknown as Story[];
const LESSONS = lessonsJson as unknown as Lesson[];
const TEMPLATES = remindersJson as unknown as ReminderTemplate[];
const AI_DELAY = 1500;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const strip = ({ password: _p, ...u }: User & { password: string }): User => u;
function me(): User {
  const db = getDB();
  const u = db.users.find((x) => x.id === db.sessionUserId);
  if (!u) throw new Error("Not logged in");
  return strip(u);
}
function myCaregiverRow(): Caregiver {
  const u = me();
  const c = getDB().caregivers.find((x) => x.userId === u.id);
  if (!c) throw new Error("No child linked to this caregiver");
  return c;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parentView = ({ clinical: _c, ...rest }: Child): ParentChildView => rest;
const today = () => dkey(new Date());

// ---------- auth ----------
export const authService: AuthService = {
  async signUp(input) {
    await wait(600);
    const db = getDB();
    if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) throw new Error("An account with this email already exists.");
    if (input.role === "therapist" && !input.independent && input.centreCode && input.centreCode.toUpperCase() !== db.centre.code) {
      throw new Error("We couldn't find that centre code.");
    }
    const user = { id: uid("u"), role: input.role, name: input.name, email: input.email, password: input.password, centreId: db.centre.id, language: input.language, profession: input.profession };
    db.users.push(user);
    db.sessionUserId = user.id;
    commit();
    return strip(user);
  },
  async logIn(email, password) {
    await wait(600);
    const db = getDB();
    const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
    if (!u) throw new Error("Email or password is incorrect.");
    db.sessionUserId = u.id;
    commit();
    return strip(u);
  },
  async demoLogIn(role) {
    const db = getDB();
    const id = role === "therapist" ? "u_nasrin" : role === "parent" ? "u_ayesha" : "u_farhana";
    db.sessionUserId = id;
    commit();
    return strip(db.users.find((u) => u.id === id)!);
  },
  async logOut() {
    getDB().sessionUserId = null;
    commit();
  },
  async currentUser() {
    const db = getDB();
    const u = db.users.find((x) => x.id === db.sessionUserId);
    return u ? strip(u) : null;
  },
  async checkCode(code) {
    await wait(500);
    const db = getDB();
    const inv = db.invites.find((i) => i.code === code.trim());
    if (!inv || new Date(inv.expiresAt) < new Date()) throw new Error("This code didn't work. Ask your therapist for a new one.");
    const child = db.children.find((c) => c.id === inv.childId)!;
    const therapist = strip(db.users.find((u) => u.id === child.therapistId)!);
    return { child: parentView(child), therapist, centre: db.centre };
  },
  async joinWithCode(input) {
    await wait(600);
    const db = getDB();
    const inv = db.invites.find((i) => i.code === input.code.trim());
    if (!inv || new Date(inv.expiresAt) < new Date()) throw new Error("This code didn't work. Ask your therapist for a new one.");
    const user = { id: uid("u"), role: "parent" as const, name: input.name, email: input.contact, phone: input.contact, password: input.password, centreId: db.centre.id, language: "bn" as const };
    db.users.push(user);
    db.caregivers.push({
      childId: inv.childId, userId: user.id, relation: input.relation,
      routineTimes: { wake: "07:00", breakfast: "08:00", lunch: "13:00", bath: "11:00", play: "16:00", dinner: "20:00", bedtime: "21:30" },
      remindersPerDay: 2, quietHours: { from: "22:00", to: "07:00" }, consent: { clinic: false, ai: false, video: false }, onboarded: false,
    });
    inv.usedBy = user.id;
    db.sessionUserId = user.id;
    commit();
    return strip(user);
  },
  async updateUser(patch) {
    const db = getDB();
    const u = db.users.find((x) => x.id === db.sessionUserId)!;
    Object.assign(u, patch);
    commit();
    return strip(u);
  },
  async getCentre() {
    return clone(getDB().centre);
  },
  async listUsers(role) {
    await wait();
    return getDB().users.filter((u) => !role || u.role === role).map(strip);
  },
};

// ---------- children ----------
export const childService: ChildService = {
  async listChildren() {
    await wait();
    const u = me();
    const db = getDB();
    if (u.role === "admin") return clone(db.children);
    return clone(db.children.filter((c) => c.therapistId === u.id));
  },
  async getChild(id) {
    await wait();
    const c = getDB().children.find((x) => x.id === id);
    if (!c) throw new Error("Child not found");
    if (me().role === "parent") throw new Error("Not allowed");
    return clone(c);
  },
  async getMyChild() {
    await wait(120);
    const cg = myCaregiverRow();
    return parentView(clone(getDB().children.find((c) => c.id === cg.childId)!));
  },
  async createChild(input) {
    await wait(500);
    const u = me();
    const child: Child = {
      id: uid("ch"), centreId: u.centreId, therapistId: u.id, nickname: input.nickname.trim(), dob: input.dob, ageBand: input.ageBand,
      gender: input.gender, firstSessionDate: input.firstSessionDate, caregiverName: input.caregiverName, caregiverPhone: input.caregiverPhone,
      sensoryFlags: input.sensoryFlags ?? [], safetyFlags: input.safetyFlags ?? [], strengths: [],
      clinical: input.clinical ?? { diagnosisNotes: "", assessments: [], coOccurring: "" }, createdAt: new Date().toISOString(),
    };
    getDB().children.push(child);
    commit();
    return clone(child);
  },
  async updateChild(id, patch) {
    const c = getDB().children.find((x) => x.id === id)!;
    Object.assign(c, patch);
    commit();
    return clone(c);
  },
  async createInviteCode(childId) {
    await wait(400);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const inv = { code, childId, createdBy: me().id, expiresAt: daysAgo(-7).toISOString() };
    getDB().invites.push(inv);
    commit();
    return inv;
  },
  async getCaregivers(childId) {
    await wait();
    const db = getDB();
    return db.caregivers.filter((c) => c.childId === childId).map((c) => ({ ...clone(c), user: strip(db.users.find((u) => u.id === c.userId)!) }));
  },
  async getMyCaregiver() {
    return clone(myCaregiverRow());
  },
  async updateMyCaregiver(patch) {
    const c = myCaregiverRow();
    Object.assign(c, patch);
    commit();
    return clone(c);
  },
};

// ---------- library ----------
export const libraryService: LibraryService = {
  async listActivities(f = {}) {
    await wait(150);
    const q = f.search?.toLowerCase().trim();
    return ACTIVITIES.filter((a) => a.status !== "archived")
      .filter((a) => f.includeDrafts !== false || a.status === "reviewed")
      .filter((a) => !f.domain || a.domain === f.domain)
      .filter((a) => !f.routine_slot || a.routine_slot === f.routine_slot)
      .filter((a) => !f.age_band || a.age_bands.includes(f.age_band) || a.age_bands.includes("parent"))
      .filter((a) => !f.comm_level || a.comm_levels.includes(f.comm_level))
      .filter((a) => !f.difficulty || a.difficulty === f.difficulty)
      .filter((a) => !q || `${a.id} ${a.title_en} ${a.title_bn} ${a.evidence.join(" ")}`.toLowerCase().includes(q));
  },
  async getActivity(id) {
    const a = ACTIVITIES.find((x) => x.id === id);
    if (!a) throw new Error(`Activity ${id} not found`);
    return a;
  },
  async suggestActivities(childId) {
    await wait(400);
    const db = getDB();
    const child = db.children.find((c) => c.id === childId)!;
    const rm = [...db.roadmaps].reverse().find((r) => r.childId === childId);
    if (!rm) return [];
    const phaseItems = rm.items.filter((i) => i.phase === rm.currentPhase);
    return suggest(child, rm.goals, ACTIVITIES, phaseItems);
  },
  async listStories() {
    await wait(120);
    return STORIES;
  },
  async getStory(id) {
    const s = STORIES.find((x) => x.id === id);
    if (!s) throw new Error("Story not found");
    return s;
  },
  async listLessons() {
    await wait(120);
    return LESSONS;
  },
};

// ---------- plan ----------
const latestRoadmap = (childId: string) => [...getDB().roadmaps].reverse().find((r) => r.childId === childId);
const approvedRoadmap = (childId: string) => [...getDB().roadmaps].reverse().find((r) => r.childId === childId && r.status === "approved");

export const planService: PlanService = {
  async getRoadmap(childId) {
    await wait();
    const rm = me().role === "parent" ? approvedRoadmap(childId) : latestRoadmap(childId);
    return rm ? clone(rm) : null;
  },
  async saveDraft(childId, draft, kept) {
    const db = getDB();
    const existing = db.roadmaps.find((r) => r.childId === childId && r.status === "draft");
    const fresh = roadmapFromDraft(childId, draft, "draft");
    if (existing && kept) {
      // keep accepted/edited goals and items, redraft the rest
      fresh.goals = [...existing.goals.filter((g) => kept.goalIds.includes(g.id)), ...fresh.goals.filter((g) => !kept.goalIds.includes(g.id))];
      fresh.items = [
        ...existing.items.filter((i) => kept.activityIds.includes(i.id)),
        ...fresh.items.filter((i) => !existing.items.some((e) => kept.activityIds.includes(e.id) && e.activityId === i.activityId && e.phase === i.phase)),
      ];
    }
    db.roadmaps = db.roadmaps.filter((r) => !(r.childId === childId && r.status === "draft"));
    db.roadmaps.push(fresh);
    commit();
    return clone(fresh);
  },
  async approvePlan(childId, roadmap) {
    await wait(500);
    const db = getDB();
    const rm: Roadmap = { ...clone(roadmap), status: "approved", approvedAt: new Date().toISOString() };
    rm.changeLog = [...rm.changeLog, { at: rm.approvedAt!, by: me().name, text: "Approved plan" }];
    db.roadmaps = db.roadmaps.filter((r) => r.childId !== childId);
    db.roadmaps.push(rm);
    // apply the reviewed profile to the child
    commit();
    return clone(rm);
  },
  async updatePlanItem(childId, itemId, patch) {
    const rm = latestRoadmap(childId)!;
    if (patch === null) rm.items = rm.items.filter((i) => i.id !== itemId);
    else Object.assign(rm.items.find((i) => i.id === itemId)!, patch);
    commit();
    return clone(rm);
  },
  async addPlanItem(childId, item) {
    const rm = latestRoadmap(childId)!;
    rm.items.push({ ...item, id: uid("pi"), roadmapId: rm.id });
    commit();
    return clone(rm);
  },
  async publishChanges(childId, roadmap, summary) {
    await wait(500);
    const db = getDB();
    const rm: Roadmap = clone(roadmap);
    rm.changeLog = [...rm.changeLog, { at: new Date().toISOString(), by: me().name, text: summary }];
    db.roadmaps = db.roadmaps.filter((r) => r.id !== rm.id);
    db.roadmaps.push(rm);
    commit();
    return clone(rm);
  },
  async getToday() {
    await wait(150);
    const cg = myCaregiverRow();
    const rm = approvedRoadmap(cg.childId);
    if (!rm) return [];
    const db = getDB();
    const t = today();
    const seen = new Set<string>();
    return rm.items
      .filter((i) => i.phase === rm.currentPhase && i.active)
      .filter((i) => (seen.has(i.activityId) ? false : (seen.add(i.activityId), true)))
      .map((item) => ({
        item: clone(item),
        activity: ACTIVITIES.find((a) => a.id === item.activityId)!,
        log: clone(db.logs.find((l) => l.planItemId === item.id && l.date === t && l.childId === cg.childId)),
      }))
      .filter((x) => x.activity);
  },
};

// ---------- alerts ----------
export const alertService: AlertService = {
  async checkText(text, childId, source, sourceId) {
    const k = findSafetyKeyword(text);
    if (!k) return null;
    const alert: Alert = { id: uid("a"), childId, source, sourceId, matchedText: text, keyword: k, createdAt: new Date().toISOString() };
    getDB().alerts.push(alert);
    commit();
    return clone(alert);
  },
  async listAlerts() {
    await wait();
    const u = me();
    const db = getDB();
    const mine = new Set(db.children.filter((c) => u.role === "admin" || c.therapistId === u.id).map((c) => c.id));
    return clone(db.alerts.filter((a) => mine.has(a.childId))).sort((a, b) => (a.resolvedAt ? 1 : 0) - (b.resolvedAt ? 1 : 0) || b.createdAt.localeCompare(a.createdAt));
  },
  async resolveAlert(id, note) {
    const a = getDB().alerts.find((x) => x.id === id)!;
    a.resolvedAt = new Date().toISOString();
    a.resolutionNote = note;
    commit();
    return clone(a);
  },
};

// ---------- feedback ----------
const withinDays = (date: string, days: number) => date >= dkey(daysAgo(days));

export const feedbackService: FeedbackService = {
  async logActivity(planItemId, mood) {
    const cg = myCaregiverRow();
    const db = getDB();
    const rm = approvedRoadmap(cg.childId)!;
    const item = rm.items.find((i) => i.id === planItemId)!;
    const t = today();
    db.logs = db.logs.filter((l) => !(l.planItemId === planItemId && l.date === t && l.childId === cg.childId));
    const log = { id: uid("l"), childId: cg.childId, planItemId, activityId: item.activityId, caregiverId: cg.userId, date: t, mood, createdAt: new Date().toISOString() };
    db.logs.push(log);
    commit();
    return clone(log);
  },
  async addFeedback(input) {
    await wait(400);
    const cg = myCaregiverRow();
    const fb: Feedback = { ...input, id: uid("f"), childId: cg.childId, caregiverId: cg.userId, flags: [], createdAt: new Date().toISOString() };
    if (fb.type === "voice" && !fb.transcript) {
      const ai = await aiService.processVoiceNote(fb.mediaUrl || "");
      Object.assign(fb, ai);
    }
    // safety check runs in code on text and transcript, separately from AI
    const alert = await alertService.checkText([fb.text, fb.transcript].filter(Boolean).join(" "), cg.childId, fb.type === "voice" ? "voice_note" : "feedback", fb.id);
    if (alert && !fb.flags.includes("safety_concern")) fb.flags.push("safety_concern");
    getDB().feedback.push(fb);
    commit();
    return { feedback: clone(fb), alert };
  },
  async listFeedback(childId) {
    await wait();
    return clone(getDB().feedback.filter((f) => f.childId === childId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async reply(feedbackId, text) {
    const f = getDB().feedback.find((x) => x.id === feedbackId)!;
    f.therapistReply = text;
    f.repliedAt = new Date().toISOString();
    f.reviewedAt ??= f.repliedAt;
    commit();
    return clone(f);
  },
  async markReviewed(feedbackId) {
    const f = getDB().feedback.find((x) => x.id === feedbackId)!;
    f.reviewedAt = new Date().toISOString();
    commit();
    return clone(f);
  },
  async saveCheckin(input) {
    await wait(300);
    const cg = myCaregiverRow();
    const db = getDB();
    const t = today();
    db.checkins = db.checkins.filter((c) => !(c.childId === cg.childId && c.date === t));
    const checkin: Checkin = { ...input, id: uid("ck"), childId: cg.childId, caregiverId: cg.userId, date: t };
    db.checkins.push(checkin);
    commit();
    const alert = await alertService.checkText(input.note || "", cg.childId, "checkin", checkin.id);
    return { checkin: clone(checkin), alert };
  },
  async listCheckins(childId, days = 14) {
    await wait();
    return clone(getDB().checkins.filter((c) => c.childId === childId && withinDays(c.date, days))).sort((a, b) => a.date.localeCompare(b.date));
  },
  async getTodayCheckin() {
    const cg = myCaregiverRow();
    return clone(getDB().checkins.find((c) => c.childId === cg.childId && c.date === today()) ?? null);
  },
  async listLogs(childId, days = 14) {
    await wait();
    return clone(getDB().logs.filter((l) => l.childId === childId && withinDays(l.date, days)));
  },
  async readyForNextStep(childId) {
    const logs = getDB().logs.filter((l) => l.childId === childId && withinDays(l.date, 7) && l.mood === "happy");
    const counts: Record<string, number> = {};
    logs.forEach((l) => (counts[l.activityId] = (counts[l.activityId] || 0) + 1));
    const rm = latestRoadmap(childId);
    return Object.keys(counts).filter((k) => counts[k] >= 3 && rm?.items.some((i) => i.activityId === k && i.phase === rm.currentPhase && i.difficulty < 3));
  },
  async listReports(childId) {
    await wait();
    return clone(getDB().reports.filter((r) => r.childId === childId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async saveReport(report) {
    const db = getDB();
    db.reports = db.reports.filter((r) => r.id !== report.id);
    db.reports.push(clone(report));
    commit();
    return clone(report);
  },
  async myReplies() {
    await wait(150);
    const cg = myCaregiverRow();
    return clone(getDB().feedback.filter((f) => f.childId === cg.childId && f.therapistReply)).sort((a, b) => (b.repliedAt || "").localeCompare(a.repliedAt || ""));
  },
  async mySharedSummaries() {
    const cg = myCaregiverRow();
    // parents only ever see the approved parent summary, never the draft
    return clone(getDB().reports.filter((r) => r.childId === cg.childId && r.approvedAt && r.parentSummaryShared && r.parentSummary)).map((r) => ({
      ...r, draft: undefined as never, final: undefined,
    }));
  },
};

// ---------- AI (fake: returns the guide's example JSON after 1.5 s) ----------
export const aiService: AiService = {
  async draftPlanFromIntake(childId, inputs) {
    await wait(AI_DELAY);
    const child = getDB().children.find((c) => c.id === childId);
    const name = child?.nickname ?? "Rafi";
    const draft = clone(EXAMPLE_PLAN_DRAFT);
    draft.missing_info = draft.missing_info.map((q) => q.replace(/Rafi/g, name));
    const counts: Record<string, number> = {};
    inputs.forEach((i) => (counts[i.type] = (counts[i.type] || 0) + 1));
    draft.based_on = Object.entries(counts).map(([t, n]) => `${n} ${t === "text" ? "text note" : t === "voice" ? "voice note" : t}${n > 1 ? "s" : ""}`).join(", ") || draft.based_on;
    // never return an activity that isn't in the library
    const ids = new Set(ACTIVITIES.map((a) => a.id));
    draft.roadmap.phases.forEach((p) => (p.activity_ids = p.activity_ids.filter((id) => ids.has(id)).slice(0, 7)));
    return draft;
  },
  async processVoiceNote() {
    await wait(AI_DELAY);
    return {
      transcript: "আজ বাবল খেলার সময় রাফি দুইবার আমার দিকে তাকিয়ে 'আরো' বললো!",
      summary_en: "During bubbles, Rafi looked at mum twice and said 'more'.",
      summary_bn: "বাবল খেলায় রাফি দুইবার তাকিয়ে 'আরো' বলেছে।",
      flags: ["success"],
    };
  },
  async draftReport(childId, range) {
    await wait(AI_DELAY);
    const r = clone(EXAMPLE_REPORT);
    const fmt = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    r.period = `${fmt(range.from)} – ${fmt(range.to)}`;
    void childId;
    return r;
  },
};

// ---------- reminders ----------
const SLOT_TIME: Record<string, keyof Caregiver["routineTimes"]> = {
  morning: "wake", mealtime: "breakfast", bath_toilet: "bath", play: "play", outing: "play", bedtime: "bedtime", any: "lunch",
};

function buildReminders(includeDone: boolean): Reminder[] {
  const cg = myCaregiverRow();
  if (cg.pausedUntil && cg.pausedUntil >= today()) return [];
  const db = getDB();
  const child = db.children.find((c) => c.id === cg.childId)!;
  const rm = approvedRoadmap(cg.childId);
  if (!rm) return [];
  const t = today();
  const items = rm.items.filter((i) => i.phase === rm.currentPhase && i.active);
  const out: Reminder[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.activityId)) continue;
    seen.add(it.activityId);
    const done = db.logs.some((l) => l.planItemId === it.id && l.date === t);
    if (done && !includeDone) continue;
    const a = ACTIVITIES.find((x) => x.id === it.activityId);
    if (!a || a.domain === "caregiver_wellbeing") continue;
    const tpl = TEMPLATES[(out.length + new Date().getDate()) % TEMPLATES.length];
    const fill = (s: string, name: string, title: string) => s.replace(/\{child\}/g, name).replace(/\{activity\}/g, title);
    out.push({
      time: cg.routineTimes[SLOT_TIME[a.routine_slot]], activityId: a.id,
      text_bn: fill(tpl.text_bn, nameIn(child.nickname, "bn"), a.title_bn), text_en: fill(tpl.text_en, child.nickname, a.title_en),
    });
  }
  const q = cg.quietHours;
  return out
    .filter((r) => !(r.time >= q.from || r.time < q.to))
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, cg.remindersPerDay);
}

export const reminderService: ReminderService = {
  async getSchedule() {
    return buildReminders(false);
  },
  async previewReminders() {
    await wait(200);
    return buildReminders(false);
  },
  async pausePlan(days, reason) {
    const cg = myCaregiverRow();
    const d = new Date();
    d.setDate(d.getDate() + days - 1);
    cg.pausedUntil = dkey(d);
    cg.pauseReason = reason;
    commit();
    return clone(cg);
  },
  async resumePlan() {
    const cg = myCaregiverRow();
    delete cg.pausedUntil;
    delete cg.pauseReason;
    commit();
    return clone(cg);
  },
};

export type { Report, PlanItem };
