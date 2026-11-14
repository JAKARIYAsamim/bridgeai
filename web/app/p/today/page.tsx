"use client";
// P-02 Today (Parent Home) — matches prototype parentHome() exactly
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/legacy/icons";
import { Cloud, Ele, Tiger } from "@/components/legacy/mascots";
import { todayKey } from "@/components/parent/common";
import { QuickNoteFab } from "@/components/parent/quick-note";
import { NextReminder } from "@/components/parent/reminder-banner";
import { Button, Card, Chip, EmptyState, ErrorState, Skeleton, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { fmtDate, MOODS, nameIn, num, SLOTS } from "@/lib/labels";
import { authService, childService, feedbackService, planService, reminderService } from "@/lib/services";
import type { RoutineSlot } from "@/lib/types";

const TINTS = ["t-blue", "t-orange", "t-green", "t-pink", "t-purple", "t-yellow"];

export default function Today() {
  const router = useRouter();
  const { lang, L } = useLang();
  const { data, loading, error, reload } = useLoad(async () => {
    const [user, child, cg, items, checkin] = await Promise.all([
      authService.currentUser(),
      childService.getMyChild(),
      childService.getMyCaregiver(),
      planService.getToday(),
      feedbackService.getTodayCheckin(),
    ]);
    return { user, child, cg, items, checkin };
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
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-24 card" />
        <SkeletonList rows={4} h="h-24" />
      </div>
    );
  }

  const { user, child, cg, items, checkin } = data;
  const childName = nameIn(child.nickname, lang);
  const parentName = nameIn(user?.name ?? "", lang);
  const paused = !!cg.pausedUntil && cg.pausedUntil >= todayKey();
  const done = items.filter((x) => x.log).length;
  const total = items.length;
  const left = total - done;
  const all = total > 0 && done === total;
  const nextItem = items.find((x) => !x.log);

  const groups = (Object.keys(SLOTS) as RoutineSlot[])
    .sort((a, b) => SLOTS[a].order - SLOTS[b].order)
    .map((slot) => ({ slot, list: items.filter((x) => x.activity.routine_slot === slot) }))
    .filter((g) => g.list.length);

  return (
    <div className="pad in" style={{ paddingBottom: 24 }}>
      {!paused && <NextReminder />}

      {/* Greeting Banner with Elephant Mascot & Speech Bubble */}
      <div className="greet">
        <h1>{L(`হ্যালো, ${parentName}`, `Hey, ${parentName}`)}</h1>
        <p>{L(`${childName}-এর অনুশীলনের জন্য তৈরি?`, `Ready for ${childName}’s practice?`)}</p>
        <span className="bubble">{all ? L("আজ দারুণ হয়েছে!", "Great job today!") : L("অল্প অল্প করে শুরু!", "Let’s start small!")}</span>
        <div className="masc">
          <Ele mood={all ? "proud" : "hi"} />
        </div>
      </div>

      {/* 3 Glass Metric Tiles */}
      <div className="tiles">
        <Link href="/p/progress" className="tile" style={{ textDecoration: "none" }}>
          <span className="ic" style={{ color: "var(--blue)" }}>
            <Icon name="turn" />
          </span>
          <span className="lab">{L("অনুশীলন", "Practice")}</span>
          <b>
            {num(done, lang)}/{num(total, lang)}
          </b>
          <span className="unit">{L("আজ হয়েছে", "done today")}</span>
        </Link>

        <Link href="/p/checkin" className="tile" style={{ textDecoration: "none" }}>
          <span className="ic" style={{ color: "var(--orange)" }}>
            <Icon name="mic" />
          </span>
          <span className="lab">{L("চেক-ইন", "Check-in")}</span>
          <b>{checkin ? "✓" : num(done > 0 ? 1 : 0, lang)}</b>
          <span className="unit">{checkin ? L("হয়ে গেছে", "completed") : L("বাকি আছে", "pending")}</span>
        </Link>

        <Link href="/p/learn" className="tile" style={{ textDecoration: "none" }}>
          <span className="ic" style={{ color: "var(--green)" }}>
            <Icon name="book" />
          </span>
          <span className="lab">{L("গল্প ও শেখা", "Stories")}</span>
          <b>{num(3, lang)}</b>
          <span className="unit">{L("গল্প উপলব্ধ", "stories")}</span>
        </Link>
      </div>

      {/* Cloud & Progress Segbar Banner */}
      {total > 0 && (
        <div className="banner" style={{ margin: "14px 0" }}>
          <div className="cl">
            <Cloud />
          </div>
          <div className="m">
            <Ele mood={all ? "proud" : "calm"} />
          </div>
          <div className="cl b">
            <Cloud />
          </div>
          <p className="h3">{L("আজকের অগ্রগতি", "Today’s progress")}</p>
          <div className="segbar">
            {items.map((it, i) => (
              <i key={it.activity.id || i} className={it.log ? "on" : ""} />
            ))}
            <span>
              {num(done, lang)}/{num(total, lang)}
            </span>
          </div>
          <div className="bchips">
            {all ? (
              <span>{L("আজকের সব শেষ!", "All done today!")}</span>
            ) : (
              <>
                <span>{L(`${num(left, lang)}টি বাকি`, `${left} left`)}</span>
                {nextItem && (
                  <span>
                    {L("এরপর: ", "Next: ")}
                    {lang === "bn" ? nextItem.activity.title_bn : nextItem.activity.title_en}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="in">
        {paused && (
          <Card className="note2" style={{ marginBottom: 12 }}>
            <p className="h3" style={{ color: "inherit", marginBottom: 2 }}>
              {L(
                `পরিকল্পনা ${fmtDate(cg.pausedUntil!, "bn", { day: "numeric", month: "long" })} পর্যন্ত বিরতিতে আছে।`,
                `Plan paused until ${fmtDate(cg.pausedUntil!, "en", { day: "numeric", month: "long" })}.`
              )}
            </p>
            <p className="small" style={{ color: "inherit", marginBottom: 8 }}>
              {L("কোনো চাপ নেই। বিশ্রাম নিন।", "No pressure. Take your time.")}
            </p>
            <Button
              size="sm"
              variant="soft"
              onClick={async () => {
                await reminderService.resumePlan();
                reload();
              }}
            >
              {L("আবার শুরু করুন", "Resume")}
            </Button>
          </Card>
        )}

        <div className="sec">
          <h2 className="h2">{L("আজকের অনুশীলন", "Today’s practice")}</h2>
          <span className="small">{fmtDate(new Date().toISOString(), lang, { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title={L(`আজ কোনো কাজ নেই। ${childName}-এর সাথে সময়টা উপভোগ করুন!`, `No activities today. Enjoy your time with ${child.nickname}!`)}
          />
        ) : (
          groups.map((g) => (
            <div key={g.slot} style={{ marginBottom: 14 }}>
              <p className="small" style={{ fontWeight: 600, margin: "6px 4px 8px", textTransform: "uppercase" }}>
                {SLOTS[g.slot].emoji} {L(SLOTS[g.slot].bn, SLOTS[g.slot].en)}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.list.map(({ activity, log }, idx) => {
                  const isDone = !!log;
                  return (
                    <div
                      key={activity.id}
                      className={`rowbox ${isDone ? "done" : ""}`}
                      onClick={() => router.push(`/p/activity/${activity.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="row">
                        <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
                          <span className={`ic ${TINTS[idx % TINTS.length]}`}>
                            <Icon name="play" />
                          </span>
                          <span className="grow" style={{ minWidth: 0 }}>
                            <span className="h3" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {lang === "bn" ? activity.title_bn : activity.title_en}
                            </span>
                            <span className="small">
                              {num(activity.minutes, lang)} {L("মিনিট", "min")} · {L(SLOTS[activity.routine_slot].bn, SLOTS[activity.routine_slot].en)}
                            </span>
                          </span>
                        </div>
                        <span className={`tick ${isDone ? "on" : ""}`} aria-label={isDone ? "Done" : "Pending"}>
                          <Icon name="check" />
                        </span>
                      </div>
                      {log && (
                        <div style={{ padding: "0 12px 10px", display: "flex", gap: 6, alignItems: "center" }}>
                          <Chip tone="primary">
                            {MOODS[log.mood].emoji} {L("সম্পন্ন", "Done")}
                          </Chip>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Daily Check-in CTA Button with Tiger Mascot */}
        <Link
          href="/p/checkin"
          className="cta"
          style={{ textDecoration: "none", marginTop: 14, display: "flex" }}
        >
          <span className="m">
            <Tiger mood={checkin ? "proud" : "hi"} />
          </span>
          <span className="grow">
            <span className="h3" style={{ display: "block" }}>
              {checkin ? L("আজকের চেক-ইন সংরক্ষিত হয়েছে", "Today’s check-in is saved") : L("আজকের দিন কেমন গেল?", "How was today?")}
            </span>
            <span className="small" style={{ color: "#a8603a" }}>
              {checkin ? L("বদলাতে চাইলে চাপুন", "Tap to review or update") : L("১৫ সেকেন্ডে থেরাপিস্টকে জানান", "Tell Dr. Nasrin in 15 seconds")}
            </span>
          </span>
          <span className="go">
            <Icon name="mic" />
          </span>
        </Link>

        {/* Stories Link Card */}
        <div className="sec" style={{ marginTop: 18 }}>
          <h2 className="h2">{L("এই সপ্তাহের গল্প", "This week’s story")}</h2>
        </div>
        <Link
          href="/p/learn"
          className="storycard"
          style={{ textDecoration: "none" }}
        >
          <span className="ic t-green" style={{ width: 50, height: 50, display: "grid", placeItems: "center", borderRadius: 12 }}>
            <Icon name="book" />
          </span>
          <span className="grow">
            <span className="h3" style={{ display: "block" }}>
              {L(`${childName} ডাক্তারের কাছে যায়`, `${child.nickname} visits the doctor`)}
            </span>
            <span className="small">{L("৬ পাতা · একসাথে পড়ুন", "6 pages · read together")}</span>
          </span>
          <span className="pill dark" style={{ marginRight: 6 }}>
            {L("পড়ুন", "Read")}
          </span>
        </Link>
      </div>

      <QuickNoteFab />
    </div>
  );
}
