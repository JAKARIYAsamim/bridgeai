"use client";
// T-07 Activity library — phone-friendly layout
import { useState } from "react";
import { ActivityDetailPanel, LibraryFilters, LibraryGrid } from "@/components/library-drawer";
import { BottomSheet, Card, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { libraryService } from "@/lib/services";
import type { ActivityFilters } from "@/lib/types";

export default function LibraryPage() {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: selected, loading } = useLoad(
    () => (openId ? libraryService.getActivity(openId) : Promise.resolve(undefined)),
    [openId]
  );

  return (
    <div className="pad" style={{ paddingBottom: 88 }}>
      <div className="bar" style={{ padding: "4px 8px 12px" }}>
        <div className="grow">
          <h1 className="h2">Activity library</h1>
          <p className="small">Grounded in WHO CST &amp; NCAEP practices</p>
        </div>
      </div>

      <div className="in">
        <Card style={{ padding: 12, marginBottom: 14 }}>
          <LibraryFilters filters={filters} onChange={setFilters} />
        </Card>

        <LibraryGrid filters={filters} onOpen={(a) => setOpenId(a.id)} />

        <BottomSheet
          open={!!openId}
          onClose={() => setOpenId(null)}
          title={selected?.title_en ?? "Activity"}
        >
          {loading || !selected ? (
            <SkeletonList rows={3} h="h-32" />
          ) : (
            <ActivityDetailPanel activity={selected} />
          )}
        </BottomSheet>
      </div>
    </div>
  );
}
