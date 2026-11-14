"use client";
// A-02 Sign up: therapist or centre admin.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Ele } from "@/components/legacy/mascots";
import { HOME } from "@/components/shells";
import { Button, Card, Field, useToast } from "@/components/ui";
import { useSession } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { num, PROFESSIONS, PROFESSIONS_DATA } from "@/lib/labels";
import { authService } from "@/lib/services";

type Kind = "therapist" | "admin";

const makeCode = () => {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
};

export default function SignUp() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useSession();
  const { lang, toggleLang, L } = useLang();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [kind, setKind] = useState<Kind>("therapist");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [profession, setProfession] = useState(PROFESSIONS[0]);
  const [language, setLanguage] = useState<"en" | "bn">("bn");
  const [centreName, setCentreName] = useState("");
  const [city, setCity] = useState("");
  const [centreCode, setCentreCode] = useState("");
  const [independent, setIndependent] = useState(false);
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");

  useEffect(() => {
    if (user && step !== 4) router.replace(HOME[user.role]);
  }, [user, router, step]);

  const errs = {
    name: !name.trim() ? L("পুরো নাম লিখুন", "Please add your full name") : null,
    email: !/^\S+@\S+\.\S+$/.test(email) ? L("সঠিক ইমেইল লিখুন", "Please add a valid email") : null,
    password: password.length < 8 ? L("কমপক্ষে ৮ অক্ষর দিন", "Use at least 8 characters") : null,
  };
  const step2Ok = !errs.name && !errs.email && !errs.password;
  const centreErr =
    kind === "admin"
      ? !centreName.trim()
        ? L("সেন্টারের নাম লিখুন", "Please add the centre name")
        : !city.trim()
        ? L("শহরের নাম লিখুন", "Please add the city")
        : null
      : !independent && centreCode.trim().length !== 6
      ? L("৬ অক্ষরের সেন্টার কোড দিন, বা স্বাধীনভাবে কাজ করা বেছে নিন", "Enter the 6-character centre code, or choose to work independently")
      : null;

  const submit = async () => {
    setTouched(true);
    if (centreErr || !agree) return;
    setBusy(true);
    setError(null);
    try {
      await authService.signUp({
        role: kind,
        name,
        email,
        password,
        language,
        profession: kind === "therapist" ? profession : undefined,
        centreName: kind === "admin" ? centreName : undefined,
        city: kind === "admin" ? city : undefined,
        centreCode: kind === "therapist" && !independent ? centreCode.trim() : undefined,
        independent: kind === "therapist" ? independent : undefined,
      });
      if (kind === "admin") {
        setNewCode(makeCode());
        setStep(4);
        setBusy(false);
      } else {
        router.replace("/t");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : L("কিছু একটা সমস্যা হয়েছে", "Something went wrong"));
      setBusy(false);
    }
  };

  const back = () => {
    setTouched(false);
    setError(null);
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  };

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 32 }} lang={lang}>
      <div className="bar" style={{ padding: "4px 16px 12px" }}>
        {step > 1 && step < 4 ? (
          <button onClick={back} className="hbtn" aria-label={L("ফিরে যান", "Back")} type="button">
            <Icon name="back" />
          </button>
        ) : (
          <Link href="/" className="hbtn" aria-label={L("ফিরে যান", "Back")}>
            <Icon name="back" />
          </Link>
        )}
        <h1 className="h2 grow" style={{ paddingLeft: 4 }}>
          {step === 4 ? L("সেন্টার তৈরি হয়েছে", "Centre created") : L("সাইন আপ", "Sign up")}
        </h1>
        <button
          onClick={toggleLang}
          type="button"
          className="hbtn"
          style={{ fontSize: 12.5, fontWeight: 700, minWidth: 38, marginRight: 6 }}
          aria-label="Toggle language"
        >
          {lang === "bn" ? "EN" : "বাং"}
        </button>
        {step < 4 && <span className="pill line">{num(step, lang)}/৩</span>}
      </div>

      <div className="in">
        {step === 1 && (
          <div>
            <p className="sub" style={{ marginBottom: 14 }}>
              {L("আপনার ভূমিকা বেছে নিন:", "Choose how you will use BridgeAI:")}
            </p>

            <button
              className="persona on"
              type="button"
              onClick={() => {
                setKind("therapist");
                setStep(2);
              }}
            >
              <span className="m t-purple">
                <Ele mood="calm" extra="doctor" />
              </span>
              <span className="grow">
                <span className="h3" style={{ display: "block" }}>{L("থেরাপিস্ট", "Therapist")}</span>
                <span className="small">{L("লক্ষ্য নির্ধারণ, AI ড্রাফট যাচাই ও হোম প্র্যাকটিস পরিচালনা।", "Set goals, approve AI drafts, and guide home practice.")}</span>
              </span>
              <span className="go"><Icon name="next" /></span>
            </button>

            <button
              className="persona"
              type="button"
              onClick={() => {
                setKind("admin");
                setStep(2);
              }}
              style={{ marginTop: 10 }}
            >
              <span className="m t-green">
                <Icon name="building" />
              </span>
              <span className="grow">
                <span className="h3" style={{ display: "block" }}>{L("সেন্টার পরিচালক", "Centre manager")}</span>
                <span className="small">{L("থেরাপিস্ট ও পরিবারগুলোর সামগ্রিক অগ্রগতি পর্যবেক্ষণ।", "Oversee therapists, families, and centre-wide progress.")}</span>
              </span>
              <span className="go"><Icon name="next" /></span>
            </button>
          </div>
        )}

        {step === 2 && (
          <Card>
            <p className="h3" style={{ marginBottom: 12 }}>{L("আপনার অ্যাকাউন্টের বিবরণ", "Your account details")}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setTouched(true);
                if (step2Ok) setStep(3);
              }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <Field label={L("পুরো নাম", "Full name")} error={touched ? errs.name : null}>
                <input
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={L("যেমন: ডা. নাসরিন আক্তার", "e.g. Dr. Nasrin Akter")}
                />
              </Field>

              {kind === "therapist" && (
                <Field label={L("পেশা", "Profession")}>
                  <select
                    className="field"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                  >
                    {PROFESSIONS.map((p) => (
                      <option key={p} value={p}>
                        {lang === "bn" ? PROFESSIONS_DATA[p]?.bn ?? p : p}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label={L("কাজের ইমেইল", "Work email")} error={touched ? errs.email : null}>
                <input
                  className="field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@centre.org"
                />
              </Field>

              <Field label={L("পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)", "Password (min 8 chars)")} error={touched ? errs.password : null}>
                <div style={{ position: "relative" }}>
                  <input
                    className="field"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label="Toggle password"
                    className="xb"
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
                  >
                    <Icon name={show ? "x" : "ear"} />
                  </button>
                </div>
              </Field>

              <Field label={L("পছন্দের ভাষা", "Preferred language")}>
                <div className="seg mini" style={{ display: "flex" }}>
                  <button
                    type="button"
                    className={language === "bn" ? "on" : ""}
                    onClick={() => setLanguage("bn")}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    className={language === "en" ? "on" : ""}
                    onClick={() => setLanguage("en")}
                  >
                    English
                  </button>
                </div>
              </Field>

              <Button type="submit" block size="md" style={{ marginTop: 8 }}>
                {L("এগিয়ে যান", "Continue")}
              </Button>
            </form>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <p className="h3" style={{ marginBottom: 12 }}>
              {kind === "admin"
                ? L("আপনার সেন্টারের বিবরণ", "Your centre details")
                : L("সেন্টারের সাথে যুক্ত হোন", "Connect to your centre")}
            </p>

            {kind === "admin" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Field label={L("সেন্টারের নাম", "Centre name")}>
                  <input
                    className="field"
                    value={centreName}
                    onChange={(e) => setCentreName(e.target.value)}
                    placeholder={L("যেমন: হোপ অটিজম সেন্টার", "e.g. Hope Autism Centre")}
                  />
                </Field>
                <Field label={L("শহর", "City")}>
                  <input
                    className="field"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={L("যেমন: ঢাকা", "e.g. Dhaka")}
                  />
                </Field>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {!independent ? (
                  <Field label={L("৬ অক্ষরের সেন্টার কোড", "6-character centre code")} hint={L("আপনার সেন্টার পরিচালকের কাছ থেকে এই কোডটি নিন।", "Ask your centre manager for this code.")}>
                    <input
                      className="field"
                      value={centreCode}
                      maxLength={6}
                      onChange={(e) => setCentreCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      style={{ letterSpacing: "0.2em", font: "700 18px var(--round)" }}
                    />
                  </Field>
                ) : (
                  <p className="sub">{L("আপনি স্বাধীন থেরাপিস্ট হিসেবে সাইন আপ করছেন।", "You are signing up as an independent therapist.")}</p>
                )}
                <button
                  type="button"
                  className="link"
                  onClick={() => setIndependent(!independent)}
                  style={{ alignSelf: "flex-start" }}
                >
                  {independent ? L("সেন্টারের সাথে যুক্ত হতে চান?", "Connect to a centre instead") : L("আমি স্বাধীনভাবে প্র্যাকটিস করি", "I work independently")}
                </button>
              </div>
            )}

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                style={{ width: 20, height: 20, marginTop: 2, accentColor: "var(--p)" }}
              />
              <span className="small">
                {L(
                  "আমি ব্যবহারের শর্তাবলীতে সম্মত এবং নিশ্চিত করছি যে থেরাপির কৌশল ও গল্প পরিবারের কাছে পাঠানোর আগে যাচাই করা হবে।",
                  "I agree to the terms of service and confirm that therapy strategies and social stories are reviewed before reaching families."
                )}
              </span>
            </label>

            {error && <p className="err" style={{ marginTop: 10 }}>{error}</p>}
            {touched && centreErr && <p className="err" style={{ marginTop: 10 }}>{centreErr}</p>}

            <Button
              type="button"
              block
              size="md"
              loading={busy}
              disabled={!agree}
              onClick={submit}
              style={{ marginTop: 12 }}
            >
              {L("নিবন্ধন সম্পন্ন করুন", "Complete registration")}
            </Button>
          </Card>
        )}

        {step === 4 && (
          <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
            <span className="ic t-green" style={{ width: 56, height: 56, fontSize: 28, margin: "0 auto 12px" }}>
              <Icon name="check" />
            </span>
            <h1 className="h1" style={{ fontSize: 24 }}>{L(`স্বাগতম, ${name}!`, `Welcome, ${name}!`)}</h1>
            <p className="sub" style={{ marginTop: 6 }}>
              {L(
                `${centreName} নিবন্ধিত হয়েছে। আপনার সেন্টারের থেরাপিস্টদের এই কোডটি দিন:`,
                `${centreName} has been registered. Share this code with therapists at your centre:`
              )}
            </p>

            <div
              className="card"
              style={{
                margin: "18px 0",
                padding: 16,
                font: "700 32px var(--round)",
                letterSpacing: "0.2em",
                color: "var(--p)",
              }}
            >
              {newCode}
            </div>

            <Button
              variant="soft"
              block
              icon={<Icon name="doc" />}
              onClick={async () => {
                await navigator.clipboard.writeText(newCode);
                toast(L("কোড ক্লিপবোর্ডে কপি হয়েছে", "Code copied to clipboard"));
              }}
            >
              {L("কোড কপি করুন", "Copy code")}
            </Button>

            <Button
              block
              style={{ marginTop: 10 }}
              onClick={() => router.replace("/c")}
            >
              {L("ড্যাশবোর্ড খুলুন", "Open dashboard")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
