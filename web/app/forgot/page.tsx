"use client";
// A-05 Forgot password (mocked in Phase 1) using prototype card, field and button.
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Button, Card, Field } from "@/components/ui";

export default function Forgot() {
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
    <div className="scroll softbg pad" style={{ paddingBottom: 32 }}>
      <div className="bar" style={{ padding: "4px 16px 12px" }}>
        <Link href="/login" className="hbtn" aria-label="Back">
          <Icon name="back" />
        </Link>
        <h1 className="h2 grow" style={{ paddingLeft: 4 }}>Reset password</h1>
      </div>

      <div className="in">
        <Card>
          {sent ? (
            <div style={{ textAlign: "center", padding: "12px 0", display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="ic t-green" style={{ width: 52, height: 52, fontSize: 26, margin: "0 auto" }}>
                <Icon name="check" />
              </span>
              <h2 className="h2">Check your email</h2>
              <p className="sub">If an account exists for <b>{email}</b>, we&apos;ve sent a reset link.</p>
              <Button href="/login" block style={{ marginTop: 8 }}>
                Back to log in
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 className="h2">Forgot password</h2>
              <p className="sub">Enter your email and we&apos;ll send you a link to reset your password.</p>
              <Field label="Email">
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
                Send reset link
              </Button>
              <div style={{ textAlign: "center", marginTop: 4 }}>
                <Link href="/login" className="link" style={{ fontSize: 14 }}>
                  Back to log in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
