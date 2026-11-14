"use client";
// A-04 Join with code (parents). Bangla first, English underneath.
import { ArrowLeft, Eye, EyeOff, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HOME } from "@/components/shells";
import { Button, Card, cx, inputCls } from "@/components/ui";
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
      <span className="bn block">{bn}</span>
      <span className="block text-[0.8em] font-normal text-muted">{en}</span>
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
      // paste
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
    <main className="mx-auto flex min-h-[calc(100vh-28px)] max-w-md flex-col justify-center px-4 py-10 text-[18px]">
      <div className="mb-3 flex items-center">
        {step > 1 ? (
          <button onClick={() => setStep((s) => (s - 1) as 1 | 2)} aria-label="Back" className="grid size-12 place-items-center rounded-full hover:bg-primary-soft"><ArrowLeft className="size-5" /></button>
        ) : (
          <Link href="/" aria-label="Back" className="grid size-12 place-items-center rounded-full hover:bg-primary-soft"><ArrowLeft className="size-5" /></Link>
        )}
      </div>

      {step === 1 && (
        <Card strong className="space-y-5 rise">
          <h1 className="text-[24px] font-bold leading-tight"><Bi bn="কোড দিয়ে যোগ দিন" en="Join with code" /></h1>
          <p className="text-text-2"><Bi bn="আপনার থেরাপিস্টের দেওয়া ৬ সংখ্যার কোডটি লিখুন।" en="Enter the 6-digit code from your therapist." /></p>
          <div className="flex justify-between gap-2" onPaste={(e) => { e.preventDefault(); setAt(0, e.clipboardData.getData("text")); }}>
            {digits.map((d, i) => (
              <input key={i} ref={(el) => { refs.current[i] = el; }} value={d} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                aria-label={`Digit ${i + 1}`}
                onChange={(e) => setAt(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); if (e.key === "Enter" && code.length === 6) check(); }}
                className={cx("h-16 w-full min-w-0 rounded-2xl border bg-surface/70 text-center text-3xl font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft",
                  error ? "border-[#ea580c]" : "border-line")} />
            ))}
          </div>
          {error && (
            <p role="alert" className="text-[16px] font-semibold text-[#c2410c]">
              <Bi bn="এই কোডটি কাজ করেনি। আপনার থেরাপিস্টের কাছে নতুন কোড চান।" en="This code didn't work. Ask your therapist for a new one." />
            </p>
          )}
          <Button size="lg" block loading={busy} disabled={code.length !== 6} onClick={check}><span className="bn">এগিয়ে যান</span> · Continue</Button>
          <p className="text-center text-sm text-muted">Demo code: 482915</p>
        </Card>
      )}

      {step === 2 && info && (
        <Card strong className="space-y-5 text-center rise">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary-soft text-primary pop"><HeartHandshake className="size-10" /></div>
          <p className="text-[20px] font-bold leading-snug">
            <Bi bn={`আপনি ${childBn}-র পরিকল্পনায় যোগ দিচ্ছেন — ${therapistBn}, ${info.centre.name}।`}
              en={`You're joining ${info.child.nickname}'s plan with ${info.therapist.name}, ${info.centre.name}.`} />
          </p>
          <Button size="lg" block onClick={() => setStep(3)}><span className="bn">চালিয়ে যান</span> · Continue</Button>
        </Card>
      )}

      {step === 3 && (
        <Card strong className="space-y-4 rise">
          <h1 className="text-[22px] font-bold"><Bi bn="আপনার তথ্য" en="About you" /></h1>
          <label className="block">
            <span className="mb-1.5 block text-[16px] font-semibold"><Bi bn="আপনার নাম" en="Your name" /></span>
            <input className={inputCls(touched && !name.trim())} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <div>
            <span className="mb-1.5 block text-[16px] font-semibold"><Bi bn="শিশুর সাথে সম্পর্ক" en="Relation to the child" /></span>
            <div className="grid grid-cols-2 gap-2">
              {RELATIONS.map((r) => (
                <button key={r.v} type="button" onClick={() => setRelation(r.v)} aria-pressed={relation === r.v}
                  className={cx("min-h-14 rounded-2xl border px-2 text-[16px] font-semibold leading-tight",
                    relation === r.v ? "border-primary bg-primary-soft text-primary" : "border-line text-text-2",
                    touched && !relation && "border-[#ea580c]")}>
                  <span className="bn block">{r.bn}</span><span className="block text-xs font-normal text-muted">{r.en}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[16px] font-semibold"><Bi bn="ফোন নম্বর বা ইমেইল" en="Phone or email" /></span>
            <input className={inputCls(touched && !contact.trim())} value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="tel" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[16px] font-semibold"><Bi bn="পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)" en="Password (8+ characters)" /></span>
            <div className="relative">
              <input className={inputCls(touched && password.length < 8)} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-0 grid size-12 place-items-center text-muted">
                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </label>
          {touched && (!name.trim() || !relation || !contact.trim() || password.length < 8) && (
            <p className="text-[15px] font-medium text-[#c2410c]"><Bi bn="দয়া করে সব ঘর পূরণ করুন।" en="Please fill in every field." /></p>
          )}
          {joinError && <p role="alert" className="text-[15px] font-semibold text-[#c2410c]">{joinError}</p>}
          <Button size="lg" block loading={busy} onClick={join}><span className="bn">যোগ দিন</span> · Join</Button>
        </Card>
      )}
    </main>
  );
}
