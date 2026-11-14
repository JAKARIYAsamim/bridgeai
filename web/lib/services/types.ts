// Service contracts. Phase 1 uses the mock versions; Phase 2 swaps in Supabase and Gemini
// behind these same method names, so screens don't change.
import type {
  Activity, ActivityFilters, ActivityLog, Alert, Caregiver, Centre, Checkin, Child, Feedback,
  IntakeInput, InviteCode, Lesson, Mood, ParentChildView, PlanDraft, PlanItem, Reminder, Report,
  ReportDraft, Role, Roadmap, Story, User,
} from "@/lib/types";

export type SignUpInput = {
  role: "therapist" | "admin";
  name: string;
  email: string;
  password: string;
  profession?: string;
  language: "en" | "bn";
  centreName?: string;
  city?: string;
  centreCode?: string;
  independent?: boolean;
};

export type JoinInput = {
  code: string;
  name: string;
  relation: Caregiver["relation"];
  contact: string;
  password: string;
};

export interface AuthService {
  signUp(input: SignUpInput): Promise<User>;
  logIn(email: string, password: string): Promise<User>;
  demoLogIn(role: Role): Promise<User>;
  logOut(): Promise<void>;
  currentUser(): Promise<User | null>;
  checkCode(code: string): Promise<{ child: ParentChildView; therapist: User; centre: Centre }>;
  joinWithCode(input: JoinInput): Promise<User>;
  updateUser(patch: Partial<User>): Promise<User>;
  getCentre(): Promise<Centre>;
  listUsers(role?: Role): Promise<User[]>;
}

export type NewChild = Pick<Child, "nickname" | "dob" | "ageBand" | "firstSessionDate"> &
  Partial<Pick<Child, "gender" | "caregiverName" | "caregiverPhone" | "sensoryFlags" | "safetyFlags" | "clinical">>;

export interface ChildService {
  listChildren(): Promise<Child[]>;
  getChild(id: string): Promise<Child>;
  /** Parent view: no clinical record. */
  getMyChild(): Promise<ParentChildView>;
  createChild(input: NewChild): Promise<Child>;
  updateChild(id: string, patch: Partial<Child>): Promise<Child>;
  createInviteCode(childId: string): Promise<InviteCode>;
  getCaregivers(childId: string): Promise<(Caregiver & { user: User })[]>;
  getMyCaregiver(): Promise<Caregiver>;
  updateMyCaregiver(patch: Partial<Caregiver>): Promise<Caregiver>;
}

export interface LibraryService {
  listActivities(filters?: ActivityFilters): Promise<Activity[]>;
  getActivity(id: string): Promise<Activity>;
  suggestActivities(childId: string): Promise<{ goalId: string; activityIds: string[] }[]>;
  listStories(): Promise<Story[]>;
  getStory(id: string): Promise<Story>;
  listLessons(): Promise<Lesson[]>;
}

export interface PlanService {
  /** Therapist: latest roadmap (draft or approved). Parent: approved only. */
  getRoadmap(childId: string): Promise<Roadmap | null>;
  saveDraft(childId: string, draft: PlanDraft, kept?: { goalIds: string[]; activityIds: string[] }): Promise<Roadmap>;
  approvePlan(childId: string, roadmap: Roadmap): Promise<Roadmap>;
  updatePlanItem(childId: string, itemId: string, patch: Partial<PlanItem> | null): Promise<Roadmap>;
  addPlanItem(childId: string, item: Omit<PlanItem, "id" | "roadmapId">): Promise<Roadmap>;
  publishChanges(childId: string, roadmap: Roadmap, summary: string): Promise<Roadmap>;
  /** Parent: today's active items for the current phase. */
  getToday(): Promise<{ item: PlanItem; activity: Activity; log?: ActivityLog }[]>;
}

export interface FeedbackService {
  logActivity(planItemId: string, mood: Mood): Promise<ActivityLog>;
  addFeedback(input: Omit<Feedback, "id" | "createdAt" | "caregiverId" | "childId" | "flags">): Promise<{ feedback: Feedback; alert: Alert | null }>;
  listFeedback(childId: string): Promise<Feedback[]>;
  reply(feedbackId: string, text?: string, mediaUrl?: string): Promise<Feedback>;
  markReviewed(feedbackId: string): Promise<Feedback>;
  saveCheckin(input: Omit<Checkin, "id" | "caregiverId" | "childId" | "date">): Promise<{ checkin: Checkin; alert: Alert | null }>;
  listCheckins(childId: string, days?: number): Promise<Checkin[]>;
  getTodayCheckin(): Promise<Checkin | null>;
  listLogs(childId: string, days?: number): Promise<ActivityLog[]>;
  readyForNextStep(childId: string): Promise<string[]>; // activity ids with 3+ happy this week
  listReports(childId: string): Promise<Report[]>;
  saveReport(report: Report): Promise<Report>;
  myReplies(): Promise<Feedback[]>;
  mySharedSummaries(): Promise<Report[]>;
}

export interface AiService {
  draftPlanFromIntake(childId: string, inputs: IntakeInput[], comment?: string): Promise<PlanDraft>;
  processVoiceNote(file: string): Promise<{ transcript: string; summary_en: string; summary_bn: string; flags: string[] }>;
  draftReport(childId: string, range: { from: string; to: string }): Promise<ReportDraft>;
}

export interface ReminderService {
  getSchedule(): Promise<Reminder[]>;
  previewReminders(): Promise<Reminder[]>;
  pausePlan(days: number, reason: string): Promise<Caregiver>;
  resumePlan(): Promise<Caregiver>;
}

export interface AlertService {
  checkText(text: string, childId: string, source: Alert["source"], sourceId?: string): Promise<Alert | null>;
  listAlerts(): Promise<Alert[]>;
  resolveAlert(id: string, note: string): Promise<Alert>;
}
