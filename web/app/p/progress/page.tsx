"use client";
// P-07 Progress: this week's wins. No streaks, no missed counts, no comparisons.
import { AudioPlayer } from "@/components/media";
import { ActivityArt, Card, EmptyState, ErrorState, Skeleton, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { fmtDate, nameIn, num } from "@/lib/labels";
import { authService, childService, feedbackService, libraryService } from "@/lib/services";
import type { Activity } from "@/lib/types";

export default function Progress() {
  const { lang, L } = useLang();
  const { data, loading, error, reload } = useLoad(async () => {
    const child = await childService.getMyChild();
    const [logs, replies, summaries, library, therapists] = await Promise.all([
      feedbackService.listLogs(child.id, 7),
      feedbackService.myReplies(),
      feedbackService.mySharedSummaries(),
      libraryService.listActivities(),
      authService.listUsers("therapist"),
    ]);
    return {
      child,
      logs,
      replies,
      summaries,
      library,
      therapist: therapists.find((u) => u.id === child.therapistId)?.name ?? "Dr. Nasrin",
    };
  }, []);

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
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-32 card" />
        <SkeletonList rows={3} />
      </div>
    );
  }

  const { child, logs, replies, summaries, library } = data;
  const byId = new Map<string, Activity>(library.map((a) => [a.id, a]));
  const happy: Record<string, number> = {};
  logs
    .filter((l) => l.mood === "happy")
    .forEach((l) => (happy[l.activityId] = (happy[l.activityId] || 0) + 1));
  const top = Object.entries(happy)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const name = nameIn(child.nickname, lang);
  const therapist = nameIn(data.therapist, lang);
  const title = (id?: string) => {
    const a = id ? byId.get(id) : undefined;
    return a ? (lang === "bn" ? a.title_bn : a.title_en) : "";
  };

  return (
    <div className="pad" style={{ paddingBottom: 24 }}>
      <div className="bar" style={{ padding: "4px 8px 12px" }}>
        <div className="grow">
          <h1 className="h2">{L("এই সপ্তাহের অগ্রগতি", "This week’s progress")}</h1>
          <p className="small">{L(`${name} আর আপনি একসাথে যা করেছেন`, `What you and ${child.nickname} did together`)}</p>
        </div>
      </div>

      <div className="in">
        <div className="card helphero" style={{ marginBottom: 16 }}>
          <span
            className="ic t-orange"
            style={{ width: 56, height: 56, fontSize: 24, fontWeight: 700, borderRadius: "50%" }}
          >
            {num(logs.length, lang)}
          </span>
          <div className="grow">
            <p className="h2" style={{ fontSize: 18 }}>
              {L(`${num(logs.length, lang)}টি মুহূর্ত একসাথে`, `${logs.length} moments together`)}
            </p>
            <p className="small" style={{ marginTop: 2 }}>
              {logs.length
                ? L("প্রতিটি ছোট চেষ্টাই গুরুত্বপূর্ণ। 💛", "Every small try matters. 💛")
                : L("এই সপ্তাহে যখন সুবিধা হয় শুরু করুন।", "Start whenever it suits you this week.")}
            </p>
          </div>
        </div>

        {top.length > 0 && (
          <>
            <div className="sec">
              <h2 className="h2">{L("সবচেয়ে আনন্দের খেলা", "Most-loved activities")}</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {top.map(([id, n]) => {
                const a = byId.get(id);
                return (
                  <div key={id} className="row">
                    {a && (
                      <div style={{ width: 44, height: 44, flex: "none" }}>
                        <ActivityArt activity={a} />
                      </div>
                    )}
                    <span className="grow h3" style={{ fontSize: 15 }}>
                      {title(id)}
                    </span>
                    <span className="pill good">
                      😀 × {num(n, lang)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="sec">
          <h2 className="h2">{L(`${therapist}-এর বার্তা`, `Messages from ${therapist}`)}</h2>
        </div>

        {replies.length === 0 ? (
          <EmptyState title={L("আপনার নোটের উত্তর এখানে দেখাবে।", "Replies to your notes will show here.")} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {replies.map((r) => (
              <Card key={r.id}>
                <p className="small" style={{ fontWeight: 600, color: "var(--p)", marginBottom: 4 }}>
                  {title(r.activityId) || L("আপনার নোট", "Your note")} · {fmtDate(r.repliedAt ?? r.createdAt, lang)}
                </p>
                {r.therapistReply && (
                  <p className="sub" style={{ fontSize: 15, color: "var(--ink)" }}>
                    {r.therapistReply}
                  </p>
                )}
                {r.therapistReplyMediaUrl && (
                  <AudioPlayer src={r.therapistReplyMediaUrl} label={L("ভয়েস বার্তা", "Voice message")} />
                )}
              </Card>
            ))}
          </div>
        )}

        {summaries.length > 0 && (
          <>
            <div className="sec" style={{ marginTop: 16 }}>
              <h2 className="h2">{L("থেরাপিস্টের সারাংশ", "Summary from your therapist")}</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {summaries.map((s) => (
                <div key={s.id} className="card" style={{ background: "rgba(131, 119, 238, 0.08)" }}>
                  <p className="small" style={{ fontWeight: 600, color: "var(--p)", marginBottom: 4 }}>
                    {fmtDate(s.periodStart, lang)} – {fmtDate(s.periodEnd, lang)}
                  </p>
                  <p className="sub" style={{ fontSize: 15 }}>
                    {s.parentSummary}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
