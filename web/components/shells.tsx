"use client";
// Layout shells and the client-side role guard.
import { BarChart3, BookOpen, Building2, Home, LifeBuoy, LogOut, Menu, Settings, ShieldAlert, Sparkles, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useLoad, useMounted } from "@/lib/hooks";
import { LangProvider, useLang } from "@/lib/i18n";
import { alertService, authService, childService } from "@/lib/services";
import type { Role, User } from "@/lib/types";
import { cx, Skeleton } from "./ui";

export const HOME: Record<Role, string> = { therapist: "/t", parent: "/p/today", admin: "/c" };

/** Redirects to /login if logged out, or to the role's home if the role doesn't match. */
export function RoleGuard({ role, children }: { role: Role; children: (user: User) => ReactNode }) {
  const mounted = useMounted();
  const router = useRouter();
  const { data: user, loading } = useLoad(() => authService.currentUser(), []);
  useEffect(() => {
    if (!mounted || loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(HOME[user.role]);
  }, [mounted, loading, user, role, router]);
  if (!mounted || loading || !user || user.role !== role)
    return <div className="mx-auto max-w-md space-y-3 p-6"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;
  return <>{children(user)}</>;
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2 py-1">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-white"><Sparkles className="size-5" /></span>
      <span className="text-lg font-bold tracking-tight">BridgeAI</span>
    </Link>
  );
}

type NavItem = { href: string; label: string; icon: ReactNode; badge?: number; exact?: boolean };

function SideNav({ items, user, footer }: { items: NavItem[]; user: User; footer?: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isActive = (i: NavItem) => (i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/"));
  const links = (
    <nav className="flex flex-col gap-1">
      {items.map((i) => (
        <Link key={i.href} href={i.href} onClick={() => setOpen(false)}
          className={cx("flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition", isActive(i) ? "bg-primary text-white" : "text-text-2 hover:bg-primary-soft")}>
          {i.icon}<span className="flex-1">{i.label}</span>
          {!!i.badge && <span className="grid min-w-6 place-items-center rounded-full bg-alert px-1.5 text-xs font-bold text-white" aria-label={`${i.badge} unresolved`}>{i.badge}</span>}
        </Link>
      ))}
    </nav>
  );
  const bottom = (
    <div className="mt-auto space-y-2 pt-6">
      {footer}
      <div className="flex items-center gap-2 rounded-xl px-2 py-2">
        <span className="grid size-9 place-items-center rounded-full bg-primary-soft font-bold text-primary">{user.name.replace(/^Dr\.?\s+/, "")[0]}</span>
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{user.name}</div><div className="truncate text-xs text-muted">{user.profession ?? (user.role === "admin" ? "Centre admin" : "")}</div></div>
        <button aria-label="Log out" title="Log out" className="grid size-10 place-items-center rounded-full text-muted hover:bg-primary-soft"
          onClick={async () => { await authService.logOut(); router.replace("/"); }}><LogOut className="size-4" /></button>
      </div>
    </div>
  );
  return (
    <>
      <aside className="glass sticky top-7 hidden h-[calc(100vh-28px)] w-64 shrink-0 flex-col gap-6 rounded-none border-y-0 border-l-0 p-4 lg:flex">
        <Brand />{links}{bottom}
      </aside>
      <header className="glass sticky top-7 z-30 flex items-center justify-between px-3 py-2 lg:hidden">
        <Brand />
        <button aria-label="Menu" onClick={() => setOpen(!open)} className="relative grid size-12 place-items-center rounded-full">
          {open ? <X /> : <Menu />}
          {!open && items.some((i) => i.badge) && <span className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-alert" />}
        </button>
      </header>
      {open && <div className="glass-strong fixed inset-x-0 top-[92px] z-30 flex flex-col p-4 lg:hidden rise">{links}{bottom}</div>}
    </>
  );
}

export function TherapistShell({ children }: { children: ReactNode }) {
  return (
    <LangProvider storageKey="bridgeai-lang-t" fallback="en">
      <RoleGuard role="therapist">{(user) => <TherapistFrame user={user}>{children}</TherapistFrame>}</RoleGuard>
    </LangProvider>
  );
}
function TherapistFrame({ user, children }: { user: User; children: ReactNode }) {
  const { data: alerts } = useLoad(() => alertService.listAlerts(), []);
  const open = alerts?.filter((a) => !a.resolvedAt).length ?? 0;
  const { lang, setLang } = useLang();
  return (
    <div className="flex min-h-[calc(100vh-28px)] flex-col lg:flex-row">
      <SideNav user={user} items={[
        { href: "/t", label: "Children", icon: <Users className="size-5" />, exact: false },
        { href: "/t/alerts", label: "Alerts", icon: <ShieldAlert className="size-5" />, badge: open },
        { href: "/t/library", label: "Library", icon: <BookOpen className="size-5" /> },
        { href: "/t/settings", label: "Settings", icon: <Settings className="size-5" /> },
      ].map((i) => (i.href === "/t" ? { ...i, exact: true } : i))}
        footer={<button onClick={() => setLang(lang === "en" ? "bn" : "en")} className="min-h-10 w-full rounded-xl border border-line text-sm font-semibold text-text-2">{lang === "en" ? "বাংলা" : "English"}</button>} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 text-[15px] lg:px-8">{children}</main>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <LangProvider storageKey="bridgeai-lang-c" fallback="en">
      <RoleGuard role="admin">
        {(user) => (
          <div className="flex min-h-[calc(100vh-28px)] flex-col lg:flex-row">
            <SideNav user={user} items={[
              { href: "/c", label: "Overview", icon: <BarChart3 className="size-5" />, exact: true },
              { href: "/c/therapists", label: "Therapists", icon: <Users className="size-5" /> },
              { href: "/c/families", label: "Families", icon: <Building2 className="size-5" /> },
            ]} />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 text-[15px] lg:px-8">{children}</main>
          </div>
        )}
      </RoleGuard>
    </LangProvider>
  );
}

export function ParentShell({ children }: { children: ReactNode }) {
  return (
    <LangProvider storageKey="bridgeai-lang-p" fallback="bn">
      <RoleGuard role="parent">{() => <ParentFrame>{children}</ParentFrame>}</RoleGuard>
    </LangProvider>
  );
}

function ParentFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { L, lang } = useLang();
  const { data: cg } = useLoad(() => childService.getMyCaregiver(), []);
  useEffect(() => {
    if (cg && !cg.onboarded && !path.startsWith("/p/onboarding")) router.replace("/p/onboarding");
  }, [cg, path, router]);
  const fullScreen = path.startsWith("/p/onboarding") || /\/p\/activity\/[^/]+\/steps/.test(path) || path.startsWith("/p/learn/story/");
  const tabs = [
    { href: "/p/today", bn: "আজ", en: "Today", icon: <Home className="size-6" /> },
    { href: "/p/progress", bn: "অগ্রগতি", en: "Progress", icon: <BarChart3 className="size-6" /> },
    { href: "/p/learn", bn: "শিখুন", en: "Learn", icon: <BookOpen className="size-6" /> },
    { href: "/p/help", bn: "সাহায্য", en: "Help", icon: <LifeBuoy className="size-6" /> },
  ];
  return (
    <div lang={lang} className={cx("mx-auto min-h-[calc(100vh-28px)] w-full max-w-[480px] text-[18px]", lang === "bn" && "bn", !fullScreen && "pb-28")}>
      {children}
      {!fullScreen && (
        <nav className="glass-strong fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] justify-around rounded-t-3xl px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5">
          {tabs.map((t) => {
            const active = path === t.href || path.startsWith(t.href + "/");
            return (
              <Link key={t.href} href={t.href} className={cx("flex min-h-14 min-w-16 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[13px] font-semibold", active ? "text-primary" : "text-muted")}>
                {t.icon}<span>{L(t.bn, t.en)}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
