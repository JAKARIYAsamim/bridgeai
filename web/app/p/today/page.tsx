"use client";
// P-02 Today
import { Check, ChevronRight, Moon, PauseCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActivityCardSmall } from "@/components/activity-view";
import { LangToggle, todayKey } from "@/components/parent/common";
import { QuickNoteFab } from "@/components/parent/quick-note";
import { NextReminder } from "@/components/parent/reminder-banner";
import { Button, Card, Chip, EmptyState, ErrorState, ProgressRing, Skeleton, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { fmtDate, MOODS, nameIn, num, SLOTS } from "@/lib/labels";
import { authService, childService, feedbackService, planService, reminderService } from "@/lib/services";
import type { RoutineSlot } from "@/lib/types";

export default function Today() {
  const router = useRouter();
  const { lang, L } = useLang();
  const { data, loading, error, reload } = useLoad(async () => {
    const [user, child, cg, items, checkin] = await Promise.all([
      authService.currentUser(), childService.getMyChild(), childService.getMyCaregiver(), planService.getToday(), feedbackService.getTodayCheckin(),
    ]);
    return { user, child, cg, items, checkin };
  }, []);

  const hour = new Date().getHours();
  const greet = hour < 12 ? L("শুভ সকাল", "Good morning") : hour < 17 ? L("শুভ দুপুর", "Good afternoon") : L("শুভ সন্ধ্যা", "Good evening");

  if (error) return <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading || !data)
    return <div className="space-y-4 p-4"><Skeleton className="h-16 w-2/3" /><Skeleton className="h-24" /><SkeletonList rows={4} h="h-24" /></div>;

  const { user, child, cg, items, checkin } = data;
  const childName = nameIn(child.nickname, lang);
  const paused = !!cg.pausedUntil && cg.pausedUntil >= todayKey();
  const done = items.filter((x) => x.log).length;
  const groups = (Object.keys(SLOTS) as RoutineSlot[])
    .sort((a, b) => SLOTS[a].order - SLOTS[b].order)
    .map((slot) => ({ slot, list: items.filter((x) => x.activity.routine_slot === slot) }))
    .filter((g) => g.list.length);

  return (
    <div className="px-4 pt-3">
      {!paused && <NextReminder />}
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] text-text-2">{fmtDate(new Date().toISOString(), lang, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="text-[26px] font-bold leading-tight">{greet}, {nameIn(user?.name ?? "", lang)}</h1>
        </div>
        <LangToggle />
        <Link href="/p/settings" className="glass flex min-h-12 flex-col items-center justify-center rounded-2xl px-2.5 text-[11px] font-semibold">
          <Settings className="size-5 text-primary" />{L("সেটিংস", "Settings")}
        </Link>
      </header>

      {paused && (
        <Card className="mt-4 flex items-center gap-3 bg-primary-soft">
          <PauseCircle className="size-8 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-semibold">{L(`পরিকল্পনা ${fmtDate(cg.pausedUntil!, "bn", { day: "numeric", month: "long" })} পর্যন্ত বিরতিতে আছে।`, `Plan paused until ${fmtDate(cg.pausedUntil!, "en", { day: "numeric", month: "long" })}.`)}</p>
            <p className="text-[15px] text-text-2">{L("কোনো চাপ নেই। বিশ্রাম নিন।", "No pressure. Take your time.")}</p>
          </div>
          <Button size="sm" variant="soft" onClick={async () => { await reminderService.resumePlan(); reload(); }}>{L("আবার শুরু", "Resume")}</Button>
        </Card>
      )}

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-[22px] font-bold">{L("আজকের কাজ", "Today's activities")}</h2>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-right text-[14px] font-semibold text-text-2">{L(`${num(items.length, "bn")}টির মধ্যে ${num(done, "bn")}টি আজ`, `${done} of ${items.length} today`)}</span>
            <ProgressRing value={done} total={items.length} size={54} label={num(done, lang)} />
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-3"><EmptyState emoji="🌤️" title={L(`আজ কোনো কাজ নেই। ${childName}-এর সাথে সময়টা উপভোগ করুন!`, `No activities today. Enjoy your time with ${child.nickname}!`)} /></div>
      ) : (
        groups.map((g) => (
          <section key={g.slot} className="mt-4">
            <h3 className="mb-2 px-1 text-[15px] font-bold text-text-2">{SLOTS[g.slot].emoji} {L(SLOTS[g.slot].bn, SLOTS[g.slot].en)}</h3>
            <div className="space-y-2.5">
              {g.list.map(({ activity, log }) => (
                <ActivityCardSmall key={activity.id} activity={activity} lang={lang} onClick={() => router.push(`/p/activity/${activity.id}`)}
                  status={log ? (
                    <div className="mt-1.5"><Chip tone="celebrate" icon={<Check className="size-3.5" />}>{L("শেষ হয়েছে", "Done")} {MOODS[log.mood].emoji}</Chip></div>
                  ) : null}
                  right={<ChevronRight className="size-6 text-muted" />} />
              ))}
            </div>
          </section>
        ))
      )}

      {items.length > 0 && done < items.length && (
        <Card className="mt-4 bg-celebrate-soft text-[16px]">
          💛 {L("আজ ব্যস্ত? ২ মিনিটের ছোট খেলাও কাজে লাগে।", "Busy today? Even a 2-minute game helps.")}
        </Card>
      )}

      <Link href="/p/checkin" className="glass mt-4 flex min-h-20 items-center gap-3 rounded-[12px] p-4">
        <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary"><Moon className="size-6" /></span>
        <span className="flex-1">
          <span className="block font-semibold">{checkin ? L("আজকের চেক-ইন হয়ে গেছে ✓", "Today's check-in is done ✓") : L("আজকের দিন কেমন গেল?", "How was today?")}</span>
          <span className="block text-[15px] text-text-2">{checkin ? L("বদলাতে চাইলে চাপুন", "Tap to change") : L("১৫ সেকেন্ডের চেক-ইন", "A 15-second check-in")}</span>
        </span>
        <ChevronRight className="size-6 text-muted" />
      </Link>

      <QuickNoteFab />
    </div>
  );
}
