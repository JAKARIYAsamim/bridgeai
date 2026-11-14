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
import { useLang } from "@/lib/i18n";
import { AGE_BANDS, COMM_LEVELS, DIFFICULTY, DOMAINS, nameIn, num, SLOTS } from "@/lib/labels";
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
  const { lang, L } = useLang();
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
          placeholder={L("নাম বা আইডি দিয়ে খুঁজুন…", "Search by title, ID or evidence")}
          aria-label={L("অনুশীলন খুঁজুন", "Search activities")}
          className="field"
          style={{ paddingLeft: 38 }}
        />
        <span
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50)",
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
          {more ? L("ফিল্টার লুকান", "Hide filters") : `${L("ফিল্টার", "Filters")}${active ? ` (${num(active, lang)})` : ""}`}
        </button>
      )}

      {more && (
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <ChipRow<Domain>
            label={L("বিষয়", "Domain")}
            value={filters.domain}
            onChange={(v) => set({ domain: v })}
            options={(Object.keys(DOMAINS) as Domain[])
              .filter((d) => d !== "early_learning")
              .map((d) => ({
                value: d,
                label: `${DOMAINS[d].emoji} ${lang === "bn" ? DOMAINS[d].bn : DOMAINS[d].en}`,
              }))}
          />
          <ChipRow<RoutineSlot>
            label={L("সময়সূচি", "Routine slot")}
            value={filters.routine_slot}
            onChange={(v) => set({ routine_slot: v })}
            options={(Object.keys(SLOTS) as RoutineSlot[]).map((s) => ({
              value: s,
              label: `${SLOTS[s].emoji} ${lang === "bn" ? SLOTS[s].bn : SLOTS[s].en}`,
            }))}
          />
          <ChipRow<AgeBand>
            label={L("বয়স", "Age band")}
            value={filters.age_band}
            onChange={(v) => set({ age_band: v })}
            options={(Object.keys(AGE_BANDS) as AgeBand[]).map((a) => ({
              value: a,
              label: lang === "bn" ? AGE_BANDS[a].bn : AGE_BANDS[a].en,
            }))}
          />
          <ChipRow<CommLevel>
            label={L("যোগাযোগের ধাপ", "Communication level")}
            value={filters.comm_level}
            onChange={(v) => set({ comm_level: v })}
            options={(Object.keys(COMM_LEVELS) as CommLevel[]).map((c) => ({
              value: c,
              label: lang === "bn" ? COMM_LEVELS[c].bn : COMM_LEVELS[c].en,
            }))}
          />
          <ChipRow<Difficulty>
            label={L("সহায়তার ধাপ", "Prompt level")}
            value={filters.difficulty}
            onChange={(v) => set({ difficulty: v })}
            options={[1, 2, 3].map((d) => ({
              value: d as Difficulty,
              label: lang === "bn" ? DIFFICULTY[d].bn : DIFFICULTY[d].en,
            }))}
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={filters.includeDrafts === false}
              onChange={(e) =>
                set({ includeDrafts: e.target.checked ? false : undefined })
              }
            />
            <span>{L("শুধু অনুমোদিত (খসড়া ছাড়া)", "Reviewed only (hide drafts)")}</span>
          </label>

          {active > 0 && (
            <button
              className="link"
              type="button"
              style={{ marginTop: 8 }}
              onClick={() =>
                onChange({ search: filters.search, includeDrafts: filters.includeDrafts })
              }
            >
              {L("ফিল্টার মুছুন", "Clear filters")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Cards & Grid ----------
function ageBandsSummary(a: Activity, lang: Lang): string {
  const bands = a.age_bands.filter((b) => b !== "parent") as AgeBand[];
  if (!bands.length) return "";
  return bands.map((b) => (lang === "bn" ? AGE_BANDS[b].bn : AGE_BANDS[b].en)).join(", ");
}

export function LibraryCard({
  activity,
  onOpen,
}: {
  activity: Activity;
  onOpen: () => void;
}) {
  const { lang, L } = useLang();
  const flagged = activity.conflicts_with_flags.length > 0;
  const ages = ageBandsSummary(activity, lang);

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <span className="small" style={{ fontWeight: 700 }}>{activity.id}</span>
        {activity.status === "draft" ? (
          <Chip tone="celebrate">{L("খসড়া", "Draft")}</Chip>
        ) : (
          <Chip tone="success">{L("অনুমোদিত", "Reviewed")}</Chip>
        )}
        {flagged && <Chip tone="alert">{L("⚠ সতর্কতা", "⚠ Flags")}</Chip>}
        <div className="grow" />
        <span className="small">{L(`${num(activity.minutes, lang)} মিনিট`, `${activity.minutes} min`)}</span>
      </div>

      <p className="h3">{lang === "bn" ? activity.title_bn : activity.title_en}</p>
      <p className={lang === "bn" ? "small" : "bn small"} style={{ marginTop: 2, color: "var(--mute)" }}>
        {lang === "bn" ? activity.title_en : activity.title_bn}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        <Chip tone="primary">
          {DOMAINS[activity.domain].emoji} {lang === "bn" ? DOMAINS[activity.domain].bn : DOMAINS[activity.domain].en}
        </Chip>
        <Chip>
          {SLOTS[activity.routine_slot].emoji} {lang === "bn" ? SLOTS[activity.routine_slot].bn : SLOTS[activity.routine_slot].en}
        </Chip>
        <Chip tone="info">{L(`ধাপ ${num(activity.difficulty, lang)}`, `Step ${activity.difficulty}`)}</Chip>
      </div>

      <div
        className="small"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 10px",
          marginTop: 8,
          color: "var(--mute)",
        }}
      >
        {ages && <span>{L(`বয়স: ${ages}`, `Age: ${ages}`)}</span>}
        {activity.comm_levels.length > 0 && (
          <span>
            {L("যোগাযোগ: ", "Comm: ")}
            {activity.comm_levels
              .map((c) => (lang === "bn" ? COMM_LEVELS[c].bn : COMM_LEVELS[c].en))
              .join(", ")}
          </span>
        )}
      </div>
    </button>
  );
}

export function LibraryGrid({
  filters,
  excludeIds = [],
  onOpen,
  groupByDomain = false,
}: {
  filters: ActivityFilters;
  excludeIds?: string[];
  onOpen: (a: Activity) => void;
  cols?: string;
  groupByDomain?: boolean;
}) {
  const { lang, L } = useLang();
  const key = JSON.stringify(filters);
  const includeDrafts = filters.includeDrafts !== false;
  const { data, loading, error, reload } = useLoad(
    () => libraryService.listActivities({ ...filters, includeDrafts }),
    [key],
  );
  const list = useMemo(
    () => (data ?? []).filter((a) => !excludeIds.includes(a.id)),
    [data, excludeIds],
  );

  if (loading && !data) return <SkeletonList rows={4} h="h-28" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!list.length) return <EmptyState emoji="🔍" title={L("কোনো অনুশীলন মেলেনি।", "No activities match these filters.")} />;

  const header = (
    <p
      className="small"
      style={{ margin: "0 2px 8px", color: "var(--mute)", fontWeight: 600 }}
    >
      {L(`${num(list.length, lang)}টি অনুশীলন`, `${list.length} activit${list.length === 1 ? "y" : "ies"}`)}
    </p>
  );

  if (!groupByDomain) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {header}
        {list.map((a) => (
          <LibraryCard key={a.id} activity={a} onOpen={() => onOpen(a)} />
        ))}
      </div>
    );
  }

  const groups = new Map<Domain, Activity[]>();
  for (const a of list) {
    const bucket = groups.get(a.domain) ?? [];
    bucket.push(a);
    groups.set(a.domain, bucket);
  }
  const domainOrder = Object.keys(DOMAINS) as Domain[];
  const sortedDomains = domainOrder.filter((d) => groups.has(d));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {header}
      {sortedDomains.map((d) => {
        const items = groups.get(d)!;
        return (
          <div key={d} style={{ marginBottom: 12 }}>
            <p
              className="small"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                margin: "4px 2px 6px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                color: "var(--mute)",
              }}
            >
              <span>{DOMAINS[d].emoji}</span>
              <span>{lang === "bn" ? DOMAINS[d].bn : DOMAINS[d].en}</span>
              <span style={{ color: "var(--mute)", fontWeight: 500 }}>· {num(items.length, lang)}</span>
            </p>
            {items.map((a) => (
              <LibraryCard key={a.id} activity={a} onOpen={() => onOpen(a)} />
            ))}
          </div>
        );
      })}
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
  const { lang, L } = useLang();
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters ?? {});
  const [selectedId, setSelectedId] = useState<string | undefined>(activityId);
  const { data: selected, loading } = useLoad(
    () => (selectedId ? libraryService.getActivity(selectedId) : Promise.resolve(undefined)),
    [selectedId],
  );
  const showList = !selectedId && mode !== "read";

  const cName = nameIn(childName ?? "", lang);
  const title = showList
    ? mode === "assign"
      ? L(`${cName ? `${cName}-এর জন্য ` : ""}অনুশীলন যোগ করুন`, `Add an activity${childName ? ` for ${childName}` : ""}`)
      : L("অ্যাক্টিভিটি লাইব্রেরি", "Activity library")
    : selected
    ? lang === "bn"
      ? selected.title_bn
      : selected.title_en
    : L("অনুশীলন", "Activity");

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
              <span>{L("লাইব্রেরিতে ফিরুন", "Back to library")}</span>
            </button>
          )}
          {loading || !selected ? (
            <SkeletonList rows={3} h="h-32" />
          ) : (
            <>
              <ActivityDetailView activity={selected} lang={lang} childName={cName} />
              {mode === "assign" && onAssign && (
                <div style={{ marginTop: 14 }}>
                  {selected.status === "draft" ? (
                    <p className="small" style={{ textAlign: "center", color: "var(--mute)" }}>
                      {L("খসড়া — এখনো অনুমোদন করা হয়নি। যুক্ত করা যাবে না।", "Draft — not yet reviewed. It can’t be assigned.")}
                    </p>
                  ) : (
                    <Button
                      block
                      onClick={() => {
                        onAssign(selected);
                        onClose();
                      }}
                    >
                      {assignLabel ?? L(`${cName || "শিশু"}-কে দিন`, `Assign to ${childName ?? "child"}`)}
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
  lang: langProp,
  childName,
}: {
  activity: Activity;
  lang?: Lang;
  childName?: string;
}) {
  const { lang: currentLang } = useLang();
  const lang = langProp ?? currentLang ?? "bn";
  return <ActivityDetailView activity={activity} lang={lang} childName={childName} />;
}
