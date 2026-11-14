"use client";
// Shared UI primitives rebuilt to match the prototype's exact glass material, type scale and layout classes.
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Icon } from "@/components/legacy/icons";
import { Ele } from "@/components/legacy/mascots";
import { lozenges } from "@/components/legacy/motion";
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

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  href,
  block,
  className,
  children,
  disabled,
  ...rest
}: BtnProps) {
  const variantCls =
    variant === "primary"
      ? "p"
      : variant === "soft"
      ? "soft"
      : variant === "danger"
      ? "danger"
      : variant === "outline"
      ? "line"
      : "soft";

  const sizeCls = size === "sm" ? "sm" : size === "lg" ? "big" : "";

  const cls = cx("btn", variantCls, sizeCls, block && "wide", className);

  const inner = (
    <>
      {loading ? <Icon name="refresh" className="animate-spin" /> : icon}
      {children}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {inner}
    </button>
  );
}

// ---------- Card ----------
export function Card({
  className,
  children,
  onClick,
  strong,
  style,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  strong?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      className={cx("card", strong && "glass-strong", className)}
      style={{ ...(onClick ? { cursor: "pointer" } : {}), ...style }}
    >
      {children}
    </div>
  );
}

// ---------- Chip ----------
export type Tone = "primary" | "info" | "success" | "celebrate" | "alert" | "muted";

export function Chip({
  tone = "muted",
  children,
  className,
  icon,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  const pillCls =
    tone === "alert"
      ? "bad"
      : tone === "success"
      ? "good"
      : tone === "celebrate"
      ? "warn"
      : tone === "primary"
      ? ""
      : "line";

  return (
    <span className={cx("pill", pillCls, className)}>
      {icon}
      {children}
    </span>
  );
}

/** Toggleable filter chip (therapist screens). */
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx("chipb tag", active && "on")}
      type="button"
    >
      {children}
    </button>
  );
}

// ---------- Segmented / Tabs ----------
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  className?: string;
}) {
  useEffect(() => {
    lozenges("seg", true);
  }, [value]);

  return (
    <div role="tablist" className={cx("seg", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={value === o.value ? "on" : ""}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Overlays (All render as prototype bottom sheets) ----------
function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  useEsc(open, onClose);
  if (!open) return null;
  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="shead">
            <div className="grow">
              <h2 className="h2">{title}</h2>
            </div>
            <button className="xb" onClick={onClose} aria-label="Close" type="button">
              <Icon name="x" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** On mobile phone frame, drawers render as bottom sheets */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {children}
    </BottomSheet>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {children}
    </BottomSheet>
  );
}

export function IconBtn({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx("hbtn", className)}
      type="button"
    >
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
      <div id="toast" role="status" aria-live="polite" className={cx("toast-pill", msg && "on")}>
        {msg}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// ---------- Loading, empty, error ----------
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("skeleton", className)} aria-hidden {...props} />;
}

export function SkeletonList({ rows = 3, h = "h-20" }: { rows?: number; h?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={cx(h, "card")} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  action,
}: {
  emoji?: string;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card empty">
      <div className="m">
        <Ele mood="calm" />
      </div>
      <p style={{ marginTop: 6 }}>{title}</p>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="err" style={{ textAlign: "center", padding: "16px 14px" }}>
      <p className="h3" style={{ color: "inherit" }}>Something went wrong</p>
      <p className="small" style={{ color: "inherit", marginTop: 4, opacity: 0.9 }}>{message}</p>
      {onRetry && (
        <Button variant="soft" size="sm" style={{ marginTop: 10 }} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ---------- AI ----------
export function AIDraftBanner({
  onApprove,
  onEdit,
  approved,
  text = "AI draft — check before use",
  children,
}: {
  onApprove?: () => void;
  onEdit?: () => void;
  approved?: boolean;
  text?: string;
  children?: ReactNode;
}) {
  if (approved) {
    return (
      <div className="ai-draft-banner approved">
        <Icon name="check" style={{ fontSize: 18 }} />
        <span className="grow">Approved by therapist</span>
      </div>
    );
  }
  return (
    <div className="ai-draft-banner">
      <Icon name="spark" style={{ fontSize: 18, color: "var(--blue)" }} />
      <span className="grow">{text}</span>
      {children}
      {onEdit && (
        <button className="link" onClick={onEdit} type="button" style={{ fontSize: 13 }}>
          Edit
        </button>
      )}
      {onApprove && (
        <Button size="sm" onClick={onApprove} style={{ height: 30, padding: "0 12px", fontSize: 13 }}>
          Approve
        </Button>
      )}
    </div>
  );
}

export function AIBlock({ children, label = "AI summary" }: { children: ReactNode; label?: string }) {
  return (
    <div
      className="card"
      style={{
        background: "rgba(0, 122, 255, 0.08)",
        borderColor: "rgba(0, 122, 255, 0.25)",
        boxShadow: "var(--shine)",
        padding: "12px 14px",
      }}
    >
      <div
        className="small"
        style={{
          color: "var(--blue)",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 700,
        }}
      >
        <Icon name="spark" style={{ fontSize: 14 }} />
        {label}
      </div>
      <div className="sub" style={{ color: "var(--ink)" }}>{children}</div>
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
    <div className="card thinking" role="status" aria-live="polite">
      <div className="m">
        <Ele mood="calm" />
      </div>
      <p className="h3">AI is working…</p>
      <div className="steps4" style={{ width: "100%", maxWidth: 220, margin: "6px 0 10px" }}>
        {steps.map((_, i) => (
          <i key={i} className={i <= done ? "on" : ""} />
        ))}
      </div>
      <p className="small">{steps[Math.min(done, steps.length - 1)]}</p>
    </div>
  );
}

// ---------- Mood Picker ----------
export function MoodPicker({
  value,
  onChange,
  lang = "bn",
}: {
  value?: Mood | null;
  onChange: (m: Mood) => void;
  lang?: "bn" | "en";
  size?: "lg" | "md";
}) {
  return (
    <div className="faces" role="radiogroup">
      <button
        type="button"
        role="radio"
        aria-checked={value === "happy"}
        onClick={() => onChange("happy")}
        className={cx("face good", value === "happy" && "on")}
      >
        <Icon name="faceGood" />
        <span>{lang === "bn" ? "ভালো" : "Went well"}</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "neutral"}
        onClick={() => onChange("neutral")}
        className={cx("face mixed", value === "neutral" && "on")}
      >
        <Icon name="faceMixed" />
        <span>{lang === "bn" ? "মোটামুটি" : "Okay"}</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "sad"}
        onClick={() => onChange("sad")}
        className={cx("face hard", value === "sad" && "on")}
      >
        <Icon name="faceHard" />
        <span>{lang === "bn" ? "কঠিন" : "Hard"}</span>
      </button>
    </div>
  );
}

// ---------- Demo Banner ----------
export function DemoBanner() {
  return (
    <div className="demo-pill" role="status">
      <Icon name="spark" style={{ fontSize: 13, color: "var(--orange)" }} />
      <span>Demo data — no real children</span>
      <span className="bn" style={{ opacity: 0.9 }}>· ডেমো তথ্য</span>
    </div>
  );
}

// ---------- Form fields ----------
export function Field({
  label,
  hint,
  error,
  children,
  optional,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <span>{label}</span>
        {optional && <span className="small">optional</span>}
      </span>
      {children}
      {error ? (
        <span style={{ display: "block", color: "var(--pink)", fontSize: 13, marginTop: 4 }}>
          {error}
        </span>
      ) : hint ? (
        <span className="small" style={{ display: "block", marginTop: 4 }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export const inputCls = (invalid?: boolean) =>
  cx("field", invalid && "border-pink");

// ---------- Activity art ----------
export function ActivityArt({
  activity,
  domain,
  className,
  step,
  style,
}: {
  activity?: Pick<Activity, "domain" | "id">;
  domain?: Domain;
  className?: string;
  emoji?: string;
  step?: number;
  style?: React.CSSProperties;
}) {
  const d = DOMAINS[activity?.domain ?? domain ?? "social"];
  const tint =
    d.tint === "blue"
      ? "t-blue"
      : d.tint === "orange"
      ? "t-orange"
      : d.tint === "green"
      ? "t-green"
      : d.tint === "pink"
      ? "t-pink"
      : d.tint === "yellow"
      ? "t-yellow"
      : "t-purple";

  return (
    <div
      className={cx("ic", tint, className)}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 20,
        fontSize: 32,
        position: "relative",
        ...style,
      }}
      aria-hidden
    >
      <Icon name={activity?.domain === "motor" ? "turn" : activity?.domain === "sensory" ? "sound" : "spark"} />
      {step != null && (
        <span
          className="pill line"
          style={{ position: "absolute", top: 6, left: 6, height: 20, fontSize: 11 }}
        >
          {step}
        </span>
      )}
    </div>
  );
}

export function tintBg(tint: string) {
  const map: Record<string, string> = {
    blue: "t-blue",
    pink: "t-pink",
    orange: "t-orange",
    green: "t-green",
    purple: "t-purple",
    yellow: "t-yellow",
  };
  return map[tint] ?? "t-purple";
}

/** Progress ring using SVG and old green token */
export function ProgressRing({
  value,
  total,
  size = 52,
  label,
}: {
  value: number;
  total: number;
  size?: number;
  label?: ReactNode;
}) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="ringp" style={{ width: size, height: size, ["--p" as string]: pct }}>
      <Icon name="turn" />
      {label && <span className="small" style={{ position: "absolute", bottom: -20, whiteSpace: "nowrap" }}>{label}</span>}
    </div>
  );
}

export function PageTitle({
  title,
  sub,
  actions,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="bar" style={{ padding: "4px 0 12px" }}>
      <div className="grow">
        <h1 className="h2">{title}</h1>
        {sub && <p className="small" style={{ marginTop: 2 }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="sec">
      <h2 className="h2">{children}</h2>
      {action}
    </div>
  );
}
