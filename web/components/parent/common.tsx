"use client";
// Small shared pieces for parent screens.
import { ArrowLeft, Languages, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import type { Caregiver } from "@/lib/types";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} aria-label={lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
      className="glass flex min-h-12 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-semibold">
      <Languages className="size-5 text-primary" />
      <span className={lang === "bn" ? "" : "bn"}>{lang === "bn" ? "English" : "বাংলা"}</span>
    </button>
  );
}

export function ParentTopBar({ title, back, close, right }: { title?: ReactNode; back?: string | true; close?: string; right?: ReactNode }) {
  const router = useRouter();
  const { L } = useLang();
  const go = (to: string | true) => (to === true ? router.back() : router.push(to));
  return (
    <header className="sticky top-7 z-30 flex items-center gap-2 px-3 pb-2 pt-3">
      {back && (
        <button onClick={() => go(back)} className="glass flex min-h-12 items-center gap-1 rounded-full pl-2.5 pr-4 text-[15px] font-semibold">
          <ArrowLeft className="size-5" />{L("ফিরে যান", "Back")}
        </button>
      )}
      {title && <h1 className="min-w-0 flex-1 truncate px-1 text-[22px] font-bold">{title}</h1>}
      {!title && <div className="flex-1" />}
      {right}
      {close && (
        <button onClick={() => go(close)} aria-label={L("বন্ধ করুন", "Close")} className="glass grid size-12 place-items-center rounded-full">
          <X className="size-6" />
        </button>
      )}
    </header>
  );
}

/** Big pill choice button used on check-in and settings. */
export function Choice({ active, onClick, children, className }: { active?: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={cx("glass min-h-14 rounded-2xl px-2 text-[16px] font-semibold transition active:scale-95", active && "bg-primary-soft text-primary ring-3 ring-primary", className)}>
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
