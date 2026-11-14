"use client";
// A-03 Log in, with prototype persona buttons for demo instant-login.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Ele, Tiger } from "@/components/legacy/mascots";
import { HOME } from "@/components/shells";
import { Button, Card, Field } from "@/components/ui";
import { useSession } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { authService } from "@/lib/services";
import type { Role } from "@/lib/types";

export default function Login() {
  const router = useRouter();
  const { user } = useSession();
  const { lang, toggleLang, L } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(HOME[user.role]);
  }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy("form");
    try {
      const u = await authService.logIn(email, password);
      router.replace(HOME[u.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : L("ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।", "Email or password is incorrect."));
      setBusy(null);
    }
  };

  const demo = async (role: Role) => {
    setBusy(role);
    const u = await authService.demoLogIn(role);
    router.replace(HOME[u.role]);
  };

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 32 }} lang={lang}>
      <div className="bar" style={{ padding: "4px 16px 12px" }}>
        <Link href="/" className="hbtn" aria-label={L("ফিরে যান", "Back")}>
          <Icon name="back" />
        </Link>
        <h1 className="h2 grow" style={{ paddingLeft: 4 }}>
          {L("লগইন", "Log in")}
        </h1>
        <button
          onClick={toggleLang}
          type="button"
          className="hbtn"
          style={{ fontSize: 12.5, fontWeight: 700, minWidth: 38 }}
          aria-label="Toggle language"
        >
          {lang === "bn" ? "EN" : "বাং"}
        </button>
      </div>

      <div className="in">
        <Card>
          <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label={L("ইমেইল", "Email")}>
              <input
                className="field"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label={L("পাসওয়ার্ড", "Password")}>
              <div style={{ position: "relative" }}>
                <input
                  className="field"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? L("পাসওয়ার্ড লুকান", "Hide password") : L("পাসওয়ার্ড দেখুন", "Show password")}
                  className="xb"
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <Icon name={show ? "x" : "ear"} />
                </button>
              </div>
            </Field>

            {error && <p className="err">{error}</p>}

            <Button
              type="submit"
              size="md"
              block
              loading={busy === "form"}
              disabled={!email || !password}
              style={{ marginTop: 4 }}
            >
              {L("লগইন", "Log in")}
            </Button>

            <div style={{ textAlign: "center", marginTop: 2 }}>
              <Link href="/forgot" className="link" style={{ fontSize: 14 }}>
                {L("পাসওয়ার্ড ভুলে গেছেন?", "Forgot password?")}
              </Link>
            </div>
          </form>
        </Card>

        <div className="sec">
          <h2 className="h2" style={{ fontSize: 16 }}>
            {L("ডেমো — এক ক্লিকে প্রবেশ", "Demo — instant login")}
          </h2>
        </div>

        <button
          className="persona"
          onClick={() => demo("therapist")}
          disabled={busy !== null}
          type="button"
        >
          <span className="m t-purple">
            <Ele mood="calm" extra="doctor" />
          </span>
          <span className="grow">
            <span className="h3" style={{ display: "block" }}>{L("থেরাপিস্ট হিসেবে প্রবেশ", "Log in as therapist")}</span>
            <span className="small">{L("ডা. নাসরিন, ক্লিনিকে", "Dr. Nasrin, at the clinic")}</span>
          </span>
          <span className="go"><Icon name="next" /></span>
        </button>

        <button
          className="persona"
          onClick={() => demo("parent")}
          disabled={busy !== null}
          type="button"
        >
          <span className="m t-orange">
            <Tiger mood="hi" />
          </span>
          <span className="grow">
            <span className="h3" style={{ display: "block" }}>{L("অভিভাবক হিসেবে প্রবেশ", "Log in as parent")}</span>
            <span className="small">{L("আয়েশা, রাফির সাথে ঘরে", "Ayesha, at home with Rafi")}</span>
          </span>
          <span className="go"><Icon name="next" /></span>
        </button>

        <button
          className="persona"
          onClick={() => demo("admin")}
          disabled={busy !== null}
          type="button"
        >
          <span className="m t-green">
            <Icon name="building" />
          </span>
          <span className="grow">
            <span className="h3" style={{ display: "block" }}>{L("সেন্টার অ্যাডমিন হিসেবে প্রবেশ", "Log in as centre admin")}</span>
            <span className="small">{L("ফারহানা, সেন্টার পরিচালনা", "Farhana, running the centre")}</span>
          </span>
          <span className="go"><Icon name="next" /></span>
        </button>

        <p className="small" style={{ textAlign: "center", marginTop: 14 }}>
          {L("সব ডেমো অ্যাকাউন্টের পাসওয়ার্ড demo1234।", "Demo accounts use password demo1234.")}
        </p>
      </div>
    </div>
  );
}
