"use client";
// Activity views: small card and detail view, built from the prototype's cards, icons and pills.
import type { ReactNode } from "react";
import { Icon } from "@/components/legacy/icons";
import { DOMAINS, num, SLOTS } from "@/lib/labels";
import type { Activity, Lang } from "@/lib/types";
import { ActivityArt, Chip, cx } from "./ui";

export function ActivityCardSmall({
  activity,
  lang,
  right,
  onClick,
  status,
}: {
  activity: Activity;
  lang: Lang;
  right?: ReactNode;
  onClick?: () => void;
  status?: ReactNode;
}) {
  const bn = lang === "bn";
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cx("card", onClick && "is-pressed")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 12,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div style={{ width: 56, height: 56, flex: "none" }}>
        <ActivityArt activity={activity} />
      </div>
      <div className="grow">
        <div className={cx("h3", bn && "bn")}>
          {bn ? activity.title_bn : activity.title_en}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          <Chip tone="primary">
            {SLOTS[activity.routine_slot].emoji} {bn ? SLOTS[activity.routine_slot].bn : SLOTS[activity.routine_slot].en}
          </Chip>
          <Chip>{bn ? DOMAINS[activity.domain].bn : DOMAINS[activity.domain].en}</Chip>
        </div>
        {status}
      </div>
      {right}
    </div>
  );
}

function SectionBox({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("card", className)} style={{ marginBottom: 10 }}>
      <p className="h3" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {icon}
        {title}
      </p>
      <div className="sub">{children}</div>
    </div>
  );
}

export function ActivityDetailView({
  activity,
  lang,
  childName,
  reply,
  footer,
}: {
  activity: Activity;
  lang: Lang;
  childName?: string;
  reply?: { text: string; from: string } | null;
  footer?: ReactNode;
}) {
  const bn = lang === "bn";
  const L = (b: string, e: string) => (bn ? b : e);

  return (
    <div lang={lang} className={cx(bn && "bn")} style={{ paddingBottom: 16 }}>
      <div style={{ height: 160, marginBottom: 14 }}>
        <ActivityArt activity={activity} />
      </div>

      <div style={{ padding: "0 4px", marginBottom: 12 }}>
        <h1 className="h1">{bn ? activity.title_bn : activity.title_en}</h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          <Chip tone="primary">
            {SLOTS[activity.routine_slot].emoji} {L(SLOTS[activity.routine_slot].bn, SLOTS[activity.routine_slot].en)}
          </Chip>
          <Chip>{L(DOMAINS[activity.domain].bn, DOMAINS[activity.domain].en)}</Chip>
          <Chip icon={<Icon name="clock" style={{ fontSize: 13 }} />}>
            {L(`প্রায় ${num(activity.minutes, lang)} মিনিট`, `About ${activity.minutes} min`)}
          </Chip>
        </div>
      </div>

      {reply && (
        <div className="msg" style={{ marginBottom: 10 }}>
          <span className="ic t-purple" style={{ width: 36, height: 36, fontSize: 18 }}>
            <Icon name="heart" />
          </span>
          <div>
            <p className="small">{L(`${reply.from}-এর বার্তা`, `Message from ${reply.from}`)}</p>
            <p className="sub" style={{ color: "var(--ink)" }}>{reply.text}</p>
          </div>
        </div>
      )}

      <SectionBox icon={<Icon name="spark" style={{ color: "var(--p)" }} />} title={L("কেন এটা কাজে লাগে", "Why it helps")}>
        {bn ? activity.why_bn : activity.why_en}
      </SectionBox>

      <SectionBox icon={<Icon name="spark" style={{ color: "var(--p)" }} />} title={L("যা লাগবে", "What you need")}>
        <ul className="steps plain" style={{ padding: 0 }}>
          {(bn ? activity.needs_bn : activity.needs_en).map((n) => (
            <li key={n} style={{ paddingLeft: 24 }}>{n}</li>
          ))}
        </ul>
      </SectionBox>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span className="ic t-blue" style={{ width: 44, height: 44, fontSize: 22 }}>
          <Icon name="play" />
        </span>
        <div className="grow">
          <p className="h3">{L("১ মিনিটের ভিডিও দেখুন", "Watch the 1-minute video")}</p>
          <p className="small">
            {activity.video_url ? L("ভিডিও খুলুন", "Open video") : L("ভিডিও শীঘ্রই আসছে", "Video coming soon")}
          </p>
        </div>
      </div>

      <SectionBox icon={<Icon name="check" style={{ color: "var(--green)" }} />} title={L("সফল হলে দেখবেন", "What success looks like")}>
        {bn ? activity.success_bn : activity.success_en}
      </SectionBox>

      <div className="note2" style={{ marginBottom: 10, display: "block" }}>
        <p className="h3" style={{ color: "inherit", marginBottom: 4 }}>
          {L(`${childName ?? "শিশু"} অস্থির হলে`, `If ${childName ?? "your child"} gets upset`)}
        </p>
        <p className="sub" style={{ color: "inherit", fontSize: 14 }}>
          {bn ? activity.if_upset_bn : activity.if_upset_en}
        </p>
      </div>

      <div className="card" style={{ background: "rgba(0, 122, 255, 0.08)", borderColor: "rgba(0, 122, 255, 0.2)", marginBottom: 14 }}>
        <p className="h3" style={{ color: "var(--blue)", marginBottom: 4 }}>
          <Icon name="shield" style={{ marginRight: 6 }} />
          {L("নিরাপত্তা", "Safety")}
        </p>
        <p className="sub" style={{ fontSize: 14 }}>
          {bn ? activity.safety_note_bn : activity.safety_note_en}
        </p>
      </div>

      {footer}
    </div>
  );
}
