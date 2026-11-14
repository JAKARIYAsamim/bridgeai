// Demo data — no real children. Built relative to today so the 14-day history always looks recent.
import type {
  ActivityLog, Alert, Caregiver, Centre, Checkin, Child, Feedback, Goal, InviteCode, Mood, PlanDraft,
  PlanItem, Report, ReportDraft, Roadmap, User,
} from "@/lib/types";

export type DB = {
  version: number;
  sessionUserId: string | null;
  centre: Centre;
  users: (User & { password: string })[];
  children: Child[];
  caregivers: Caregiver[];
  roadmaps: Roadmap[];
  logs: ActivityLog[];
  feedback: Feedback[];
  checkins: Checkin[];
  reports: Report[];
  alerts: Alert[];
  invites: InviteCode[];
  shownReminders: string[];
};

export const DB_VERSION = 3;

export const dkey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const daysAgo = (n: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};
const yearsAgo = (y: number, months = 0) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - y);
  d.setMonth(d.getMonth() - months);
  return dkey(d);
};

/** The example AI draft from the build guide (Flow 3). */
export const EXAMPLE_PLAN_DRAFT: PlanDraft = {
  profile: {
    age_band: "3-5",
    comm_level: "words_gestures",
    support_level: 2,
    sensory_flags: ["noise"],
    safety_flags: ["wanders_off"],
    strengths: ["Loves bubbles and music", "Good at matching shapes"],
  },
  goals: [
    { id: "g1", domain: "communication", text: "Asks for snacks and toys with a word or picture", evidence: "He pulls my hand to the fridge instead of asking" },
    { id: "g2", domain: "social", text: "Shares attention in a face-to-face game for 2 minutes", evidence: "Eye contact is brief but he smiles during bubbles" },
    { id: "g3", domain: "daily_living", text: "Washes hands with picture steps and less help", evidence: "Needs full help with handwashing" },
    { id: "g4", domain: "behaviour", text: "Moves between activities with fewer meltdowns", evidence: "Cries when TV time ends" },
  ],
  roadmap: {
    phases: [
      { name: "Weeks 1-4: Connect and build routines", goal_ids: ["g1", "g2", "g3"], activity_ids: ["COM-01", "SOC-01", "DLY-01", "SEN-02", "CGW-01"] },
      { name: "Weeks 5-8: Build skills", goal_ids: ["g1", "g2", "g4"], activity_ids: ["COM-02", "COM-03", "SOC-02", "BEH-01", "BEH-02", "CGW-01"] },
      { name: "Weeks 9-12: Use skills everywhere", goal_ids: ["g1", "g3", "g4"], activity_ids: ["COM-03", "PLY-01", "DLY-01", "BEH-02", "CGW-01"] },
    ],
  },
  missing_info: ["How does Rafi sleep at night?", "Does Rafi eat only a few foods?"],
  based_on: "1 voice note, 1 photo",
};

/** The example report from the build guide (Flow 6). */
export const EXAMPLE_REPORT: ReportDraft = {
  period: "Last 14 days",
  summary:
    "Rafi's family practised on 11 of 14 days. Bubble play and snack choices went best. Meltdowns were more frequent after nights of poor sleep.",
  completion: [
    { activity_id: "SOC-01", planned: 14, done: 12, top_mood: "happy" },
    { activity_id: "COM-01", planned: 14, done: 10, top_mood: "happy" },
    { activity_id: "DLY-01", planned: 14, done: 6, top_mood: "neutral" },
  ],
  patterns: ["3 of 4 high-meltdown days followed a poor night's sleep"],
  parent_quotes: [{ text: "He said 'bubble' twice today!", feedback_id: "f_102" }],
  concerns: ["Handwashing often stops at step 3 (soap)"],
  questions_for_visit: ["Is the soap step too hard? Try a pump bottle?", "Ask about the bedtime routine"],
};

const PHASE_NAMES: [string, string, string] = [
  "Weeks 1–4: Connect and build routines",
  "Weeks 5–8: Build skills",
  "Weeks 9–12: Use skills everywhere",
];

const DOMAIN_OF: Record<string, string> = {
  COM: "communication", SOC: "social", PLY: "imitation_play", SEN: "sensory", DLY: "daily_living",
  BEH: "behaviour", MOT: "motor", CGW: "caregiver_wellbeing",
};

/** Turn a plan draft into a roadmap; activities go under the goal with the same domain. */
export function roadmapFromDraft(childId: string, draft: PlanDraft, status: Roadmap["status"], id = `rm_${childId}_${Date.now()}`): Roadmap {
  const goals: Goal[] = draft.goals.map((g) => ({ ...g, childId, source: "ai" as const }));
  const items: PlanItem[] = [];
  draft.roadmap.phases.forEach((p, pi) => {
    p.activity_ids.forEach((aid, ai) => {
      const dom = DOMAIN_OF[aid.split("-")[0]];
      const goal =
        dom === "caregiver_wellbeing"
          ? "caregiver"
          : goals.find((g) => g.domain === dom && p.goal_ids.includes(g.id))?.id ??
            goals.find((g) => g.domain === dom)?.id ??
            goals.find((g) => g.domain === "behaviour")?.id ??
            p.goal_ids[0];
      items.push({ id: `pi_${pi + 1}_${ai}_${aid}`, roadmapId: id, phase: (pi + 1) as 1 | 2 | 3, goalId: goal, activityId: aid, difficulty: 1, active: true });
    });
  });
  return {
    id, childId, status, currentPhase: 1, phaseNames: PHASE_NAMES, goals, items, changeLog: [],
    aiMeta: { missing_info: draft.missing_info, based_on: draft.based_on, profile: draft.profile },
  };
}

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildSeed(): DB {
  const r = rand(42);
  const centre: Centre = { id: "c_hope", name: "Hope Therapy Centre", city: "Dhaka", code: "HOPE24", phone: "+8801700000000", whatsapp: "8801700000000" };
  const users: DB["users"] = [
    { id: "u_nasrin", role: "therapist", name: "Dr. Nasrin", email: "nasrin@hope.demo", password: "demo1234", centreId: centre.id, language: "en", profession: "Developmental paediatrician", phone: "+8801711111111" },
    { id: "u_ayesha", role: "parent", name: "Ayesha", email: "ayesha@family.demo", password: "demo1234", centreId: centre.id, language: "bn", phone: "+8801722222222" },
    { id: "u_karim", role: "parent", name: "Karim", email: "karim@family.demo", password: "demo1234", centreId: centre.id, language: "bn", phone: "+8801733333333" },
    { id: "u_farhana", role: "admin", name: "Farhana", email: "farhana@hope.demo", password: "demo1234", centreId: centre.id, language: "en" },
    { id: "u_tanvir", role: "therapist", name: "Tanvir Hasan", email: "tanvir@hope.demo", password: "demo1234", centreId: centre.id, language: "en", profession: "Speech therapist" },
    { id: "u_sadia", role: "therapist", name: "Sadia Rahman", email: "sadia@hope.demo", password: "demo1234", centreId: centre.id, language: "bn", profession: "Occupational therapist" },
    { id: "u_nabil_mum", role: "parent", name: "Shirin", email: "shirin@family.demo", password: "demo1234", centreId: centre.id, language: "bn" },
    { id: "u_tasnim_dad", role: "parent", name: "Habib", email: "habib@family.demo", password: "demo1234", centreId: centre.id, language: "bn" },
  ];

  const emptyClinical = { diagnosisNotes: "", assessments: [], coOccurring: "" };
  const children: Child[] = [
    {
      id: "rafi", centreId: centre.id, therapistId: "u_nasrin", nickname: "Rafi", dob: yearsAgo(4, 3), ageBand: "3_5", gender: "Boy",
      commLevel: "words_gestures", sensoryFlags: ["noise"], safetyFlags: ["wanders_off"], strengths: ["Loves bubbles and music", "Good at matching shapes"],
      firstSessionDate: dkey(daysAgo(28)), nextSessionDate: dkey(daysAgo(-3)), caregiverName: "Ayesha", caregiverPhone: "+8801722222222",
      clinical: {
        diagnosisNotes: "ASD, DSM-5-TR Level 2, with language impairment",
        assessments: [{ tool: "M-CHAT-R/F", date: dkey(daysAgo(40)), score: "11" }, { tool: "CARS-2", date: dkey(daysAgo(30)), score: "36" }],
        coOccurring: "None recorded",
        supportLevel: 2,
      },
      createdAt: daysAgo(28).toISOString(),
    },
    {
      id: "mitu", centreId: centre.id, therapistId: "u_nasrin", nickname: "Mitu", dob: yearsAgo(7, 2), ageBand: "6_9", gender: "Girl",
      sensoryFlags: [], safetyFlags: [], strengths: [], firstSessionDate: dkey(daysAgo(0)), nextSessionDate: dkey(daysAgo(-14)),
      caregiverName: "Rokeya", caregiverPhone: "+8801744444444", clinical: emptyClinical, createdAt: daysAgo(0, 9).toISOString(),
    },
    {
      id: "nabil", centreId: centre.id, therapistId: "u_tanvir", nickname: "Nabil", dob: yearsAgo(5), ageBand: "3_5", sensoryFlags: [], safetyFlags: [],
      strengths: [], firstSessionDate: dkey(daysAgo(50)), clinical: emptyClinical, createdAt: daysAgo(50).toISOString(),
    },
    {
      id: "tasnim", centreId: centre.id, therapistId: "u_sadia", nickname: "Tasnim", dob: yearsAgo(8), ageBand: "6_9", sensoryFlags: [], safetyFlags: [],
      strengths: [], firstSessionDate: dkey(daysAgo(70)), clinical: emptyClinical, createdAt: daysAgo(70).toISOString(),
    },
  ];

  const routine = { wake: "07:00", breakfast: "08:00", lunch: "13:00", bath: "11:00", play: "16:00", dinner: "20:00", bedtime: "21:30" };
  const caregivers: Caregiver[] = [
    { childId: "rafi", userId: "u_ayesha", relation: "mother", routineTimes: routine, remindersPerDay: 3, quietHours: { from: "22:00", to: "07:00" }, consent: { clinic: true, ai: true, video: true }, onboarded: true },
    { childId: "rafi", userId: "u_karim", relation: "father", routineTimes: routine, remindersPerDay: 1, quietHours: { from: "22:00", to: "07:00" }, consent: { clinic: true, ai: true, video: false }, onboarded: true },
    { childId: "nabil", userId: "u_nabil_mum", relation: "mother", routineTimes: routine, remindersPerDay: 2, quietHours: { from: "22:00", to: "07:00" }, consent: { clinic: true, ai: false, video: false }, onboarded: true },
    { childId: "tasnim", userId: "u_tasnim_dad", relation: "father", routineTimes: routine, remindersPerDay: 2, quietHours: { from: "22:00", to: "07:00" }, consent: { clinic: true, ai: true, video: false }, onboarded: true },
  ];

  const rafiPlan = roadmapFromDraft("rafi", EXAMPLE_PLAN_DRAFT, "approved", "rm_rafi");
  rafiPlan.approvedAt = daysAgo(27).toISOString();
  rafiPlan.changeLog = [{ at: daysAgo(27).toISOString(), by: "Dr. Nasrin", text: "Approved plan from smart intake" }];
  const nabilPlan = roadmapFromDraft("nabil", EXAMPLE_PLAN_DRAFT, "approved", "rm_nabil");
  nabilPlan.approvedAt = daysAgo(49).toISOString();
  const tasnimPlan = roadmapFromDraft("tasnim", EXAMPLE_PLAN_DRAFT, "approved", "rm_tasnim");
  tasnimPlan.approvedAt = daysAgo(69).toISOString();

  // 14 days of history for Rafi (not today, so the demo can log today).
  const p1 = rafiPlan.items.filter((i) => i.phase === 1);
  const target: Record<string, number> = { "SOC-01": 12, "COM-01": 10, "DLY-01": 6, "SEN-02": 7, "CGW-01": 5 };
  const skipDays = new Set([4, 9, 12]);
  const logs: ActivityLog[] = [];
  for (const it of p1) {
    let left = target[it.activityId] ?? 5;
    for (let d = 1; d <= 14 && left > 0; d++) {
      if (skipDays.has(d)) continue;
      if (r() < left / (15 - d)) {
        const mood: Mood =
          it.activityId === "DLY-01" ? (r() < 0.6 ? "neutral" : r() < 0.5 ? "happy" : "sad") : it.activityId === "SOC-01" && d <= 6 ? "happy" : r() < 0.75 ? "happy" : "neutral";
        logs.push({ id: `l_${it.activityId}_${d}`, childId: "rafi", planItemId: it.id, activityId: it.activityId, caregiverId: d % 3 === 0 ? "u_karim" : "u_ayesha", date: dkey(daysAgo(d)), mood, createdAt: daysAgo(d, 17).toISOString() });
        left--;
      }
    }
  }
  // Nabil logs a few, Tasnim nothing for 9 days (shows on centre admin).
  for (let d = 1; d <= 6; d++) logs.push({ id: `l_nabil_${d}`, childId: "nabil", planItemId: nabilPlan.items[0].id, activityId: nabilPlan.items[0].activityId, caregiverId: "u_nabil_mum", date: dkey(daysAgo(d)), mood: "happy", createdAt: daysAgo(d).toISOString() });
  logs.push({ id: "l_tasnim_9", childId: "tasnim", planItemId: tasnimPlan.items[0].id, activityId: tasnimPlan.items[0].activityId, caregiverId: "u_tasnim_dad", date: dkey(daysAgo(9)), mood: "neutral", createdAt: daysAgo(9).toISOString() });

  const poorSleep = new Set([2, 5, 8, 11]);
  const checkins: Checkin[] = [];
  for (let d = 1; d <= 14; d++) {
    if (skipDays.has(d)) continue;
    const poor = poorSleep.has(d);
    checkins.push({
      id: `ck_${d}`, childId: "rafi", caregiverId: "u_ayesha", date: dkey(daysAgo(d)),
      mood: poor ? "sad" : r() < 0.6 ? "happy" : "neutral",
      sleep: poor ? "poor" : r() < 0.6 ? "good" : "ok",
      meals: r() < 0.5 ? "well" : "some",
      meltdowns: poor && d !== 11 ? "many" : d === 7 ? "many" : r() < 0.6 ? "none" : "few",
    });
  }

  const it = (aid: string) => p1.find((i) => i.activityId === aid)!;
  const feedback: Feedback[] = [
    { id: "f_101", childId: "rafi", activityId: "SOC-01", caregiverId: "u_ayesha", type: "voice", mediaUrl: "/demo/voice-1.wav", transcript: "আজ রাফি তিনবার আমার মুখের দিকে তাকিয়ে আরও বাবল চাইলো। খুব হাসছিল।", summary_en: "Rafi looked at mum's face three times to ask for more bubbles and laughed a lot.", summary_bn: "রাফি তিনবার তাকিয়ে আরও বাবল চেয়েছে, অনেক হেসেছে।", flags: ["success"], therapistReply: "Wonderful! Keep the 5-second wait — it's working.", repliedAt: daysAgo(1, 19).toISOString(), reviewedAt: daysAgo(1, 19).toISOString(), createdAt: daysAgo(1, 17).toISOString(), logId: `l_SOC-01_1` },
    { id: "f_102", childId: "rafi", activityId: "COM-01", caregiverId: "u_ayesha", type: "text", text: "He said 'bubble' twice today!", flags: ["success"], createdAt: daysAgo(2, 13).toISOString() },
    { id: "f_103", childId: "rafi", activityId: "DLY-01", caregiverId: "u_karim", type: "voice", mediaUrl: "/demo/voice-2.wav", transcript: "সাবানের ধাপে এসে ও থেমে যায়, সাবান ধরতে চায় না। তারপর কান্না শুরু করলো।", summary_en: "Handwashing stops at the soap step; Rafi won't touch the soap and then cries.", summary_bn: "সাবানের ধাপে থেমে যায়, তারপর কাঁদে।", flags: ["refused", "upset"], createdAt: daysAgo(3, 11).toISOString() },
    { id: "f_104", childId: "rafi", activityId: "SEN-02", caregiverId: "u_ayesha", type: "photo", mediaUrl: "/demo/photo-1.svg", text: "The noise picture on the kitchen wall", flags: [], reviewedAt: daysAgo(4).toISOString(), createdAt: daysAgo(5, 9).toISOString() },
    { id: "f_105", childId: "rafi", activityId: "CGW-01", caregiverId: "u_ayesha", type: "voice", mediaUrl: "/demo/voice-3.wav", transcript: "আজ খুব ক্লান্ত লাগছিল, শ্বাসের ব্যায়ামটা করে একটু ভালো লাগলো।", summary_en: "Mum felt very tired today; the breathing exercise helped a little.", summary_bn: "মা খুব ক্লান্ত ছিলেন, শ্বাসের ব্যায়ামে একটু ভালো লেগেছে।", flags: ["caregiver_stress"], createdAt: daysAgo(6, 21).toISOString() },
    { id: "f_106", childId: "rafi", activityId: "COM-01", caregiverId: "u_karim", type: "photo", mediaUrl: "/demo/photo-2.svg", text: "Two snacks on the table — he pointed at the biscuit", flags: ["success"], createdAt: daysAgo(8, 16).toISOString() },
  ];
  void it;

  const alerts: Alert[] = [
    { id: "a_1", childId: "rafi", source: "feedback", sourceId: "f_old", matchedText: "He banged his head on the door when the TV went off.", keyword: "banging his head", createdAt: daysAgo(10, 20).toISOString(), resolvedAt: daysAgo(10, 21).toISOString(), resolutionNote: "Called Ayesha. Small bump, no injury. Talked through the two-minute warning." },
  ];

  const reports: Report[] = [
    {
      id: "r_1", childId: "rafi", periodStart: dkey(daysAgo(28)), periodEnd: dkey(daysAgo(15)),
      draft: { ...EXAMPLE_REPORT, period: "First two weeks", summary: "Rafi's family practised on 9 of 14 days while settling into the plan. Bubble play was the clear favourite.", patterns: ["Practice happened most often in the afternoon play slot (8 of 9 days)"], concerns: ["Snack choice: Rafi grabs both snacks"], questions_for_visit: ["Hold snacks further apart?"] },
      createdAt: daysAgo(15).toISOString(), approvedAt: daysAgo(14).toISOString(),
      parentSummary: "রাফির পরিবার দুই সপ্তাহে ৯ দিন অনুশীলন করেছে। বাবল খেলা রাফির সবচেয়ে প্রিয়। চমৎকার শুরু!",
      parentSummaryShared: true,
    },
  ];
  reports[0].final = reports[0].draft;

  const invites: InviteCode[] = [{ code: "482915", childId: "rafi", createdBy: "u_nasrin", expiresAt: daysAgo(-7).toISOString() }];

  return {
    version: DB_VERSION, sessionUserId: null, centre, users, children, caregivers,
    roadmaps: [rafiPlan, nabilPlan, tasnimPlan], logs, feedback, checkins, reports, alerts, invites, shownReminders: [],
  };
}
