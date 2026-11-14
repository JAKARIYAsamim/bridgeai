"use client";
// A-04 Join with code (parents). Bangla first, English underneath.
// Styled using prototype glass cards, fields and Tiger mascot.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Tiger } from "@/components/legacy/mascots";
import { HOME } from "@/components/shells";
import { Button, Card, cx, Field } from "@/components/ui";
import { useSession } from "@/lib/hooks";
import { nameIn } from "@/lib/labels";
import { authService } from "@/lib/services";
import type { Caregiver, Centre, ParentChildView, User } from "@/lib/types";

const RELATIONS: { v: Caregiver["relation"]; bn: string; en: string }[] = [
  { v: "mother", bn: "মা", en: "Mother" },
  { v: "father", bn: "বাবা", en: "Father" },
  { v: "grandparent", bn: "দাদা-দাদি বা নানা-নানি", en: "Grandparent" },
  { v: "other", bn: "অন্য", en: "Other" },
];

function Bi({ bn, en, className }: { bn: string; en: string; className?: string }) {
  return (
    <span className={cx("block", className)}>
      <span className="bn" style={{ display: "block", fontWeight: 600 }}>{bn}</span>
      <span className="small" style={{ display: "block", color: "var(--mute)" }}>{en}</span>
    </span>
  );
}

export default function Join() {
  const router = useRouter();
  const { user } = useSession();
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
      setJoinError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  const childBn = info ? nameIn(info.child.nickname, "bn") : "";
  const therapistBn = info ? nameIn(info.therapist.name, "bn") : "";

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 32 }}>
      <div className="bar" style={{ padding: "4px 16px 12px" }}>
        {step > 1 ? (
          <button onClick={() => setStep((s) => (s - 1) as 1 | 2)} className="hbtn" aria-label="Back" type="button">
            <Icon name="back" />
          </button>
        ) : (
          <Link href="/" className="hbtn" aria-label="Back">
            <Icon name="back" />
          </Link>
        )}
        <h1 className="h2 grow" style={{ paddingLeft: 4 }}>
          {step === 1 ? "কোড দিয়ে যোগ দিন" : step === 2 ? "সন্তান যাচাই" : "আপনার বিবরণ"}
        </h1>
        <span className="pill line">{step}/3</span>
      </div>

      <div className="in">
        {step === 1 && (
          <Card>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ width: 76, margin: "0 auto 10px" }}>
                <Tiger mood="hi" />
              </div>
              <h2 className="h2 bn">৬ সংখ্যার কোড দিন</h2>
              <p className="small" style={{ marginTop: 2 }}>Enter the 6-digit code from your therapist</p>
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
                কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে। থেরাপিস্টের সাথে কথা বলুন।
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
              এগিয়ে যান · Continue
            </Button>
          </Card>
        )}

        {step === 2 && info && (
          <Card>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <span className="ic t-green" style={{ width: 52, height: 52, fontSize: 26, margin: "0 auto 10px" }}>
                <Icon name="check" />
              </span>
              <h2 className="h2 bn">{childBn}-এর পরিকল্পনা</h2>
              <p className="small">{info.child.nickname}&apos;s therapy plan</p>
            </div>

            <div className="card" style={{ background: "rgba(255, 255, 255, 0.5)", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <Bi bn="থেরাপিস্ট" en="Therapist" />
                <span className="h3 bn" style={{ textAlign: "right" }}>{therapistBn}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "0.5px solid var(--line)" }}>
                <Bi bn="সেন্টার" en="Centre" />
                <span className="h3" style={{ textAlign: "right" }}>{info.centre.name}</span>
              </div>
            </div>

            <Button block size="md" onClick={() => setStep(3)}>
              হ্যাঁ, এটি সঠিক · Confirm
            </Button>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <h2 className="h2 bn" style={{ marginBottom: 12 }}>আপনার তথ্য দিন</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label={<Bi bn="আপনার পুরো নাম" en="Your full name" />} error={touched && !name.trim() ? "নাম লিখুন" : null}>
                <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ayesha Rahman" />
              </Field>

              <Field label={<Bi bn="শিশুর সাথে সম্পর্ক" en="Relationship to child" />} error={touched && !relation ? "সম্পর্ক বেছে নিন" : null}>
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
                      <span className="bn" style={{ display: "block", fontSize: 14 }}>{r.bn}</span>
                      <span className="small">{r.en}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={<Bi bn="ফোন বা ইমেইল" en="Phone or email" />} error={touched && !contact.trim() ? "যোগাযোগের নম্বর বা ইমেইল দিন" : null}>
                <input className="field" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="017... or name@mail.com" />
              </Field>

              <Field label={<Bi bn="পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)" en="Password (min 8 characters)" />} error={touched && password.length < 8 ? "কমপক্ষে ৮ অক্ষর দিন" : null}>
                <div style={{ position: "relative" }}>
                  <input className="field" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShow(!show)} className="xb" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
                    <Icon name={show ? "x" : "ear"} />
                  </button>
                </div>
              </Field>

              {joinError && <p className="err">{joinError}</p>}

              <Button block size="md" loading={busy} onClick={join} style={{ marginTop: 8 }}>
                যুক্ত হোন · Join now
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
