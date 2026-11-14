"use client";
// P-07 Progress: this week's wins. No streaks, no missed counts, no comparisons.
import { HeartHandshake, MessageCircleHeart, Sparkles } from "lucide-react";
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
      feedbackService.listLogs(child.id, 7), feedbackService.myReplies(), feedbackService.mySharedSummaries(),
      libraryService.listActivities(), authService.listUsers("therapist"),
    ]);
    return { child, logs, replies, summaries, library, therapist: therapists.find((u) => u.id === child.therapistId)?.name ?? "Dr. Nasrin" };
  }, []);

  if (error) return <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading || !data) return <div className="space-y-4 p-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-32" /><SkeletonList rows={3} /></div>;

  const { child, logs, replies, summaries, library } = data;
  const byId = new Map<string, Activity>(library.map((a) => [a.id, a]));
  const happy: Record<string, number> = {};
  logs.filter((l) => l.mood === "happy").forEach((l) => (happy[l.activityId] = (happy[l.activityId] || 0) + 1));
  const top = Object.entries(happy).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const name = nameIn(child.nickname, lang);
  const therapist = nameIn(data.therapist, lang);
  const title = (id?: string) => { const a = id ? byId.get(id) : undefined; return a ? (lang === "bn" ? a.title_bn : a.title_en) : ""; };

  return (
    <div className="px-4 pt-4">
      <h1 className="text-[26px] font-bold">{L("এই সপ্তাহের জয়", "This week's wins")}</h1>
      <p className="mt-1 text-text-2">{L(`${name} আর আপনি একসাথে যা করেছেন`, `What you and ${child.nickname} did together`)}</p>

      <Card className="mt-4 flex items-center gap-4 bg-celebrate-soft">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-celebrate text-3xl font-bold text-white">{num(logs.length, lang)}</span>
        <div>
          <p className="text-[20px] font-bold">{L(`${num(logs.length, "bn")}টি মুহূর্ত একসাথে`, `${logs.length} moments together`)}</p>
          <p className="text-[15px] text-text-2">{logs.length ? L("প্রতিটি ছোট চেষ্টাই গুরুত্বপূর্ণ। 💛", "Every small try matters. 💛") : L("এই সপ্তাহে যখন সুবিধা হয় শুরু করুন।", "Start whenever it suits you this week.")}</p>
        </div>
      </Card>

      {top.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 flex items-center gap-2 text-[20px] font-bold"><Sparkles className="size-5 text-celebrate" />{L("সবচেয়ে আনন্দের খেলা", "Most-loved activities")}</h2>
          <div className="space-y-2.5">
            {top.map(([id, n]) => {
              const a = byId.get(id);
              return (
                <Card key={id} className="flex items-center gap-3">
                  {a && <ActivityArt activity={a} className="size-14 shrink-0" />}
                  <div className="flex-1 font-semibold">{title(id)}</div>
                  <span className="text-[17px] font-bold">😀 × {num(n, lang)}</span>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <h2 className="mb-2 mt-6 flex items-center gap-2 text-[20px] font-bold"><MessageCircleHeart className="size-5 text-primary" />{L(`${therapist}-এর বার্তা`, `Messages from ${therapist}`)}</h2>
      {replies.length === 0 ? (
        <EmptyState emoji="💌" title={L("আপনার নোটের উত্তর এখানে দেখাবে।", "Replies to your notes will show here.")} />
      ) : (
        <div className="space-y-2.5">
          {replies.map((r) => (
            <Card key={r.id}>
              <p className="text-[14px] font-semibold text-primary">{title(r.activityId) || L("আপনার নোট", "Your note")} · {fmtDate(r.repliedAt ?? r.createdAt, lang)}</p>
              <p className="mt-1 text-[17px]">{r.therapistReply}</p>
            </Card>
          ))}
        </div>
      )}

      {summaries.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 flex items-center gap-2 text-[20px] font-bold"><HeartHandshake className="size-5 text-primary" />{L("থেরাপিস্টের সারাংশ", "Summary from your therapist")}</h2>
          <div className="space-y-2.5">
            {summaries.map((s) => (
              <Card key={s.id} className="bg-primary-soft">
                <p className="text-[14px] font-semibold text-primary">{fmtDate(s.periodStart, lang)} – {fmtDate(s.periodEnd, lang)}</p>
                <p className="mt-1 text-[17px]">{s.parentSummary}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
