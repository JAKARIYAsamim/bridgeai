"use client";
// T-01 Therapist home
import { CalendarDays, ChevronRight, FileText, MessageSquare, Plus, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Chip, EmptyState, ErrorState, PageTitle, SectionTitle, SkeletonList } from "@/components/ui";
import { useLoad, useSession } from "@/lib/hooks";
import { AGE_BANDS, ago, fmtDate } from "@/lib/labels";
import { alertService, childService, feedbackService, planService } from "@/lib/services";

export default function TherapistHome() {
  const router = useRouter();
  const { user } = useSession();
  const { data, loading, error, reload } = useLoad(async () => {
    const children = await childService.listChildren();
    const rows = await Promise.all(
      children.map(async (c) => {
        const [roadmap, feedback, reports] = await Promise.all([
          planService.getRoadmap(c.id),
          feedbackService.listFeedback(c.id),
          feedbackService.listReports(c.id),
        ]);
        return { child: c, roadmap, newFeedback: feedback.filter((f) => !f.reviewedAt).length, reports };
      }),
    );
    const alerts = await alertService.listAlerts();
    return { rows, alerts };
  }, []);

  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const reportsDue =
    data?.rows.filter(
      (r) =>
        r.roadmap?.status === "approved" &&
        r.child.nextSessionDate &&
        new Date(r.child.nextSessionDate + "T23:59:59") <= weekAhead &&
        !r.reports.some((rep) => rep.approvedAt && new Date(rep.approvedAt) >= weekAgo),
    ) ?? [];
  const openAlerts = data?.alerts.filter((a) => !a.resolvedAt) ?? [];
  const nameOf = (id: string) => data?.rows.find((r) => r.child.id === id)?.child.nickname ?? "Child";

  return (
    <div>
      <PageTitle
        title={`Good day${user ? `, ${user.name}` : ""}`}
        sub="Your children, today's alerts and reports due."
        actions={<Button href="/t/children/new" icon={<Plus className="size-5" />}>Add child</Button>}
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            <SectionTitle>Children</SectionTitle>
            {loading && !data ? (
              <SkeletonList rows={3} />
            ) : !data?.rows.length ? (
              <EmptyState emoji="🧒" title="Add your first child" action={<Button href="/t/children/new" icon={<Plus className="size-5" />}>Add child</Button>} />
            ) : (
              <div className="space-y-3">
                {data.rows.map(({ child, roadmap, newFeedback }) => (
                  <Card
                    key={child.id}
                    className="flex items-center gap-4"
                    onClick={() => router.push(roadmap ? `/t/children/${child.id}` : `/t/children/${child.id}/intake`)}
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-lg font-bold text-primary">{child.nickname[0]}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[17px] font-bold">{child.nickname}</span>
                        <span className="text-sm text-muted">Age {AGE_BANDS[child.ageBand].en}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {!roadmap ? (
                          <Chip>No plan yet</Chip>
                        ) : roadmap.status === "draft" ? (
                          <Chip tone="info">Draft to review</Chip>
                        ) : (
                          <Chip tone="primary">{roadmap.phaseNames[roadmap.currentPhase - 1].split(":")[0]}</Chip>
                        )}
                        {newFeedback > 0 && (
                          <Chip tone="celebrate" icon={<MessageSquare className="size-3.5" />}>{newFeedback} new feedback</Chip>
                        )}
                        {child.nextSessionDate && (
                          <Chip icon={<CalendarDays className="size-3.5" />}>Next session {fmtDate(child.nextSessionDate)}</Chip>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-muted" />
                  </Card>
                ))}
              </div>
            )}
          </section>

          <aside>
            <SectionTitle action={<Link href="/t/alerts" className="text-sm font-semibold text-primary">All alerts</Link>}>Today&apos;s alerts</SectionTitle>
            {loading && !data ? (
              <SkeletonList rows={1} h="h-16" />
            ) : openAlerts.length === 0 ? (
              <Card className="text-sm text-text-2">No alerts. All quiet.</Card>
            ) : (
              <div className="space-y-2">
                {openAlerts.map((a) => (
                  <Link key={a.id} href="/t/alerts" className="block rounded-[12px] border border-alert/30 bg-alert-soft p-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-alert"><ShieldAlert className="size-4" />{nameOf(a.childId)} · {ago(a.createdAt)}</div>
                    <p className="mt-1 line-clamp-2 text-sm">&ldquo;{a.matchedText}&rdquo;</p>
                  </Link>
                ))}
              </div>
            )}

            <SectionTitle>Reports due</SectionTitle>
            {loading && !data ? (
              <SkeletonList rows={1} h="h-16" />
            ) : reportsDue.length === 0 ? (
              <Card className="text-sm text-text-2">No reports due this week.</Card>
            ) : (
              <div className="space-y-2">
                {reportsDue.map(({ child }) => (
                  <Card key={child.id} className="flex items-center gap-3" onClick={() => router.push(`/t/children/${child.id}/report`)}>
                    <FileText className="size-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-semibold">{child.nickname}</div>
                      <div className="text-xs text-muted">Session {fmtDate(child.nextSessionDate!)}</div>
                    </div>
                    <ChevronRight className="size-4 text-muted" />
                  </Card>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
