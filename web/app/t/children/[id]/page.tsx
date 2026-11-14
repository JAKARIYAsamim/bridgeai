"use client";
// T-05 Child overview
import { ArrowUpCircle, CalendarDays, ChevronDown, ClipboardList, FileText, Inbox, Lock, Map, ShieldAlert, Sparkles, UserPlus, Wrench } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { InviteModal } from "@/components/invite-modal";
import { Button, Card, Chip, cx, EmptyState, ErrorState, PageTitle, SectionTitle, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { AGE_BANDS, ago, DOMAINS, fmtDate, MOODS } from "@/lib/labels";
import { alertService, childService, feedbackService, libraryService, planService } from "@/lib/services";
import type { Activity, Checkin, Mood } from "@/lib/types";

export default function ChildOverview() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [invite, setInvite] = useState(false);
  const [clinicalOpen, setClinicalOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data, loading, error, reload } = useLoad(async () => {
    const [child, roadmap, caregivers, logs, checkins, feedback, ready, alerts, library] = await Promise.all([
      childService.getChild(id),
      planService.getRoadmap(id),
      childService.getCaregivers(id),
      feedbackService.listLogs(id, 7),
      feedbackService.listCheckins(id, 14),
      feedbackService.listFeedback(id),
      feedbackService.readyForNextStep(id),
      alertService.listAlerts(),
      libraryService.listActivities({ includeDrafts: true }),
    ]);
    return { child, roadmap, caregivers, logs, checkins, feedback, ready, alerts: alerts.filter((a) => a.childId === id && !a.resolvedAt), library };
  }, [id]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <SkeletonList rows={5} />;

  const { child, roadmap, caregivers, logs, checkins, feedback, ready, alerts, library } = data;
  const lib = new globalThis.Map<string, Activity>(library.map((a) => [a.id, a]));
  const approved = roadmap?.status === "approved" ? roadmap : null;
  const userName = (uid: string) => caregivers.find((c) => c.userId === uid)?.user.name ?? "Caregiver";

  const header = (
    <PageTitle
      title={child.nickname}
      sub={
        <span className="flex flex-wrap items-center gap-2">
          <span>Age {AGE_BANDS[child.ageBand].en}</span>
          {approved && <Chip tone="primary">{approved.phaseNames[approved.currentPhase - 1]}</Chip>}
          {child.nextSessionDate && <Chip icon={<CalendarDays className="size-3.5" />}>Next session {fmtDate(child.nextSessionDate)}</Chip>}
          {caregivers.length > 0 && <span className="text-sm text-muted">Caregivers: {caregivers.map((c) => `${c.user.name} (${c.relation})`).join(", ")}</span>}
        </span>
      }
      actions={approved ? (
        <>
          <Button href={`/t/children/${id}/report`} icon={<FileText className="size-5" />}>Generate report</Button>
          <Button variant="soft" href={`/t/children/${id}/roadmap`} icon={<Map className="size-5" />}>Edit roadmap</Button>
          <Button variant="soft" href={`/t/children/${id}/feedback`} icon={<Inbox className="size-5" />}>Feedback</Button>
          <Button variant="soft" onClick={() => setInvite(true)} icon={<UserPlus className="size-5" />}>Invite caregiver</Button>
        </>
      ) : undefined}
    />
  );

  const alertBox = alerts.length > 0 && (
    <div className="mb-5 space-y-2">
      {alerts.map((a) => (
        <Link key={a.id} href="/t/alerts" className="flex items-start gap-3 rounded-[12px] border border-alert/40 bg-alert-soft p-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-alert" />
          <div className="flex-1">
            <div className="font-bold text-alert">Safety alert · {ago(a.createdAt)}</div>
            <p className="text-sm">&ldquo;{a.matchedText}&rdquo;</p>
          </div>
          <span className="text-sm font-semibold text-alert">Open</span>
        </Link>
      ))}
    </div>
  );

  const clinical = (
    <Card className="mt-6 p-0">
      <button onClick={() => setClinicalOpen(!clinicalOpen)} aria-expanded={clinicalOpen} className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
        <Lock className="size-5 text-primary" />
        <span className="flex-1 font-semibold">Clinical record <span className="font-normal text-muted">(therapist only)</span></span>
        <ChevronDown className={cx("size-5 transition", clinicalOpen && "rotate-180")} />
      </button>
      {clinicalOpen && (
        <div className="space-y-3 border-t border-line p-4 text-sm">
          <div><div className="text-xs font-semibold uppercase text-muted">Diagnosis notes</div><p>{child.clinical.diagnosisNotes || "Not recorded"}</p></div>
          <div><div className="text-xs font-semibold uppercase text-muted">Support level</div><p>{child.clinical.supportLevel ? `Level ${child.clinical.supportLevel}` : "Not set"}</p></div>
          <div>
            <div className="text-xs font-semibold uppercase text-muted">Assessments</div>
            {child.clinical.assessments.length ? (
              <ul>{child.clinical.assessments.map((a, i) => <li key={i}>{a.tool} · {a.date ? fmtDate(a.date) : "no date"} · score {a.score || "—"}</li>)}</ul>
            ) : <p>None recorded</p>}
          </div>
          <div><div className="text-xs font-semibold uppercase text-muted">Co-occurring</div><p>{child.clinical.coOccurring || "None recorded"}</p></div>
          <div><div className="text-xs font-semibold uppercase text-muted">Flags</div><p>{[...child.sensoryFlags, ...child.safetyFlags].join(", ") || "None"}</p></div>
        </div>
      )}
    </Card>
  );

  if (!approved)
    return (
      <div>
        {header}
        {alertBox}
        <EmptyState
          emoji="🗺️"
          title={roadmap?.status === "draft" ? `${child.nickname}'s draft plan is waiting for your review.` : `${child.nickname} has no plan yet.`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {roadmap?.status === "draft" && <Button href={`/t/children/${id}/intake/review`} icon={<ClipboardList className="size-5" />}>Review draft</Button>}
              <Button variant={roadmap ? "soft" : "primary"} href={`/t/children/${id}/intake`} icon={<Sparkles className="size-5" />}>Smart intake</Button>
              <Button variant="soft" href={`/t/children/${id}/roadmap`} icon={<Wrench className="size-5" />}>Build it myself</Button>
            </div>
          }
        />
        {clinical}
      </div>
    );

  // this week, per current-phase activity
  const seen = new Set<string>();
  const current = approved.items.filter((i) => i.phase === approved.currentPhase && i.active && !seen.has(i.activityId) && seen.add(i.activityId));
  const topMood = (aid: string): Mood | null => {
    const c: Record<string, number> = {};
    logs.filter((l) => l.activityId === aid).forEach((l) => (c[l.mood] = (c[l.mood] || 0) + 1));
    const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return best ? (best[0] as Mood) : null;
  };
  const readyItems = ready.filter((aid) => !dismissed.includes(aid));

  return (
    <div>
      {header}
      {alertBox}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <SectionTitle action={<span className="text-xs text-muted">last 7 days</span>}>This week</SectionTitle>
          <Card className="space-y-3">
            {current.length === 0 && <p className="text-sm text-text-2">No active activities in this phase.</p>}
            {current.map((i) => {
              const a = lib.get(i.activityId);
              const done = new Set(logs.filter((l) => l.activityId === i.activityId).map((l) => l.date)).size;
              const m = topMood(i.activityId);
              return (
                <div key={i.id} className="grid grid-cols-[minmax(0,1fr)_120px_44px] items-center gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{a?.title_en ?? i.activityId}</div>
                    <div className="text-xs text-muted">{a ? DOMAINS[a.domain].en : ""} · Step {i.difficulty}</div>
                  </div>
                  <div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-primary-soft" aria-label={`${done} of 7 days`}>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(done / 7) * 100}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-muted">{done} of 7 days</div>
                  </div>
                  <span className="text-2xl" title={m ? MOODS[m].en : "No logs"}>{m ? MOODS[m].emoji : <span className="text-sm text-muted">—</span>}</span>
                </div>
              );
            })}
          </Card>

          <SectionTitle action={<span className="text-xs text-muted">from daily check-ins</span>}>Last 14 days</SectionTitle>
          <Card className="grid gap-4 md:grid-cols-3">
            <TrendChart title="Mood" checkins={checkins} value={(c) => ({ happy: 2, neutral: 1, sad: 0 })[c.mood]} labels={["😟", "😐", "😀"]} />
            <TrendChart title="Sleep" checkins={checkins} value={(c) => ({ good: 2, ok: 1, poor: 0 })[c.sleep]} labels={["Poor", "OK", "Good"]} />
            <TrendChart title="Meltdowns" checkins={checkins} value={(c) => ({ none: 0, few: 1, many: 2 })[c.meltdowns]} labels={["None", "1–2", "3+"]} />
          </Card>

          <SectionTitle>Goals</SectionTitle>
          <Card className="space-y-2">
            {approved.goals.map((g) => (
              <div key={g.id} className="flex items-start gap-2">
                <Chip tone="primary">{DOMAINS[g.domain].emoji} {DOMAINS[g.domain].en}</Chip>
                <span className="text-[15px]">{g.text}</span>
              </div>
            ))}
          </Card>
          {clinical}
        </div>

        <aside>
          {readyItems.length > 0 && (
            <>
              <SectionTitle>Ready for next step?</SectionTitle>
              <div className="space-y-2">
                {readyItems.map((aid) => {
                  const item = current.find((i) => i.activityId === aid);
                  if (!item) return null;
                  return (
                    <Card key={aid} className="ring-1 ring-celebrate/40">
                      <div className="flex items-center gap-2 font-semibold"><ArrowUpCircle className="size-5 text-celebrate" />{lib.get(aid)?.title_en ?? aid}</div>
                      <p className="mt-1 text-sm text-text-2">Logged 😀 3 or more times this week at step {item.difficulty}.</p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={async () => {
                          await planService.updatePlanItem(id, item.id, { difficulty: (item.difficulty + 1) as 2 | 3 });
                          toast(`Moved to step ${item.difficulty + 1}`);
                        }}>Move to step {item.difficulty + 1}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDismissed([...dismissed, aid])}>Not yet</Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          <SectionTitle action={<Link href={`/t/children/${id}/feedback`} className="text-sm font-semibold text-primary">Inbox</Link>}>Latest feedback</SectionTitle>
          {feedback.length === 0 ? (
            <Card className="text-sm text-text-2">No feedback yet.</Card>
          ) : (
            <div className="space-y-2">
              {feedback.slice(0, 3).map((f) => (
                <Link key={f.id} href={`/t/children/${id}/feedback`} className="glass block rounded-[12px] p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{f.activityId ? lib.get(f.activityId)?.title_en ?? f.activityId : "Quick note"}</span>
                    {!f.reviewedAt && <Chip tone="celebrate">New</Chip>}
                    {f.flags.includes("safety_concern") && <Chip tone="alert">Safety</Chip>}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">{userName(f.caregiverId)} · {f.type} · {ago(f.createdAt)}</div>
                  <p className="mt-1 line-clamp-2 text-sm">{f.summary_en ?? f.text ?? f.transcript}</p>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
      <InviteModal open={invite} onClose={() => setInvite(false)} childId={id} childName={child.nickname} />
    </div>
  );
}

/** Simple 14-day line on a 0–2 scale. Days without a check-in are gaps. */
function TrendChart({ title, checkins, value, labels }: { title: string; checkins: Checkin[]; value: (c: Checkin) => number; labels: [string, string, string] }) {
  const W = 220, H = 90, P = 6;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const pts = days.map((d, i) => {
    const c = checkins.find((x) => x.date === d);
    return c ? { x: P + (i * (W - 2 * P)) / 13, y: H - P - (value(c) * (H - 2 * P)) / 2 } : null;
  });
  // split into segments at gaps
  const segs: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  pts.forEach((p) => { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } });
  if (cur.length) segs.push(cur);
  return (
    <figure>
      <figcaption className="mb-1 text-sm font-semibold">{title}</figcaption>
      <div className="flex gap-1.5">
        <div className="flex h-[90px] flex-col justify-between py-0.5 text-[10px] text-muted">{[...labels].reverse().map((l) => <span key={l}>{l}</span>)}</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[90px] w-full" role="img" aria-label={`${title} over the last 14 days`}>
          {[0, 1, 2].map((v) => <line key={v} x1={P} x2={W - P} y1={H - P - (v * (H - 2 * P)) / 2} y2={H - P - (v * (H - 2 * P)) / 2} stroke="var(--line)" />)}
          {segs.map((s, i) => <polyline key={i} points={s.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />)}
          {pts.map((p, i) => p && <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--primary)" />)}
        </svg>
      </div>
      <div className="mt-1 flex justify-between pl-7 text-[10px] text-muted"><span>14 days ago</span><span>Today</span></div>
    </figure>
  );
}
