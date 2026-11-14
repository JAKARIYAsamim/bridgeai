"use client";
// T-07 Activity library — phone-friendly layout
import { useState } from "react";
import { ActivityDetailPanel, LibraryFilters, LibraryGrid } from "@/components/library-drawer";
import { BottomSheet, Card, FilterChip, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { libraryService } from "@/lib/services";
import type { ActivityFilters } from "@/lib/types";

export default function LibraryPage() {
  const { lang, L } = useLang();
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [groupByDomain, setGroupByDomain] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: selected, loading } = useLoad(
    () => (openId ? libraryService.getActivity(openId) : Promise.resolve(undefined)),
    [openId]
  );

  return (
    <div className="pad" style={{ paddingBottom: 88 }} lang={lang}>
      <div className="bar" style={{ padding: "4px 8px 12px" }}>
        <div className="grow">
          <h1 className="h2">{L("অ্যাক্টিভিটি লাইব্রেরি", "Activity library")}</h1>
          <p className="small">{L("WHO CST ও NCAEP নির্দেশিকাভিত্তিক", "Grounded in WHO CST & NCAEP practices")}</p>
        </div>
      </div>

      <div className="in">
        <Card style={{ padding: 12, marginBottom: 14 }}>
          <LibraryFilters filters={filters} onChange={setFilters} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderTop: "1px solid var(--line, rgba(0,0,0,0.08))",
              paddingTop: 10,
              marginTop: 4,
              flexWrap: "wrap",
            }}
          >
            <span className="small" style={{ fontWeight: 600, color: "var(--mute)" }}>
              {L("প্রদর্শন", "View")}
            </span>
            <FilterChip active={groupByDomain} onClick={() => setGroupByDomain(true)}>
              {L("বিষয়ভিত্তিক", "By domain")}
            </FilterChip>
            <FilterChip active={!groupByDomain} onClick={() => setGroupByDomain(false)}>
              {L("একটানা তালিকা", "Flat list")}
            </FilterChip>
          </div>
        </Card>

        <LibraryGrid
          filters={filters}
          groupByDomain={groupByDomain}
          onOpen={(a) => setOpenId(a.id)}
        />

        <BottomSheet
          open={!!openId}
          onClose={() => setOpenId(null)}
          title={selected ? (lang === "bn" ? selected.title_bn : selected.title_en) : L("অনুশীলন", "Activity")}
        >
          {loading || !selected ? (
            <SkeletonList rows={3} h="h-32" />
          ) : (
            <ActivityDetailPanel activity={selected} lang={lang} />
          )}
        </BottomSheet>
      </div>
    </div>
  );
}
