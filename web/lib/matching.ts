// The 7 activity matching rules from the build guide. Used by "Suggest activities" (no AI)
// and to check AI drafts. Pure functions, no data access.
import type { Activity, AgeBand, Child, CommLevel, Goal, PlanItem } from "@/lib/types";

export const MAX_ACTIVE = 7;
const COMM_ORDER: CommLevel[] = ["preverbal", "words_gestures", "phrases", "conversational"];

export function commCompatible(card: Activity, level?: CommLevel): boolean {
  if (!level) return true;
  if (card.comm_levels.includes(level)) return true;
  if (level === "aac") return card.comm_levels.includes("aac");
  const i = COMM_ORDER.indexOf(level);
  return card.comm_levels.some((l) => Math.abs(COMM_ORDER.indexOf(l) - i) === 1);
}

export function ageCompatible(card: Activity, band: AgeBand): boolean {
  return card.age_bands.includes(band) || card.age_bands.includes("parent");
}

/** Rule 3: hard conflicts exclude; some flags only add a note. */
export function flagNote(card: Activity, child: Pick<Child, "sensoryFlags" | "safetyFlags">): string | null {
  const flags = [...child.sensoryFlags, ...child.safetyFlags];
  if (card.conflicts_with_flags.includes("food_allergy") && flags.includes("food_allergy")) return "Food card: check allergy before use";
  if (card.routine_slot === "outing" && flags.includes("wanders_off")) return "Indoor only: wanders off";
  return null;
}
export function isExcluded(card: Activity, child: Pick<Child, "sensoryFlags" | "safetyFlags">): boolean {
  const flags = [...child.sensoryFlags, ...child.safetyFlags];
  return card.conflicts_with_flags.some((f) => f !== "food_allergy" && f !== "wanders_off" && flags.includes(f));
}

export function eligible(card: Activity, child: Child, goals: Goal[]): boolean {
  if (card.status !== "reviewed") return false;
  if (card.domain !== "caregiver_wellbeing" && !goals.some((g) => g.domain === card.domain)) return false; // rule 1
  if (!ageCompatible(card, child.ageBand)) return false; // rule 2
  if (!commCompatible(card, child.commLevel)) return false; // rule 2
  if (isExcluded(card, child)) return false; // rule 3
  return true;
}

/**
 * Fill goals that have no active activity in the given phase.
 * Rules 4 (max 2 per slot, "any" excluded), 5 (start at step 1 — caller sets difficulty 1),
 * 6 (always one CGW card), 7 (max 7 active).
 */
export function suggest(
  child: Child,
  goals: Goal[],
  library: Activity[],
  existing: Pick<PlanItem, "activityId" | "goalId" | "active">[],
): { goalId: string; activityIds: string[] }[] {
  const active = existing.filter((i) => i.active);
  const used = new Set(active.map((i) => i.activityId));
  const slotCount: Record<string, number> = {};
  const byId = new Map(library.map((a) => [a.id, a]));
  for (const i of active) {
    const s = byId.get(i.activityId)?.routine_slot;
    if (s) slotCount[s] = (slotCount[s] || 0) + 1;
  }
  let count = active.length;
  const out: { goalId: string; activityIds: string[] }[] = [];
  const fits = (a: Activity) => a.routine_slot === "any" || (slotCount[a.routine_slot] || 0) < 2;
  const take = (a: Activity) => {
    used.add(a.id);
    slotCount[a.routine_slot] = (slotCount[a.routine_slot] || 0) + 1;
    count++;
  };

  for (const g of goals) {
    if (count >= MAX_ACTIVE) break;
    if (active.some((i) => i.goalId === g.id)) continue;
    const pick = library.find((a) => a.domain === g.domain && !used.has(a.id) && eligible(a, child, goals) && fits(a));
    if (pick) {
      take(pick);
      out.push({ goalId: g.id, activityIds: [pick.id] });
    }
  }
  const hasCgw = [...used].some((id) => byId.get(id)?.domain === "caregiver_wellbeing");
  if (!hasCgw && count < MAX_ACTIVE) {
    const cgw = library.find((a) => a.domain === "caregiver_wellbeing" && a.status === "reviewed");
    if (cgw) {
      take(cgw);
      out.push({ goalId: "caregiver", activityIds: [cgw.id] });
    }
  }
  return out;
}

export function ageBandFromDob(dob: string, today = new Date()): AgeBand {
  const d = new Date(dob);
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  if (age < 3) return "under_3";
  if (age <= 5) return "3_5";
  if (age <= 9) return "6_9";
  return "10_plus";
}
