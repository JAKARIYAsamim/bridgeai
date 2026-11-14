"use client";
// C-03 Families: summary only (no feedback media, no clinical record).
import { Search } from "lucide-react";
import { useState } from "react";
import { Card, Chip, EmptyState, ErrorState, inputCls, PageTitle, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { AGE_BANDS, fmtDate } from "@/lib/labels";
import { authService, childService, feedbackService, planService } from "@/lib/services";

const RELATION: Record<string, string> = { mother: "mother", father: "father", grandparent: "grandparent", other: "caregiver" };

async function loadFamilies() {
  const [children, therapists] = await Promise.all([childService.listChildren(), authService.listUsers("therapist")]);
  return Promise.all(
    children.map(async (c) => {
      const [rm, cgs, logs] = await Promise.all([planService.getRoadmap(c.id), childService.getCaregivers(c.id), feedbackService.listLogs(c.id, 60)]);
      return {
        id: c.id, nickname: c.nickname, ageBand: c.ageBand,
        therapist: therapists.find((t) => t.id === c.therapistId)?.name ?? "—",
        caregivers: cgs.map((g) => `${g.user.name} (${RELATION[g.relation]})`),
        plan: rm ? rm.status : null,
        last: logs.map((l) => l.date).sort().pop(),
      };
    }),
  );
}

export default function Families() {
  const [q, setQ] = useState("");
  const { data, loading, error, reload } = useLoad(loadFamilies, []);
  const rows = (data ?? []).filter((r) => `${r.nickname} ${r.therapist} ${r.caregivers.join(" ")}`.toLowerCase().includes(q.toLowerCase().trim()));

  return (
    <div>
      <PageTitle title="Families" sub={data ? `${data.length} families` : undefined} />
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input className={`${inputCls()} pl-10`} placeholder="Search child, therapist or caregiver" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search families" />
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <SkeletonList rows={4} h="h-14" />
      ) : rows.length === 0 ? (
        <EmptyState emoji="🔍" title={q ? "No families match your search." : "No families yet."} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Child</th><th className="px-4 py-3">Age</th><th className="px-4 py-3">Therapist</th>
                <th className="px-4 py-3">Caregivers</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold">{r.nickname}</td>
                  <td className="px-4 py-3">{AGE_BANDS[r.ageBand].en}</td>
                  <td className="px-4 py-3">{r.therapist}</td>
                  <td className="px-4 py-3 text-text-2">{r.caregivers.length ? r.caregivers.join(", ") : <span className="text-muted">Not joined yet</span>}</td>
                  <td className="px-4 py-3">
                    {r.plan === "approved" ? <Chip tone="success">Plan live</Chip> : r.plan === "draft" ? <Chip tone="info">Draft</Chip> : <Chip>No plan yet</Chip>}
                  </td>
                  <td className="px-4 py-3">{r.last ? fmtDate(r.last) : <span className="text-muted">No activity yet</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
