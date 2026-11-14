"use client";
// What a parent sees for one activity (P-03). Reused by the therapist's "Parent preview" in the library,
// so the preview is always exactly the parent screen.
import { Clock, HeartHandshake, PlayCircle, ShieldCheck, Sparkles, Target } from "lucide-react";
import type { ReactNode } from "react";
import { DOMAINS, num, SLOTS } from "@/lib/labels";
import type { Activity, Lang } from "@/lib/types";
import { ActivityArt, Chip, cx } from "./ui";

export function ActivityCardSmall({ activity, lang, right, onClick, status }: { activity: Activity; lang: Lang; right?: ReactNode; onClick?: () => void; status?: ReactNode }) {
  const bn = lang === "bn";
  return (
    <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cx("glass flex items-center gap-3 rounded-[12px] p-3", onClick && "cursor-pointer transition active:scale-[0.99]")}>
      <ActivityArt activity={activity} className="size-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className={cx("font-semibold leading-snug", bn && "bn")}>{bn ? activity.title_bn : activity.title_en}</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Chip tone="primary">{SLOTS[activity.routine_slot].emoji} {bn ? SLOTS[activity.routine_slot].bn : SLOTS[activity.routine_slot].en}</Chip>
          <Chip>{bn ? DOMAINS[activity.domain].bn : DOMAINS[activity.domain].en}</Chip>
        </div>
        {status}
      </div>
      {right}
    </div>
  );
}

function Box({ icon, title, children, tone }: { icon: ReactNode; title: string; children: ReactNode; tone?: string }) {
  return (
    <section className={cx("rounded-[12px] p-4", tone ?? "glass")}>
      <h3 className="mb-1.5 flex items-center gap-2 text-[15px] font-bold">{icon}{title}</h3>
      <div className="text-[17px] leading-relaxed">{children}</div>
    </section>
  );
}

export function ActivityDetailView({ activity, lang, childName, reply, footer }: {
  activity: Activity;
  lang: Lang;
  childName?: string;
  reply?: { text: string; from: string } | null;
  footer?: ReactNode;
}) {
  const bn = lang === "bn";
  const L = (b: string, e: string) => (bn ? b : e);
  return (
    <div lang={lang} className={cx("space-y-3", bn && "bn")}>
      <ActivityArt activity={activity} className="h-44 w-full" />
      <div>
        <h1 className="text-[24px] font-bold leading-tight">{bn ? activity.title_bn : activity.title_en}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip tone="primary">{SLOTS[activity.routine_slot].emoji} {L(SLOTS[activity.routine_slot].bn, SLOTS[activity.routine_slot].en)}</Chip>
          <Chip>{L(DOMAINS[activity.domain].bn, DOMAINS[activity.domain].en)}</Chip>
          <Chip icon={<Clock className="size-3.5" />}>{L(`প্রায় ${num(activity.minutes, "bn")} মিনিট`, `About ${activity.minutes} min`)}</Chip>
        </div>
      </div>

      {reply && (
        <div className="rounded-[12px] bg-primary-soft p-4">
          <div className="mb-1 text-sm font-bold text-primary">{L(`${reply.from}-এর বার্তা`, `Message from ${reply.from}`)}</div>
          <p className="text-[17px]">{reply.text}</p>
        </div>
      )}

      <Box icon={<Target className="size-4 text-primary" />} title={L("কেন এটা কাজে লাগে", "Why it helps")}>{bn ? activity.why_bn : activity.why_en}</Box>
      <Box icon={<Sparkles className="size-4 text-primary" />} title={L("যা লাগবে", "What you need")}>
        <ul className="list-disc space-y-0.5 pl-5">{(bn ? activity.needs_bn : activity.needs_en).map((n) => <li key={n}>{n}</li>)}</ul>
      </Box>
      <section className="glass flex items-center gap-3 rounded-[12px] p-4">
        <PlayCircle className="size-10 text-primary" />
        <div className="flex-1">
          <div className="font-bold">{L("১ মিনিটের ভিডিও দেখুন", "Watch the 1-minute video")}</div>
          <div className="text-sm text-muted">{activity.video_url ? L("ভিডিও খুলুন", "Open video") : L("ভিডিও শীঘ্রই আসছে", "Video coming soon")}</div>
        </div>
      </section>
      <Box icon={<Sparkles className="size-4 text-celebrate" />} title={L("সফল হলে দেখবেন", "What success looks like")}>{bn ? activity.success_bn : activity.success_en}</Box>
      <Box tone="bg-celebrate-soft" icon={<HeartHandshake className="size-4 text-[#b36800]" />} title={L(`${childName ?? "শিশু"} অস্থির হলে`, `If ${childName ?? "your child"} gets upset`)}>
        {bn ? activity.if_upset_bn : activity.if_upset_en}
      </Box>
      <Box tone="bg-info-soft" icon={<ShieldCheck className="size-4 text-info" />} title={L("নিরাপত্তা", "Safety")}>
        <span className="text-[15px]">{bn ? activity.safety_note_bn : activity.safety_note_en}</span>
      </Box>
      {footer}
    </div>
  );
}
