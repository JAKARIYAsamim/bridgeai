"use client";
import { Suspense, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  setupMotion,
  arrive,
  lozenges,
  getTransitionKind,
  isBackClicked,
  resetBackClicked,
  observeContentChanges,
} from "./motion";

function MotionTracker() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const isPopStateRef = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      isPopStateRef.current = true;
    };
    window.addEventListener("popstate", onPopState);

    const onResize = () => {
      lozenges(pathname, false);
    };
    window.addEventListener("resize", onResize);

    const cleanupMotion = setupMotion();
    const cleanupObserver = observeContentChanges();

    return () => {
      cleanupMotion();
      cleanupObserver();
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    if (!prev) {
      requestAnimationFrame(() => {
        lozenges(pathname, false);
        arrive("tab");
      });
      return;
    }

    if (prev === pathname) return;

    const isPop = isPopStateRef.current || isBackClicked();
    isPopStateRef.current = false;
    resetBackClicked();

    const kind = getTransitionKind(prev, pathname, isPop);

    // Reset scroll of active screen on page transition
    const scroll = document.querySelector<HTMLElement>("#app .scroll");
    if (scroll) {
      scroll.scrollTop = 0;
    }

    requestAnimationFrame(() => {
      arrive(kind);
      lozenges(pathname, true);
    });
  }, [pathname]);

  return null;
}

export function MotionInit() {
  return (
    <Suspense fallback={null}>
      <MotionTracker />
    </Suspense>
  );
}
