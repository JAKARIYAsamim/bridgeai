// Shared domain types for BridgeAI. Screens and services both use these.
// Parent screens receive ParentChildView, which has no clinical fields.

export type Role = "therapist" | "parent" | "admin";
export type Lang = "bn" | "en";

export type Domain =
  | "communication"
  | "social"
  | "imitation_play"
  | "sensory"
  | "daily_living"
  | "behaviour"
  | "motor"
  | "early_learning"
  | "caregiver_wellbeing";

export type RoutineSlot = "morning" | "mealtime" | "bath_toilet" | "play" | "outing" | "bedtime" | "any";
export type AgeBand = "under_3" | "3_5" | "6_9" | "10_plus";
export type CommLevel = "preverbal" | "words_gestures" | "phrases" | "conversational" | "aac";
export type Difficulty = 1 | 2 | 3;
export type Mood = "happy" | "neutral" | "sad";
export type MediaType = "voice" | "photo" | "video" | "text";

export type User = {
  id: string;
  role: Role;
  name: string;
  email: string;
  centreId: string;
  language: Lang;
  profession?: string;
  phone?: string;
};

export type Centre = { id: string; name: string; city: string; code: string; phone: string; whatsapp: string };

export type Assessment = { tool: string; date: string; score: string };

/** Therapist-only data. Never sent to parent screens. */
export type ClinicalRecord = {
  diagnosisNotes: string;
  assessments: Assessment[];
  coOccurring: string;
  supportLevel?: 1 | 2 | 3;
};

export type Child = {
  id: string;
  centreId: string;
  therapistId: string;
  nickname: string;
  dob: string; // ISO date
  ageBand: AgeBand;
  gender?: string;
  commLevel?: CommLevel;
  sensoryFlags: string[]; // noise, touch, light, food_textures
  safetyFlags: string[]; // wanders_off, mouthing, self_injury, seizures, food_allergy
  strengths: string[];
  firstSessionDate: string;
  nextSessionDate?: string;
  caregiverName?: string;
  caregiverPhone?: string;
  clinical: ClinicalRecord;
  createdAt: string;
};

/** What a parent may see about a child. */
export type ParentChildView = Omit<Child, "clinical">;

export type Caregiver = {
  childId: string;
  userId: string;
  relation: "mother" | "father" | "grandparent" | "other";
  routineTimes: Record<"wake" | "breakfast" | "lunch" | "bath" | "play" | "dinner" | "bedtime", string>;
  remindersPerDay: 1 | 2 | 3;
  quietHours: { from: string; to: string };
  pausedUntil?: string;
  pauseReason?: string;
  consent: { clinic: boolean; ai: boolean; video: boolean };
  onboarded: boolean;
};

export type ActivityStep = { text_bn: string; text_en: string; image: string };

export type Activity = {
  id: string;
  title_en: string;
  title_bn: string;
  domain: Domain;
  routine_slot: RoutineSlot;
  age_bands: (AgeBand | "parent")[];
  comm_levels: CommLevel[];
  difficulty: Difficulty;
  minutes: number;
  why_bn: string;
  why_en: string;
  needs_bn: string[];
  needs_en: string[];
  steps: ActivityStep[];
  success_bn: string;
  success_en: string;
  if_upset_bn: string;
  if_upset_en: string;
  video_url?: string;
  safety_note_bn: string;
  safety_note_en: string;
  conflicts_with_flags: string[];
  evidence: string[];
  status: "draft" | "reviewed" | "archived";
  version: number;
  cover: string;
};

export type ActivityFilters = {
  domain?: Domain;
  routine_slot?: RoutineSlot;
  age_band?: AgeBand;
  comm_level?: CommLevel;
  difficulty?: Difficulty;
  search?: string;
  includeDrafts?: boolean;
};

export type Goal = {
  id: string;
  childId: string;
  domain: Domain;
  text: string;
  text_bn?: string;
  evidence: string | null;
  source: "ai" | "therapist";
};

export type PlanItem = {
  id: string;
  roadmapId: string;
  phase: 1 | 2 | 3;
  goalId: string;
  activityId: string;
  difficulty: Difficulty;
  active: boolean;
};

export type ChangeLogEntry = { at: string; by: string; text: string };

export type Roadmap = {
  id: string;
  childId: string;
  status: "draft" | "approved";
  approvedAt?: string;
  currentPhase: 1 | 2 | 3;
  phaseNames: [string, string, string];
  goals: Goal[];
  items: PlanItem[];
  changeLog: ChangeLogEntry[];
  /** From the AI draft; shown on the review screen (therapist only). */
  aiMeta?: { missing_info: string[]; based_on: string; profile: PlanDraft["profile"] };
};

/** The shape the AI (fake or real) returns for smart intake. */
export type PlanDraft = {
  profile: {
    age_band: string;
    comm_level: CommLevel;
    support_level?: 1 | 2 | 3;
    sensory_flags: string[];
    safety_flags: string[];
    strengths: string[];
  };
  goals: { id: string; domain: Domain; text: string; evidence: string | null }[];
  roadmap: { phases: { name: string; goal_ids: string[]; activity_ids: string[] }[] };
  missing_info: string[];
  based_on: string;
};

export type IntakeInput = { id: string; type: MediaType; label: string; url?: string; text?: string; seconds?: number };

export type ActivityLog = {
  id: string;
  childId: string;
  planItemId: string;
  activityId: string;
  caregiverId: string;
  date: string; // YYYY-MM-DD
  mood: Mood;
  createdAt: string;
};

export type Feedback = {
  id: string;
  childId: string;
  logId?: string;
  activityId?: string;
  caregiverId: string;
  type: MediaType;
  mediaUrl?: string;
  text?: string;
  transcript?: string;
  summary_en?: string;
  summary_bn?: string;
  flags: string[];
  therapistReply?: string;
  therapistReplyMediaUrl?: string;
  repliedAt?: string;
  reviewedAt?: string;
  createdAt: string;
};

export type Checkin = {
  id: string;
  childId: string;
  caregiverId: string;
  date: string;
  mood: Mood;
  sleep: "good" | "ok" | "poor";
  meals: "well" | "some" | "little";
  meltdowns: "none" | "few" | "many";
  voiceUrl?: string;
  note?: string;
};

export type ReportDraft = {
  period: string;
  summary: string;
  completion: { activity_id: string; planned: number; done: number; top_mood: Mood }[];
  patterns: string[];
  parent_quotes: { text: string; feedback_id: string }[];
  concerns: string[];
  questions_for_visit: string[];
};

export type Report = {
  id: string;
  childId: string;
  periodStart: string;
  periodEnd: string;
  draft: ReportDraft;
  final?: ReportDraft;
  parentSummary?: string;
  parentSummaryShared?: boolean;
  approvedAt?: string;
  createdAt: string;
};

export type Alert = {
  id: string;
  childId: string;
  source: "feedback" | "checkin" | "voice_note";
  sourceId?: string;
  matchedText: string;
  keyword: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
};

export type InviteCode = { code: string; childId: string; createdBy: string; expiresAt: string; usedBy?: string };

export type ReminderTemplate = { id: string; text_bn: string; text_en: string };
export type Reminder = { time: string; activityId: string; text_bn: string; text_en: string };

export type StoryPage = { text_bn: string; text_en: string; emoji: string; tint: string };
export type Story = { id: string; title_bn: string; title_en: string; cover: string; pages: StoryPage[] };

export type Lesson = {
  id: string;
  n: number;
  title_bn: string;
  title_en: string;
  tips: { emoji: string; text_bn: string; text_en: string }[];
};
