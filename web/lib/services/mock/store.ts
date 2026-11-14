// In-memory store saved to localStorage, so switching roles in one browser keeps the demo state.
"use client";
import { buildSeed, DB_VERSION, type DB } from "./seed";

const KEY = "bridgeai-web:db";
let db: DB | null = null;
const listeners = new Set<() => void>();
let rev = 0;

function load(): DB {
  if (typeof window === "undefined") return buildSeed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    /* storage blocked or corrupt: fall back to seed */
  }
  return buildSeed();
}

export function getDB(): DB {
  if (!db) db = load();
  return db;
}

export function commit() {
  rev++;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function resetDB(keepSession = true) {
  const session = db?.sessionUserId ?? null;
  db = buildSeed();
  if (keepSession) db.sessionUserId = session;
  commit();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  // also react to other tabs (e.g. the parent phone and the therapist laptop in two tabs)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      db = load();
      rev++;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export const getRev = () => rev;

export const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));
export const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const clone = <T,>(x: T): T => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
