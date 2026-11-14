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
import { DIFFICULTY, DOMAINS, fmtDate, fmtTime, num, SLOTS } from "@/lib/labels";
import { useLang } from "@/lib/i18n";
import { flagNote, MAX_ACTIVE } from "@/lib/matching";
import { childService, libraryService, planService } from "@/lib/services";
import type { Activity, ActivityFilters, Child, Difficulty, Domain, Goal, PlanItem, Roadmap } from "@/lib/types";

type DrawerState = { goalId: string; domain: Domain; swapItemId?: string } | null;

export default function RoadmapPage() {
  const { lang, L } = useLang();
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
        <Link href={`/t/children/${id}`} className="hbtn" aria-label={L("ফিরে যান", "Back")}>
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            {lang === "bn" ? `${c.nickname}-এর রোডম্যাপ` : `${c.nickname}’s roadmap`}
          </h1>
          <p className="small">{L("১২ সপ্তাহ · ৩ ধাপ", "12 weeks · 3 phases")}</p>
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
  const { lang, L } = useLang();
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
    toast(lang === "bn" ? `${child.nickname}-এর রোডম্যাপ তৈরি হয়েছে` : `${child.nickname}’s roadmap created`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!goals.length && (
        <EmptyState
          title={
            lang === "bn"
              ? `${child.nickname}-এর পরিকল্পনা নিজে তৈরি করুন অথবা স্মার্ট ইনটেক ব্যবহার করুন।`
              : `Build ${child.nickname}’s plan yourself, or use smart intake.`
          }
          action={
            <Button
              variant="soft"
              href={`/t/children/${child.id}/intake`}
              icon={<Icon name="spark" />}
            >
              {L("স্মার্ট ইনটেক ব্যবহার করুন", "Use smart intake instead")}
            </Button>
          }
        />
      )}

      <Card>
        <p className="h3" style={{ marginBottom: 10 }}>
          {L("লক্ষ্যসমূহ", "Goals")} ({num(goals.length, lang)}/{num(5, lang)})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {goals.map((g, i) => (
            <div key={i} className="row" style={{ alignItems: "center" }}>
              <Chip tone="primary">{DOMAINS[g.domain]?.[lang] ?? DOMAINS[g.domain]?.en}</Chip>
              <span className="grow sub" style={{ fontSize: 14 }}>
                {g.text}
              </span>
              <button
                type="button"
                aria-label={L("লক্ষ্য বাদ দিন", "Remove goal")}
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
            <Field label={L("ক্ষেত্র", "Domain")}>
              <select
                className="field"
                value={domain}
                onChange={(e) => setDomain(e.target.value as Domain)}
              >
                {(Object.keys(DOMAINS) as Domain[])
                  .filter((d) => d !== "caregiver_wellbeing")
                  .map((d) => (
                    <option key={d} value={d}>
                      {DOMAINS[d]?.[lang] ?? DOMAINS[d]?.en}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label={L("সহজ কথায় লক্ষ্য", "Goal in plain words")}>
              <input
                className="field"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder={L("যেমন: কথা বা ছবি দিয়ে নাস্তা চায়", "e.g. Asks for a snack with a word or picture")}
              />
            </Field>

            <Button
              variant="soft"
              onClick={add}
              disabled={!text.trim()}
              icon={<Icon name="spark" />}
            >
              {L("লক্ষ্য যোগ করুন", "Add goal")}
            </Button>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Button block variant="primary" onClick={create} loading={busy} disabled={!goals.length}>
            {L("রোডম্যাপ তৈরি করুন", "Create roadmap")}
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
  const { lang, L } = useLang();
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
  const title = (aid: string) => (lang === "bn" ? byId.get(aid)?.title_bn : byId.get(aid)?.title_en) ?? aid;

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
    {
      goal: null,
      id: "caregiver",
      domain: "caregiver_wellbeing" as Domain,
      text: L("অভিভাবকের মানসিক সুস্থতা", "Caregiver wellbeing"),
    },
  ];
  const phaseItems = rm.items.filter((i) => i.phase === phase);

  const openAdd = (goalId: string, domain: Domain) => {
    if (activeIn(phase) >= MAX_ACTIVE) {
      return setWarn(
        lang === "bn"
          ? `এই ধাপে ইতিমধ্যে ${num(MAX_ACTIVE, "bn")}টি কার্যক্রম রয়েছে। আগে একটি বাদ দিন।`
          : `This phase already has ${MAX_ACTIVE} activities. Remove one first.`
      );
    }
    setDrawer({ goalId, domain });
  };

  const onAssign = (a: Activity) => {
    if (!drawer) return;
    if (drawer.swapItemId) {
      const old = rm.items.find((i) => i.id === drawer.swapItemId)!;
      edit(
        rm.items.map((i) => (i.id === old.id ? { ...i, activityId: a.id, difficulty: 1 } : i)),
        lang === "bn"
          ? `${title(old.activityId)}-এর বদলে ${a.title_bn} দেওয়া হয়েছে (সপ্তাহ ${phaseLabel(phase, "bn")})`
          : `Swapped ${title(old.activityId)} for ${a.title_en} (weeks ${phaseLabel(phase, "en")})`
      );
    } else {
      if (activeIn(phase) >= MAX_ACTIVE) return setWarn(L("আগে একটি বাদ দিন।", "Remove one first."));
      const item: PlanItem = {
        id: `pi_${Date.now().toString(36)}`,
        roadmapId: rm.id,
        phase,
        goalId: drawer.goalId,
        activityId: a.id,
        difficulty: 1,
        active: true,
      };
      edit(
        [...rm.items, item],
        lang === "bn"
          ? `সপ্তাহ ${phaseLabel(phase, "bn")}-এ ${a.title_bn} যোগ করা হয়েছে`
          : `Added ${a.title_en} to weeks ${phaseLabel(phase, "en")}`
      );
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
      if (!added) toast(lang === "bn" ? "প্রতিটি লক্ষ্যের জন্য ইতিমধ্যে কার্যক্রম রয়েছে" : "Every goal already has an activity");
      else {
        edit(items, `Suggested ${added} activities using matching rules`);
        toast(lang === "bn" ? `${num(added, "bn")}টি প্রস্তাবিত কার্যক্রম যোগ করা হয়েছে` : `Added ${added} suggested activities`);
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
        toast(lang === "bn" ? `${child.nickname}-এর পরিকল্পনা চালু হয়েছে` : `${child.nickname}’s plan is live`);
      } else {
        await planService.publishChanges(child.id, { ...rm, goals }, changes.join("; ") || "Updated plan");
        toast(lang === "bn" ? "প্রকাশিত হয়েছে — পরিবর্তনগুলো আগামীকাল দেখা যাবে" : `Published — updates will appear tomorrow`);
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
            {L("স্মার্ট ইনটেক থেকে এআই খসড়া", "AI draft from smart intake")}
          </p>
          <p className="sub" style={{ fontSize: 13, marginBottom: 8 }}>
            {L("পর্যালোচনা ও অনুমোদন না করা পর্যন্ত পরিবার দেখতে পাবে না।", "Not visible to family until you review and approve.")}
          </p>
          <Button size="sm" variant="soft" href={`/t/children/${child.id}/intake/review`}>
            {L("খসড়া পর্যালোচনা", "Review draft")}
          </Button>
        </div>
      )}

      {isDraft && !fromIntake && (
        <div className="note2">
          <p className="small">
            {L("খসড়া পরিকল্পনা — আপনি অনুমোদন দিলে অভিভাবক দেখতে পাবেন।", "Draft plan — caregiver sees it after you tap approve.")}
          </p>
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
            {L("সপ্তাহ", "Weeks")} {phaseLabel(p, lang)} ({num(activeIn(p), lang)}/{num(MAX_ACTIVE, lang)})
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="small" style={{ fontWeight: 600 }}>
          {rm.phaseNames[phase - 1]}
        </p>
        <Button size="sm" variant="soft" onClick={suggestNow} loading={busy} icon={<Icon name="spark" />}>
          {L("পরামর্শ", "Suggest")}
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
                <Chip tone={row.goal ? "primary" : "celebrate"}>{DOMAINS[row.domain]?.[lang] ?? DOMAINS[row.domain]?.en}</Chip>
                <p className="h3 grow" style={{ fontSize: 14 }}>
                  {row.text}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Icon name="spark" />}
                  onClick={() => openAdd(row.id, row.domain)}
                >
                  {L("যোগ করুন", "Add")}
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
                            `Removed ${title(it.activityId)} from weeks ${phaseLabel(phase, "en")}`
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
                            return setWarn(
                              lang === "bn"
                                ? `সপ্তাহ ${phaseLabel(np, "bn")}-এ ইতিমধ্যে ${num(MAX_ACTIVE, "bn")}টি কার্যক্রম রয়েছে।`
                                : `Weeks ${phaseLabel(np, "en")} already has ${MAX_ACTIVE} activities.`
                            );
                          }
                          edit(
                            rm.items.map((i) => (i.id === it.id ? { ...i, phase: np } : i)),
                            `Moved ${title(it.activityId)} to weeks ${phaseLabel(np, "en")}`
                          );
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="small" style={{ textAlign: "center", padding: "12px 0", color: "var(--mute)" }}>
                  {lang === "bn"
                    ? `এই সপ্তাহে (${phaseLabel(phase, "bn")}) এই লক্ষ্যের কোনো কার্যক্রম নেই।`
                    : `No activity for this goal in weeks ${phaseLabel(phase, "en")} yet.`}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Change Log */}
      <div className="sec" style={{ marginTop: 12 }}>
        <h2 className="h2">{L("পরিবর্তনের ইতিহাস", "Change log")}</h2>
        <span className="small">{num(rm.changeLog.length, lang)}</span>
      </div>
      <Card>
        {rm.changeLog.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...rm.changeLog].reverse().map((c, i) => (
              <div key={i} style={{ fontSize: 13, borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
                <span className="small" style={{ color: "var(--mute)" }}>
                  {fmtDate(c.at, lang)} · {fmtTime(c.at, lang)}
                </span>
                <p style={{ margin: "2px 0 0" }}>
                  <b>{c.by}:</b> {c.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="small">{L("এখনও কোনো পরিবর্তন রেকর্ড করা হয়নি।", "No changes recorded yet.")}</p>
        )}
      </Card>

      {/* Bottom Publish Toolbar */}
      {(changes.length > 0 || isDraft) && !fromIntake && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="small" style={{ textAlign: "center", fontWeight: 600 }}>
            {changes.length
              ? (lang === "bn" ? `সংরক্ষণ না করা পরিবর্তন (${num(changes.length, "bn")})` : `Unsaved changes (${changes.length})`)
              : (lang === "bn" ? "খসড়া পরিকল্পনা" : "Draft plan")}
          </p>
          <Button
            block
            size="lg"
            variant="primary"
            onClick={publish}
            loading={busy}
            disabled={isDraft && !rm.items.some((i) => i.active)}
          >
            {isDraft ? L("অনুমোদন ও প্রকাশ করুন", "Approve and publish") : L("পরিবর্তন প্রকাশ করুন", "Publish changes")}
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
              {L("পরিবর্তন বাতিল করুন", "Discard changes")}
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
        assignLabel={drawer?.swapItemId ? L("এই কার্যক্রমে বদলান", "Swap in this activity") : undefined}
      />
    </div>
  );
}

const phaseLabel = (p: number, lang: "bn" | "en" = "en") =>
  p === 1 ? (lang === "bn" ? "১–৪" : "1–4") : p === 2 ? (lang === "bn" ? "৫–৮" : "5–8") : (lang === "bn" ? "৯–১২" : "9–12");

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
  const { lang, L } = useLang();
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
            {activity ? (lang === "bn" ? activity.title_bn : activity.title_en) : (lang === "bn" ? "অজানা কার্যক্রম" : "Unknown activity")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
            {activity && <Chip>{SLOTS[activity.routine_slot]?.[lang] ?? SLOTS[activity.routine_slot]?.en}</Chip>}
            <Chip tone="primary">{DIFFICULTY[item.difficulty]?.[lang] ?? DIFFICULTY[item.difficulty]?.en}</Chip>
            {note && <Chip tone="celebrate">{note}</Chip>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="hbtn"
          aria-label={L("বিকল্প দেখুন", "Toggle options")}
          style={{ width: 34, height: 34, transform: open ? "rotate(180deg)" : undefined }}
        >
          <Icon name="next" />
        </button>
      </div>

      {open && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
          <Button size="sm" variant="soft" onClick={onSwap}>
            {L("বদলান", "Swap")}
          </Button>
          <Button size="sm" variant="soft" onClick={() => onStep(item.difficulty === 3 ? 1 : ((item.difficulty + 1) as Difficulty))}>
            {lang === "bn"
              ? `ধাপ ${num(item.difficulty, "bn")} → ${num(item.difficulty === 3 ? 1 : item.difficulty + 1, "bn")}`
              : `Step ${item.difficulty} → ${item.difficulty === 3 ? 1 : item.difficulty + 1}`}
          </Button>
          {canMoveNext && (
            <Button size="sm" variant="soft" onClick={onNext}>
              {L("পরবর্তী ধাপ", "Next phase")}
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={onRemove}>
            {L("বাদ দিন", "Remove")}
          </Button>
        </div>
      )}
    </div>
  );
}
