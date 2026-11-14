"use client";
// T-05 Child overview — formatted for phone frame matching prototype childView()
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { InviteModal } from "@/components/invite-modal";
import { Icon } from "@/components/legacy/icons";
import { Button, Card, EmptyState, ErrorState, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { AGE_BANDS, ago, DOMAINS, fmtDate, MOODS, nameIn, num } from "@/lib/labels";
import { alertService, childService, feedbackService, libraryService, planService } from "@/lib/services";
import type { Activity, Checkin, Mood } from "@/lib/types";

export default function ChildOverview() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { lang, L } = useLang();
  const [invite, setInvite] = useState(false);
  const [clinicalOpen, setClinicalOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data, loading, error, reload } = useLoad(async () => {
    const [child, roadmap, caregivers, logs, checkins, feedback, ready, alerts, library] =
      await Promise.all([
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
    return {
      child,
      roadmap,
      caregivers,
      logs,
      checkins,
      feedback,
      ready,
      alerts: alerts.filter((a) => a.childId === id && !a.resolvedAt),
      library,
    };
  }, [id]);

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <SkeletonList rows={5} />
      </div>
    );
  }

  const { child, roadmap, caregivers, logs, checkins, feedback, ready, alerts, library } = data;
  const lib = new Map<string, Activity>(library.map((a) => [a.id, a]));
  const approved = roadmap?.status === "approved" ? roadmap : null;
  const cName = nameIn(child.nickname, lang);
  const userName = (uid: string) => nameIn(caregivers.find((c) => c.userId === uid)?.user.name ?? "Caregiver", lang);
  const parentName = caregivers[0]?.user.name ? nameIn(caregivers[0].user.name, lang) : child.caregiverPhone ?? L("অভিভাবক", "Parent");

  const topMood = (aid: string): Mood | null => {
    const c: Record<string, number> = {};
    logs.filter((l) => l.activityId === aid).forEach((l) => (c[l.mood] = (c[l.mood] || 0) + 1));
    const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return best ? (best[0] as Mood) : null;
  };
  const readyItems = ready.filter((aid) => !dismissed.includes(aid));
  const seen = new Set<string>();
  const current = approved
    ? approved.items.filter(
        (i) => i.phase === approved.currentPhase && i.active && !seen.has(i.activityId) && seen.add(i.activityId)
      )
    : [];

  return (
    <div className="pad" style={{ paddingBottom: 24 }} lang={lang}>
      {/* Top Bar with Child Details and Avatar */}
      <div className="bar" style={{ padding: "4px 8px 12px", alignItems: "center" }}>
        <Link href="/t" className="hbtn" aria-label={L("ফিরে যান", "Back")}>
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <p className="h2" style={{ margin: 0 }}>
            {cName}, {lang === "bn" ? AGE_BANDS[child.ageBand].bn : AGE_BANDS[child.ageBand].en}
          </p>
          <p className="small">
            {L(`অভিভাবক: ${parentName}`, `Parent: ${parentName}`)}
            {child.nextSessionDate ? ` · ${L("পরবর্তী সেশন: ", "Next session: ")}${fmtDate(child.nextSessionDate, lang)}` : ""}
          </p>
        </div>
        <span
          className="av t-purple"
          style={{ width: 40, height: 40, fontSize: 16 }}
        >
          {cName[0]}
        </span>
      </div>

      {/* Segmented Sub-navigation Tabs */}
      <div className="in" style={{ paddingBottom: 10 }}>
        <div className="seg">
          <button className="on" type="button">
            {L("সারসংক্ষেপ", "Summary")}
          </button>
          <button onClick={() => router.push(`/t/children/${id}/roadmap`)} type="button">
            {L("পরিকল্পনা", "Plan")} {roadmap?.status === "draft" ? "•" : ""}
          </button>
          <button onClick={() => router.push(`/t/children/${id}/feedback`)} type="button">
            {L("নোট", "Notes")} {feedback.filter((f) => !f.reviewedAt).length ? `(${num(feedback.filter((f) => !f.reviewedAt).length, lang)})` : ""}
          </button>
          <button onClick={() => router.push(`/t/children/${id}/report`)} type="button">
            {L("রিপোর্ট", "Report")}
          </button>
        </div>
      </div>

      <div className="in">
        {/* Safety alerts banner */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {alerts.map((a) => (
              <Link
                key={a.id}
                href="/t/alerts"
                className="row"
                style={{
                  background: "rgba(255, 69, 58, 0.08)",
                  borderColor: "rgba(255, 69, 58, 0.3)",
                  textDecoration: "none",
                }}
              >
                <span className="ic" style={{ background: "var(--pink)", color: "#fff", width: 36, height: 36 }}>
                  <Icon name="alert" />
                </span>
                <span className="grow">
                  <span className="h3" style={{ color: "var(--pink)", display: "block" }}>
                    {L("নিরাপত্তা সতর্কতা", "Safety alert")} · {ago(a.createdAt, lang)}
                  </span>
                  <span className="small">&ldquo;{a.matchedText}&rdquo;</span>
                </span>
                <Icon name="next" />
              </Link>
            ))}
          </div>
        )}

        {!approved ? (
          <div style={{ marginBottom: 16 }}>
            <EmptyState
              title={
                roadmap?.status === "draft"
                  ? L(`${cName}-এর ড্রাফট পরিকল্পনা পর্যালোচনার অপেক্ষায় আছে।`, `${child.nickname}’s draft plan is waiting for your review.`)
                  : L(`${cName}-এর এখনো কোনো পরিকল্পনা তৈরি করা হয়নি।`, `${child.nickname} has no plan yet.`)
              }
              action={
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {roadmap?.status === "draft" && (
                    <Button href={`/t/children/${id}/intake/review`} variant="primary" icon={<Icon name="edit" />}>
                      {L("ড্রাফট পরিকল্পনা দেখুন", "Review draft plan")}
                    </Button>
                  )}
                  <Button
                    variant={roadmap ? "soft" : "primary"}
                    href={`/t/children/${id}/intake`}
                    icon={<Icon name="spark" />}
                  >
                    {L("স্মার্ট ইনটেক", "Smart intake")}
                  </Button>
                  <Button variant="soft" href={`/t/children/${id}/roadmap`} icon={<Icon name="turn" />}>
                    {L("রোডম্যাপ সাজান", "Build roadmap")}
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <Button href={`/t/children/${id}/report`} variant="soft" icon={<Icon name="doc" />}>
                {L("রিপোর্ট তৈরি", "Report")}
              </Button>
              <Button variant="soft" onClick={() => setInvite(true)} icon={<Icon name="users" />}>
                {L("আমন্ত্রণ কোড", "Invite parent")}
              </Button>
            </div>

            {/* This week's activities */}
            <div className="sec">
              <h2 className="h2">{L("এই সপ্তাহের অনুশীলন", "This week's activities")}</h2>
              <span className="small">{L("বিগত ৭ দিন", "Last 7 days")}</span>
            </div>
            <Card style={{ padding: 14, marginBottom: 14 }}>
              {current.length === 0 ? (
                <p className="small">{L("এই ধাপে কোনো সক্রিয় অনুশীলন নেই।", "No active activities in this phase.")}</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {current.map((i) => {
                    const a = lib.get(i.activityId);
                    const done = new Set(logs.filter((l) => l.activityId === i.activityId).map((l) => l.date)).size;
                    const m = topMood(i.activityId);
                    const titleStr = a ? (lang === "bn" ? a.title_bn : a.title_en) : i.activityId;
                    const domainStr = a ? (lang === "bn" ? DOMAINS[a.domain].bn : DOMAINS[a.domain].en) : "";
                    return (
                      <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="grow" style={{ minWidth: 0 }}>
                          <p className="h3" style={{ fontSize: 15, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {titleStr}
                          </p>
                          <p className="small" style={{ margin: "2px 0 0" }}>
                            {domainStr} · {L(`ধাপ ${num(i.difficulty, lang)}`, `Step ${i.difficulty}`)}
                          </p>
                        </div>
                        <div style={{ width: 70, textAlign: "right" }}>
                          <div className="pbar" style={{ height: 6, margin: "0 0 2px" }}>
                            <i style={{ width: `${(done / 7) * 100}%` }} />
                          </div>
                          <span className="small">{num(done, lang)}/{num(7, lang)} {L("দিন", "days")}</span>
                        </div>
                        <span style={{ fontSize: 20, minWidth: 26, textAlign: "center" }}>
                          {m ? MOODS[m].emoji : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* 14-day trends */}
            <div className="sec">
              <h2 className="h2">{L("চেক-ইন ট্রেন্ড", "Check-in trends")}</h2>
              <span className="small">{L("বিগত ১৪ দিন", "Last 14 days")}</span>
            </div>
            <Card style={{ padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <TrendChart
                  title={L("মেজাজ", "Mood")}
                  checkins={checkins}
                  value={(c) => ({ happy: 2, neutral: 1, sad: 0 })[c.mood]}
                  labels={["😟", "😐", "😀"]}
                />
                <TrendChart
                  title={L("ঘুম", "Sleep")}
                  checkins={checkins}
                  value={(c) => ({ good: 2, ok: 1, poor: 0 })[c.sleep]}
                  labels={[L("খারাপ", "Poor"), L("মোটামুটি", "OK"), L("ভালো", "Good")]}
                />
              </div>
            </Card>

            {/* Next step prompt */}
            {readyItems.length > 0 && (
              <>
                <div className="sec">
                  <h2 className="h2">{L("পরের ধাপে যাওয়ার সময়?", "Ready for next step?")}</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {readyItems.map((aid) => {
                    const item = current.find((i) => i.activityId === aid);
                    if (!item) return null;
                    const a = lib.get(aid);
                    const titleStr = a ? (lang === "bn" ? a.title_bn : a.title_en) : aid;
                    return (
                      <Card key={aid} style={{ border: "1px solid var(--p)", padding: 12 }}>
                        <p className="h3" style={{ color: "var(--p)", marginBottom: 4 }}>
                          <Icon name="spark" style={{ marginRight: 6 }} />
                          {titleStr}
                        </p>
                        <p className="small">
                          {L(
                            `এই সপ্তাহে ধাপ ${num(item.difficulty, lang)}-এ 😀 ৩+ বার লগ হয়েছে।`,
                            `Logged 😀 3+ times this week at step ${item.difficulty}.`
                          )}
                        </p>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={async () => {
                              await planService.updatePlanItem(id, item.id, {
                                difficulty: (item.difficulty + 1) as 2 | 3,
                              });
                              toast(L(`ধাপ ${num(item.difficulty + 1, lang)}-এ উন্নীত হয়েছে`, `Moved to step ${item.difficulty + 1}`));
                              reload();
                            }}
                          >
                            {L(`ধাপ ${num(item.difficulty + 1, lang)}-এ নিন`, `Move to step ${item.difficulty + 1}`)}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDismissed([...dismissed, aid])}
                          >
                            {L("এখন নয়", "Not yet")}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {/* Recent feedback preview */}
            <div className="sec">
              <h2 className="h2">{L("বাড়ি থেকে সাম্প্রতিক নোট", "Recent notes from home")}</h2>
              <Link href={`/t/children/${id}/feedback`} className="link">
                {L(`সব দেখুন (${num(feedback.length, lang)})`, `See all (${feedback.length})`)}
              </Link>
            </div>
            {feedback.length === 0 ? (
              <Card style={{ marginBottom: 14 }}>
                <p className="small">{L("এই সপ্তাহে অভিভাবকের কাছ থেকে কোনো নোট নেই।", "No notes from caregiver yet this week.")}</p>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {feedback.slice(0, 3).map((f) => {
                  const act = f.activityId ? lib.get(f.activityId) : null;
                  const actTitle = act ? (lang === "bn" ? act.title_bn : act.title_en) : f.activityId ?? L("দ্রুত চেক-ইন", "Quick check-in");
                  return (
                    <Link
                      key={f.id}
                      href={`/t/children/${id}/feedback`}
                      className="row"
                      style={{ textDecoration: "none" }}
                    >
                      <span className="ic t-orange" style={{ width: 36, height: 36, fontSize: 16 }}>
                        <Icon name="mic" />
                      </span>
                      <span className="grow" style={{ minWidth: 0 }}>
                        <span className="h3" style={{ fontSize: 14, display: "block" }}>
                          {actTitle}
                        </span>
                        <span className="small">
                          {userName(f.caregiverId)} · {ago(f.createdAt, lang)}
                        </span>
                        <span
                          className="sub"
                          style={{
                            fontSize: 13,
                            display: "block",
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.summary_bn ?? f.summary_en ?? f.text ?? f.transcript ?? L("অডিও নোট", "Audio note")}
                        </span>
                      </span>
                      {!f.reviewedAt && <span className="pill dark">{L("নতুন", "New")}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Clinical records toggle */}
        <Card style={{ padding: 0 }}>
          <button
            onClick={() => setClinicalOpen(!clinicalOpen)}
            aria-expanded={clinicalOpen}
            type="button"
            style={{
              display: "flex",
              minHeight: 50,
              width: "100%",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Icon name="shield" style={{ color: "var(--p)", fontSize: 18 }} />
            <span className="grow h3" style={{ fontSize: 15 }}>
              {L("ক্লিনিক্যাল রেকর্ড", "Clinical record")} <span className="small">{L("(শুধু থেরাপিস্ট)", "(therapist only)")}</span>
            </span>
            <span style={{ transform: clinicalOpen ? "rotate(180deg)" : undefined, transition: "transform .2s" }}>
              <Icon name="next" />
            </span>
          </button>
          {clinicalOpen && (
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <div>
                <p className="small" style={{ fontWeight: 600, textTransform: "uppercase" }}>{L("ডায়াগনোসিস নোট", "Diagnosis notes")}</p>
                <p className="sub" style={{ fontSize: 14 }}>{child.clinical.diagnosisNotes || L("রেকর্ড নেই", "Not recorded")}</p>
              </div>
              <div>
                <p className="small" style={{ fontWeight: 600, textTransform: "uppercase" }}>{L("সহায়তার লেভেল", "Support level")}</p>
                <p className="sub" style={{ fontSize: 14 }}>{child.clinical.supportLevel ? L(`লেভেল ${num(child.clinical.supportLevel, lang)}`, `Level ${child.clinical.supportLevel}`) : L("নির্ধারিত নয়", "Not set")}</p>
              </div>
              <div>
                <p className="small" style={{ fontWeight: 600, textTransform: "uppercase" }}>{L("অ্যাসেসমেন্ট", "Assessments")}</p>
                {child.clinical.assessments.length ? (
                  <ul className="steps plain" style={{ padding: 0, margin: 0 }}>
                    {child.clinical.assessments.map((a, i) => (
                      <li key={i} style={{ fontSize: 14 }}>
                        {a.tool} · {a.date ? fmtDate(a.date, lang) : L("তারিখ নেই", "no date")} · {L("স্কোর: ", "score ")}{num(a.score || "—", lang)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="sub" style={{ fontSize: 14 }}>{L("কোনো অ্যাসেসমেন্ট রেকর্ড নেই", "None recorded")}</p>
                )}
              </div>
              <div>
                <p className="small" style={{ fontWeight: 600, textTransform: "uppercase" }}>{L("সতর্কতা / ফ্ল্যাগ", "Flags")}</p>
                <p className="sub" style={{ fontSize: 14 }}>{[...child.sensoryFlags, ...child.safetyFlags].join(", ") || L("কোনো ফ্ল্যাগ নেই", "None")}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <InviteModal open={invite} onClose={() => setInvite(false)} childId={id} childName={child.nickname} />
    </div>
  );
}

function TrendChart({
  title,
  checkins,
  value,
  labels,
}: {
  title: string;
  checkins: Checkin[];
  value: (c: Checkin) => number;
  labels: [string, string, string];
}) {
  const W = 280, H = 80, P = 8;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const pts = days.map((d, i) => {
    const c = checkins.find((x) => x.date === d);
    return c ? { x: P + (i * (W - 2 * P)) / 13, y: H - P - (value(c) * (H - 2 * P)) / 2 } : null;
  });
  const segs: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  pts.forEach((p) => {
    if (p) cur.push(p);
    else if (cur.length) {
      segs.push(cur);
      cur = [];
    }
  });
  if (cur.length) segs.push(cur);

  return (
    <div>
      <p className="small" style={{ fontWeight: 600, marginBottom: 4 }}>
        {title}
      </p>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 70, fontSize: 11, color: "var(--mute)" }}>
          {[...labels].reverse().map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 70 }} role="img" aria-label={title}>
          {[0, 1, 2].map((v) => (
            <line
              key={v}
              x1={P}
              x2={W - P}
              y1={H - P - (v * (H - 2 * P)) / 2}
              y2={H - P - (v * (H - 2 * P)) / 2}
              stroke="var(--line)"
            />
          ))}
          {segs.map((s, i) => (
            <polyline
              key={i}
              points={s.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="var(--p)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {pts.map((p, i) => p && <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--p)" />)}
        </svg>
      </div>
    </div>
  );
}
