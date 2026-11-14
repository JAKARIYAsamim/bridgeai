"use client";
// A-02 Sign up: therapist or centre admin.
import { ArrowLeft, Building2, Check, Copy, Eye, EyeOff, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HOME } from "@/components/shells";
import { Button, Card, cx, Field, inputCls, useToast } from "@/components/ui";
import { useSession } from "@/lib/hooks";
import { PROFESSIONS } from "@/lib/labels";
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [kind, setKind] = useState<Kind>("therapist");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [profession, setProfession] = useState(PROFESSIONS[0]);
  const [language, setLanguage] = useState<"en" | "bn">("en");
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
    name: !name.trim() ? "Please add your full name" : null,
    email: !/^\S+@\S+\.\S+$/.test(email) ? "Please add a valid email" : null,
    password: password.length < 8 ? "Use at least 8 characters" : null,
  };
  const step2Ok = !errs.name && !errs.email && !errs.password;
  const centreErr =
    kind === "admin"
      ? !centreName.trim() ? "Please add the centre name" : !city.trim() ? "Please add the city" : null
      : !independent && centreCode.trim().length !== 6 ? "Enter the 6-character centre code, or choose to work independently" : null;

  const submit = async () => {
    setTouched(true);
    if (centreErr || !agree) return;
    setBusy(true);
    setError(null);
    try {
      await authService.signUp({
        role: kind, name, email, password, language,
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
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  const back = () => { setTouched(false); setError(null); setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s)); };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-28px)] max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-center text-2xl font-bold tracking-tight">BridgeAI</Link>

      {step < 4 && (
        <div className="mb-3 flex items-center gap-2">
          {step > 1 ? (
            <button onClick={back} aria-label="Back" className="grid size-12 place-items-center rounded-full hover:bg-primary-soft"><ArrowLeft className="size-5" /></button>
          ) : <span className="size-12" />}
          <div className="flex flex-1 gap-1.5">{[1, 2, 3].map((n) => <span key={n} className={cx("h-1.5 flex-1 rounded-full", n <= step ? "bg-primary" : "bg-line")} />)}</div>
          <span className="w-12 text-right text-xs text-muted">{step}/3</span>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3 rise">
          <h1 className="mb-2 text-2xl font-bold">Create an account</h1>
          {([
            { k: "therapist" as Kind, title: "I'm a therapist", sub: "Build home plans and follow families between sessions.", icon: <Stethoscope className="size-8" /> },
            { k: "admin" as Kind, title: "I run a centre", sub: "Invite therapists and see how families are doing.", icon: <Building2 className="size-8" /> },
          ]).map((o) => (
            <Card key={o.k} strong onClick={() => { setKind(o.k); setStep(2); }} className="flex min-h-28 items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">{o.icon}</span>
              <div><div className="text-lg font-bold">{o.title}</div><div className="text-sm text-text-2">{o.sub}</div></div>
            </Card>
          ))}
          <p className="pt-2 text-center text-sm text-muted">Parent? <Link href="/join" className="font-semibold text-primary">Join with your therapist&apos;s code</Link></p>
          <p className="text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-primary">Log in</Link></p>
        </div>
      )}

      {step === 2 && (
        <Card strong className="space-y-4 rise">
          <h1 className="text-2xl font-bold">{kind === "therapist" ? "About you" : "Your account"}</h1>
          <Field label="Full name" error={touched ? errs.name : null}>
            <input className={inputCls(touched && !!errs.name)} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
          <Field label="Email" error={touched ? errs.email : null}>
            <input className={inputCls(touched && !!errs.email)} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Password" hint="At least 8 characters" error={touched ? errs.password : null}>
            <div className="relative">
              <input className={inputCls(touched && !!errs.password)} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-0 grid size-12 place-items-center text-muted">
                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </Field>
          {kind === "therapist" && (
            <Field label="Profession">
              <select className={inputCls()} value={profession} onChange={(e) => setProfession(e.target.value)}>
                {PROFESSIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          )}
          <Field label="Language">
            <div className="grid grid-cols-2 gap-2">
              {([["en", "English"], ["bn", "বাংলা"]] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setLanguage(v)} aria-pressed={language === v}
                  className={cx("min-h-12 rounded-xl border font-semibold", language === v ? "border-primary bg-primary-soft text-primary" : "border-line text-text-2", v === "bn" && "bn")}>{l}</button>
              ))}
            </div>
          </Field>
          <Button size="lg" block onClick={() => { setTouched(true); if (step2Ok) { setTouched(false); setStep(3); } }}>Continue</Button>
        </Card>
      )}

      {step === 3 && (
        <Card strong className="space-y-4 rise">
          {kind === "admin" ? (
            <>
              <h1 className="text-2xl font-bold">Your centre</h1>
              <p className="text-sm text-text-2">We&apos;ll create a 6-character centre code you can share with your therapists.</p>
              <Field label="Centre name" error={touched && !centreName.trim() ? "Please add the centre name" : null}>
                <input className={inputCls(touched && !centreName.trim())} value={centreName} onChange={(e) => setCentreName(e.target.value)} />
              </Field>
              <Field label="City" error={touched && centreName.trim() && !city.trim() ? "Please add the city" : null}>
                <input className={inputCls(touched && !city.trim())} value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Your centre</h1>
              <Field label="Centre code" hint="Ask your centre admin. Demo code: HOPE24" error={touched && centreErr && !independent ? centreErr : null}>
                <input className={cx(inputCls(touched && !!centreErr && !independent), "uppercase tracking-[0.3em] font-semibold")} maxLength={6} value={centreCode} disabled={independent}
                  onChange={(e) => setCentreCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="HOPE24" />
              </Field>
              <button type="button" onClick={() => setIndependent(!independent)} aria-pressed={independent}
                className={cx("flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 text-left font-semibold", independent ? "border-primary bg-primary-soft text-primary" : "border-line text-text-2")}>
                <span className={cx("grid size-6 place-items-center rounded-md border", independent ? "border-primary bg-primary text-white" : "border-line")}>{independent && <Check className="size-4" />}</span>
                I work independently
              </button>
              {independent && <p className="text-xs text-muted">We&apos;ll set up a one-person centre for you.</p>}
            </>
          )}
          <label className="flex min-h-12 cursor-pointer items-start gap-3 py-1">
            <input type="checkbox" className="mt-1 size-5 accent-[var(--primary)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span className="text-sm">I agree to the <span className="font-semibold text-primary">terms</span> and the <span className="font-semibold text-primary">data policy</span>.</span>
          </label>
          {touched && !agree && <p className="-mt-2 text-sm font-medium text-[#c2410c]">Please agree to continue</p>}
          {error && <p role="alert" className="text-sm font-semibold text-[#c2410c]">{error}</p>}
          <Button size="lg" block loading={busy} onClick={submit}>Create account</Button>
        </Card>
      )}

      {step === 4 && (
        <Card strong className="space-y-4 text-center rise">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success pop"><Check className="size-8" /></div>
          <h1 className="text-2xl font-bold">{centreName} is ready</h1>
          <p className="text-sm text-text-2">Share this centre code with your therapists so they can join.</p>
          <div className="rounded-2xl bg-primary-soft py-4 text-4xl font-bold tracking-[0.3em] text-primary">{newCode}</div>
          <Button variant="soft" block icon={<Copy className="size-5" />} onClick={() => { navigator.clipboard?.writeText(newCode).catch(() => {}); toast("Code copied"); }}>Copy code</Button>
          <Button size="lg" block onClick={() => router.replace("/c")}>Go to dashboard</Button>
        </Card>
      )}
    </main>
  );
}
