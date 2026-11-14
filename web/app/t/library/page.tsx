"use client";
// T-07 Activity library
import { useState } from "react";
import { ActivityDetailPanel, LibraryFilters, LibraryGrid } from "@/components/library-drawer";
import { Drawer, PageTitle, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { libraryService } from "@/lib/services";
import type { ActivityFilters } from "@/lib/types";

export default function LibraryPage() {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: selected, loading } = useLoad(() => (openId ? libraryService.getActivity(openId) : Promise.resolve(undefined)), [openId]);
  return (
    <div>
      <PageTitle title="Activity library" sub="Preset cards grounded in WHO Caregiver Skills Training and NCAEP practices. Only reviewed cards can be assigned." />
      <div className="glass mb-5 rounded-[12px] p-4">
        <LibraryFilters filters={filters} onChange={setFilters} />
      </div>
      <LibraryGrid filters={filters} onOpen={(a) => setOpenId(a.id)} />
      <Drawer open={!!openId} onClose={() => setOpenId(null)} title={selected?.title_en ?? "Activity"} wide>
        {loading || !selected ? <SkeletonList rows={3} h="h-32" /> : <ActivityDetailPanel activity={selected} />}
      </Drawer>
    </div>
  );
}
