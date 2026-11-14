"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { authService, subscribeToData } from "@/lib/services";
import type { User } from "@/lib/types";

/** Load data from a service, re-run when the mock store changes. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  const run = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const v = await fnRef.current();
      setData(v);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let live = true;
    // start on the next tick so no state is set synchronously inside the effect
    Promise.resolve().then(() => {
      if (live) run();
    });
    const unsub = subscribeToData(() => run(true));
    return () => {
      live = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload: () => run() };
}

export function useSession() {
  const { data: user, loading } = useLoad<User | null>(() => authService.currentUser(), []);
  return { user: user ?? null, loading };
}

const noopSubscribe = () => () => {};
/** True once mounted in the browser (mock data lives in localStorage). */
export function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
