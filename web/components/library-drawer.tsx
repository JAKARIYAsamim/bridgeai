"use client";
// Activity library pieces redesigned for the phone frame:
// stacked rows/cards, segmented filters, and bottom sheets instead of side drawers.
import { useMemo, useState } from "react";
import { ActivityDetailView } from "@/components/activity-view";
import { Icon } from "@/components/legacy/icons";
import {
  BottomSheet,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  FilterChip,
  SkeletonList,
} from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { AGE_BANDS, COMM_LEVELS, DOMAINS, SLOTS } from "@/lib/labels";
import { libraryService } from "@/lib/services";
import type {
  Activity,
  ActivityFilters,
  AgeBand,
  CommLevel,
  Difficulty,
  Domain,
  Lang,
  RoutineSlot,
} from "@/lib/types";

// ---------- Filters ----------
function ChipRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: T;
  options: { value: T; label: string }[];
  onChange: (v?: T) => void;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p className="small" style={{ fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>
        {label}
      </p>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
        {options.map((o) => (
          <FilterChip
            key={String(o.value)}
            active={value === o.value}
            onClick={() => onChange(value === o.value ? undefined : o.value)}
          >
            {o.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

export function LibraryFilters({
  filters,
  onChange,
  compact,
}: {
  filters: ActivityFilters;
  onChange: (f: ActivityFilters) => void;
  compact?: boolean;
}) {
  const [more, setMore] = useState(!compact);
  const set = (patch: Partial<ActivityFilters>) => onChange({ ...filters, ...patch });
  const active = [
    filters.domain,
    filters.routine_slot,
    filters.age_band,
    filters.comm_level,
    filters.difficulty,
  ].filter(Boolean).length;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          value={filters.search ?? ""}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search by title, ID or evidence"
          aria-label="Search activities"
          className="field"
          style={{ paddingLeft: 38 }}
        />
        <span
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--mute)",
            fontSize: 18,
          }}
        >
          <Icon name="turn" />
        </span>
      </div>

      {compact && (
        <button
          onClick={() => setMore(!more)}
          className="link"
          type="button"
          style={{ marginBottom: 6 }}
        >
          {more ? "Hide filters" : `Filters${active ? ` (${active})` : ""}`}
        </button>
      )}

      {more && (
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <ChipRow<Domain>
            label="Domain"
            value={filters.domain}
            onChange={(v) => set({ domain: v })}
            options={(Object.keys(DOMAINS) as Domain[])
              .filter((d) => d !== "early_learning")
              .map((d) => ({ value: d, label: `${DOMAINS[d].emoji} ${DOMAINS[d].en}` }))}
          />
          <ChipRow<RoutineSlot>
            label="Slot"
            value={filters.routine_slot}
            onChange={(v) => set({ routine_slot: v })}
            options={(Object.keys(SLOTS) as RoutineSlot[]).map((s) => ({
              value: s,
              label: SLOTS[s].en,
            }))}
          />
          <ChipRow<AgeBand>
            label="Age"
            value={filters.age_band}
            onChange={(v) => set({ age_band: v })}
            options={(Object.keys(AGE_BANDS) as AgeBand[]).map((a) => ({
              value: a,
              label: AGE_BANDS[a].en,
            }))}
          />
          <ChipRow<CommLevel>
            label="Talking"
            value={filters.comm_level}
            onChange={(v) => set({ comm_level: v })}
            options={(Object.keys(COMM_LEVELS) as CommLevel[]).map((c) => ({
              value: c,
              label: COMM_LEVELS[c].en,
            }))}
          />
          <ChipRow<Difficulty>
            label="Step"
            value={filters.difficulty}
            onChange={(v) => set({ difficulty: v })}
            options={[1, 2, 3].map((d) => ({ value: d as Difficulty, label: `Step ${d}` }))}
          />
          {active > 0 && (
            <button
              className="link"
              type="button"
              onClick={() =>
                onChange({ search: filters.search, includeDrafts: filters.includeDrafts })
              }
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Cards & Grid ----------
export function LibraryCard({
  activity,
  onOpen,
}: {
  activity: Activity;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="card"
      type="button"
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        padding: 12,
        width: "100%",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span className="small" style={{ fontWeight: 700 }}>{activity.id}</span>
        {activity.status === "draft" && <Chip tone="celebrate">Draft</Chip>}
        <div className="grow" />
        <span className="small">{activity.minutes} min</span>
      </div>

      <p className="h3">{activity.title_en}</p>
      <p className="bn small" style={{ marginTop: 2 }}>{activity.title_bn}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        <Chip tone="primary">{DOMAINS[activity.domain].en}</Chip>
        <Chip>{SLOTS[activity.routine_slot].en}</Chip>
      </div>
    </button>
  );
}

export function LibraryGrid({
  filters,
  excludeIds = [],
  onOpen,
}: {
  filters: ActivityFilters;
  excludeIds?: string[];
  onOpen: (a: Activity) => void;
  cols?: string;
}) {
  const key = JSON.stringify(filters);
  const { data, loading, error, reload } = useLoad(
    () => libraryService.listActivities({ includeDrafts: true, ...filters }),
    [key],
  );
  const list = useMemo(
    () => (data ?? []).filter((a) => !excludeIds.includes(a.id)),
    [data, excludeIds],
  );

  if (loading && !data) return <SkeletonList rows={4} h="h-28" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!list.length) return <EmptyState emoji="🔍" title="No activities match these filters." />;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {list.map((a) => (
        <LibraryCard key={a.id} activity={a} onOpen={() => onOpen(a)} />
      ))}
    </div>
  );
}

// ---------- Drawer ----------
export function LibraryDrawer({
  open,
  onClose,
  mode = "browse",
  activityId,
  initialFilters,
  excludeIds,
  onAssign,
  assignLabel,
  childName,
}: {
  open: boolean;
  onClose: () => void;
  mode?: "browse" | "assign" | "read";
  activityId?: string;
  initialFilters?: ActivityFilters;
  excludeIds?: string[];
  onAssign?: (a: Activity) => void;
  assignLabel?: string;
  childName?: string;
}) {
  if (!open) return null;
  return (
    <DrawerInner
      key={`${activityId ?? ""}-${JSON.stringify(initialFilters ?? {})}`}
      {...{
        onClose,
        mode,
        activityId,
        initialFilters,
        excludeIds,
        onAssign,
        assignLabel,
        childName,
      }}
    />
  );
}

function DrawerInner({
  onClose,
  mode,
  activityId,
  initialFilters,
  excludeIds,
  onAssign,
  assignLabel,
  childName,
}: {
  onClose: () => void;
  mode: "browse" | "assign" | "read";
  activityId?: string;
  initialFilters?: ActivityFilters;
  excludeIds?: string[];
  onAssign?: (a: Activity) => void;
  assignLabel?: string;
  childName?: string;
}) {
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters ?? {});
  const [selectedId, setSelectedId] = useState<string | undefined>(activityId);
  const { data: selected, loading } = useLoad(
    () => (selectedId ? libraryService.getActivity(selectedId) : Promise.resolve(undefined)),
    [selectedId],
  );
  const showList = !selectedId && mode !== "read";

  const title = showList
    ? mode === "assign"
      ? `Add an activity${childName ? ` for ${childName}` : ""}`
      : "Activity library"
    : selected?.title_en ?? "Activity";

  return (
    <BottomSheet open onClose={onClose} title={title}>
      {showList ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <LibraryFilters filters={filters} onChange={setFilters} compact />
          <LibraryGrid
            filters={filters}
            excludeIds={excludeIds}
            onOpen={(a) => setSelectedId(a.id)}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode !== "read" && (
            <button
              onClick={() => setSelectedId(undefined)}
              className="link"
              type="button"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 4 }}
            >
              <Icon name="back" />
              <span>Back to library</span>
            </button>
          )}
          {loading || !selected ? (
            <SkeletonList rows={3} h="h-32" />
          ) : (
            <>
              <ActivityDetailView activity={selected} lang="en" childName={childName} />
              {mode === "assign" && onAssign && (
                <div style={{ marginTop: 14 }}>
                  {selected.status === "draft" ? (
                    <p className="small" style={{ textAlign: "center", color: "var(--mute)" }}>
                      Draft — not yet reviewed. It can&apos;t be assigned.
                    </p>
                  ) : (
                    <Button
                      block
                      onClick={() => {
                        onAssign(selected);
                        onClose();
                      }}
                    >
                      {assignLabel ?? `Assign to ${childName ?? "child"}`}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

export function ActivityDetailPanel({
  activity,
  lang = "en",
  childName,
}: {
  activity: Activity;
  lang?: Lang;
  childName?: string;
}) {
  return <ActivityDetailView activity={activity} lang={lang} childName={childName} />;
}
