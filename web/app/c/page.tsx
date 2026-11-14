"use client";
// C-01 Centre overview: families, therapists, weekly logging rate, families who may need a call.
import { Activity as ActivityIcon, PhoneCall, Users, UserRound } from "lucide-react";
import Link from "next/link";
import { Card, Chip, EmptyState, ErrorState, PageTitle, SectionTitle, Skeleton, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { fmtDate } from "@/lib/labels";
import { authService, childService, feedbackService, planService } from "@/lib/services";

type Row = { id: string; nickname: string; therapistId: string; therapist: string; hasPlan: boolean; days7: number; last?: string };

async function loadOverview() {
  const [children, therapists, centre] = await Promise.all([childService.listChildren(), authService.listUsers("therapist"), authService.getCentre()]);
  const rows: Row[] = await Promise.all(
    children.map(async (c) => {
      const [rm, logs7, logs30] = await Promise.all([planService.getRoadmap(c.id), feedbackService.listLogs(c.id, 7), feedbackService.listLogs(c.id, 30)]);
      const last = logs30.map((l) => l.date).sort().pop();
      return {
        id: c.id, nickname: c.nickname, therapistId: c.therapistId,
        therapist: therapists.find((t) => t.id === c.therapistId)?.name ?? "—",
        hasPlan: rm?.status === "approved", days7: new Set(logs7.map((l) => l.date)).size, last,
      };
    }),
  );
  return { rows, therapists, centre };
}

export default function CentreOverview() {
  const { data, loading, error, reload } = useLoad(loadOverview, []);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data)
    return (
      <div>
        <Skeleton className="mb-6 h-9 w-64" />
        <div className="mb-6 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        <SkeletonList rows={3} />
      </div>
    );

  const { rows, therapists, centre } = data;
  const withPlan = rows.filter((r) => r.hasPlan);
  const logging = withPlan.filter((r) => r.days7 >= 3);
  const rate = withPlan.length ? Math.round((logging.length / withPlan.length) * 100) : 0;
  const quiet = withPlan.filter((r) => r.days7 === 0);

  const stats = [
    { label: "Families", value: rows.length, sub: `${withPlan.length} with a live plan`, icon: <Users className="size-5" /> },
    { label: "Therapists", value: therapists.length, sub: centre.name, icon: <UserRound className="size-5" /> },
    { label: "Weekly logging rate", value: `${rate}%`, sub: `${logging.length} of ${withPlan.length} families logged 3+ days this week`, icon: <ActivityIcon className="size-5" /> },
  ];

  return (
    <div>
      <PageTitle title="Centre overview" sub={`${centre.name} · ${centre.city}`} />
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="rise">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-2"><span className="text-primary">{s.icon}</span>{s.label}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{s.value}</div>
            <div className="mt-1 text-xs text-muted">{s.sub}</div>
          </Card>
        ))}
      </div>

      <SectionTitle action={<Link href="/c/families" className="text-sm font-semibold text-primary">All families</Link>}>Families who may need a call</SectionTitle>
      {quiet.length === 0 ? (
        <EmptyState emoji="🌤️" title="Every family with a plan has logged in the last 7 days." />
      ) : (
        <div className="space-y-2">
          {quiet.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-celebrate-soft font-bold text-[#b36800]">{r.nickname[0]}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{r.nickname}</div>
                <div className="text-sm text-muted">{r.therapist} · Last activity {r.last ? fmtDate(r.last) : "none in 30 days"}</div>
              </div>
              <Chip tone="celebrate" icon={<PhoneCall className="size-3.5" />}>Follow up</Chip>
            </Card>
          ))}
        </div>
      )}

      <SectionTitle>Therapists</SectionTitle>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-3">Therapist</th><th className="px-4 py-3">Children</th><th className="px-4 py-3">Families logging 3+ days</th></tr>
          </thead>
          <tbody>
            {therapists.map((t) => {
              const mine = rows.filter((r) => r.therapistId === t.id);
              return (
                <tr key={t.id} className="border-t border-line">
                  <td className="px-4 py-3"><div className="font-semibold">{t.name}</div><div className="text-xs text-muted">{t.profession}</div></td>
                  <td className="px-4 py-3">{mine.length}</td>
                  <td className="px-4 py-3">{mine.filter((r) => r.hasPlan && r.days7 >= 3).length} of {mine.filter((r) => r.hasPlan).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
