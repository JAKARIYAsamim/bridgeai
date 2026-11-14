"use client";
// T-06 Roadmap: phases, goals and assigned activities (redesigned for phone frame)
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { LibraryDrawer } from "@/components/library-drawer";
import {
  ActivityArt,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  SkeletonList,
  useToast,
} from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { DIFFICULTY, DOMAINS, fmtDate, fmtTime, SLOTS } from "@/lib/labels";
import { flagNote, MAX_ACTIVE } from "@/lib/matching";
import { childService, libraryService, planService } from "@/lib/services";
import type { Activity, ActivityFilters, Child, Difficulty, Domain, Goal, PlanItem, Roadmap } from "@/lib/types";

type DrawerState = { goalId: string; domain: Domain; swapItemId?: string } | null;

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>();
  const child = useLoad(() => childService.getChild(id), [id]);
  const roadmap = useLoad(() => planService.getRoadmap(id), [id]);
  const lib = useLoad(() => libraryService.listActivities({ includeDrafts: true }), []);

  if (child.loading || roadmap.loading || lib.loading) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <SkeletonList rows={4} h="h-28" />
      </div>
    );
  }
  if (child.error || roadmap.error || lib.error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState
          message={child.error || roadmap.error || lib.error || ""}
          onRetry={() => {
            child.reload();
            roadmap.reload();
          }}
        />
      </div>
    );
  }
  const c = child.data!;

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 96 }}>
      <div className="bar" style={{ padding: "4px 8px 10px" }}>
        <Link href={`/t/children/${id}`} className="hbtn" aria-label="Back">
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            {c.nickname}’s roadmap
          </h1>
          <p className="small">12 weeks · 3 phases</p>
        </div>
      </div>

      <div className="in">
        {roadmap.data ? (
          <RoadmapEditor
            key={roadmap.data.id + roadmap.data.changeLog.length + roadmap.data.status}
            child={c}
            initial={roadmap.data}
            library={lib.data!}
          />
        ) : (
          <GoalBuilder child={c} />
        )}
      </div>
    </div>
  );
}

// ---------- Empty roadmap: therapist adds goals ----------
function GoalBuilder({ child }: { child: Child }) {
  const toast = useToast();
  const [goals, setGoals] = useState<{ domain: Domain; text: string }[]>([]);
  const [domain, setDomain] = useState<Domain>("communication");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const add = () => {
    if (!text.trim() || goals.length >= 5) return;
    setGoals([...goals, { domain, text: text.trim() }]);
    setText("");
  };

  const create = async () => {
    setBusy(true);
    await planService.saveDraft(child.id, {
      profile: { age_band: "", comm_level: "words_gestures", sensory_flags: [], safety_flags: [], strengths: [] },
      goals: goals.map((g, i) => ({ id: `g${i + 1}`, domain: g.domain, text: g.text, evidence: null })),
      roadmap: {
        phases: [
          { name: "Weeks 1-4", goal_ids: [], activity_ids: [] },
          { name: "Weeks 5-8", goal_ids: [], activity_ids: [] },
          { name: "Weeks 9-12", goal_ids: [], activity_ids: [] },
        ],
      },
      missing_info: [],
      based_on: "Built by therapist",
    });
    toast(`${child.nickname}’s roadmap created`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!goals.length && (
        <EmptyState
          title={`Build ${child.nickname}’s plan yourself, or use smart intake.`}
          action={
            <Button
              variant="soft"
              href={`/t/children/${child.id}/intake`}
              icon={<Icon name="spark" />}
            >
              Use smart intake instead
            </Button>
          }
        />
      )}

      <Card>
        <p className="h3" style={{ marginBottom: 10 }}>
          Goals ({goals.length}/5)
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {goals.map((g, i) => (
            <div key={i} className="row" style={{ alignItems: "center" }}>
              <Chip tone="primary">{DOMAINS[g.domain].en}</Chip>
              <span className="grow sub" style={{ fontSize: 14 }}>
                {g.text}
              </span>
              <button
                type="button"
                aria-label="Remove goal"
                onClick={() => setGoals(goals.filter((_, j) => j !== i))}
                className="hbtn"
                style={{ width: 34, height: 34 }}
              >
                <Icon name="x" />
              </button>
            </div>
          ))}
        </div>

        {goals.length < 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Domain">
              <select
                className="field"
                value={domain}
                onChange={(e) => setDomain(e.target.value as Domain)}
              >
                {(Object.keys(DOMAINS) as Domain[])
                  .filter((d) => d !== "caregiver_wellbeing")
                  .map((d) => (
                    <option key={d} value={d}>
                      {DOMAINS[d].en}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="Goal in plain words">
              <input
                className="field"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="e.g. Asks for a snack with a word or picture"
              />
            </Field>

            <Button
              variant="soft"
              onClick={add}
              disabled={!text.trim()}
              icon={<Icon name="spark" />}
            >
              Add goal
            </Button>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Button block variant="primary" onClick={create} loading={busy} disabled={!goals.length}>
            Create roadmap
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------- Editor ----------
function RoadmapEditor({
  child,
  initial,
  library,
}: {
  child: Child;
  initial: Roadmap;
  library: Activity[];
}) {
  const toast = useToast();
  const [rm, setRm] = useState<Roadmap>(initial);
  const [changes, setChanges] = useState<string[]>([]);
  const [phase, setPhase] = useState<1 | 2 | 3>(initial.currentPhase);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const byId = useMemo(() => new Map(library.map((a) => [a.id, a])), [library]);
  const isDraft = rm.status === "draft";
  const fromIntake = isDraft && rm.aiMeta?.based_on !== "Built by therapist";
  const title = (aid: string) => byId.get(aid)?.title_en ?? aid;

  useEffect(() => {
    if (!warn) return;
    const t = window.setTimeout(() => setWarn(null), 4000);
    return () => window.clearTimeout(t);
  }, [warn]);

  const activeIn = (p: number, items = rm.items) => items.filter((i) => i.phase === p && i.active).length;
  const edit = (items: PlanItem[], note: string) => {
    setRm({ ...rm, items });
    setChanges((c) => [...c, note]);
    setWarn(null);
  };

  const goalRows: { goal: Goal | null; id: string; domain: Domain; text: string }[] = [
    ...rm.goals.map((g) => ({ goal: g, id: g.id, domain: g.domain, text: g.text })),
    { goal: null, id: "caregiver", domain: "caregiver_wellbeing" as Domain, text: "Caregiver wellbeing" },
  ];
  const phaseItems = rm.items.filter((i) => i.phase === phase);

  const openAdd = (goalId: string, domain: Domain) => {
    if (activeIn(phase) >= MAX_ACTIVE) {
      return setWarn(`This phase already has ${MAX_ACTIVE} activities. Remove one first.`);
    }
    setDrawer({ goalId, domain });
  };

  const onAssign = (a: Activity) => {
    if (!drawer) return;
    if (drawer.swapItemId) {
      const old = rm.items.find((i) => i.id === drawer.swapItemId)!;
      edit(
        rm.items.map((i) => (i.id === old.id ? { ...i, activityId: a.id, difficulty: 1 } : i)),
        `Swapped ${title(old.activityId)} for ${a.title_en} (weeks ${phaseLabel(phase)})`
      );
    } else {
      if (activeIn(phase) >= MAX_ACTIVE) return setWarn("Remove one first.");
      const item: PlanItem = {
        id: `pi_${Date.now().toString(36)}`,
        roadmapId: rm.id,
        phase,
        goalId: drawer.goalId,
        activityId: a.id,
        difficulty: 1,
        active: true,
      };
      edit([...rm.items, item], `Added ${a.title_en} to weeks ${phaseLabel(phase)}`);
    }
  };

  const suggestNow = async () => {
    setBusy(true);
    try {
      const sug = await libraryService.suggestActivities(child.id);
      let items = [...rm.items];
      let added = 0;
      const cur = rm.currentPhase;
      for (const s of sug) {
        if (s.goalId !== "caregiver" && items.some((i) => i.phase === cur && i.active && i.goalId === s.goalId))
          continue;
        for (const aid of s.activityIds) {
          if (activeIn(cur, items) >= MAX_ACTIVE) break;
          if (items.some((i) => i.phase === cur && i.activityId === aid)) continue;
          items = [
            ...items,
            {
              id: `pi_${Date.now().toString(36)}_${aid}`,
              roadmapId: rm.id,
              phase: cur,
              goalId: s.goalId,
              activityId: aid,
              difficulty: 1,
              active: true,
            },
          ];
          added++;
        }
      }
      setPhase(cur);
      if (!added) toast("Every goal already has an activity");
      else {
        edit(items, `Suggested ${added} activities using matching rules`);
        toast(`Added ${added} suggested activities`);
      }
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    try {
      const goals = rm.goals.map((g) =>
        rm.aiMeta?.based_on === "Built by therapist" ? { ...g, source: "therapist" as const } : g
      );
      if (isDraft) {
        await planService.approvePlan(child.id, { ...rm, goals });
        toast(`${child.nickname}’s plan is live`);
      } else {
        await planService.publishChanges(child.id, { ...rm, goals }, changes.join("; ") || "Updated plan");
        toast(`Published — updates will appear tomorrow`);
      }
      setChanges([]);
    } finally {
      setBusy(false);
    }
  };

  const drawerItems = drawer ? rm.items.filter((i) => i.phase === phase).map((i) => i.activityId) : [];
  const filters: ActivityFilters | undefined = drawer
    ? { domain: drawer.domain, age_band: child.ageBand, includeDrafts: true }
    : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {fromIntake && (
        <div className="note2" style={{ background: "rgba(0, 122, 255, 0.08)", borderColor: "rgba(0, 122, 255, 0.25)" }}>
          <p className="small" style={{ color: "var(--blue)", marginBottom: 4, fontWeight: 600 }}>
            AI draft from smart intake
          </p>
          <p className="sub" style={{ fontSize: 13, marginBottom: 8 }}>
            Not visible to family until you review and approve.
          </p>
          <Button size="sm" variant="soft" href={`/t/children/${child.id}/intake/review`}>
            Review draft
          </Button>
        </div>
      )}

      {isDraft && !fromIntake && (
        <div className="note2">
          <p className="small">Draft plan — caregiver sees it after you tap approve.</p>
        </div>
      )}

      {/* Phase Segmented Selector */}
      <div className="seg">
        {([1, 2, 3] as const).map((p) => (
          <button
            key={p}
            className={phase === p ? "on" : ""}
            onClick={() => setPhase(p)}
            type="button"
          >
            Weeks {phaseLabel(p)} ({activeIn(p)}/{MAX_ACTIVE})
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="small" style={{ fontWeight: 600 }}>
          {rm.phaseNames[phase - 1]}
        </p>
        <Button size="sm" variant="soft" onClick={suggestNow} loading={busy} icon={<Icon name="spark" />}>
          Suggest
        </Button>
      </div>

      {warn && (
        <div className="note2" style={{ background: "rgba(255, 149, 0, 0.1)", color: "#b36800" }}>
          <p className="small">{warn}</p>
        </div>
      )}

      {/* Goals and Assigned Activities */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {goalRows.map((row) => {
          const items = phaseItems.filter((i) => i.goalId === row.id);
          return (
            <Card key={row.id}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <Chip tone={row.goal ? "primary" : "celebrate"}>{DOMAINS[row.domain].en}</Chip>
                <p className="h3 grow" style={{ fontSize: 14 }}>
                  {row.text}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Icon name="spark" />}
                  onClick={() => openAdd(row.id, row.domain)}
                >
                  Add
                </Button>
              </div>

              {items.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((it) => {
                    const a = byId.get(it.activityId);
                    return (
                      <ItemCard
                        key={it.id}
                        item={it}
                        activity={a}
                        child={child}
                        canMoveNext={phase < 3}
                        onSwap={() =>
                          setDrawer({ goalId: row.id, domain: a?.domain ?? row.domain, swapItemId: it.id })
                        }
                        onRemove={() =>
                          edit(
                            rm.items.filter((i) => i.id !== it.id),
                            `Removed ${title(it.activityId)} from weeks ${phaseLabel(phase)}`
                          )
                        }
                        onStep={(d) =>
                          edit(
                            rm.items.map((i) => (i.id === it.id ? { ...i, difficulty: d } : i)),
                            `${title(it.activityId)} moved to step ${d}`
                          )
                        }
                        onNext={() => {
                          const np = (phase + 1) as 2 | 3;
                          if (activeIn(np) >= MAX_ACTIVE) {
                            return setWarn(`Weeks ${phaseLabel(np)} already has ${MAX_ACTIVE} activities.`);
                          }
                          edit(
                            rm.items.map((i) => (i.id === it.id ? { ...i, phase: np } : i)),
                            `Moved ${title(it.activityId)} to weeks ${phaseLabel(np)}`
                          );
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="small" style={{ textAlign: "center", padding: "12px 0", color: "var(--mute)" }}>
                  No activity for this goal in weeks {phaseLabel(phase)} yet.
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Change Log */}
      <div className="sec" style={{ marginTop: 12 }}>
        <h2 className="h2">Change log</h2>
        <span className="small">{rm.changeLog.length}</span>
      </div>
      <Card>
        {rm.changeLog.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...rm.changeLog].reverse().map((c, i) => (
              <div key={i} style={{ fontSize: 13, borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
                <span className="small" style={{ color: "var(--mute)" }}>
                  {fmtDate(c.at)} · {fmtTime(c.at)}
                </span>
                <p style={{ margin: "2px 0 0" }}>
                  <b>{c.by}:</b> {c.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="small">No changes recorded yet.</p>
        )}
      </Card>

      {/* Bottom Publish Toolbar */}
      {(changes.length > 0 || isDraft) && !fromIntake && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="small" style={{ textAlign: "center", fontWeight: 600 }}>
            {changes.length ? `Unsaved changes (${changes.length})` : "Draft plan"}
          </p>
          <Button
            block
            size="lg"
            variant="primary"
            onClick={publish}
            loading={busy}
            disabled={isDraft && !rm.items.some((i) => i.active)}
          >
            {isDraft ? "Approve and publish" : "Publish changes"}
          </Button>
          {changes.length > 0 && (
            <Button
              block
              variant="ghost"
              onClick={() => {
                setRm(initial);
                setChanges([]);
              }}
            >
              Discard changes
            </Button>
          )}
        </div>
      )}

      <LibraryDrawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        mode="assign"
        initialFilters={filters}
        excludeIds={drawerItems}
        onAssign={onAssign}
        childName={child.nickname}
        assignLabel={drawer?.swapItemId ? "Swap in this activity" : undefined}
      />
    </div>
  );
}

const phaseLabel = (p: number) => (p === 1 ? "1–4" : p === 2 ? "5–8" : "9–12");

function ItemCard({
  item,
  activity,
  child,
  canMoveNext,
  onSwap,
  onRemove,
  onStep,
  onNext,
}: {
  item: PlanItem;
  activity?: Activity;
  child: Child;
  canMoveNext: boolean;
  onSwap: () => void;
  onRemove: () => void;
  onStep: (d: Difficulty) => void;
  onNext: () => void;
}) {
  const [open, setOpen] = useState(false);
  const note = activity ? flagNote(activity, child) : null;

  return (
    <div className="card" style={{ padding: 10, background: "rgba(255, 255, 255, 0.5)" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {activity ? (
          <div style={{ width: 44, height: 44, flex: "none" }}>
            <ActivityArt activity={activity} />
          </div>
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--line)" }} />
        )}
        <div className="grow" style={{ minWidth: 0 }}>
          <p className="h3" style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activity?.title_en ?? "Unknown activity"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
            {activity && <Chip>{SLOTS[activity.routine_slot].en}</Chip>}
            <Chip tone="primary">{DIFFICULTY[item.difficulty].en}</Chip>
            {note && <Chip tone="celebrate">{note}</Chip>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="hbtn"
          style={{ width: 34, height: 34, transform: open ? "rotate(180deg)" : undefined }}
        >
          <Icon name="next" />
        </button>
      </div>

      {open && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
          <Button size="sm" variant="soft" onClick={onSwap}>
            Swap
          </Button>
          <Button size="sm" variant="soft" onClick={() => onStep(item.difficulty === 3 ? 1 : ((item.difficulty + 1) as Difficulty))}>
            Step {item.difficulty} → {item.difficulty === 3 ? 1 : item.difficulty + 1}
          </Button>
          {canMoveNext && (
            <Button size="sm" variant="soft" onClick={onNext}>
              Next phase
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={onRemove}>
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
