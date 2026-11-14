"use client";
// T-06 Roadmap: phases, goals and assigned activities. Edits stay local until "Publish changes".
import { ArrowLeft, ArrowRight, MoreVertical, Plus, RefreshCw, Sparkles, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LibraryDrawer } from "@/components/library-drawer";
import { ActivityArt, Button, Card, Chip, cx, EmptyState, ErrorState, Field, inputCls, PageTitle, SectionTitle, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { AGE_BANDS, DIFFICULTY, DOMAINS, fmtDate, fmtTime, SLOTS } from "@/lib/labels";
import { flagNote, MAX_ACTIVE } from "@/lib/matching";
import { childService, libraryService, planService } from "@/lib/services";
import type { Activity, ActivityFilters, Child, Difficulty, Domain, Goal, PlanItem, Roadmap } from "@/lib/types";

type DrawerState = { goalId: string; domain: Domain; swapItemId?: string } | null;

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>();
  const child = useLoad(() => childService.getChild(id), [id]);
  const roadmap = useLoad(() => planService.getRoadmap(id), [id]);
  const lib = useLoad(() => libraryService.listActivities({ includeDrafts: true }), []);

  if (child.loading || roadmap.loading || lib.loading) return <SkeletonList rows={4} h="h-28" />;
  if (child.error || roadmap.error || lib.error) return <ErrorState message={child.error || roadmap.error || lib.error || ""} onRetry={() => { child.reload(); roadmap.reload(); }} />;
  const c = child.data!;
  return (
    <div>
      <Link href={`/t/children/${id}`} className="mb-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="size-4" />{c.nickname}</Link>
      {roadmap.data ? (
        <RoadmapEditor key={roadmap.data.id + (roadmap.data.changeLog.length) + roadmap.data.status} child={c} initial={roadmap.data} library={lib.data!} />
      ) : (
        <GoalBuilder child={c} />
      )}
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
      roadmap: { phases: [{ name: "Weeks 1-4", goal_ids: [], activity_ids: [] }, { name: "Weeks 5-8", goal_ids: [], activity_ids: [] }, { name: "Weeks 9-12", goal_ids: [], activity_ids: [] }] },
      missing_info: [],
      based_on: "Built by therapist",
    });
    toast(`${child.nickname}'s roadmap created`);
  };
  return (
    <div>
      <PageTitle title={`${child.nickname}'s roadmap`} sub="No plan yet. Start with 3–5 goals, then pick activities from the library." />
      {!goals.length && (
        <div className="mb-4">
          <EmptyState emoji="🗺️" title={`Build ${child.nickname}'s plan yourself, or let smart intake draft it.`}
            action={<Button variant="soft" href={`/t/children/${child.id}/intake`} icon={<Sparkles className="size-5" />}>Use smart intake instead</Button>} />
        </div>
      )}
      <Card>
        <h2 className="mb-3 text-lg font-bold">Goals ({goals.length}/5)</h2>
        <ul className="mb-4 space-y-2">
          {goals.map((g, i) => (
            <li key={i} className="flex items-center gap-2 rounded-xl bg-primary-soft/50 p-3">
              <Chip tone="primary">{DOMAINS[g.domain].en}</Chip><span className="flex-1">{g.text}</span>
              <button aria-label="Remove goal" onClick={() => setGoals(goals.filter((_, j) => j !== i))} className="grid size-10 place-items-center rounded-full text-muted hover:bg-primary-soft"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
        {goals.length < 5 && (
          <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto] sm:items-end">
            <Field label="Need domain">
              <select className={inputCls()} value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>
                {(Object.keys(DOMAINS) as Domain[]).filter((d) => d !== "caregiver_wellbeing").map((d) => <option key={d} value={d}>{DOMAINS[d].en}</option>)}
              </select>
            </Field>
            <Field label="Goal in plain words">
              <input className={inputCls()} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="e.g. Asks for a snack with a word or picture" />
            </Field>
            <Button variant="soft" onClick={add} disabled={!text.trim()} icon={<Plus className="size-5" />}>Add goal</Button>
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <Button onClick={create} loading={busy} disabled={!goals.length}>Create roadmap</Button>
        </div>
      </Card>
    </div>
  );
}

// ---------- Editor ----------
function RoadmapEditor({ child, initial, library }: { child: Child; initial: Roadmap; library: Activity[] }) {
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
    if (activeIn(phase) >= MAX_ACTIVE) return setWarn(`This phase already has ${MAX_ACTIVE} activities. Remove one first.`);
    setDrawer({ goalId, domain });
  };
  const onAssign = (a: Activity) => {
    if (!drawer) return;
    if (drawer.swapItemId) {
      const old = rm.items.find((i) => i.id === drawer.swapItemId)!;
      edit(rm.items.map((i) => (i.id === old.id ? { ...i, activityId: a.id, difficulty: 1 } : i)), `Swapped ${title(old.activityId)} for ${a.title_en} (weeks ${phaseLabel(phase)})`);
    } else {
      if (activeIn(phase) >= MAX_ACTIVE) return setWarn("Remove one first.");
      const item: PlanItem = { id: `pi_${Date.now().toString(36)}`, roadmapId: rm.id, phase, goalId: drawer.goalId, activityId: a.id, difficulty: 1, active: true };
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
        if (s.goalId !== "caregiver" && items.some((i) => i.phase === cur && i.active && i.goalId === s.goalId)) continue;
        for (const aid of s.activityIds) {
          if (activeIn(cur, items) >= MAX_ACTIVE) break;
          if (items.some((i) => i.phase === cur && i.activityId === aid)) continue;
          items = [...items, { id: `pi_${Date.now().toString(36)}_${aid}`, roadmapId: rm.id, phase: cur, goalId: s.goalId, activityId: aid, difficulty: 1, active: true }];
          added++;
        }
      }
      setPhase(cur);
      if (!added) toast("Every goal already has an activity");
      else {
        edit(items, `Suggested ${added} ${added === 1 ? "activity" : "activities"} using the matching rules`);
        toast(`Added ${added} suggested ${added === 1 ? "activity" : "activities"}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    try {
      const goals = rm.goals.map((g) => (rm.aiMeta?.based_on === "Built by therapist" ? { ...g, source: "therapist" as const } : g));
      if (isDraft) {
        await planService.approvePlan(child.id, { ...rm, goals });
        toast(`${child.nickname}'s plan is live`);
      } else {
        await planService.publishChanges(child.id, { ...rm, goals }, changes.join("; ") || "Updated plan");
        toast(`Published — ${child.nickname}'s Today screen updates tomorrow`);
      }
      setChanges([]);
    } finally {
      setBusy(false);
    }
  };

  const drawerItems = drawer ? rm.items.filter((i) => i.phase === phase).map((i) => i.activityId) : [];
  const filters: ActivityFilters | undefined = drawer ? { domain: drawer.domain, age_band: child.ageBand, includeDrafts: true } : undefined;

  return (
    <div className="pb-24">
      <PageTitle
        title={`${child.nickname}'s roadmap`}
        sub={`12 weeks in three phases · ${AGE_BANDS[child.ageBand].en} · at most ${MAX_ACTIVE} active activities per phase`}
        actions={<Button variant="soft" onClick={suggestNow} loading={busy} icon={<Wand2 className="size-5" />}>Suggest activities</Button>}
      />

      {fromIntake && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-info-soft px-4 py-3 text-info">
          <Sparkles className="size-5" /><span className="flex-1 text-sm font-semibold">This plan is an AI draft from smart intake and isn&apos;t visible to the family yet.</span>
          <Button size="sm" href={`/t/children/${child.id}/intake/review`} className="bg-info shadow-none">Review the draft</Button>
        </div>
      )}
      {isDraft && !fromIntake && (
        <div className="mb-4 rounded-2xl bg-primary-soft px-4 py-3 text-sm font-semibold text-primary">Draft plan — the family sees it after you tap “Approve and publish”.</div>
      )}

      <div role="tablist" className="mb-5 grid grid-cols-3 gap-2">
        {([1, 2, 3] as const).map((p) => (
          <button key={p} role="tab" aria-selected={phase === p} onClick={() => setPhase(p)}
            className={cx("glass min-h-16 rounded-2xl px-3 py-2 text-left transition", phase === p && "ring-3 ring-primary")}>
            <div className="flex items-center gap-2 font-bold">Weeks {phaseLabel(p)}{rm.currentPhase === p && <Chip tone="primary">Current</Chip>}</div>
            <div className="truncate text-xs text-muted">{rm.phaseNames[p - 1].replace(/^Weeks [\d–-]+:\s*/, "")} · {activeIn(p)}/{MAX_ACTIVE}</div>
          </button>
        ))}
      </div>

      {warn && <div role="alert" className="mb-4 rounded-2xl bg-celebrate-soft px-4 py-3 text-sm font-semibold text-[#b36800]">{warn}</div>}

      <div className="space-y-4">
        {goalRows.map((row) => {
          const items = phaseItems.filter((i) => i.goalId === row.id);
          return (
            <Card key={row.id}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Chip tone={row.goal ? "primary" : "celebrate"}>{DOMAINS[row.domain].emoji} {DOMAINS[row.domain].en}</Chip>
                <h3 className="flex-1 font-semibold">{row.text}</h3>
                <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => openAdd(row.id, row.domain)}>Add from library</Button>
              </div>
              {items.length ? (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((it) => {
                    const a = byId.get(it.activityId);
                    return (
                      <ItemCard key={it.id} item={it} activity={a} child={child} canMoveNext={phase < 3}
                        onSwap={() => setDrawer({ goalId: row.id, domain: a?.domain ?? row.domain, swapItemId: it.id })}
                        onRemove={() => edit(rm.items.filter((i) => i.id !== it.id), `Removed ${title(it.activityId)} from weeks ${phaseLabel(phase)}`)}
                        onStep={(d) => edit(rm.items.map((i) => (i.id === it.id ? { ...i, difficulty: d } : i)), `${title(it.activityId)} moved to step ${d}`)}
                        onNext={() => {
                          const np = (phase + 1) as 2 | 3;
                          if (activeIn(np) >= MAX_ACTIVE) return setWarn(`Weeks ${phaseLabel(np)} already has ${MAX_ACTIVE} activities. Remove one first.`);
                          edit(rm.items.map((i) => (i.id === it.id ? { ...i, phase: np } : i)), `Moved ${title(it.activityId)} to weeks ${phaseLabel(np)}`);
                        }} />
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted">No activity for this goal in weeks {phaseLabel(phase)} yet.</p>
              )}
            </Card>
          );
        })}
      </div>

      <SectionTitle>Change log</SectionTitle>
      <Card>
        {rm.changeLog.length ? (
          <ul className="divide-y divide-line">
            {[...rm.changeLog].reverse().map((c, i) => (
              <li key={i} className="flex flex-wrap gap-x-3 py-2.5 text-sm">
                <span className="w-36 shrink-0 text-muted">{fmtDate(c.at)} · {fmtTime(c.at)}</span>
                <span className="font-semibold">{c.by}</span><span className="flex-1">{c.text}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No changes yet.</p>}
      </Card>

      {(changes.length > 0 || isDraft) && !fromIntake && (
        <div className="glass-strong fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-end gap-3 px-4 py-3 lg:left-64">
          <span className="flex-1 text-sm font-semibold">
            {changes.length ? `Unsaved changes (${changes.length})` : "Draft plan"}
            {changes.length > 0 && <span className="ml-2 font-normal text-muted">{changes[changes.length - 1]}</span>}
          </span>
          {changes.length > 0 && (
            <Button variant="ghost" icon={<RefreshCw className="size-4" />} onClick={() => { setRm(initial); setChanges([]); }}>Discard</Button>
          )}
          <Button onClick={publish} loading={busy} disabled={isDraft && !rm.items.some((i) => i.active)}>{isDraft ? "Approve and publish" : "Publish changes"}</Button>
        </div>
      )}

      <LibraryDrawer open={!!drawer} onClose={() => setDrawer(null)} mode="assign" initialFilters={filters} excludeIds={drawerItems}
        onAssign={onAssign} childName={child.nickname} assignLabel={drawer?.swapItemId ? "Swap in this activity" : undefined} />
    </div>
  );
}

const phaseLabel = (p: number) => (p === 1 ? "1–4" : p === 2 ? "5–8" : "9–12");

function ItemCard({ item, activity, child, canMoveNext, onSwap, onRemove, onStep, onNext }: {
  item: PlanItem; activity?: Activity; child: Child; canMoveNext: boolean;
  onSwap: () => void; onRemove: () => void; onStep: (d: Difficulty) => void; onNext: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const note = activity ? flagNote(activity, child) : null;
  return (
    <div className={cx("relative flex gap-3 rounded-[12px] border border-line bg-surface/60 p-3", !item.active && "opacity-60")}>
      {activity ? <ActivityArt activity={activity} className="size-14 shrink-0" /> : <div className="size-14 shrink-0 rounded-2xl bg-line" />}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-muted">{item.activityId}</div>
        <div className="font-semibold leading-snug">{activity?.title_en ?? "Unknown activity"}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {activity && <Chip>{SLOTS[activity.routine_slot].en}</Chip>}
          <Chip tone="primary">{DIFFICULTY[item.difficulty].en}</Chip>
          {note && <Chip tone="celebrate">{note}</Chip>}
        </div>
      </div>
      <button aria-label="Activity actions" aria-expanded={menu} onClick={() => setMenu(!menu)} className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-primary-soft">
        <MoreVertical className="size-5" />
      </button>
      {menu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
          <div className="glass-strong absolute right-2 top-12 z-20 w-56 rounded-2xl p-1.5 text-sm rise" role="menu">
            <MenuBtn onClick={() => { setMenu(false); onSwap(); }} icon={<RefreshCw className="size-4" />}>Swap</MenuBtn>
            <div className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-muted">Change step</div>
            <div className="grid grid-cols-3 gap-1 px-1.5 pb-1.5">
              {([1, 2, 3] as const).map((d) => (
                <button key={d} onClick={() => { setMenu(false); if (d !== item.difficulty) onStep(d); }}
                  className={cx("min-h-10 rounded-xl font-semibold", d === item.difficulty ? "bg-primary text-white" : "hover:bg-primary-soft")}>{d}</button>
              ))}
            </div>
            {canMoveNext && <MenuBtn onClick={() => { setMenu(false); onNext(); }} icon={<ArrowRight className="size-4" />}>Move to next phase</MenuBtn>}
            <MenuBtn onClick={() => { setMenu(false); onRemove(); }} icon={<Trash2 className="size-4" />}>Remove</MenuBtn>
          </div>
        </>
      )}
    </div>
  );
}

function MenuBtn({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button role="menuitem" onClick={onClick} className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 font-semibold hover:bg-primary-soft">
      {icon}{children}
    </button>
  );
}
