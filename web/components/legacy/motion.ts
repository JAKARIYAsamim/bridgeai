"use client";
// Liquid, springy motion ported from public/motion.js with full screen arrivals, lozenges, and press physics.

export const RM =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
export const off = () => RM.matches;

// A spring with a little bounce. Browsers without linear() get a close curve instead.
export const SPRING =
  typeof CSS !== "undefined" && CSS.supports("transition-timing-function", "linear(0, 1)")
    ? "linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)"
    : "cubic-bezier(0.2, 1.3, 0.3, 1)";
export const GLIDE = "cubic-bezier(0.2, 0.9, 0.25, 1)";

export const play = (
  el: Element,
  frames: Keyframe[] | PropertyIndexedKeyframes,
  opts: KeyframeAnimationOptions
) => {
  try {
    return el.animate(frames, opts);
  } catch {
    return null;
  }
};

const SURFACE =
  ".btn, .navb, .hbtn, .tile, .row, .persona, .chipb, .cta, .storycard, .rb, .tick, .xb, .seg button, .card[data-act], .sugg button, .pill[data-act], .link, button, a.card, [role='button']";

let backClicked = false;
export const isBackClicked = () => backClicked;
export const resetBackClicked = () => {
  backClicked = false;
};

// ----- press: the surface dips, and a soft highlight spreads from the finger like a drop in liquid -----
export function setupMotion() {
  if (typeof window === "undefined") return () => {};

  document.documentElement.style.setProperty("--spring", SPRING);

  const onPointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Detect back navigation button clicks
    if (
      target.closest(
        '[aria-label*="Back" i], [aria-label*="back"], [aria-label*="Close" i], [data-act="back"], .back-btn'
      )
    ) {
      backClicked = true;
    }

    // Ignore text inputs
    if (target.closest("input, textarea, select")) return;

    const a = target.closest<HTMLElement>(SURFACE);
    if (!a || (a as HTMLButtonElement).disabled || off()) return;

    let el: HTMLElement = a;
    if (el.classList.contains("row") && el.parentElement?.classList.contains("rowbox")) {
      el = el.parentElement;
    }

    el.classList.add("is-pressed");
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;

    const d = Math.max(r.width, r.height) * 2.3;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.classList.add("lq-host");

    const drop = document.createElement("span");
    drop.className = "lq";
    drop.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    el.append(drop);

    const anim = play(
      drop,
      [{ transform: "scale(0.12)", opacity: 0.95 }, { transform: "scale(1)", opacity: 0 }],
      { duration: 720, easing: GLIDE }
    );
    if (anim) anim.onfinish = () => drop.remove();
    else drop.remove();

    const up = () => {
      el.classList.remove("is-pressed");
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);

      if (!el.classList.contains("navb") && !el.closest(".seg")) {
        play(
          el,
          [{ transform: `scale(${/row|card|cta|persona/.test(el.className) ? 0.97 : 0.94})` }, { transform: "none" }],
          { duration: 640, easing: SPRING }
        );
        const glow = document.createElement("span");
        glow.className = "lq glow";
        el.append(glow);
        const g = play(glow, [{ opacity: 0.55 }, { opacity: 0 }], { duration: 520, easing: "ease-out" });
        if (g) g.onfinish = () => glow.remove();
        else glow.remove();
      }
    };

    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const tick = target?.closest<HTMLElement>(".tick");
    if (tick && !off()) {
      tickEffect(tick);
    }
  };

  document.addEventListener("pointerdown", onPointerDown, { passive: true });
  document.addEventListener("click", onClick, { passive: true });

  return () => {
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("click", onClick);
  };
}

// ----- the selected lozenge in the tab bar and in segmented controls flows to its new place -----
let lastSpots: Record<string, { x: number; y: number; w: number; h: number }> = {};

export function lozenges(scope = "nav", animate = true) {
  if (typeof document === "undefined") return;
  const spots: Record<string, { x: number; y: number; w: number; h: number }> = {};

  const groups = document.querySelectorAll<HTMLElement>("#app .nav, #app .seg, .phone .nav, .phone .seg");
  groups.forEach((group, i) => {
    const on = group.querySelector<HTMLElement>(":scope > .on");
    if (!on) return;
    const isNav = group.classList.contains("nav");
    const id = isNav ? "nav" : `${scope}#${i}`;
    const spot = { x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight };

    if (spot.w === 0 && spot.h === 0) return;

    let ind = group.querySelector<HTMLElement>(":scope > .ind");
    if (!ind) {
      ind = document.createElement("i");
      ind.className = "ind";
      group.prepend(ind);
    }
    group.classList.add("has-ind");
    Object.assign(ind.style, {
      left: spot.x + "px",
      top: spot.y + "px",
      width: spot.w + "px",
      height: spot.h + "px",
    });

    const was = lastSpots[id];
    if (animate && was && (was.x !== spot.x || was.y !== spot.y) && !off()) {
      const dx = was.x - spot.x;
      const sx = was.w / (spot.w || 1);
      play(
        ind,
        [
          { transform: `translateX(${dx}px) scale(${sx}, 1)` },
          { transform: `translateX(${dx * 0.42}px) scale(${Math.max(sx, 1) * 1.28}, 0.86)`, offset: 0.34 },
          { transform: "none" },
        ],
        { duration: 620, easing: SPRING }
      );
      play(on, [{ transform: "scale(0.86)" }, { transform: "none" }], { duration: 620, easing: SPRING });
    }
    spots[id] = spot;
  });

  lastSpots = { ...lastSpots, ...spots };
}

// ----- screens arrive the way they do on an iPhone -----
export type TransitionKind = "push" | "pop" | "tab" | "role";

export const ARRIVE: Record<TransitionKind, Keyframe[]> = {
  push: [{ transform: "translateX(34%)", opacity: 0, filter: "blur(8px)" }, { transform: "none", opacity: 1, filter: "blur(0)" }],
  pop: [{ transform: "translateX(-26%)", opacity: 0, filter: "blur(8px)" }, { transform: "none", opacity: 1, filter: "blur(0)" }],
  tab: [{ transform: "scale(0.955)", opacity: 0, filter: "blur(12px)" }, { transform: "none", opacity: 1, filter: "blur(0)" }],
  role: [{ transform: "scale(1.12)", opacity: 0, filter: "blur(20px)" }, { transform: "none", opacity: 1, filter: "blur(0)" }],
};

let lastArriveTimestamp = 0;

export function staggerChildren(container: Element) {
  if (off()) return;
  const parts = container.querySelectorAll(
    ".greet, .tiles > *, .banner, .in > *, .sec, .rowbox, .cta, .reader > *, .hello > *, .chips > *, .ask, .duo2 > *, .big, .tagline, .sheet0, .card, .streak, .duo > *, .stat, .headcard"
  );
  Array.from(parts)
    .slice(0, 16)
    .forEach((el, i) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.dataset.staggered) return;
      htmlEl.dataset.staggered = "1";
      play(
        el,
        [{ transform: "translateY(22px) scale(0.96)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 760, delay: 40 + i * 34, easing: SPRING, fill: "backwards" }
      );
    });
}

export function arrive(kind: TransitionKind) {
  if (typeof document === "undefined" || off() || !ARRIVE[kind]) return;
  lastArriveTimestamp = performance.now();

  if (kind === "role") {
    const screen =
      document.querySelector<HTMLElement>("#app > :first-child") ||
      document.querySelector<HTMLElement>("#app");
    if (screen) {
      play(screen, ARRIVE.role, { duration: 640, easing: GLIDE });
      staggerChildren(screen);
    }
    const nav = document.querySelector<HTMLElement>("#app .nav");
    if (nav) {
      play(
        nav,
        [{ transform: "translateY(90px) scale(0.9)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 800, delay: 180, easing: SPRING, fill: "backwards" }
      );
    }
    return;
  }

  const screen =
    document.querySelector<HTMLElement>("#app .scroll") ||
    document.querySelector<HTMLElement>("#app > :first-child") ||
    document.querySelector<HTMLElement>("#app");

  if (!screen) return;

  play(screen, ARRIVE[kind], { duration: 480, easing: GLIDE });

  if (kind === "tab") {
    staggerChildren(screen);
  }
}

// ----- observe async content replacements (e.g. Skeletons -> real cards) -----
export function observeContentChanges() {
  if (typeof document === "undefined" || off()) return () => {};

  const observer = new MutationObserver(() => {
    if (performance.now() - lastArriveTimestamp > 1200) return;
    const screen =
      document.querySelector<HTMLElement>("#app .scroll") ||
      document.querySelector<HTMLElement>("#app > :first-child");
    if (screen) {
      staggerChildren(screen);
    }
  });

  const app = document.querySelector("#app");
  if (app) {
    observer.observe(app, { childList: true, subtree: true });
  }

  return () => observer.disconnect();
}

// ----- transition kind resolver -----
const PARENT_TABS = ["/p", "/p/today", "/p/progress", "/p/learn", "/p/help"];
const THERAPIST_TABS = ["/t", "/t/alerts", "/t/library", "/t/settings"];
const CENTRE_TABS = ["/c", "/c/therapists", "/c/families"];

function getRole(path: string): string {
  if (path.startsWith("/p")) return "parent";
  if (path.startsWith("/t")) return "therapist";
  if (path.startsWith("/c")) return "centre";
  return path;
}

function isTab(path: string): boolean {
  return PARENT_TABS.includes(path) || THERAPIST_TABS.includes(path) || CENTRE_TABS.includes(path);
}

export function getTransitionKind(prev: string, curr: string, isPop = false): TransitionKind {
  if (isPop) return "pop";

  const prevRole = getRole(prev);
  const currRole = getRole(curr);
  if (prevRole !== currRole) return "role";

  if (isTab(prev) && isTab(curr)) return "tab";

  const prevDepth = prev.split("/").filter(Boolean).length;
  const currDepth = curr.split("/").filter(Boolean).length;

  if (currDepth > prevDepth || (curr.startsWith(prev) && curr !== prev)) return "push";
  if (currDepth < prevDepth || prev.startsWith(curr)) return "pop";

  return "tab";
}

// ----- small moments: tick burst, accordion unfold, story page turn -----
export function tickEffect(el: HTMLElement) {
  if (off()) return;
  play(el, [{ transform: "scale(0.5)" }, { transform: "scale(1.28)", offset: 0.4 }, { transform: "none" }], {
    duration: 560,
    easing: GLIDE,
  });
  const mark = el.querySelector("svg");
  if (mark) {
    play(mark, [{ transform: "scale(0) rotate(-40deg)", opacity: 0 }, { transform: "none", opacity: 1 }], {
      duration: 520,
      delay: 60,
      easing: SPRING,
      fill: "backwards",
    });
  }
  const ring = document.createElement("span");
  ring.className = "burst";
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  el.append(ring);
  const a = play(ring, [{ transform: "scale(0.6)", opacity: 0.9 }, { transform: "scale(2.6)", opacity: 0 }], {
    duration: 700,
    easing: GLIDE,
  });
  if (a) a.onfinish = () => ring.remove();
  else ring.remove();
}

export function turnPage(dir: number) {
  if (off() || typeof document === "undefined") return;
  const pic = document.querySelector<HTMLElement>("#app .reader .pic, #app .story-pic, #app .pic");
  const words = document.querySelector<HTMLElement>("#app .reader .words, #app .story-words, #app .words");
  if (pic) {
    play(
      pic,
      [
        { transform: `translateX(${dir * 70}px) scale(0.9) rotate(${dir * 3}deg)`, opacity: 0, filter: "blur(8px)" },
        { transform: "none", opacity: 1, filter: "blur(0)" },
      ],
      { duration: 640, easing: SPRING }
    );
  }
  if (words) {
    play(words, [{ transform: "translateY(14px)", opacity: 0 }, { transform: "none", opacity: 1 }], {
      duration: 520,
      delay: 90,
      easing: GLIDE,
      fill: "backwards",
    });
  }
}

export function unfold(rowOrEl: HTMLElement) {
  if (off() || !rowOrEl) return;
  const parts = rowOrEl.querySelectorAll(".steps > li, .stepfoot");
  parts.forEach((el, i) =>
    play(
      el,
      [{ transform: "translateY(-10px) scale(0.97)", opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 620, delay: i * 45, easing: SPRING, fill: "backwards" }
    )
  );
}
