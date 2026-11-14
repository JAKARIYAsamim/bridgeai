"use client";
// T-04 Review AI draft: accept, edit or remove profile, goals and roadmap; swap activities; regenerate; approve.
import { Check, MessageSquareQuote, Pencil, Plus, RefreshCw, Repeat2, Sparkles, Trash2, Undo2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { InviteModal } from "@/components/invite-modal";
import { LibraryDrawer } from "@/components/library-drawer";
import {
  AIDraftBanner, Button, Card, Chip, cx, ErrorState, inputCls, Modal, PageTitle, SectionTitle, Segmented, SkeletonList, StepLoader, useToast,
} from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { AGE_BANDS, COMM_LEVELS, DOMAINS, SAFETY_FLAGS, SENSORY_FLAGS, SLOTS } from "@/lib/labels";
import { MAX_ACTIVE } from "@/lib/matching";
import { aiService, childService, libraryService, planService } from "@/lib/services";
import type { Activity, Child, CommLevel, Goal, PlanDraft, PlanItem, Roadmap } from "@/lib/types";

type Status = "pending" | "accepted" | "edited" | "removed";
type Profile = PlanDraft["profile"];
type ProfileKey = "age_band" | "comm_level" | "support_level" | "sensory_flags" | "safety_flags" | "strengths";

const PROFILE_ROWS: { key: ProfileKey; label: string }[] = [
  { key: "age_band", label: "Age band" },
  { key: "comm_level", label: "Communication level" },
  { key: "support_level", label: "Support level (optional, therapist only)" },
  { key: "sensory_flags", label: "Sensory flags" },
  { key: "safety_flags", label: "Safety flags" },
  { key: "strengths", label: "Strengths" },
];

const flagLabel = (f: string) => SENSORY_FLAGS[f] ?? SAFETY_FLAGS[f] ?? f;

function profileText(p: Profile, k: ProfileKey): string {
  switch (k) {
    case "age_band": return p.age_band;
    case "comm_level": return COMM_LEVELS[p.comm_level]?.en ?? p.comm_level;
    case "support_level": return p.support_level ? `Level ${p.support_level}` : "Not set";
    case "sensory_flags": return p.sensory_flags.map(flagLabel).join(", ") || "None";
    case "safety_flags": return p.safety_flags.map(flagLabel).join(", ") || "None";
    case "strengths": return p.strengths.join(" · ") || "None";
  }
}

export default function ReviewDraft() {
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
  const [drawer, setDrawer] = useState<{ mode: "read" | "assign"; activityId?: string; swapItemId?: string; addPhase?: 1 | 2 | 3 } | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [working, setWorking] = useState<null | "regen" | "approve">(null);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [approved, setApproved] = useState(false);

  // initialise local edit state once the draft loads (state derived during render)
  if (data && !rm && data.roadmap?.status === "draft") {
    setRm(data.roadmap);
    setProfile(data.roadmap.aiMeta?.profile ?? null);
  }
  // no draft to review: send the therapist somewhere useful
  useEffect(() => {
    if (!data || rm || approved) return;
    if (!data.roadmap || data.roadmap.status !== "draft") router.replace(data.roadmap ? `/t/children/${id}` : `/t/children/${id}/intake`);
  }, [data, rm, router, id, approved]);

  const lib = useMemo(() => new Map((data?.library ?? []).map((a) => [a.id, a])), [data]);
  const child = data?.child;

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !rm || !child) return <SkeletonList rows={5} />;

  if (working)
    return (
      <div className="py-16">
        <StepLoader steps={working === "regen" ? ["Reading your comment", "Keeping your accepted items", "Redrafting the rest"] : ["Saving the plan", "Updating the profile"]} />
      </div>
    );

  const phaseNum = Number(phase) as 1 | 2 | 3;
  const liveItems = (p: number) => rm.items.filter((i) => i.phase === p && iStatus[i.id] !== "removed");
  const goalById = (gid: string) => rm.goals.find((g) => g.id === gid);

  // ----- goal actions -----
  const editGoal = (gid: string, text: string) => {
    setRm({ ...rm, goals: rm.goals.map((g) => (g.id === gid ? { ...g, text, source: "therapist" } : g)) });
    setGStatus({ ...gStatus, [gid]: "edited" });
  };

  // ----- item actions -----
  const swapTo = (itemId: string, a: Activity) => {
    setRm({ ...rm, items: rm.items.map((i) => (i.id === itemId ? { ...i, activityId: a.id, difficulty: 1 } : i)) });
    setIStatus({ ...iStatus, [itemId]: "edited" });
    toast(`Swapped for ${a.title_en}`);
  };
  const addTo = (p: 1 | 2 | 3, a: Activity) => {
    if (liveItems(p).length >= MAX_ACTIVE) {
      setLimitMsg("Remove one first.");
      return;
    }
    const goal = a.domain === "caregiver_wellbeing" ? "caregiver" : rm.goals.find((g) => g.domain === a.domain)?.id ?? rm.goals[0]?.id ?? "caregiver";
    const item: PlanItem = { id: `pi_new_${Date.now()}`, roadmapId: rm.id, phase: p, goalId: goal, activityId: a.id, difficulty: 1, active: true };
    setRm({ ...rm, items: [...rm.items, item] });
    setIStatus({ ...iStatus, [item.id]: "accepted" });
    toast(`${a.title_en} added`);
  };

  // ----- regenerate: keep accepted/edited, redraft the rest -----
  const regenerate = async () => {
    setRegenOpen(false);
    setWorking("regen");
    try {
      const keptGoals = rm.goals.filter((g) => gStatus[g.id] === "accepted" || gStatus[g.id] === "edited");
      const keptItems = rm.items.filter((i) => iStatus[i.id] === "accepted" || iStatus[i.id] === "edited");
      const draft = await aiService.draftPlanFromIntake(id, [], comment);
      const fresh = await planService.saveDraft(id, draft, { goalIds: keptGoals.map((g) => g.id), activityIds: keptItems.map((i) => i.id) });
      const keptGoalIds = new Set(keptGoals.map((g) => g.id));
      const keptItemIds = new Set(keptItems.map((i) => i.id));
      const merged: Roadmap = {
        ...fresh,
        goals: fresh.goals.map((g) => (keptGoalIds.has(g.id) ? keptGoals.find((k) => k.id === g.id)! : g)),
        items: [
          ...keptItems,
          ...fresh.items.filter((i) => !keptItemIds.has(i.id) && !keptItems.some((k) => k.activityId === i.activityId && k.phase === i.phase)),
        ],
      };
      setRm(merged);
      setGStatus(Object.fromEntries(keptGoals.map((g) => [g.id, gStatus[g.id]])));
      setIStatus(Object.fromEntries(keptItems.map((i) => [i.id, iStatus[i.id]])));
      setComment("");
      toast("New draft ready. Your accepted items were kept.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not regenerate");
    } finally {
      setWorking(null);
    }
  };

  // ----- approve -----
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
          ...answered.map(([q, a]) => ({ at: new Date().toISOString(), by: "Therapist", text: `Answered: ${q} — ${a.trim()}` })),
        ],
      };
      if (profile) {
        const keep = (k: ProfileKey) => pStatus[k] !== "removed";
        const patch: Partial<Child> = {
          sensoryFlags: keep("sensory_flags") ? profile.sensory_flags : child.sensoryFlags,
          safetyFlags: keep("safety_flags") ? profile.safety_flags : child.safetyFlags,
          strengths: keep("strengths") ? profile.strengths : child.strengths,
          clinical: { ...child.clinical, supportLevel: keep("support_level") ? profile.support_level : child.clinical.supportLevel },
        };
        if (keep("comm_level")) patch.commLevel = profile.comm_level;
        await childService.updateChild(id, patch);
      }
      await planService.approvePlan(id, final);
      setApproved(true);
      toast(`${child.nickname}'s plan is live`);
      setInviteOpen(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not approve");
    } finally {
      setWorking(null);
    }
  };

  const missing = rm.aiMeta?.missing_info ?? [];

  return (
    <div className="mx-auto max-w-4xl pb-28">
      <PageTitle title={`Review ${child.nickname}'s draft plan`} sub="Accept, edit or remove each part. Nothing reaches the family until you approve." />
      <AIDraftBanner approved={approved}>
        <span className="text-xs font-medium">Based on: {rm.aiMeta?.based_on ?? "your notes"}</span>
      </AIDraftBanner>

      {/* Profile */}
      {profile && (
        <>
          <SectionTitle>Profile</SectionTitle>
          <Card className="divide-y divide-line p-0">
            {PROFILE_ROWS.map(({ key, label }) => (
              <ProfileRow key={key} label={label} status={pStatus[key] ?? "pending"} text={profileText(profile, key)}
                onAccept={() => setPStatus({ ...pStatus, [key]: "accepted" })}
                onRemove={() => setPStatus({ ...pStatus, [key]: pStatus[key] === "removed" ? "pending" : "removed" })}
                editor={(done) => <ProfileEditor k={key} profile={profile} onSave={(p) => { setProfile(p); setPStatus({ ...pStatus, [key]: "edited" }); done(); }} />}
              />
            ))}
          </Card>
          <p className="mt-2 px-1 text-xs text-muted">Age band from the AI is a suggestion. The child record keeps {AGE_BANDS[child.ageBand].en}. Support level is never shown to parents.</p>
        </>
      )}

      {/* Goals */}
      <SectionTitle>Goals</SectionTitle>
      <div className="space-y-2.5">
        {rm.goals.map((g) => (
          <GoalRow key={g.id} goal={g} status={gStatus[g.id] ?? "pending"}
            onAccept={() => setGStatus({ ...gStatus, [g.id]: "accepted" })}
            onRemove={() => setGStatus({ ...gStatus, [g.id]: gStatus[g.id] === "removed" ? "pending" : "removed" })}
            onEdit={(t) => editGoal(g.id, t)} />
        ))}
      </div>

      {/* Roadmap */}
      <SectionTitle action={<span className="text-xs text-muted">Max {MAX_ACTIVE} per phase</span>}>12-week roadmap</SectionTitle>
      <Segmented value={phase} onChange={(v) => { setPhase(v); setLimitMsg(null); }} className="mb-3 flex w-full overflow-x-auto"
        options={(["1", "2", "3"] as const).map((p) => ({ value: p, label: `Weeks ${p === "1" ? "1–4" : p === "2" ? "5–8" : "9–12"} · ${liveItems(Number(p)).length}` }))} />
      <Card>
        <h3 className="mb-3 font-bold">{rm.phaseNames[phaseNum - 1]}</h3>
        <div className="space-y-2">
          {rm.items.filter((i) => i.phase === phaseNum).map((i) => {
            const a = lib.get(i.activityId);
            const st = iStatus[i.id] ?? "pending";
            const goal = goalById(i.goalId);
            return (
              <div key={i.id} className={cx("flex flex-wrap items-center gap-3 rounded-xl border border-line p-3", st === "removed" && "opacity-45", (st === "accepted" || st === "edited") && "border-success/50 bg-success-soft/40")}>
                <button className="min-w-0 flex-1 text-left" onClick={() => a && setDrawer({ mode: "read", activityId: a.id })}>
                  <div className={cx("font-semibold", st === "removed" && "line-through")}>{a ? a.title_en : i.activityId} <span className="text-xs font-normal text-muted">{i.activityId}</span></div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {a && <Chip tone="primary">{SLOTS[a.routine_slot].en}</Chip>}
                    {a && <Chip>{DOMAINS[a.domain].en}</Chip>}
                    <Chip>Step {i.difficulty}</Chip>
                    {goal && <span className="text-xs text-muted">for: {goal.text}</span>}
                    {st === "edited" && <Chip tone="success">Swapped</Chip>}
                  </div>
                </button>
                <ItemActions status={st}
                  onAccept={() => setIStatus({ ...iStatus, [i.id]: "accepted" })}
                  onSwap={() => setDrawer({ mode: "assign", swapItemId: i.id })}
                  onRemove={() => setIStatus({ ...iStatus, [i.id]: st === "removed" ? "pending" : "removed" })} />
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => {
            if (liveItems(phaseNum).length >= MAX_ACTIVE) setLimitMsg("Remove one first.");
            else setDrawer({ mode: "assign", addPhase: phaseNum });
          }}>Add from library</Button>
          {limitMsg && <span role="alert" className="text-sm font-semibold text-[#b36800]">{limitMsg}</span>}
        </div>
      </Card>

      {/* Missing info */}
      {missing.length > 0 && (
        <>
          <SectionTitle>Missing information</SectionTitle>
          <Card className="space-y-3">
            <p className="text-sm text-text-2">The AI couldn&apos;t tell these from your notes. Answer now or leave them for later.</p>
            {missing.map((q) => (
              <label key={q} className="block">
                <span className="mb-1 block text-[15px] font-semibold">{q}</span>
                <input className={inputCls()} placeholder="Optional answer" value={answers[q] ?? ""} onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })} />
              </label>
            ))}
          </Card>
        </>
      )}

      {/* Footer */}
      {!approved && (
        <div className="glass-strong fixed inset-x-0 bottom-0 z-30 lg:left-64">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-2 px-4 py-3">
            <Button variant="soft" icon={<RefreshCw className="size-5" />} onClick={() => setRegenOpen(true)}>Regenerate with a comment</Button>
            <Button size="lg" icon={<Check className="size-5" />} onClick={approve}>Approve plan</Button>
          </div>
        </div>
      )}

      <Modal open={regenOpen} onClose={() => setRegenOpen(false)} title="Regenerate with a comment">
        <p className="mb-3 text-sm text-text-2">Accepted and edited items stay. Everything else is redrafted.</p>
        <textarea autoFocus className={cx(inputCls(), "min-h-28 py-3")} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Focus more on toileting" />
        <Button block className="mt-3" icon={<Sparkles className="size-5" />} onClick={regenerate}>Regenerate</Button>
      </Modal>

      {drawer && (
        <LibraryDrawer
          open
          onClose={() => setDrawer(null)}
          mode={drawer.mode}
          activityId={drawer.activityId}
          childName={child.nickname}
          initialFilters={(() => {
            const cur = drawer.swapItemId ? lib.get(rm.items.find((x) => x.id === drawer.swapItemId)?.activityId ?? "") : undefined;
            return { domain: cur?.domain, age_band: child.ageBand };
          })()}
          excludeIds={rm.items.filter((i) => i.phase === (drawer.addPhase ?? phaseNum) && iStatus[i.id] !== "removed").map((i) => i.activityId)}
          assignLabel={drawer.swapItemId ? "Swap in" : "Add to phase"}
          onAssign={(a) => {
            if (drawer.swapItemId) swapTo(drawer.swapItemId, a);
            else if (drawer.addPhase) addTo(drawer.addPhase, a);
            setDrawer(null);
          }}
        />
      )}

      <InviteModal open={inviteOpen} childId={id} childName={child.nickname} onClose={() => { setInviteOpen(false); router.push(`/t/children/${id}`); }} />
    </div>
  );
}

// ---------- pieces ----------
function StatusChip({ status }: { status: Status }) {
  if (status === "accepted") return <Chip tone="success" icon={<Check className="size-3.5" />}>Accepted</Chip>;
  if (status === "edited") return <Chip tone="success" icon={<Pencil className="size-3.5" />}>Edited</Chip>;
  if (status === "removed") return <Chip>Removed</Chip>;
  return null;
}

function ActBtn({ label, onClick, children, active }: { label: string; onClick: () => void; children: ReactNode; active?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick}
      className={cx("inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition hover:bg-primary-soft", active ? "bg-success-soft text-[#1f8f3c]" : "text-text-2")}>
      {children}<span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ItemActions({ status, onAccept, onSwap, onRemove }: { status: Status; onAccept: () => void; onSwap: () => void; onRemove: () => void }) {
  return (
    <div className="flex gap-1">
      {status !== "removed" && <ActBtn label="Accept" active={status === "accepted" || status === "edited"} onClick={onAccept}><Check className="size-4" /></ActBtn>}
      {status !== "removed" && <ActBtn label="Swap" onClick={onSwap}><Repeat2 className="size-4" /></ActBtn>}
      <ActBtn label={status === "removed" ? "Undo" : "Remove"} onClick={onRemove}>{status === "removed" ? <Undo2 className="size-4" /> : <Trash2 className="size-4" />}</ActBtn>
    </div>
  );
}

function ProfileRow({ label, text, status, onAccept, onRemove, editor }: {
  label: string; text: string; status: Status; onAccept: () => void; onRemove: () => void; editor: (done: () => void) => ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className={cx("flex flex-wrap items-center gap-3 px-4 py-3", status === "removed" && "opacity-50")}>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
        {editing ? <div className="mt-1.5">{editor(() => setEditing(false))}</div> : <div className={cx("mt-0.5 font-medium", status === "removed" && "line-through")}>{text}</div>}
      </div>
      <StatusChip status={status} />
      {!editing && (
        <div className="flex gap-1">
          {status !== "removed" && <ActBtn label="Accept" active={status === "accepted"} onClick={onAccept}><Check className="size-4" /></ActBtn>}
          {status !== "removed" && <ActBtn label="Edit" onClick={() => setEditing(true)}><Pencil className="size-4" /></ActBtn>}
          <ActBtn label={status === "removed" ? "Undo" : "Remove"} onClick={onRemove}>{status === "removed" ? <Undo2 className="size-4" /> : <Trash2 className="size-4" />}</ActBtn>
        </div>
      )}
    </div>
  );
}

function ProfileEditor({ k, profile, onSave }: { k: ProfileKey; profile: Profile; onSave: (p: Profile) => void }) {
  const initial =
    k === "sensory_flags" ? profile.sensory_flags.join(", ")
    : k === "safety_flags" ? profile.safety_flags.join(", ")
    : k === "strengths" ? profile.strengths.join(", ")
    : k === "support_level" ? String(profile.support_level ?? "")
    : k === "comm_level" ? profile.comm_level
    : profile.age_band;
  const [v, setV] = useState(initial);
  const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const save = () => {
    const p = { ...profile };
    if (k === "sensory_flags") p.sensory_flags = list(v);
    else if (k === "safety_flags") p.safety_flags = list(v);
    else if (k === "strengths") p.strengths = list(v);
    else if (k === "support_level") p.support_level = v ? (Number(v) as 1 | 2 | 3) : undefined;
    else if (k === "comm_level") p.comm_level = v as CommLevel;
    else p.age_band = v;
    onSave(p);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {k === "comm_level" ? (
        <select className={cx(inputCls(), "max-w-xs")} value={v} onChange={(e) => setV(e.target.value)}>
          {(Object.keys(COMM_LEVELS) as CommLevel[]).map((c) => <option key={c} value={c}>{COMM_LEVELS[c].en}</option>)}
        </select>
      ) : k === "support_level" ? (
        <select className={cx(inputCls(), "max-w-xs")} value={v} onChange={(e) => setV(e.target.value)}>
          <option value="">Not set</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option>
        </select>
      ) : (
        <input autoFocus className={cx(inputCls(), "max-w-md flex-1")} value={v} onChange={(e) => setV(e.target.value)}
          placeholder={k.endsWith("flags") ? "comma separated, e.g. noise, wanders_off" : undefined} />
      )}
      <Button size="sm" onClick={save}>Save</Button>
    </div>
  );
}

function GoalRow({ goal, status, onAccept, onRemove, onEdit }: { goal: Goal; status: Status; onAccept: () => void; onRemove: () => void; onEdit: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(goal.text);
  const [showSource, setShowSource] = useState(false);
  return (
    <Card className={cx(status === "removed" && "opacity-50", (status === "accepted" || status === "edited") && "ring-1 ring-success/50")}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Chip tone="primary">{DOMAINS[goal.domain].emoji} {DOMAINS[goal.domain].en}</Chip>
            <StatusChip status={status} />
          </div>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              <input autoFocus className={cx(inputCls(), "flex-1")} value={text} onChange={(e) => setText(e.target.value)} />
              <Button size="sm" disabled={!text.trim()} onClick={() => { onEdit(text.trim()); setEditing(false); }}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setText(goal.text); setEditing(false); }}>Cancel</Button>
            </div>
          ) : (
            <p className={cx("text-[16px] font-semibold", status === "removed" && "line-through")}>{goal.text}</p>
          )}
          {goal.evidence ? (
            <button onClick={() => setShowSource(!showSource)} className="mt-1.5 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-primary">
              <MessageSquareQuote className="size-4" />{showSource ? "Hide source" : "From your notes"}
            </button>
          ) : (
            <div className="mt-1.5"><Chip tone="info" icon={<Sparkles className="size-3.5" />}>Added by AI, no source</Chip></div>
          )}
          {showSource && goal.evidence && <blockquote className="mt-1 border-l-3 border-primary/40 pl-3 text-sm italic text-text-2">&ldquo;{goal.evidence}&rdquo;</blockquote>}
        </div>
        {!editing && (
          <div className="flex gap-1">
            {status !== "removed" && <ActBtn label="Accept" active={status === "accepted" || status === "edited"} onClick={onAccept}><Check className="size-4" /></ActBtn>}
            {status !== "removed" && <ActBtn label="Edit" onClick={() => setEditing(true)}><Pencil className="size-4" /></ActBtn>}
            <ActBtn label={status === "removed" ? "Undo" : "Remove"} onClick={onRemove}>{status === "removed" ? <Undo2 className="size-4" /> : <Trash2 className="size-4" />}</ActBtn>
          </div>
        )}
      </div>
    </Card>
  );
}
