"use client";
// T-04 Review AI draft: accept, edit or remove profile, goals and roadmap; swap activities; regenerate; approve.
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { InviteModal } from "@/components/invite-modal";
import { Icon } from "@/components/legacy/icons";
import { LibraryDrawer } from "@/components/library-drawer";
import {
  AIDraftBanner,
  Button,
  Card,
  Chip,
  ErrorState,
  Modal,
  SkeletonList,
  StepLoader,
  useToast,
} from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { COMM_LEVELS, DOMAINS, SAFETY_FLAGS, SENSORY_FLAGS, SLOTS, num } from "@/lib/labels";
import { useLang } from "@/lib/i18n";
import { MAX_ACTIVE } from "@/lib/matching";
import { aiService, childService, libraryService, planService } from "@/lib/services";
import type { Activity, Child, Goal, PlanDraft, PlanItem, Roadmap } from "@/lib/types";

type Status = "pending" | "accepted" | "edited" | "removed";
type Profile = PlanDraft["profile"];
type ProfileKey = "age_band" | "comm_level" | "support_level" | "sensory_flags" | "safety_flags" | "strengths";

const PROFILE_ROWS: { key: ProfileKey; label_bn: string; label_en: string }[] = [
  { key: "age_band", label_bn: "বয়স সীমা", label_en: "Age band" },
  { key: "comm_level", label_bn: "যোগাযোগের স্তর", label_en: "Communication level" },
  { key: "support_level", label_bn: "সহায়তার স্তর (থেরাপিস্টদের জন্য)", label_en: "Support level (therapist only)" },
  { key: "sensory_flags", label_bn: "সংবেদনশীল বৈশিষ্ট্য", label_en: "Sensory flags" },
  { key: "safety_flags", label_bn: "নিরাপত্তা সতর্কতা", label_en: "Safety flags" },
  { key: "strengths", label_bn: "দক্ষতা ও পছন্দ", label_en: "Strengths" },
];

const flagLabel = (f: string, lang: "bn" | "en") => SENSORY_FLAGS[f]?.[lang] ?? SAFETY_FLAGS[f]?.[lang] ?? f;

function profileText(p: Profile, k: ProfileKey, lang: "bn" | "en"): string {
  switch (k) {
    case "age_band":
      return p.age_band;
    case "comm_level":
      return COMM_LEVELS[p.comm_level]?.[lang] ?? COMM_LEVELS[p.comm_level]?.en ?? p.comm_level;
    case "support_level":
      return p.support_level ? (lang === "bn" ? `স্তর ${num(p.support_level, "bn")}` : `Level ${p.support_level}`) : (lang === "bn" ? "নির্ধারিত নয়" : "Not set");
    case "sensory_flags":
      return p.sensory_flags.map((f) => flagLabel(f, lang)).join(", ") || (lang === "bn" ? "নেই" : "None");
    case "safety_flags":
      return p.safety_flags.map((f) => flagLabel(f, lang)).join(", ") || (lang === "bn" ? "নেই" : "None");
    case "strengths":
      return p.strengths.join(" · ") || (lang === "bn" ? "নেই" : "None");
  }
}

export default function ReviewDraft() {
  const { lang, L } = useLang();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const { data, loading, error, reload } = useLoad(async () => {
    const [child, roadmap, library] = await Promise.all([
      childService.getChild(id),
      planService.getRoadmap(id),
      libraryService.listActivities({ includeDrafts: true }),
    ]);
    return { child, roadmap, library };
  }, [id]);

  const [rm, setRm] = useState<Roadmap | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pStatus, setPStatus] = useState<Partial<Record<ProfileKey, Status>>>({});
  const [gStatus, setGStatus] = useState<Record<string, Status>>({});
  const [iStatus, setIStatus] = useState<Record<string, Status>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"1" | "2" | "3">("1");
  const [drawer, setDrawer] = useState<{
    mode: "read" | "assign";
    activityId?: string;
    swapItemId?: string;
    addPhase?: 1 | 2 | 3;
  } | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [working, setWorking] = useState<null | "regen" | "approve">(null);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [approved, setApproved] = useState(false);

  if (data && !rm && data.roadmap?.status === "draft") {
    setRm(data.roadmap);
    setProfile(data.roadmap.aiMeta?.profile ?? null);
  }

  useEffect(() => {
    if (!data || rm || approved) return;
    if (!data.roadmap || data.roadmap.status !== "draft") {
      router.replace(data.roadmap ? `/t/children/${id}` : `/t/children/${id}/intake`);
    }
  }, [data, rm, router, id, approved]);

  const lib = useMemo(() => new Map((data?.library ?? []).map((a) => [a.id, a])), [data]);
  const child = data?.child;

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }
  if (loading || !rm || !child) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <SkeletonList rows={5} />
      </div>
    );
  }

  if (working) {
    return (
      <div className="scroll softbg pad in" style={{ paddingTop: 48, textAlign: "center" }}>
        <StepLoader
          steps={
            working === "regen"
              ? (lang === "bn"
                  ? ["আপনার মন্তব্য পর্যালোচনা করা হচ্ছে", "পছন্দের আইটেমগুলো রাখা হচ্ছে", "বাকি অংশ নতুন করে তৈরি হচ্ছে"]
                  : ["Reading your comment", "Keeping your accepted items", "Redrafting the rest"])
              : (lang === "bn"
                  ? ["পরিকল্পনা সংরক্ষণ করা হচ্ছে", "প্রোফাইল আপডেট করা হচ্ছে"]
                  : ["Saving the plan", "Updating the profile"])
          }
        />
      </div>
    );
  }

  const phaseNum = Number(phase) as 1 | 2 | 3;
  const liveItems = (p: number) => rm.items.filter((i) => i.phase === p && iStatus[i.id] !== "removed");
  const goalById = (gid: string) => rm.goals.find((g) => g.id === gid);

  const editGoal = (gid: string, text: string) => {
    setRm({ ...rm, goals: rm.goals.map((g) => (g.id === gid ? { ...g, text, source: "therapist" } : g)) });
    setGStatus({ ...gStatus, [gid]: "edited" });
  };

  const swapTo = (itemId: string, a: Activity) => {
    setRm({ ...rm, items: rm.items.map((i) => (i.id === itemId ? { ...i, activityId: a.id, difficulty: 1 } : i)) });
    setIStatus({ ...iStatus, [itemId]: "edited" });
    toast(lang === "bn" ? `বদলানো হয়েছে: ${a.title_bn}` : `Swapped for ${a.title_en}`);
  };

  const addTo = (p: 1 | 2 | 3, a: Activity) => {
    if (liveItems(p).length >= MAX_ACTIVE) {
      setLimitMsg(L("আগে একটি বাদ দিন।", "Remove one first."));
      return;
    }
    const goal =
      a.domain === "caregiver_wellbeing"
        ? "caregiver"
        : rm.goals.find((g) => g.domain === a.domain)?.id ?? rm.goals[0]?.id ?? "caregiver";
    const item: PlanItem = {
      id: `pi_new_${Date.now()}`,
      roadmapId: rm.id,
      phase: p,
      goalId: goal,
      activityId: a.id,
      difficulty: 1,
      active: true,
    };
    setRm({ ...rm, items: [...rm.items, item] });
    setIStatus({ ...iStatus, [item.id]: "accepted" });
    toast(lang === "bn" ? `${a.title_bn} যোগ করা হয়েছে` : `${a.title_en} added`);
  };

  const regenerate = async () => {
    setRegenOpen(false);
    setWorking("regen");
    try {
      const keptGoals = rm.goals.filter((g) => gStatus[g.id] === "accepted" || gStatus[g.id] === "edited");
      const keptItems = rm.items.filter((i) => iStatus[i.id] === "accepted" || iStatus[i.id] === "edited");
      const draft = await aiService.draftPlanFromIntake(id, [], comment);
      const fresh = await planService.saveDraft(id, draft, {
        goalIds: keptGoals.map((g) => g.id),
        activityIds: keptItems.map((i) => i.id),
      });
      const keptGoalIds = new Set(keptGoals.map((g) => g.id));
      const keptItemIds = new Set(keptItems.map((i) => i.id));
      const merged: Roadmap = {
        ...fresh,
        goals: fresh.goals.map((g) => (keptGoalIds.has(g.id) ? keptGoals.find((k) => k.id === g.id)! : g)),
        items: [
          ...keptItems,
          ...fresh.items.filter(
            (i) =>
              !keptItemIds.has(i.id) &&
              !keptItems.some((k) => k.activityId === i.activityId && k.phase === i.phase)
          ),
        ],
      };
      setRm(merged);
      setGStatus(Object.fromEntries(keptGoals.map((g) => [g.id, gStatus[g.id]])));
      setIStatus(Object.fromEntries(keptItems.map((i) => [i.id, iStatus[i.id]])));
      setComment("");
      toast(lang === "bn" ? "নতুন খসড়া প্রস্তুত। সংরক্ষিত আইটেম অপরিবর্তিত রাখা হয়েছে।" : "New draft ready. Your accepted items were kept.");
    } catch (e) {
      toast(e instanceof Error ? e.message : (lang === "bn" ? "পুনরায় তৈরি করা যায়নি" : "Could not regenerate"));
    } finally {
      setWorking(null);
    }
  };

  const approve = async () => {
    setWorking("approve");
    try {
      const removedGoals = new Set(rm.goals.filter((g) => gStatus[g.id] === "removed").map((g) => g.id));
      const answered = Object.entries(answers).filter(([, a]) => a.trim());
      const final: Roadmap = {
        ...rm,
        goals: rm.goals.filter((g) => !removedGoals.has(g.id)),
        items: rm.items.filter((i) => iStatus[i.id] !== "removed" && !removedGoals.has(i.goalId)),
        changeLog: [
          ...rm.changeLog,
          ...answered.map(([q, a]) => ({
            at: new Date().toISOString(),
            by: "Therapist",
            text: `Answered: ${q} — ${a.trim()}`,
          })),
        ],
      };
      if (profile) {
        const keep = (k: ProfileKey) => pStatus[k] !== "removed";
        const patch: Partial<Child> = {
          sensoryFlags: keep("sensory_flags") ? profile.sensory_flags : child.sensoryFlags,
          safetyFlags: keep("safety_flags") ? profile.safety_flags : child.safetyFlags,
          strengths: keep("strengths") ? profile.strengths : child.strengths,
          clinical: {
            ...child.clinical,
            supportLevel: keep("support_level") ? profile.support_level : child.clinical.supportLevel,
          },
        };
        if (keep("comm_level")) patch.commLevel = profile.comm_level;
        await childService.updateChild(id, patch);
      }
      await planService.approvePlan(id, final);
      setApproved(true);
      toast(lang === "bn" ? `${child.nickname}-এর পরিকল্পনা চালু হয়েছে` : `${child.nickname}’s plan is live`);
      setInviteOpen(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : (lang === "bn" ? "অনুমোদন করা যায়নি" : "Could not approve"));
    } finally {
      setWorking(null);
    }
  };

  const missing = rm.aiMeta?.missing_info ?? [];

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 96 }}>
      <div className="bar" style={{ padding: "4px 8px 10px" }}>
        <Link href={`/t/children/${id}`} className="hbtn" aria-label="Back">
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            {L("পর্যালোচনা", "Review")}: {child.nickname}
          </h1>
          <p className="small">{L("এআই তৈরি খসড়া পরিকল্পনা", "AI draft plan")}</p>
        </div>
      </div>

      <div className="in">
        <AIDraftBanner approved={approved}>
          <span className="small">
            {L("উৎস: ", "Based on: ")}
            {rm.aiMeta?.based_on ?? L("আপনার নোট", "your notes")}
          </span>
        </AIDraftBanner>

        {/* Profile */}
        {profile && (
          <div style={{ marginTop: 14 }}>
            <div className="sec">
              <h2 className="h2">{L("প্রোফাইল", "Profile")}</h2>
            </div>
            <Card style={{ padding: 0 }}>
              {PROFILE_ROWS.map(({ key, label_bn, label_en }) => (
                <ProfileRow
                  key={key}
                  label={lang === "bn" ? label_bn : label_en}
                  status={pStatus[key] ?? "pending"}
                  text={profileText(profile, key, lang)}
                  onAccept={() => setPStatus({ ...pStatus, [key]: "accepted" })}
                  onRemove={() =>
                    setPStatus({ ...pStatus, [key]: pStatus[key] === "removed" ? "pending" : "removed" })
                  }
                  editor={(done) => (
                    <ProfileEditor
                      k={key}
                      profile={profile}
                      onSave={(p) => {
                        setProfile(p);
                        setPStatus({ ...pStatus, [key]: "edited" });
                        done();
                      }}
                    />
                  )}
                />
              ))}
            </Card>
          </div>
        )}

        {/* Goals */}
        <div style={{ marginTop: 16 }}>
          <div className="sec">
            <h2 className="h2">{L("লক্ষ্যসমূহ", "Goals")}</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rm.goals.map((g) => (
              <GoalRow
                key={g.id}
                goal={g}
                status={gStatus[g.id] ?? "pending"}
                onAccept={() => setGStatus({ ...gStatus, [g.id]: "accepted" })}
                onRemove={() =>
                  setGStatus({ ...gStatus, [g.id]: gStatus[g.id] === "removed" ? "pending" : "removed" })
                }
                onEdit={(t) => editGoal(g.id, t)}
              />
            ))}
          </div>
        </div>

        {/* 12-week roadmap */}
        <div style={{ marginTop: 16 }}>
          <div className="sec">
            <h2 className="h2">{L("১২ সপ্তাহের রোডম্যাপ", "12-week roadmap")}</h2>
            <span className="small">
              {lang === "bn" ? `ধাপে সর্বোচ্চ ${num(MAX_ACTIVE, "bn")}টি` : `Max ${MAX_ACTIVE} per phase`}
            </span>
          </div>

          <div className="seg" style={{ marginBottom: 10 }}>
            {(["1", "2", "3"] as const).map((p) => (
              <button
                key={p}
                className={phase === p ? "on" : ""}
                onClick={() => {
                  setPhase(p);
                  setLimitMsg(null);
                }}
                type="button"
              >
                {L("সপ্তাহ", "Weeks")} {p === "1" ? (lang === "bn" ? "১–৪" : "1–4") : p === "2" ? (lang === "bn" ? "৫–৮" : "5–8") : (lang === "bn" ? "৯–১২" : "9–12")} ({num(liveItems(Number(p)).length, lang)})
              </button>
            ))}
          </div>

          <Card>
            <p className="h3" style={{ marginBottom: 10 }}>
              {rm.phaseNames[phaseNum - 1]}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rm.items
                .filter((i) => i.phase === phaseNum)
                .map((i) => {
                  const a = lib.get(i.activityId);
                  const st = iStatus[i.id] ?? "pending";
                  const goal = goalById(i.goalId);
                  const title = a ? (lang === "bn" ? a.title_bn : a.title_en) : i.activityId;
                  return (
                    <div
                      key={i.id}
                      className="card"
                      style={{
                        padding: 10,
                        opacity: st === "removed" ? 0.45 : 1,
                        background: st === "accepted" || st === "edited" ? "rgba(52, 199, 89, 0.08)" : undefined,
                      }}
                    >
                      <button
                        className="grow"
                        style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", width: "100%", padding: 0 }}
                        onClick={() => a && setDrawer({ mode: "read", activityId: a.id })}
                        type="button"
                      >
                        <p className="h3" style={{ fontSize: 14, textDecoration: st === "removed" ? "line-through" : undefined, margin: 0 }}>
                          {title}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                          {a && <Chip tone="primary">{SLOTS[a.routine_slot]?.[lang] ?? SLOTS[a.routine_slot]?.en}</Chip>}
                          {a && <Chip>{DOMAINS[a.domain]?.[lang] ?? DOMAINS[a.domain]?.en}</Chip>}
                          <Chip>{lang === "bn" ? `ধাপ ${num(i.difficulty, "bn")}` : `Step ${i.difficulty}`}</Chip>
                          {st === "edited" && <span className="pill good">{L("বদলানো", "Swapped")}</span>}
                        </div>
                        {goal && <p className="small" style={{ marginTop: 4 }}>{L("উদ্দেশ্য: ", "for: ")}{goal.text}</p>}
                      </button>

                      <div style={{ display: "flex", gap: 6, marginTop: 8, borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                        {st !== "removed" && (
                          <Button
                            size="sm"
                            variant={st === "accepted" || st === "edited" ? "primary" : "soft"}
                            onClick={() => setIStatus({ ...iStatus, [i.id]: "accepted" })}
                            icon={<Icon name="check" />}
                          >
                            {L("গ্রহণ করুন", "Accept")}
                          </Button>
                        )}
                        {st !== "removed" && (
                          <Button
                            size="sm"
                            variant="soft"
                            onClick={() => setDrawer({ mode: "assign", swapItemId: i.id })}
                            icon={<Icon name="turn" />}
                          >
                            {L("বদলান", "Swap")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIStatus({ ...iStatus, [i.id]: st === "removed" ? "pending" : "removed" })}
                        >
                          {st === "removed" ? L("বাতিল ফিরিয়ে আনুন", "Undo") : L("বাদ দিন", "Remove")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div style={{ marginTop: 12 }}>
              <Button
                size="sm"
                variant="ghost"
                icon={<Icon name="spark" />}
                onClick={() => {
                  if (liveItems(phaseNum).length >= MAX_ACTIVE) {
                    setLimitMsg(L("আগে একটি বাদ দিন।", "Remove one first."));
                  } else {
                    setDrawer({ mode: "assign", addPhase: phaseNum });
                  }
                }}
              >
                {L("লাইব্রেরি থেকে যোগ করুন", "Add from library")}
              </Button>
              {limitMsg && <p className="err" style={{ marginTop: 4 }}>{limitMsg}</p>}
            </div>
          </Card>
        </div>

        {/* Missing information */}
        {missing.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="sec">
              <h2 className="h2">{L("অনুপস্থিত তথ্য", "Missing information")}</h2>
            </div>
            <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p className="small">
                {L(
                  "আপনার নোট থেকে এই তথ্যগুলো নিশ্চিত হওয়া যায়নি। এখনই উত্তর দিতে পারেন বা পরেও দিতে পারেন।",
                  "The AI couldn’t tell these from your notes. Answer now or leave for later."
                )}
              </p>
              {missing.map((q) => (
                <div key={q}>
                  <label className="small" style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>
                    {q}
                  </label>
                  <input
                    className="field"
                    placeholder={L("ঐচ্ছিক উত্তর", "Optional answer")}
                    value={answers[q] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                  />
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Action buttons */}
        {!approved && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
            <Button
              block
              size="lg"
              variant="primary"
              onClick={approve}
              icon={<Icon name="check" />}
            >
              {L("পরিকল্পনা অনুমোদন করুন", "Approve plan")}
            </Button>
            <Button
              block
              variant="soft"
              onClick={() => setRegenOpen(true)}
              icon={<Icon name="spark" />}
            >
              {L("মন্তব্য দিয়ে পুনরায় তৈরি করুন", "Regenerate with comment")}
            </Button>
          </div>
        )}
      </div>

      <Modal open={regenOpen} onClose={() => setRegenOpen(false)} title={L("মন্তব্য দিয়ে পুনরায় তৈরি", "Regenerate with a comment")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p className="small">
            {L(
              "গৃহীত ও সম্পাদিত বিষয়গুলো একই থাকবে। বাকিগুলো নতুন করে তৈরি হবে।",
              "Accepted and edited items stay. Everything else is redrafted."
            )}
          </p>
          <textarea
            autoFocus
            className="field"
            style={{ minHeight: 90, width: "100%", padding: 10, fontSize: 15 }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={L("যেমন: টয়লেট ব্যবহারের ওপর বেশি জোর দিন", "e.g. Focus more on toileting")}
          />
          <Button
            block
            variant="primary"
            onClick={regenerate}
            icon={<Icon name="spark" />}
          >
            {L("পুনরায় তৈরি করুন", "Regenerate")}
          </Button>
        </div>
      </Modal>

      {drawer && (
        <LibraryDrawer
          open
          onClose={() => setDrawer(null)}
          mode={drawer.mode}
          activityId={drawer.activityId}
          childName={child.nickname}
          initialFilters={(() => {
            const cur = drawer.swapItemId
              ? lib.get(rm.items.find((x) => x.id === drawer.swapItemId)?.activityId ?? "")
              : undefined;
            return { domain: cur?.domain, age_band: child.ageBand };
          })()}
          excludeIds={rm.items
            .filter((i) => i.phase === (drawer.addPhase ?? phaseNum) && iStatus[i.id] !== "removed")
            .map((i) => i.activityId)}
          assignLabel={drawer.swapItemId ? L("বদলান", "Swap in") : L("ধাপে যোগ করুন", "Add to phase")}
          onAssign={(a) => {
            if (drawer.swapItemId) swapTo(drawer.swapItemId, a);
            else if (drawer.addPhase) addTo(drawer.addPhase, a);
            setDrawer(null);
          }}
        />
      )}

      <InviteModal
        open={inviteOpen}
        childId={id}
        childName={child.nickname}
        onClose={() => {
          setInviteOpen(false);
          router.push(`/t/children/${id}`);
        }}
      />
    </div>
  );
}

// ---------- profile row & editor ----------
function ProfileRow({
  label,
  text,
  status,
  onAccept,
  onRemove,
  editor,
}: {
  label: string;
  text: string;
  status: Status;
  onAccept: () => void;
  onRemove: () => void;
  editor: (done: () => void) => ReactNode;
}) {
  const { L } = useLang();
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ padding: 12, borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div className="grow">
          <p className="small" style={{ fontWeight: 600, color: "var(--mute)" }}>{label}</p>
          <p className="sub" style={{ fontSize: 14, color: "var(--ink)", marginTop: 2 }}>{text}</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {status !== "removed" && (
            <Button
              size="sm"
              variant={status === "accepted" ? "primary" : "ghost"}
              onClick={onAccept}
              icon={<Icon name="check" />}
            />
          )}
          <Button size="sm" variant="ghost" onClick={() => setEditing(!editing)}>
            {L("বদলান", "Edit")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            icon={<Icon name="x" />}
          />
        </div>
      </div>
      {editing && <div style={{ marginTop: 8 }}>{editor(() => setEditing(false))}</div>}
    </div>
  );
}

function ProfileEditor({
  k,
  profile,
  onSave,
}: {
  k: ProfileKey;
  profile: Profile;
  onSave: (p: Profile) => void;
}) {
  const { L } = useLang();
  const [val, setVal] = useState(profile[k] ? String(profile[k]) : "");
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input
        className="field"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{ fontSize: 13, padding: 6 }}
      />
      <Button
        size="sm"
        variant="primary"
        onClick={() => {
          onSave({ ...profile, [k]: k === "support_level" ? Number(val) || null : val });
        }}
      >
        {L("সংরক্ষণ", "Save")}
      </Button>
    </div>
  );
}

// ---------- goal row ----------
function GoalRow({
  goal,
  status,
  onAccept,
  onRemove,
  onEdit,
}: {
  goal: Goal;
  status: Status;
  onAccept: () => void;
  onRemove: () => void;
  onEdit: (t: string) => void;
}) {
  const { lang, L } = useLang();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(goal.text);
  return (
    <Card style={{ padding: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <Chip tone="primary">{DOMAINS[goal.domain]?.[lang] ?? DOMAINS[goal.domain]?.en}</Chip>
        <div className="grow">
          {editing ? (
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <input
                className="field"
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ fontSize: 13, padding: 6 }}
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onEdit(text.trim());
                  setEditing(false);
                }}
              >
                {L("সংরক্ষণ", "Save")}
              </Button>
            </div>
          ) : (
            <p className="sub" style={{ fontSize: 14, color: "var(--ink)" }}>{goal.text}</p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
        {status !== "removed" && (
          <Button
            size="sm"
            variant={status === "accepted" ? "primary" : "soft"}
            onClick={onAccept}
            icon={<Icon name="check" />}
          >
            {L("গ্রহণ করুন", "Accept")}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setEditing(!editing)}>
          {L("বদলান", "Edit")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          {status === "removed" ? L("বাতিল ফিরিয়ে আনুন", "Undo") : L("বাদ দিন", "Remove")}
        </Button>
      </div>
    </Card>
  );
}
