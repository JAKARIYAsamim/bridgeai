"use client";
// Activity library pieces: filters, grid, detail (therapist view + parent preview), and the drawer
// used from the roadmap and the AI review screen.
import { ArrowLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ActivityDetailView } from "@/components/activity-view";
import { ActivityArt, Button, Chip, cx, Drawer, EmptyState, ErrorState, FilterChip, Segmented, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { AGE_BANDS, COMM_LEVELS, DIFFICULTY, DOMAINS, SLOTS } from "@/lib/labels";
import { libraryService } from "@/lib/services";
import type { Activity, ActivityFilters, AgeBand, CommLevel, Difficulty, Domain, Lang, RoutineSlot } from "@/lib/types";

// ---------- Filters ----------
function ChipRow<T extends string | number>({ label, value, options, onChange }: {
  label: string; value?: T; options: { value: T; label: string }[]; onChange: (v?: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      {options.map((o) => (
        <FilterChip key={String(o.value)} active={value === o.value} onClick={() => onChange(value === o.value ? undefined : o.value)}>{o.label}</FilterChip>
      ))}
    </div>
  );
}

export function LibraryFilters({ filters, onChange, compact }: { filters: ActivityFilters; onChange: (f: ActivityFilters) => void; compact?: boolean }) {
  const [more, setMore] = useState(!compact);
  const set = (patch: Partial<ActivityFilters>) => onChange({ ...filters, ...patch });
  const active = [filters.domain, filters.routine_slot, filters.age_band, filters.comm_level, filters.difficulty].filter(Boolean).length;
  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          value={filters.search ?? ""}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search by title, ID or evidence"
          aria-label="Search activities"
          className="min-h-12 w-full rounded-xl border border-line bg-surface/70 pl-11 pr-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
      </div>
      {compact && (
        <button onClick={() => setMore(!more)} className="min-h-10 text-sm font-semibold text-primary">
          {more ? "Hide filters" : `Filters${active ? ` (${active})` : ""}`}
        </button>
      )}
      {more && (
        <div className="space-y-2">
          <ChipRow<Domain> label="Domain" value={filters.domain} onChange={(v) => set({ domain: v })}
            options={(Object.keys(DOMAINS) as Domain[]).filter((d) => d !== "early_learning").map((d) => ({ value: d, label: `${DOMAINS[d].emoji} ${DOMAINS[d].en}` }))} />
          <ChipRow<RoutineSlot> label="Slot" value={filters.routine_slot} onChange={(v) => set({ routine_slot: v })}
            options={(Object.keys(SLOTS) as RoutineSlot[]).map((s) => ({ value: s, label: SLOTS[s].en }))} />
          <ChipRow<AgeBand> label="Age" value={filters.age_band} onChange={(v) => set({ age_band: v })}
            options={(Object.keys(AGE_BANDS) as AgeBand[]).map((a) => ({ value: a, label: AGE_BANDS[a].en }))} />
          <ChipRow<CommLevel> label="Talking" value={filters.comm_level} onChange={(v) => set({ comm_level: v })}
            options={(Object.keys(COMM_LEVELS) as CommLevel[]).map((c) => ({ value: c, label: COMM_LEVELS[c].en }))} />
          <ChipRow<Difficulty> label="Step" value={filters.difficulty} onChange={(v) => set({ difficulty: v })}
            options={[1, 2, 3].map((d) => ({ value: d as Difficulty, label: `Step ${d}` }))} />
          {active > 0 && (
            <button className="min-h-10 text-sm font-semibold text-primary"
              onClick={() => onChange({ search: filters.search, includeDrafts: filters.includeDrafts })}>Clear filters</button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Grid ----------
export function LibraryCard({ activity, onOpen }: { activity: Activity; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="glass flex flex-col overflow-hidden rounded-[12px] text-left transition hover:-translate-y-0.5 active:scale-[0.99]">
      <ActivityArt activity={activity} className="h-28 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted">{activity.id}</span>
          {activity.status === "draft" && <Chip tone="celebrate">Draft</Chip>}
        </div>
        <div className="font-semibold leading-snug">{activity.title_en}</div>
        <div className="bn text-sm text-text-2">{activity.title_bn}</div>
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          <Chip tone="primary">{DOMAINS[activity.domain].en}</Chip>
          <Chip>{SLOTS[activity.routine_slot].en}</Chip>
          <Chip>{activity.minutes} min</Chip>
        </div>
      </div>
    </button>
  );
}

export function LibraryGrid({ filters, excludeIds = [], onOpen, cols = "sm:grid-cols-2 xl:grid-cols-3" }: {
  filters: ActivityFilters; excludeIds?: string[]; onOpen: (a: Activity) => void; cols?: string;
}) {
  const key = JSON.stringify(filters);
  const { data, loading, error, reload } = useLoad(() => libraryService.listActivities({ includeDrafts: true, ...filters }), [key]);
  const list = useMemo(() => (data ?? []).filter((a) => !excludeIds.includes(a.id)), [data, excludeIds]);
  if (loading && !data) return <SkeletonList rows={4} h="h-44" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!list.length) return <EmptyState emoji="🔍" title="No activities match these filters." />;
  return (
    <>
      <p className="mb-2 text-sm text-muted">{list.length} {list.length === 1 ? "activity" : "activities"}</p>
      <div className={cx("grid grid-cols-1 gap-3", cols)}>
        {list.map((a) => <LibraryCard key={a.id} activity={a} onOpen={() => onOpen(a)} />)}
      </div>
    </>
  );
}

// ---------- Detail ----------
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-line py-2 last:border-0">
      <div className="text-xs font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="text-[15px]">{children}</div>
    </div>
  );
}

export function TherapistActivityView({ activity }: { activity: Activity }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <ActivityArt activity={activity} className="size-24 shrink-0" />
        <div>
          <div className="flex items-center gap-2"><span className="text-xs font-bold text-muted">{activity.id} · v{activity.version}</span>
            {activity.status === "draft" ? <Chip tone="celebrate">Draft</Chip> : <Chip tone="success">Reviewed</Chip>}</div>
          <h3 className="text-xl font-bold">{activity.title_en}</h3>
          <div className="bn text-text-2">{activity.title_bn}</div>
        </div>
      </div>
      <div className="glass rounded-[12px] px-4 py-1">
        <Row label="Domain">{DOMAINS[activity.domain].emoji} {DOMAINS[activity.domain].en}</Row>
        <Row label="Slot">{SLOTS[activity.routine_slot].en}</Row>
        <Row label="Ages">{activity.age_bands.map((a) => (a === "parent" ? "Parent" : AGE_BANDS[a].en)).join(", ")}</Row>
        <Row label="Talking">{activity.comm_levels.map((c) => COMM_LEVELS[c].en).join(", ")}</Row>
        <Row label="Starts at">{DIFFICULTY[activity.difficulty].en} · {activity.minutes} min</Row>
        <Row label="Why">{activity.why_en}<div className="bn text-sm text-text-2">{activity.why_bn}</div></Row>
        <Row label="Needs">{activity.needs_en.join(", ")}</Row>
        <Row label="Success">{activity.success_en}</Row>
        <Row label="If upset">{activity.if_upset_en}</Row>
        <Row label="Conflicts">{activity.conflicts_with_flags.length ? activity.conflicts_with_flags.map((f) => <Chip key={f} tone="celebrate" className="mr-1">{f}</Chip>) : "None"}</Row>
        <Row label="Evidence">{activity.evidence.map((e) => <Chip key={e} tone="info" className="mb-1 mr-1">{e}</Chip>)}</Row>
      </div>
      <div>
        <h4 className="mb-2 font-bold">Steps</h4>
        <ol className="space-y-2">
          {activity.steps.map((s, i) => (
            <li key={i} className="glass flex gap-3 rounded-[12px] p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary">{i + 1}</span>
              <div><div>{s.text_en}</div><div className="bn text-sm text-text-2">{s.text_bn}</div></div>
            </li>
          ))}
        </ol>
      </div>
      <p className="rounded-[12px] bg-info-soft p-3 text-sm">{activity.safety_note_en}</p>
    </div>
  );
}

export function ParentPreview({ activity, childName }: { activity: Activity; childName?: string }) {
  const [lang, setLang] = useState<Lang>("bn");
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-muted">Exactly what the parent sees.</p>
        <Segmented value={lang} onChange={setLang} options={[{ value: "bn", label: "বাংলা" }, { value: "en", label: "English" }]} />
      </div>
      <div className="mx-auto w-full max-w-[380px] rounded-[36px] border-[6px] border-[#1c1c1e] bg-bg p-3 shadow-xl">
        <div className="max-h-[620px] overflow-y-auto no-scrollbar text-[18px]">
          <ActivityDetailView activity={activity} lang={lang} childName={childName} footer={
            <div className="pt-1"><div className="grid min-h-14 place-items-center rounded-2xl bg-primary text-lg font-semibold text-white">{lang === "bn" ? "শুরু করুন" : "Start"}</div></div>
          } />
        </div>
      </div>
    </div>
  );
}

export function ActivityDetailPanel({ activity, childName }: { activity: Activity; childName?: string }) {
  const [tab, setTab] = useState<"therapist" | "parent">("therapist");
  return (
    <div className="space-y-4">
      <Segmented value={tab} onChange={setTab} options={[{ value: "therapist", label: "Therapist view" }, { value: "parent", label: "Parent preview" }]} />
      {tab === "therapist" ? <TherapistActivityView activity={activity} /> : <ParentPreview activity={activity} childName={childName} />}
    </div>
  );
}

// ---------- Drawer ----------
export function LibraryDrawer({ open, onClose, mode, activityId, initialFilters, excludeIds, onAssign, assignLabel, childName }: {
  open: boolean; onClose: () => void; mode: "browse" | "assign" | "read"; activityId?: string; initialFilters?: ActivityFilters;
  excludeIds?: string[]; onAssign?: (a: Activity) => void; assignLabel?: string; childName?: string;
}) {
  if (!open) return null;
  return (
    <DrawerInner key={`${activityId ?? ""}-${JSON.stringify(initialFilters ?? {})}`} {...{ onClose, mode, activityId, initialFilters, excludeIds, onAssign, assignLabel, childName }} />
  );
}

function DrawerInner({ onClose, mode, activityId, initialFilters, excludeIds, onAssign, assignLabel, childName }: {
  onClose: () => void; mode: "browse" | "assign" | "read"; activityId?: string; initialFilters?: ActivityFilters;
  excludeIds?: string[]; onAssign?: (a: Activity) => void; assignLabel?: string; childName?: string;
}) {
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters ?? {});
  const [selectedId, setSelectedId] = useState<string | undefined>(activityId);
  const { data: selected, loading } = useLoad(() => (selectedId ? libraryService.getActivity(selectedId) : Promise.resolve(undefined)), [selectedId]);
  const showList = !selectedId && mode !== "read";

  const title = showList ? (mode === "assign" ? `Add an activity${childName ? ` for ${childName}` : ""}` : "Activity library") : selected?.title_en ?? "Activity";
  return (
    <Drawer open onClose={onClose} title={title} wide>
      {showList ? (
        <div className="space-y-4">
          <LibraryFilters filters={filters} onChange={setFilters} compact />
          <LibraryGrid filters={filters} excludeIds={excludeIds} onOpen={(a) => setSelectedId(a.id)} cols="sm:grid-cols-2" />
        </div>
      ) : (
        <div className="space-y-4">
          {mode !== "read" && (
            <button onClick={() => setSelectedId(undefined)} className="flex min-h-10 items-center gap-1 text-sm font-semibold text-primary">
              <ArrowLeft className="size-4" /> Back to library
            </button>
          )}
          {loading || !selected ? <SkeletonList rows={3} h="h-32" /> : (
            <>
              <ActivityDetailPanel activity={selected} childName={childName} />
              {mode === "assign" && onAssign && (
                <div className="glass-strong sticky bottom-0 -mx-1 rounded-2xl p-3">
                  {selected.status === "draft" ? (
                    <p className="text-center text-sm font-semibold text-text-2">Draft — not yet reviewed. It can&apos;t be assigned.</p>
                  ) : (
                    <Button block size="lg" onClick={() => { onAssign(selected); onClose(); }}>
                      {assignLabel ?? `Assign to ${childName ?? "child"}`}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}
