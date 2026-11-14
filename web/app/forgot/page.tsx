"use client";
// A-05 Forgot password (mocked in Phase 1).
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, Card, Field, inputCls } from "@/components/ui";

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
    <main className="mx-auto flex min-h-[calc(100vh-28px)] max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-center text-2xl font-bold tracking-tight">BridgeAI</Link>
      <Card strong className="rise">
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success pop"><MailCheck className="size-8" /></div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-text-2">If an account exists for <b>{email}</b>, we&apos;ve sent a reset link.</p>
            <Button href="/login" size="lg" block>Back to log in</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <h1 className="text-2xl font-bold">Forgot password</h1>
            <p className="text-sm text-text-2">Enter your email and we&apos;ll send you a link to reset your password.</p>
            <Field label="Email">
              <input className={inputCls()} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button type="submit" size="lg" block loading={busy} disabled={!valid}>Send reset link</Button>
            <div className="text-center"><Link href="/login" className="inline-block py-2 text-sm font-semibold text-primary">Back to log in</Link></div>
          </form>
        )}
      </Card>
    </main>
  );
}
