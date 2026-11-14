"use client";
// T-01 Therapist home — matches prototype doctorHome()
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/legacy/icons";
import { Cloud, Ele } from "@/components/legacy/mascots";
import { Button, EmptyState, ErrorState, Skeleton, SkeletonList } from "@/components/ui";
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
      })
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
        !r.reports.some((rep) => rep.approvedAt && new Date(rep.approvedAt) >= weekAgo)
    ) ?? [];
  const openAlerts = data?.alerts.filter((a) => !a.resolvedAt) ?? [];
  const drafts = data?.rows.filter((r) => r.roadmap?.status === "draft") ?? [];
  const freshNotes = data?.rows.reduce((sum, r) => sum + r.newFeedback, 0) ?? 0;
  const nameOf = (id: string) => data?.rows.find((r) => r.child.id === id)?.child.nickname ?? "Child";

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="pad in" style={{ paddingTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-24 card" />
        <SkeletonList rows={4} h="h-20" />
      </div>
    );
  }

  const all = data.rows;
  const bubble = openAlerts.length
    ? `${openAlerts.length} urgent alert${openAlerts.length > 1 ? "s" : ""}!`
    : drafts.length
    ? `${drafts.length} draft${drafts.length > 1 ? "s" : ""} to review`
    : freshNotes
    ? `${freshNotes} new feedback!`
    : "All caught up!";

  return (
    <div className="pad" style={{ paddingBottom: 88 }}>
      {/* Top greeting with Dr. Nasrin and Elephant Mascot */}
      <div className="greet">
        <h1>Hey, {user?.name ? user.name.split(" ")[0] : "Dr. Nasrin"}</h1>
        <p>Chattogram Child Development Centre</p>
        <span className="bubble">{bubble}</span>
        <div className="masc">
          <Ele mood="hi" extra="doctor" />
        </div>
      </div>

      {/* 3 Metric Glass Tiles */}
      <div className="tiles">
        <div className="tile">
          <span className="ic" style={{ color: "var(--p)" }}>
            <Icon name="users" />
          </span>
          <span className="lab">Children</span>
          <b>{all.length}</b>
          <span className="unit">in care</span>
        </div>

        <div className="tile">
          <span className="ic" style={{ color: "var(--orange)" }}>
            <Icon name="edit" />
          </span>
          <span className="lab">To review</span>
          <b>{drafts.length}</b>
          <span className="unit">{drafts.length === 1 ? "draft" : "drafts"}</span>
        </div>

        <Link href="/t/alerts" className="tile" style={{ textDecoration: "none" }}>
          <span className="ic" style={{ color: openAlerts.length ? "var(--pink)" : "var(--green)" }}>
            <Icon name="bell" />
          </span>
          <span className="lab">Alerts</span>
          <b style={{ color: openAlerts.length ? "var(--pink)" : undefined }}>{openAlerts.length}</b>
          <span className="unit">active</span>
        </Link>
      </div>

      {/* Cloud & Progress Banner */}
      <div className="banner" style={{ margin: "14px 0" }}>
        <div className="cl">
          <Cloud />
        </div>
        <div className="m">
          <Ele mood="calm" extra="doctor" />
        </div>
        <div className="cl b">
          <Cloud />
        </div>
        <p className="h3">Caregiver engagement this week</p>
        <div className="segbar">
          <i className="on" />
          <i className="on" />
          <i className="on" />
          <i className="on" />
          <i className="on" />
          <i className="" />
          <i className="" />
          <span>5/7</span>
        </div>
        <div className="bchips">
          <span>{all.filter((r) => r.roadmap?.status === "approved").length} plans live</span>
          <span>{freshNotes} feedback notes</span>
        </div>
      </div>

      <div className="in">
        {/* Needs attention */}
        <div className="sec">
          <h2 className="h2">Needs your attention</h2>
        </div>

        {openAlerts.length > 0 && (
          <Link
            href="/t/alerts"
            className="row"
            style={{
              textDecoration: "none",
              marginBottom: 10,
              background: "rgba(255, 69, 58, 0.08)",
              borderColor: "rgba(255, 69, 58, 0.25)",
            }}
          >
            <span
              className="ic"
              style={{
                background: "var(--pink)",
                color: "#fff",
                width: 40,
                height: 40,
                fontSize: 18,
              }}
            >
              <Icon name="alert" />
            </span>
            <span className="grow">
              <span className="h3" style={{ display: "block", color: "var(--pink)" }}>
                {openAlerts.length} safety alert{openAlerts.length > 1 ? "s" : ""}
              </span>
              <span className="small">
                {nameOf(openAlerts[0].childId)}: &ldquo;{openAlerts[0].matchedText}&rdquo; · {ago(openAlerts[0].createdAt)}
              </span>
            </span>
            <span style={{ color: "var(--pink)" }}>
              <Icon name="next" />
            </span>
          </Link>
        )}

        {drafts.length > 0 &&
          drafts.map(({ child }) => (
            <button
              key={child.id}
              onClick={() => router.push(`/t/children/${child.id}/intake/review`)}
              className="row"
              style={{ marginBottom: 10 }}
              type="button"
            >
              <span className="ic t-orange">
                <Icon name="edit" />
              </span>
              <span className="grow">
                <span className="h3" style={{ display: "block" }}>
                  Review {child.nickname}’s draft plan
                </span>
                <span className="small">Parent cannot see it until you approve</span>
              </span>
              <Icon name="next" />
            </button>
          ))}

        {reportsDue.map(({ child }) => (
          <button
            key={child.id}
            onClick={() => router.push(`/t/children/${child.id}/report`)}
            className="row"
            style={{ marginBottom: 10 }}
            type="button"
          >
            <span className="ic t-blue">
              <Icon name="doc" />
            </span>
            <span className="grow">
              <span className="h3" style={{ display: "block" }}>
                Generate report for {child.nickname}
              </span>
              <span className="small">Next session {fmtDate(child.nextSessionDate!)}</span>
            </span>
            <Icon name="next" />
          </button>
        ))}

        {/* Children list */}
        <div className="sec" style={{ marginTop: 18 }}>
          <h2 className="h2">My children</h2>
          <Button href="/t/children/new" size="sm" variant="soft" icon={<Icon name="spark" />}>
            Add child
          </Button>
        </div>

        {all.length === 0 ? (
          <EmptyState
            title="Add your first child to begin therapy"
            action={
              <Button href="/t/children/new" variant="primary">
                Add child
              </Button>
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {all.map(({ child, roadmap, newFeedback }) => {
              const tints = ["t-purple", "t-blue", "t-orange", "t-green"];
              const tint = tints[child.nickname.charCodeAt(0) % tints.length];
              return (
                <div
                  key={child.id}
                  onClick={() =>
                    router.push(roadmap ? `/t/children/${child.id}` : `/t/children/${child.id}/intake`)
                  }
                  role="button"
                  tabIndex={0}
                  className="row"
                  style={{ cursor: "pointer", alignItems: "center" }}
                >
                  <span
                    className={`av ${tint}`}
                    style={{ width: 44, height: 44, fontSize: 18 }}
                  >
                    {child.nickname[0]}
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="h3" style={{ fontWeight: 700 }}>
                        {child.nickname}
                      </span>
                      <span className="small">Age {AGE_BANDS[child.ageBand].en}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {!roadmap ? (
                        <span className="pill line">No plan yet</span>
                      ) : roadmap.status === "draft" ? (
                        <span className="pill warn">Draft to review</span>
                      ) : (
                        <span className="pill good">Plan live</span>
                      )}
                      {newFeedback > 0 && (
                        <span className="pill dark">
                          {newFeedback} new feedback
                        </span>
                      )}
                    </div>
                  </div>
                  <Icon name="next" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
