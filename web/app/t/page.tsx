"use client";
// T-01 Therapist home — matches prototype doctorHome()
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/legacy/icons";
import { Cloud, Ele } from "@/components/legacy/mascots";
import { Button, EmptyState, ErrorState, Skeleton, SkeletonList } from "@/components/ui";
import { useLoad, useSession } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { AGE_BANDS, ago, fmtDate, nameIn, num } from "@/lib/labels";
import { alertService, childService, feedbackService, planService } from "@/lib/services";

export default function TherapistHome() {
  const router = useRouter();
  const { user } = useSession();
  const { lang, L } = useLang();
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
  const nameOf = (id: string) => nameIn(data?.rows.find((r) => r.child.id === id)?.child.nickname ?? "Child", lang);

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
    ? L(`${num(openAlerts.length, lang)}টি জরুরি সতর্কতা!`, `${openAlerts.length} urgent alert${openAlerts.length > 1 ? "s" : ""}!`)
    : drafts.length
    ? L(`${num(drafts.length, lang)}টি ড্রাফট পর্যালোচনার বাকি`, `${drafts.length} draft${drafts.length > 1 ? "s" : ""} to review`)
    : freshNotes
    ? L(`${num(freshNotes, lang)}টি নতুন ফিডব্যাক!`, `${freshNotes} new feedback!`)
    : L("সব কাজ আপডেট আছে!", "All caught up!");

  const doctorTitle = user?.name ? nameIn(user.name, lang) : L("ডা. নাসরিন", "Dr. Nasrin");

  return (
    <div className="pad" style={{ paddingBottom: 88 }} lang={lang}>
      {/* Top greeting with Dr. Nasrin and Elephant Mascot */}
      <div className="greet">
        <h1>{L(`হ্যালো, ${doctorTitle}`, `Hey, ${doctorTitle}`)}</h1>
        <p>{L("চট্টগ্রাম শিশু বিকাশ কেন্দ্র", "Chattogram Child Development Centre")}</p>
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
          <span className="lab">{L("শিশুরা", "Children")}</span>
          <b>{num(all.length, lang)}</b>
          <span className="unit">{L("আওতাধীন", "in care")}</span>
        </div>

        <div className="tile">
          <span className="ic" style={{ color: "var(--orange)" }}>
            <Icon name="edit" />
          </span>
          <span className="lab">{L("পর্যালোচনা", "To review")}</span>
          <b>{num(drafts.length, lang)}</b>
          <span className="unit">{L("ড্রাফট", drafts.length === 1 ? "draft" : "drafts")}</span>
        </div>

        <Link href="/t/alerts" className="tile" style={{ textDecoration: "none" }}>
          <span className="ic" style={{ color: openAlerts.length ? "var(--pink)" : "var(--green)" }}>
            <Icon name="bell" />
          </span>
          <span className="lab">{L("সতর্কতা", "Alerts")}</span>
          <b style={{ color: openAlerts.length ? "var(--pink)" : undefined }}>{num(openAlerts.length, lang)}</b>
          <span className="unit">{L("সক্রিয়", "active")}</span>
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
        <p className="h3">{L("এই সপ্তাহে অভিভাবকদের অংশগ্রহণ", "Caregiver engagement this week")}</p>
        <div className="segbar">
          <i className="on" />
          <i className="on" />
          <i className="on" />
          <i className="on" />
          <i className="on" />
          <i className="" />
          <i className="" />
          <span>{num("5", lang)}/{num("7", lang)}</span>
        </div>
        <div className="bchips">
          <span>{L(`${num(all.filter((r) => r.roadmap?.status === "approved").length, lang)}টি পরিকল্পনা চালু`, `${all.filter((r) => r.roadmap?.status === "approved").length} plans live`)}</span>
          <span>{L(`${num(freshNotes, lang)}টি ফিডব্যাক নোট`, `${freshNotes} feedback notes`)}</span>
        </div>
      </div>

      <div className="in">
        {/* Needs attention */}
        <div className="sec">
          <h2 className="h2">{L("আপনার মনোযোগ প্রয়োজন", "Needs your attention")}</h2>
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
                {L(`${num(openAlerts.length, lang)}টি নিরাপত্তা সতর্কতা`, `${openAlerts.length} safety alert${openAlerts.length > 1 ? "s" : ""}`)}
              </span>
              <span className="small">
                {nameOf(openAlerts[0].childId)}: &ldquo;{openAlerts[0].matchedText}&rdquo; · {ago(openAlerts[0].createdAt, lang)}
              </span>
            </span>
            <span style={{ color: "var(--pink)" }}>
              <Icon name="next" />
            </span>
          </Link>
        )}

        {drafts.length > 0 &&
          drafts.map(({ child }) => {
            const cName = nameIn(child.nickname, lang);
            return (
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
                    {L(`${cName}-এর ড্রাফট পরিকল্পনা দেখুন`, `Review ${child.nickname}’s draft plan`)}
                  </span>
                  <span className="small">
                    {L("অনুমোদন না দেওয়া পর্যন্ত অভিভাবক দেখতে পাবেন না", "Parent cannot see it until you approve")}
                  </span>
                </span>
                <Icon name="next" />
              </button>
            );
          })}

        {reportsDue.map(({ child }) => {
          const cName = nameIn(child.nickname, lang);
          return (
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
                  {L(`${cName}-এর রিপোর্ট তৈরি করুন`, `Generate report for ${child.nickname}`)}
                </span>
                <span className="small">
                  {L(`পরবর্তী সেশন ${fmtDate(child.nextSessionDate!, lang)}`, `Next session ${fmtDate(child.nextSessionDate!, lang)}`)}
                </span>
              </span>
              <Icon name="next" />
            </button>
          );
        })}

        {/* Children list */}
        <div className="sec" style={{ marginTop: 18 }}>
          <h2 className="h2">{L("আমার শিশুরা", "My children")}</h2>
          <Button href="/t/children/new" size="sm" variant="soft" icon={<Icon name="spark" />}>
            {L("শিশু যোগ করুন", "Add child")}
          </Button>
        </div>

        {all.length === 0 ? (
          <EmptyState
            title={L("থেরাপি শুরু করতে প্রথম শিশুকে যুক্ত করুন", "Add your first child to begin therapy")}
            action={
              <Button href="/t/children/new" variant="primary">
                {L("শিশু যোগ করুন", "Add child")}
              </Button>
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {all.map(({ child, roadmap, newFeedback }) => {
              const tints = ["t-purple", "t-blue", "t-orange", "t-green"];
              const tint = tints[child.nickname.charCodeAt(0) % tints.length];
              const cName = nameIn(child.nickname, lang);
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
                    {cName[0]}
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="h3" style={{ fontWeight: 700 }}>
                        {cName}
                      </span>
                      <span className="small">
                        {L(`বয়স: ${lang === "bn" ? AGE_BANDS[child.ageBand].bn : AGE_BANDS[child.ageBand].en}`, `Age ${AGE_BANDS[child.ageBand].en}`)}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {!roadmap ? (
                        <span className="pill line">{L("পরিকল্পনা নেই", "No plan yet")}</span>
                      ) : roadmap.status === "draft" ? (
                        <span className="pill warn">{L("ড্রাফট বাকি", "Draft to review")}</span>
                      ) : (
                        <span className="pill good">{L("পরিকল্পনা চালু", "Plan live")}</span>
                      )}
                      {newFeedback > 0 && (
                        <span className="pill dark">
                          {L(`${num(newFeedback, lang)}টি নতুন ফিডব্যাক`, `${newFeedback} new feedback`)}
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
