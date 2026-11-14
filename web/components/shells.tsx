"use client";
// Layout shells and role guards using the prototype's phone frame, top bar and bottom glass nav.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/legacy/icons";
import { Ele, Tiger } from "@/components/legacy/mascots";
import { BottomSheet, cx, Skeleton } from "@/components/ui";
import { useLoad, useMounted } from "@/lib/hooks";
import { LangProvider, useLang } from "@/lib/i18n";
import { alertService, authService, childService } from "@/lib/services";
import type { Role, User } from "@/lib/types";

export const HOME: Record<Role, string> = { therapist: "/t", parent: "/p/today", admin: "/c" };

/** Redirects to /login if logged out, or to the role's home if the role doesn't match. */
export function RoleGuard({ role, children }: { role: Role; children: (user: User | null) => ReactNode }) {
  const mounted = useMounted();
  const router = useRouter();
  const { data: user, loading } = useLoad(() => authService.currentUser(), []);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(HOME[user.role]);
  }, [mounted, loading, user, role, router]);

  if (!mounted || loading || !user || user.role !== role) {
    return (
      <>
        <div className="pad in" style={{ paddingTop: 70 }}>
          <Skeleton className="h-10 w-2/3" style={{ marginBottom: 16 }} />
          <Skeleton className="h-24 card" style={{ marginBottom: 12 }} />
          <Skeleton className="h-24 card" />
        </div>
        <div style={{ display: "none" }} aria-hidden="true">
          {children(user ?? null)}
        </div>
      </>
    );
  }

  return <>{children(user)}</>;
}

// ---------- Shared Top Bar & Menu Sheet ----------
export function ShellTopBar({
  dot,
  extra,
  user,
}: {
  dot?: boolean;
  extra?: ReactNode;
  user?: User | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="top">
        <button
          className="hbtn"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          type="button"
        >
          <Icon name="menu" />
        </button>
        <button
          className="hbtn"
          onClick={() => {
            if (user?.role === "therapist") router.push("/t/alerts");
            else if (user?.role === "parent") router.push("/p/help");
            else router.push("/c");
          }}
          aria-label="Notifications"
          type="button"
        >
          <Icon name="bell" />
          {dot && <i className="dot" />}
        </button>
        <div className="grow" />
        {extra}
      </div>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="BridgeAI">
        <p className="sub" style={{ marginTop: 2, marginBottom: 14 }}>
          {user ? `Logged in as ${user.name}` : "Therapy that continues at home."}
        </p>

        <div className="sec" style={{ margin: "16px 0 8px" }}>
          <h2 className="h2" style={{ fontSize: 16 }}>Switch persona</h2>
        </div>

        <button
          className={cx("persona", user?.role === "parent" && "on")}
          onClick={async () => {
            setMenuOpen(false);
            await authService.demoLogIn("parent");
            router.push("/p/today");
          }}
          type="button"
        >
          <span className="m t-orange">
            <Tiger mood="hi" />
          </span>
          <span className="grow">
            <span className="h3" style={{ display: "block" }}>View as a parent</span>
            <span className="small">At home with your child</span>
          </span>
          <span className="go"><Icon name={user?.role === "parent" ? "check" : "next"} /></span>
        </button>

        <button
          className={cx("persona", user?.role === "therapist" && "on")}
          onClick={async () => {
            setMenuOpen(false);
            await authService.demoLogIn("therapist");
            router.push("/t");
          }}
          type="button"
        >
          <span className="m t-purple">
            <Ele mood="calm" extra="doctor" />
          </span>
          <span className="grow">
            <span className="h3" style={{ display: "block" }}>View as a therapist</span>
            <span className="small">Dr. Nasrin, at the clinic</span>
          </span>
          <span className="go"><Icon name={user?.role === "therapist" ? "check" : "next"} /></span>
        </button>

        <button
          className={cx("persona", user?.role === "admin" && "on")}
          onClick={async () => {
            setMenuOpen(false);
            await authService.demoLogIn("admin");
            router.push("/c");
          }}
          type="button"
        >
          <span className="m t-green">
            <Icon name="building" />
          </span>
          <span className="grow">
            <span className="h3" style={{ display: "block" }}>View as the centre</span>
            <span className="small">Managing the centre</span>
          </span>
          <span className="go"><Icon name={user?.role === "admin" ? "check" : "next"} /></span>
        </button>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <Link
            href="/t/settings"
            onClick={() => setMenuOpen(false)}
            className="row"
            style={{ textDecoration: "none" }}
          >
            <span className="ic t-green" style={{ width: 38, height: 38, fontSize: 18 }}>
              <Icon name="shield" />
            </span>
            <span className="grow h3" style={{ fontWeight: 500 }}>How AI is used</span>
            <Icon name="next" />
          </Link>

          <button
            className="btn soft wide"
            onClick={async () => {
              setMenuOpen(false);
              await authService.logOut();
              router.push("/");
            }}
            type="button"
            style={{ marginTop: 8 }}
          >
            Log out
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

// ---------- Therapist Shell ----------
export function TherapistShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LangProvider storageKey="bridgeai-lang-t" fallback="en">
        <RoleGuard role="therapist">{(user) => <TherapistFrame user={user}>{children}</TherapistFrame>}</RoleGuard>
      </LangProvider>
    </Suspense>
  );
}

function TherapistFrame({ user, children }: { user?: User | null; children: ReactNode }) {
  const path = usePathname();
  const { data: alerts } = useLoad(() => alertService.listAlerts(), []);
  const openAlerts = alerts?.filter((a) => !a.resolvedAt).length ?? 0;
  const { lang, setLang } = useLang();

  // Child sub-views or detail pages can hide nav if needed
  const hideNav = path.includes("/roadmap") || path.includes("/intake");

  const langBtn = (
    <button
      className={cx("hbtn", lang === "en" ? "bn" : "")}
      style={{ fontSize: 12.5, fontWeight: 600 }}
      onClick={() => setLang(lang === "en" ? "bn" : "en")}
      aria-label="Change language"
      type="button"
    >
      {lang === "en" ? "বাং" : "EN"}
    </button>
  );

  return (
    <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="pad" style={{ paddingBottom: 0 }}>
        <ShellTopBar user={user} dot={openAlerts > 0} extra={langBtn} />
      </div>

      <div className={cx("scroll softbg", !hideNav && "with-nav")} style={{ flex: 1, paddingBottom: hideNav ? 28 : 116 }}>
        {children}
      </div>

      {!hideNav && (
        <>
          <div className="fade" />
          <nav className="nav">
            <Link
              href="/t"
              className={cx("navb", (path === "/t" || path.startsWith("/t/children")) && "on")}
            >
              <Icon name="users" />
              <span>Children</span>
            </Link>
            <Link
              href="/t/alerts"
              className={cx("navb", path === "/t/alerts" && "on")}
            >
              <Icon name="bell" />
              <span>Alerts</span>
              {openAlerts > 0 && <span className="n">{openAlerts}</span>}
            </Link>
            <Link
              href="/t/library"
              className={cx("navb", path.startsWith("/t/library") && "on")}
            >
              <Icon name="book" />
              <span>Library</span>
            </Link>
            <Link
              href="/t/settings"
              className={cx("navb", path.startsWith("/t/settings") && "on")}
            >
              <Icon name="gear" />
              <span>Settings</span>
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}

// ---------- Admin Shell ----------
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LangProvider storageKey="bridgeai-lang-c" fallback="en">
        <RoleGuard role="admin">{(user) => <AdminFrame user={user}>{children}</AdminFrame>}</RoleGuard>
      </LangProvider>
    </Suspense>
  );
}

function AdminFrame({ user, children }: { user?: User | null; children: ReactNode }) {
  const path = usePathname();

  return (
    <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="pad" style={{ paddingBottom: 0 }}>
        <ShellTopBar user={user} />
      </div>

      <div className="scroll softbg" style={{ flex: 1, paddingBottom: 116 }}>
        {children}
      </div>

      <div className="fade" />
      <nav className="nav">
        <Link
          href="/c"
          className={cx("navb", path === "/c" && "on")}
        >
          <Icon name="building" />
          <span>Overview</span>
        </Link>
        <Link
          href="/c/therapists"
          className={cx("navb", path.startsWith("/c/therapists") && "on")}
        >
          <Icon name="users" />
          <span>Therapists</span>
        </Link>
        <Link
          href="/c/families"
          className={cx("navb", path.startsWith("/c/families") && "on")}
        >
          <Icon name="heart" />
          <span>Families</span>
        </Link>
      </nav>
    </div>
  );
}

// ---------- Parent Shell ----------
export function ParentShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LangProvider storageKey="bridgeai-lang-p" fallback="bn">
        <RoleGuard role="parent">{(user) => <ParentFrame user={user}>{children}</ParentFrame>}</RoleGuard>
      </LangProvider>
    </Suspense>
  );
}

function ParentFrame({ user, children }: { user?: User | null; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { L, lang, setLang } = useLang();
  const { data: cg } = useLoad(() => childService.getMyCaregiver(), []);

  useEffect(() => {
    if (cg && !cg.onboarded && !path.startsWith("/p/onboarding")) {
      router.replace("/p/onboarding");
    }
  }, [cg, path, router]);

  const hideNav =
    path.startsWith("/p/onboarding") ||
    /\/p\/activity\/[^/]+\/steps/.test(path) ||
    path.startsWith("/p/learn/story/");

  const langBtn = (
    <button
      className={cx("hbtn", lang === "en" ? "bn" : "")}
      style={{ fontSize: 12.5, fontWeight: 600 }}
      onClick={() => setLang(lang === "en" ? "bn" : "en")}
      aria-label="Change language"
      type="button"
    >
      {lang === "en" ? "বাং" : "EN"}
    </button>
  );

  return (
    <div
      lang={lang}
      className={cx(lang === "bn" && "bn")}
      style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div className="pad" style={{ paddingBottom: 0 }}>
        <ShellTopBar user={user} extra={langBtn} />
      </div>

      <div className="scroll homebg" style={{ flex: 1, paddingBottom: hideNav ? 28 : 116 }}>
        {children}
      </div>

      {!hideNav && (
        <>
          <div className="fade" />
          <nav className="nav">
            <Link
              href="/p/today"
              className={cx("navb", (path === "/p" || path.startsWith("/p/today")) && "on")}
            >
              <Icon name="home" />
              <span>{L("আজ", "Today")}</span>
            </Link>
            <Link
              href="/p/progress"
              className={cx("navb", path.startsWith("/p/progress") && "on")}
            >
              <Icon name="chart" />
              <span>{L("অগ্রগতি", "Progress")}</span>
            </Link>
            <Link
              href="/p/learn"
              className={cx("navb", path.startsWith("/p/learn") && "on")}
            >
              <Icon name="book" />
              <span>{L("শিখুন", "Learn")}</span>
            </Link>
            <Link
              href="/p/help"
              className={cx("navb", path.startsWith("/p/help") && "on")}
            >
              <Icon name="lifebuoy" />
              <span>{L("সাহায্য", "Help")}</span>
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
