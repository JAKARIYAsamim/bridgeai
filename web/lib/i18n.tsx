"use client";
// Language for parent screens (Bangla first) and the therapist Bangla toggle.
// Usage: const { lang, L } = useLang(); L("আজকের কাজ", "Today's activities")
import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { Lang } from "@/lib/types";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; L: (bn: string, en: string) => string };
const LangCtx = createContext<Ctx>({ lang: "bn", setLang: () => {}, L: (bn) => bn });

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
function read(key: string): Lang | null {
  try {
    const v = window.localStorage.getItem(key);
    return v === "bn" || v === "en" ? v : null;
  } catch {
    return null;
  }
}

export function LangProvider({ children, storageKey, fallback }: { children: ReactNode; storageKey: string; fallback: Lang }) {
  const lang = useSyncExternalStore(subscribe, () => read(storageKey) ?? fallback, () => fallback);
  const setLang = useCallback(
    (l: Lang) => {
      try { window.localStorage.setItem(storageKey, l); } catch { /* ignore */ }
      listeners.forEach((f) => f());
    },
    [storageKey],
  );
  return <LangCtx.Provider value={{ lang, setLang, L: (bn, en) => (lang === "bn" ? bn : en) }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

/** Wraps text with the Bangla font when the language is Bangla. */
export function T({ bn, en, className }: { bn: string; en: string; className?: string }) {
  const { lang } = useLang();
  return <span lang={lang} className={className}>{lang === "bn" ? bn : en}</span>;
}
