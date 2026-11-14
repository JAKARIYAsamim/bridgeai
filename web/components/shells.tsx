"use client";
// Layout shells and role guards using the prototype's phone frame, top bar and bottom glass nav.
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/legacy/icons";
import { Ele, Tiger } from "@/components/legacy/mascots";
import { BottomSheet, cx, Skeleton } from "@/components/ui";
import { useLoad, useMounted } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn } from "@/lib/labels";
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
  const { lang, toggleLang, L } = useLang();

  const langBtn = (
    <button
      className={cx("hbtn", lang === "bn" ? "" : "bn")}
      style={{ fontSize: 12.5, fontWeight: 600, minWidth: 38 }}
      onClick={toggleLang}
      aria-label="Change language"
      type="button"
    >
      {lang === "bn" ? "EN" : "বাং"}
    </button>
  );

  return (
    <>
      <div className="top">
        <button
          className="hbtn"
          onClick={() => setMenuOpen(true)}
          aria-label={L("মেনু", "Menu")}
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
          aria-label={L("নোটিফিকেশন", "Notifications")}
          type="button"
        >
          <Icon name="bell" />
          {dot && <i className="dot" />}
        </button>
        <div className="grow" />
        {extra ?? langBtn}
      </div>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="BridgeAI">
        <p className="sub" style={{ marginTop: 2, marginBottom: 14 }}>
          {user
            ? L(`${nameIn(user.name, lang)} হিসেবে লগইন আছেন`, `Logged in as ${user.name}`)
            : L("থেরাপি চলবে ঘরেও।", "Therapy that continues at home.")}
        </p>

        <div className="sec" style={{ margin: "16px 0 8px" }}>
          <h2 className="h2" style={{ fontSize: 16 }}>{L("রোল পরিবর্তন", "Switch persona")}</h2>
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
            <span className="h3" style={{ display: "block" }}>{L("অভিভাবক হিসেবে দেখুন", "View as a parent")}</span>
            <span className="small">{L("শিশুর সাথে ঘরে", "At home with your child")}</span>
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
            <span className="h3" style={{ display: "block" }}>{L("থেরাপিস্ট হিসেবে দেখুন", "View as a therapist")}</span>
            <span className="small">{L("ডা. নাসরিন, ক্লিনিকে", "Dr. Nasrin, at the clinic")}</span>
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
            <span className="h3" style={{ display: "block" }}>{L("সেন্টার হিসেবে দেখুন", "View as the centre")}</span>
            <span className="small">{L("সেন্টার পরিচালনা", "Managing the centre")}</span>
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
            <span className="grow h3" style={{ fontWeight: 500 }}>{L("AI কীভাবে কাজ করে", "How AI is used")}</span>
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
            {L("লগআউট", "Log out")}
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
      <RoleGuard role="therapist">{(user) => <TherapistFrame user={user}>{children}</TherapistFrame>}</RoleGuard>
    </Suspense>
  );
}

function TherapistFrame({ user, children }: { user?: User | null; children: ReactNode }) {
  const path = usePathname();
  const { data: alerts } = useLoad(() => alertService.listAlerts(), []);
  const openAlerts = alerts?.filter((a) => !a.resolvedAt).length ?? 0;
  const { lang, L } = useLang();

  // Child sub-views or detail pages can hide nav if needed
  const hideNav = path.includes("/roadmap") || path.includes("/intake");

  return (
    <div
      lang={lang}
      className={cx(lang === "bn" && "bn")}
      style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div className="pad" style={{ paddingBottom: 0 }}>
        <ShellTopBar user={user} dot={openAlerts > 0} />
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
              <span>{L("শিশুরা", "Children")}</span>
            </Link>
            <Link
              href="/t/alerts"
              className={cx("navb", path === "/t/alerts" && "on")}
            >
              <Icon name="bell" />
              <span>{L("সতর্কতা", "Alerts")}</span>
              {openAlerts > 0 && <span className="n">{openAlerts}</span>}
            </Link>
            <Link
              href="/t/library"
              className={cx("navb", path.startsWith("/t/library") && "on")}
            >
              <Icon name="book" />
              <span>{L("লাইব্রেরি", "Library")}</span>
            </Link>
            <Link
              href="/t/settings"
              className={cx("navb", path.startsWith("/t/settings") && "on")}
            >
              <Icon name="gear" />
              <span>{L("সেটিংস", "Settings")}</span>
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
      <RoleGuard role="admin">{(user) => <AdminFrame user={user}>{children}</AdminFrame>}</RoleGuard>
    </Suspense>
  );
}

function AdminFrame({ user, children }: { user?: User | null; children: ReactNode }) {
  const path = usePathname();
  const { lang, L } = useLang();

  return (
    <div
      lang={lang}
      className={cx(lang === "bn" && "bn")}
      style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}
    >
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
          <span>{L("ওভারভিউ", "Overview")}</span>
        </Link>
        <Link
          href="/c/therapists"
          className={cx("navb", path.startsWith("/c/therapists") && "on")}
        >
          <Icon name="users" />
          <span>{L("থেরাপিস্ট", "Therapists")}</span>
        </Link>
        <Link
          href="/c/families"
          className={cx("navb", path.startsWith("/c/families") && "on")}
        >
          <Icon name="heart" />
          <span>{L("পরিবার", "Families")}</span>
        </Link>
      </nav>
    </div>
  );
}

// ---------- Parent Shell ----------
export function ParentShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RoleGuard role="parent">{(user) => <ParentFrame user={user}>{children}</ParentFrame>}</RoleGuard>
    </Suspense>
  );
}

function ParentFrame({ user, children }: { user?: User | null; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { L, lang } = useLang();
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

  return (
    <div
      lang={lang}
      className={cx(lang === "bn" && "bn")}
      style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div className="pad" style={{ paddingBottom: 0 }}>
        <ShellTopBar user={user} />
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
