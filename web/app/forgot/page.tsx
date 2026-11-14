"use client";
// A-05 Forgot password (mocked in Phase 1) using prototype card, field and button.
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Button, Card, Field } from "@/components/ui";
import { useLang } from "@/lib/i18n";

export default function Forgot() {
  const { lang, toggleLang, L } = useLang();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const valid = /^\S+@\S+\.\S+$/.test(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 800));
    setBusy(false);
    setSent(true);
  };

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 32 }} lang={lang}>
      <div className="bar" style={{ padding: "4px 16px 12px" }}>
        <Link href="/login" className="hbtn" aria-label={L("ফিরে যান", "Back")}>
          <Icon name="back" />
        </Link>
        <h1 className="h2 grow" style={{ paddingLeft: 4 }}>
          {L("পাসওয়ার্ড রিসেট", "Reset password")}
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
          {sent ? (
            <div style={{ textAlign: "center", padding: "12px 0", display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="ic t-green" style={{ width: 52, height: 52, fontSize: 26, margin: "0 auto" }}>
                <Icon name="check" />
              </span>
              <h2 className="h2">{L("ইমেইল চেক করুন", "Check your email")}</h2>
              <p className="sub">
                {L(
                  `${email} ঠিকানায় একটি অ্যাকাউন্ট থাকলে পাসওয়ার্ড রিসেটের লিংক পাঠানো হয়েছে।`,
                  `If an account exists for ${email}, we’ve sent a reset link.`
                )}
              </p>
              <Button href="/login" block style={{ marginTop: 8 }}>
                {L("লগইনে ফিরুন", "Back to log in")}
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 className="h2">{L("পাসওয়ার্ড ভুলে গেছেন?", "Forgot password?")}</h2>
              <p className="sub">
                {L(
                  "আপনার ইমেইল ঠিকানা দিন। আমরা পাসওয়ার্ড রিসেট করার লিংক পাঠাব।",
                  "Enter your email and we’ll send you a link to reset your password."
                )}
              </p>
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
              <Button type="submit" block loading={busy} disabled={!valid} style={{ marginTop: 4 }}>
                {L("রিসেট লিংক পাঠান", "Send reset link")}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
