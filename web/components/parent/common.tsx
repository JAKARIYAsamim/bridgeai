"use client";
// Small shared pieces for parent screens styled with prototype glass and buttons.
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/legacy/icons";
import { cx } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import type { Caregiver } from "@/lib/types";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "bn" ? "en" : "bn")}
      aria-label={lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
      className={cx("hbtn", lang === "en" ? "bn" : "")}
      type="button"
      style={{ fontSize: 13, fontWeight: 600 }}
    >
      {lang === "bn" ? "EN" : "বাং"}
    </button>
  );
}

export function ParentTopBar({
  title,
  back,
  close,
  right,
}: {
  title?: ReactNode;
  back?: string | true;
  close?: string;
  right?: ReactNode;
}) {
  const router = useRouter();
  const { L } = useLang();
  const go = (to: string | true) => (to === true ? router.back() : router.push(to));

  return (
    <div className="bar" style={{ padding: "4px 16px 8px" }}>
      {back && (
        <button
          onClick={() => go(back)}
          className="hbtn"
          aria-label={L("ফিরে যান", "Back")}
          type="button"
          style={{ marginRight: 6 }}
        >
          <Icon name="back" />
        </button>
      )}
      {title && (
        <h1 className="h2 grow truncate" style={{ paddingLeft: back ? 4 : 0 }}>
          {title}
        </h1>
      )}
      {!title && <div className="grow" />}
      {right}
      {close && (
        <button
          onClick={() => go(close)}
          aria-label={L("বন্ধ করুন", "Close")}
          className="xb"
          type="button"
          style={{ marginLeft: 6 }}
        >
          <Icon name="x" />
        </button>
      )}
    </div>
  );
}

/** Choice button used on check-in and settings. */
export function Choice({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      type="button"
      className={cx("card", active && "is-pressed", className)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 52,
        padding: "10px 14px",
        margin: 0,
        fontWeight: 600,
        fontSize: 15,
        border: active ? "1.5px solid var(--p)" : undefined,
        color: active ? "var(--deep)" : "var(--ink)",
      }}
    >
      {children}
    </button>
  );
}

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function speak(text: string, lang: "bn" | "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "bn" ? "bn-BD" : "en-GB";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export const ROUTINE_LABELS: { k: keyof Caregiver["routineTimes"]; bn: string; en: string }[] = [
  { k: "wake", bn: "ঘুম থেকে ওঠা", en: "Wake-up" },
  { k: "breakfast", bn: "সকালের নাস্তা", en: "Breakfast" },
  { k: "bath", bn: "গোসল", en: "Bath" },
  { k: "lunch", bn: "দুপুরের খাবার", en: "Lunch" },
  { k: "play", bn: "খেলা", en: "Play" },
  { k: "dinner", bn: "রাতের খাবার", en: "Dinner" },
  { k: "bedtime", bn: "ঘুমানো", en: "Bedtime" },
];
