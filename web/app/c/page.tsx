"use client";
// C-01 Centre overview — matches prototype centreHome()
import Link from "next/link";
import { Icon } from "@/components/legacy/icons";
import { Ele } from "@/components/legacy/mascots";
import { EmptyState, ErrorState, SkeletonList } from "@/components/ui";
import { useLoad, useSession } from "@/lib/hooks";
import { fmtDate, nameIn, num, PROFESSIONS_DATA } from "@/lib/labels";
import { useLang } from "@/lib/i18n";
import { authService, childService, feedbackService, planService } from "@/lib/services";

type Row = {
  id: string;
  nickname: string;
  therapistId: string;
  therapist: string;
  hasPlan: boolean;
  days7: number;
  last?: string;
};

async function loadOverview() {
  const [children, therapists, centre] = await Promise.all([
    childService.listChildren(),
    authService.listUsers("therapist"),
    authService.getCentre(),
  ]);
  const rows: Row[] = await Promise.all(
    children.map(async (c) => {
      const [rm, logs7, logs30] = await Promise.all([
        planService.getRoadmap(c.id),
        feedbackService.listLogs(c.id, 7),
        feedbackService.listLogs(c.id, 30),
      ]);
      const last = logs30
        .map((l) => l.date)
        .sort()
        .pop();
      return {
        id: c.id,
        nickname: c.nickname,
        therapistId: c.therapistId,
        therapist: therapists.find((t) => t.id === c.therapistId)?.name ?? "—",
        hasPlan: rm?.status === "approved",
        days7: new Set(logs7.map((l) => l.date)).size,
        last,
      };
    })
  );
  return { rows, therapists, centre };
}

export default function CentreOverview() {
  const { lang, L } = useLang();
  const { user } = useSession();
  const { data, loading, error, reload } = useLoad(loadOverview, []);

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
        <SkeletonList rows={4} h="h-24" />
      </div>
    );
  }

  const { rows, therapists, centre } = data;
  const withPlan = rows.filter((r) => r.hasPlan);
  const logging = withPlan.filter((r) => r.days7 >= 3);
  const quiet = withPlan.filter((r) => r.days7 === 0);
  const managerName = user?.name ? user.name.split(" ")[0] : (lang === "bn" ? "ম্যানেজার" : "Manager");

  return (
    <div className="pad" style={{ paddingBottom: 88 }}>
      {/* Top greeting with Elephant Mascot */}
      <div className="greet">
        <h1>{lang === "bn" ? `হ্যালো, ${nameIn(managerName, "bn")}` : `Hey, ${managerName}`}</h1>
        <p>{centre.name}</p>
        <span className="bubble">
          {quiet.length
            ? (lang === "bn" ? `${num(quiet.length, "bn")}টি পরিবার অনিয়মিত` : `${quiet.length} quiet ${quiet.length === 1 ? "family" : "families"}`)
            : (lang === "bn" ? "সব পরিবার নিয়মিত" : "All families active")}
        </span>
        <div className="masc">
          <Ele mood="hi" extra="doctor" />
        </div>
      </div>

      {/* 3 Metric Tiles */}
      <div className="tiles">
        <Link href="/c/therapists" className="tile" style={{ textDecoration: "none" }}>
          <span className="ic" style={{ color: "var(--p)" }}>
            <Icon name="users" />
          </span>
          <span className="lab">{L("থেরাপিস্ট", "Therapists")}</span>
          <b>{num(therapists.length, lang)}</b>
          <span className="unit">{L("সেন্টারে কর্মরত", "at centre")}</span>
        </Link>

        <Link href="/c/families" className="tile" style={{ textDecoration: "none" }}>
          <span className="ic" style={{ color: "var(--blue)" }}>
            <Icon name="heart" />
          </span>
          <span className="lab">{L("শিশু", "Children")}</span>
          <b>{num(rows.length, lang)}</b>
          <span className="unit">{L("চিকিৎসাধীন", "in care")}</span>
        </Link>

        <div className="tile">
          <span className="ic" style={{ color: "var(--green)" }}>
            <Icon name="mic" />
          </span>
          <span className="lab">{L("নিয়মিত", "Active")}</span>
          <b>{num(logging.length, lang)}</b>
          <span className="unit">{L("এই সপ্তাহে", "this week")}</span>
        </div>
      </div>

      <div className="in">
        {quiet.length > 0 && (
          <div className="warnbar" style={{ margin: "14px 0" }}>
            <Icon name="alert" />
            <span>
              {lang === "bn"
                ? `${num(quiet.length, "bn")}টি পরিবার এই সপ্তাহে কোনো আপডেট দেয়নি`
                : `${quiet.length} ${quiet.length === 1 ? "family has" : "families have"} not left a note this week`}
            </span>
          </div>
        )}

        {/* Needs follow-up */}
        <div className="sec">
          <h2 className="h2">{L("যোগাযোগ প্রয়োজন এমন পরিবার", "Families who may need a call")}</h2>
          <Link href="/c/families" className="link">
            {L("সবগুলো দেখুন", "See all")} ({num(rows.length, lang)})
          </Link>
        </div>

        {quiet.length === 0 ? (
          <EmptyState title={L("পরিকল্পনাভুক্ত সব পরিবার গত ৭ দিনে নিয়মিত অংশগ্রহণ করেছে।", "Every family with a plan has logged in the last 7 days.")} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {quiet.map((r) => (
              <div key={r.id} className="row" style={{ alignItems: "center" }}>
                <span
                  className="av t-orange"
                  style={{ width: 40, height: 40, fontSize: 16 }}
                >
                  {r.nickname[0]}
                </span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <span className="h3" style={{ fontSize: 15, display: "block" }}>
                    {r.nickname}
                  </span>
                  <span className="small">
                    {nameIn(r.therapist, lang)} · {r.last ? (lang === "bn" ? `সর্বশেষ ${fmtDate(r.last, "bn")}` : `Last ${fmtDate(r.last)}`) : (lang === "bn" ? "৩০ দিনে কোনো লগ নেই" : "none in 30d")}
                  </span>
                </div>
                <span className="pill warn">
                  {L("খোঁজ নিন", "Follow up")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Therapists team overview */}
        <div className="sec">
          <h2 className="h2">{L("থেরাপিস্ট দল", "Therapists")}</h2>
          <Link href="/c/therapists" className="link">
            {L("টিম ভিউ", "Team view")}
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {therapists.map((t) => {
            const mine = rows.filter((r) => r.therapistId === t.id);
            const activeMine = mine.filter((r) => r.hasPlan && r.days7 >= 3).length;
            const ratio = mine.length ? activeMine / mine.length : 1;
            const profession = (t.profession ? PROFESSIONS_DATA[t.profession]?.[lang] : undefined) ?? t.profession ?? L("থেরাপিস্ট", "Therapist");
            return (
              <div key={t.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    className="av t-blue"
                    style={{ width: 40, height: 40, fontSize: 16 }}
                  >
                    {t.name.replace(/^Dr\.?\s+/, "")[0]}
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <p className="h3" style={{ fontSize: 15, margin: 0 }}>
                      {nameIn(t.name, lang)}
                    </p>
                    <p className="small" style={{ margin: "2px 0 0" }}>
                      {lang === "bn"
                        ? `${num(mine.length, "bn")}টি শিশু · ${profession}`
                        : `${mine.length} children · ${t.profession}`}
                    </p>
                  </div>
                  <span className={`pill ${ratio >= 0.8 ? "good" : ratio >= 0.5 ? "" : "warn"}`}>
                    {lang === "bn"
                      ? `${num(activeMine, "bn")}/${num(mine.length, "bn")} নিয়মিত`
                      : `${activeMine}/${mine.length} active`}
                  </span>
                </div>
                <div className="pbar" style={{ marginTop: 8, height: 6 }}>
                  <i
                    className={ratio >= 0.8 ? "good" : ratio >= 0.5 ? "" : "warn"}
                    style={{ width: `${Math.round(ratio * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
