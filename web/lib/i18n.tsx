"use client";
// Unified Language Context with Bangla First approach.
// Usage: const { lang, setLang, toggleLang, L } = useLang();
import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { Lang } from "@/lib/types";
import { bnNum } from "@/lib/labels";

export const DEFAULT_LANG: Lang = "bn";
export const STORAGE_KEY = "bridgeai-lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  L: (bn: string, en: string) => string;
  num: (n: string | number) => string;
};

const LangCtx = createContext<Ctx>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  toggleLang: () => {},
  L: (bn) => bn,
  num: (n) => bnNum(n),
});

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

function readLang(customKey?: string): Lang | null {
  if (typeof window === "undefined") return null;
  try {
    const primary = window.localStorage.getItem(customKey || STORAGE_KEY);
    if (primary === "bn" || primary === "en") return primary;
    // Check fallback legacy keys if customKey not given or unset
    for (const k of [STORAGE_KEY, "bridgeai-lang-p", "bridgeai-lang-t", "bridgeai-lang-c"]) {
      const v = window.localStorage.getItem(k);
      if (v === "bn" || v === "en") return v;
    }
    return null;
  } catch {
    return null;
  }
}

export function LangProvider({
  children,
  storageKey = STORAGE_KEY,
  fallback = DEFAULT_LANG,
}: {
  children: ReactNode;
  storageKey?: string;
  fallback?: Lang;
}) {
  const lang = useSyncExternalStore(
    subscribe,
    () => readLang(storageKey) ?? fallback,
    () => fallback
  );

  const setLang = useCallback(
    (l: Lang) => {
      try {
        window.localStorage.setItem(storageKey, l);
        window.localStorage.setItem(STORAGE_KEY, l);
        window.localStorage.setItem("bridgeai-lang-p", l);
        window.localStorage.setItem("bridgeai-lang-t", l);
        window.localStorage.setItem("bridgeai-lang-c", l);
        document.documentElement.lang = l;
      } catch {
        /* ignore */
      }
      listeners.forEach((f) => f());
    },
    [storageKey]
  );

  const toggleLang = useCallback(() => {
    setLang(lang === "bn" ? "en" : "bn");
  }, [lang, setLang]);

  return (
    <LangCtx.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        L: (bn, en) => (lang === "bn" ? bn : en),
        num: (n) => (lang === "bn" ? bnNum(n) : String(n)),
      }}
    >
      {children}
    </LangCtx.Provider>
  );
}

export const useLang = () => useContext(LangCtx);

/** Wraps text with the Bangla font when the language is Bangla. */
export function T({ bn, en, className }: { bn: string; en: string; className?: string }) {
  const { lang } = useLang();
  return (
    <span lang={lang} className={className}>
      {lang === "bn" ? bn : en}
    </span>
  );
}
