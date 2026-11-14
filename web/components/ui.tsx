"use client";
// Shared UI primitives in the prototype's glass style. Every tappable element is at least 48 px tall.
import { Check, Info, Loader2, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { DOMAINS } from "@/lib/labels";
import type { Activity, Domain, Mood } from "@/lib/types";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ---------- Button ----------
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "ghost" | "danger" | "outline";
  size?: "md" | "lg" | "sm";
  loading?: boolean;
  icon?: ReactNode;
  href?: string;
  block?: boolean;
};
const VARIANTS = {
  primary: "bg-primary text-white shadow-[0_8px_20px_-8px_var(--primary)] hover:bg-primary-deep",
  soft: "glass text-primary",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "bg-alert text-white",
  outline: "border border-line text-text hover:bg-primary-soft",
};
const SIZES = { sm: "min-h-10 px-3 text-sm rounded-xl", md: "min-h-12 px-4 text-[15px] rounded-2xl", lg: "min-h-14 px-5 text-lg rounded-2xl" };

export function Button({ variant = "primary", size = "md", loading, icon, href, block, className, children, disabled, ...rest }: BtnProps) {
  const cls = cx(
    "inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100 select-none",
    VARIANTS[variant], SIZES[size], block && "w-full", className,
  );
  const inner = (
    <>
      {loading ? <Loader2 className="size-5 animate-spin" /> : icon}
      {children}
    </>
  );
  if (href && !disabled) return <Link href={href} className={cls}>{inner}</Link>;
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {inner}
    </button>
  );
}

// ---------- Card ----------
export function Card({ className, children, onClick, strong }: { className?: string; children: ReactNode; onClick?: () => void; strong?: boolean }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      className={cx(strong ? "glass-strong" : "glass", "rounded-[var(--radius-card)] p-4", onClick && "cursor-pointer transition active:scale-[0.99]", className)}
    >
      {children}
    </div>
  );
}

// ---------- Chip ----------
const TONES = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-[#1f8f3c] dark:text-success",
  celebrate: "bg-celebrate-soft text-[#b36800] dark:text-celebrate",
  alert: "bg-alert-soft text-alert",
  muted: "bg-line text-text-2",
};
export type Tone = keyof typeof TONES;
export function Chip({ tone = "muted", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", TONES[tone], className)}>{icon}{children}</span>;
}

/** Toggleable filter chip, 40px tall (therapist screens). */
export function FilterChip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={cx("min-h-10 rounded-full px-3.5 text-sm font-medium transition border", active ? "bg-primary text-white border-primary" : "border-line text-text-2 hover:bg-primary-soft")}>
      {children}
    </button>
  );
}

// ---------- Segmented / Tabs ----------
export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div role="tablist" className={cx("glass inline-flex rounded-2xl p-1 gap-1", className)}>
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cx("min-h-10 rounded-xl px-4 text-sm font-semibold transition", value === o.value ? "bg-primary text-white shadow" : "text-text-2 hover:text-text")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Overlays ----------
function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
}

export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="glass-strong relative w-full max-w-[480px] max-h-[92vh] overflow-y-auto rounded-t-3xl p-5 pb-[max(20px,env(safe-area-inset-bottom))] rise">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        {title && <div className="mb-3 flex items-start justify-between gap-3"><h2 className="text-xl font-bold">{title}</h2><IconBtn label="Close" onClick={onClose}><X className="size-5" /></IconBtn></div>}
        {children}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className={cx("glass-strong relative h-full w-full overflow-y-auto p-5 rise", wide ? "max-w-[680px]" : "max-w-[520px]")}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="text-xl font-bold">{title}</div>
          <IconBtn label="Close" onClick={onClose}><X className="size-5" /></IconBtn>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="glass-strong relative w-full max-w-md rounded-3xl p-6 pop">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <IconBtn label="Close" onClick={onClose}><X className="size-5" /></IconBtn>
        </div>
        {children}
      </div>
    </div>
  );
}

export function IconBtn({ label, onClick, children, className }: { label: string; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={cx("grid size-12 shrink-0 place-items-center rounded-full text-text-2 hover:bg-primary-soft", className)}>
      {children}
    </button>
  );
}

// ---------- Toast ----------
const ToastCtx = createContext<(msg: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div role="status" className="fixed left-1/2 top-14 z-[60] -translate-x-1/2 rise">
          <div className="glass-strong flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold">
            <Check className="size-5 text-success" />{msg}
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// ---------- Loading, empty, error ----------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden />;
}
export function SkeletonList({ rows = 3, h = "h-20" }: { rows?: number; h?: string }) {
  return <div className="space-y-3" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className={cx(h, "w-full rounded-[12px]")} />)}</div>;
}

export function EmptyState({ emoji = "🌱", title, action }: { emoji?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="glass rounded-[var(--radius-card)] px-6 py-10 text-center rise">
      <div className="mx-auto mb-3 grid size-20 place-items-center rounded-full bg-primary-soft text-4xl">{emoji}</div>
      <p className="mx-auto max-w-xs text-[17px] font-semibold">{title}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glass rounded-[var(--radius-card)] p-6 text-center">
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      {onRetry && <Button variant="soft" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

// ---------- AI ----------
export function AIDraftBanner({ onApprove, onEdit, approved, text = "AI draft — check before use", children }: { onApprove?: () => void; onEdit?: () => void; approved?: boolean; text?: string; children?: ReactNode }) {
  if (approved)
    return <div className="flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-3 text-sm font-semibold text-[#1f8f3c]"><Check className="size-5" />Approved by therapist</div>;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-info-soft px-4 py-3 text-info">
      <Sparkles className="size-5" />
      <span className="flex-1 text-sm font-semibold">{text}</span>
      {children}
      {onEdit && <Button size="sm" variant="ghost" className="text-info" onClick={onEdit}>Edit</Button>}
      {onApprove && <Button size="sm" className="bg-info shadow-none" onClick={onApprove}>Approve</Button>}
    </div>
  );
}

export function AIBlock({ children, label = "AI summary" }: { children: ReactNode; label?: string }) {
  return (
    <div className="rounded-xl border border-info/20 bg-info-soft p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-info"><Sparkles className="size-3.5" />{label}</div>
      <div className="text-sm text-text">{children}</div>
    </div>
  );
}

/** Steps that tick off one by one while AI works. */
export function StepLoader({ steps, stepMs = 500 }: { steps: string[]; stepMs?: number }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setDone((d) => Math.min(d + 1, steps.length)), stepMs);
    return () => window.clearInterval(t);
  }, [steps.length, stepMs]);
  return (
    <div className="glass mx-auto max-w-sm rounded-3xl p-6" role="status" aria-live="polite">
      <div className="mb-4 flex items-center gap-2 text-info"><Sparkles className="size-5 animate-pulse" /><span className="font-semibold">AI is working…</span></div>
      <ul className="space-y-3">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3">
            <span className={cx("grid size-7 place-items-center rounded-full transition", i < done ? "bg-success text-white pop" : i === done ? "bg-info-soft text-info" : "bg-line text-muted")}>
              {i < done ? <Check className="size-4" /> : i === done ? <Loader2 className="size-4 animate-spin" /> : i + 1}
            </span>
            <span className={cx("text-[15px]", i <= done ? "text-text" : "text-muted")}>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Mood ----------
const MOOD_LIST: { v: Mood; e: string; en: string; bn: string }[] = [
  { v: "happy", e: "😀", en: "Went well", bn: "ভালো" },
  { v: "neutral", e: "😐", en: "Okay", bn: "মোটামুটি" },
  { v: "sad", e: "😟", en: "Hard", bn: "কঠিন" },
];
export function MoodPicker({ value, onChange, lang = "bn", size = "lg" }: { value?: Mood | null; onChange: (m: Mood) => void; lang?: "bn" | "en"; size?: "lg" | "md" }) {
  return (
    <div className="grid grid-cols-3 gap-3" role="radiogroup">
      {MOOD_LIST.map((m) => (
        <button key={m.v} role="radio" aria-checked={value === m.v} onClick={() => onChange(m.v)}
          className={cx("glass flex flex-col items-center justify-center gap-1 rounded-3xl transition active:scale-95", size === "lg" ? "min-h-28" : "min-h-20",
            value === m.v && "ring-3 ring-primary bg-primary-soft")}>
          <span className={size === "lg" ? "text-5xl" : "text-3xl"}>{m.e}</span>
          <span className={cx("text-sm font-semibold", lang === "bn" && "bn")}>{lang === "bn" ? m.bn : m.en}</span>
        </button>
      ))}
    </div>
  );
}

// ---------- Banners ----------
export function DemoBanner() {
  return (
    <div className="no-print sticky top-0 z-40 flex min-h-7 items-center justify-center gap-1.5 bg-celebrate px-3 py-1 text-center text-xs font-bold text-white">
      <Info className="size-3.5" /> Demo data — no real children <span className="bn font-semibold opacity-90">· ডেমো তথ্য — কোনো আসল শিশু নয়</span>
    </div>
  );
}

// ---------- Form fields ----------
export function Field({ label, hint, error, children, optional }: { label: ReactNode; hint?: ReactNode; error?: string | null; children: ReactNode; optional?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold">{label}{optional && <span className="text-xs font-normal text-muted">optional</span>}</span>
      {children}
      {error ? <span className="mt-1 block text-sm font-medium text-[#c2410c]">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
export const inputCls = (invalid?: boolean) =>
  cx("w-full min-h-12 rounded-xl border bg-surface/70 px-3.5 text-[15px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft",
    invalid ? "border-[#ea580c] ring-2 ring-[#ea580c]/20" : "border-line");

// ---------- Activity art (placeholder illustration until real pictures exist) ----------
const TINT_BG: Record<string, string> = {
  blue: "from-[#cfe6ff] to-[#e8f2ff]", pink: "from-[#ffd6e3] to-[#fff0f5]", orange: "from-[#ffe1bf] to-[#fff4e6]", green: "from-[#d3f5dc] to-[#effcf2]",
  purple: "from-[#ddd9ff] to-[#f1efff]", yellow: "from-[#fff0b3] to-[#fffae0]",
};
export function ActivityArt({ activity, domain, className, emoji, step }: { activity?: Pick<Activity, "domain" | "id">; domain?: Domain; className?: string; emoji?: string; step?: number }) {
  const d = DOMAINS[activity?.domain ?? domain ?? "social"];
  return (
    <div className={cx("relative grid place-items-center overflow-hidden rounded-2xl bg-gradient-to-br", TINT_BG[d.tint], className)} aria-hidden>
      <span className="text-[min(3.5rem,40cqw)] drop-shadow-sm">{emoji ?? d.emoji}</span>
      {step != null && <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-text">{step}</span>}
    </div>
  );
}

export function tintBg(tint: string) {
  return cx("bg-gradient-to-br", TINT_BG[tint] ?? TINT_BG.purple);
}

/** Small amber progress ring, e.g. "3 of 5 today". Never red. */
export function ProgressRing({ value, total, size = 64, label }: { value: number; total: number; size?: number; label?: ReactNode }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? value / total : 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--celebrate-soft)" strokeWidth="7" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--celebrate)" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .6s" }} />
      </svg>
      <span className="absolute text-sm font-bold">{label}</span>
    </div>
  );
}

export function PageTitle({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-[15px] text-text-2">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-7 flex items-baseline justify-between gap-2 px-1">
      <h2 className="text-lg font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}
