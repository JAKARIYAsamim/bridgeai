"use client";
// A-04 Join with code (parents). Bangla first approach.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Tiger } from "@/components/legacy/mascots";
import { HOME } from "@/components/shells";
import { Button, Card, cx, Field } from "@/components/ui";
import { useSession } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn, num } from "@/lib/labels";
import { authService } from "@/lib/services";
import type { Caregiver, Centre, ParentChildView, User } from "@/lib/types";

const RELATIONS: { v: Caregiver["relation"]; bn: string; en: string }[] = [
  { v: "mother", bn: "মা", en: "Mother" },
  { v: "father", bn: "বাবা", en: "Father" },
  { v: "grandparent", bn: "দাদা-দাদি / নানা-নানি", en: "Grandparent" },
  { v: "other", bn: "অন্য অভিভাবক", en: "Other" },
];

export default function Join() {
  const router = useRouter();
  const { user } = useSession();
  const { lang, toggleLang, L } = useLang();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<boolean>(false);
  const [info, setInfo] = useState<{ child: ParentChildView; therapist: User; centre: Centre } | null>(null);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<Caregiver["relation"] | null>(null);
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !busy) router.replace(HOME[user.role]);
  }, [user, router, busy]);

  const code = digits.join("");

  const setAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = [...digits];
      clean.slice(0, 6 - i).split("").forEach((d, k) => (next[i + k] = d));
      setDigits(next);
      refs.current[Math.min(5, i + clean.length)]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError(false);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const check = async () => {
    setBusy(true);
    setError(false);
    try {
      setInfo(await authService.checkCode(code));
      setStep(2);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setTouched(true);
    if (!name.trim() || !relation || !contact.trim() || password.length < 8) return;
    setBusy(true);
    setJoinError(null);
    try {
      await authService.joinWithCode({ code, name: name.trim(), relation, contact: contact.trim(), password });
      router.replace("/p/onboarding");
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : L("কিছু একটা সমস্যা হয়েছে", "Something went wrong"));
      setBusy(false);
    }
  };

  const childName = info ? nameIn(info.child.nickname, lang) : "";
  const therapistName = info ? nameIn(info.therapist.name, lang) : "";

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 32 }} lang={lang}>
      <div className="bar" style={{ padding: "4px 16px 12px" }}>
        {step > 1 ? (
          <button onClick={() => setStep((s) => (s - 1) as 1 | 2)} className="hbtn" aria-label={L("ফিরে যান", "Back")} type="button">
            <Icon name="back" />
          </button>
        ) : (
          <Link href="/" className="hbtn" aria-label={L("ফিরে যান", "Back")}>
            <Icon name="back" />
          </Link>
        )}
        <h1 className="h2 grow" style={{ paddingLeft: 4 }}>
          {step === 1 ? L("কোড দিয়ে যোগ দিন", "Join with code") : step === 2 ? L("সন্তান যাচাই", "Verify child") : L("আপনার বিবরণ", "Your details")}
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
        <span className="pill line">{num(step, lang)}/৩</span>
      </div>

      <div className="in">
        {step === 1 && (
          <Card>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ width: 76, margin: "0 auto 10px" }}>
                <Tiger mood="hi" />
              </div>
              <h2 className="h2">{L("৬ সংখ্যার কোড দিন", "Enter 6-digit code")}</h2>
              <p className="small" style={{ marginTop: 2 }}>
                {L("আপনার থেরাপিস্টের দেওয়া কোডটি লিখুন", "Enter the code given by your therapist")}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, margin: "16px 0" }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  className="field"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setAt(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !digits[i] && i > 0) {
                      refs.current[i - 1]?.focus();
                    }
                  }}
                  style={{
                    height: 54,
                    textAlign: "center",
                    font: "700 22px var(--round)",
                    padding: 0,
                  }}
                />
              ))}
            </div>

            {error && (
              <p className="err" style={{ textAlign: "center" }}>
                {L("কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে। থেরাপিস্টের সাথে কথা বলুন।", "Invalid or expired code. Please check with your therapist.")}
              </p>
            )}

            <Button
              block
              size="md"
              loading={busy}
              disabled={code.length !== 6}
              onClick={check}
              style={{ marginTop: 10 }}
            >
              {L("এগিয়ে যান", "Continue")}
            </Button>
          </Card>
        )}

        {step === 2 && info && (
          <Card>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <span className="ic t-green" style={{ width: 52, height: 52, fontSize: 26, margin: "0 auto 10px" }}>
                <Icon name="check" />
              </span>
              <h2 className="h2">{L(`${childName}-এর পরিকল্পনা`, `${info.child.nickname}’s therapy plan`)}</h2>
              <p className="small">{L("ক্লিনিকের তথ্য মিলেছে", "Clinic match confirmed")}</p>
            </div>

            <div className="card" style={{ background: "rgba(255, 255, 255, 0.5)", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span className="small">{L("থেরাপিস্ট", "Therapist")}</span>
                <span className="h3" style={{ textAlign: "right" }}>{therapistName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "0.5px solid var(--line)" }}>
                <span className="small">{L("সেন্টার", "Centre")}</span>
                <span className="h3" style={{ textAlign: "right" }}>{info.centre.name}</span>
              </div>
            </div>

            <Button block size="md" onClick={() => setStep(3)}>
              {L("হ্যাঁ, এটি সঠিক", "Confirm & Continue")}
            </Button>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <h2 className="h2" style={{ marginBottom: 12 }}>{L("আপনার তথ্য দিন", "Your details")}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label={L("আপনার পুরো নাম", "Your full name")} error={touched && !name.trim() ? L("নাম লিখুন", "Please enter your name") : null}>
                <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={L("যেমন: আয়েশা রহমান", "e.g. Ayesha Rahman")} />
              </Field>

              <Field label={L("শিশুর সাথে সম্পর্ক", "Relationship to child")} error={touched && !relation ? L("সম্পর্ক বেছে নিন", "Please select relation") : null}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {RELATIONS.map((r) => (
                    <button
                      key={r.v}
                      type="button"
                      className={cx("card", relation === r.v && "is-pressed")}
                      onClick={() => setRelation(r.v)}
                      style={{
                        padding: "8px 10px",
                        margin: 0,
                        border: relation === r.v ? "1.5px solid var(--p)" : undefined,
                        textAlign: "center",
                      }}
                    >
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{L(r.bn, r.en)}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={L("মোবাইল নম্বর বা ইমেইল", "Phone or email")} error={touched && !contact.trim() ? L("যোগাযোগের নম্বর বা ইমেইল দিন", "Please enter phone or email") : null}>
                <input className="field" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="017... or name@mail.com" />
              </Field>

              <Field label={L("পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)", "Password (min 8 characters)")} error={touched && password.length < 8 ? L("কমপক্ষে ৮ অক্ষর দিন", "Must be at least 8 characters") : null}>
                <div style={{ position: "relative" }}>
                  <input className="field" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShow(!show)} className="xb" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
                    <Icon name={show ? "x" : "ear"} />
                  </button>
                </div>
              </Field>

              {joinError && <p className="err">{joinError}</p>}

              <Button block size="md" loading={busy} onClick={join} style={{ marginTop: 8 }}>
                {L("যুক্ত হোন", "Join now")}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
