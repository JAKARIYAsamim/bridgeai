"use client";
// A-03 Log in, with Phase 1 demo buttons.
import { Building2, Eye, EyeOff, Stethoscope, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HOME } from "@/components/shells";
import { Button, Card, Field, inputCls } from "@/components/ui";
import { useSession } from "@/lib/hooks";
import { authService } from "@/lib/services";
import type { Role } from "@/lib/types";

export default function Login() {
  const router = useRouter();
  const { user } = useSession();
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
      setError(err instanceof Error ? err.message : "Email or password is incorrect.");
      setBusy(null);
    }
  };
  const demo = async (role: Role) => {
    setBusy(role);
    const u = await authService.demoLogIn(role);
    router.replace(HOME[u.role]);
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-28px)] max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-center text-2xl font-bold tracking-tight">BridgeAI</Link>
      <Card strong className="rise">
        <h1 className="mb-4 text-2xl font-bold">Log in</h1>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email">
            <input className={inputCls()} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input className={inputCls()} type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-0 grid size-12 place-items-center text-muted">
                {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </Field>
          {error && <p role="alert" className="text-sm font-semibold text-[#c2410c]">{error}</p>}
          <Button type="submit" size="lg" block loading={busy === "form"} disabled={!email || !password}>Log in</Button>
          <div className="text-center"><Link href="/forgot" className="inline-block py-2 text-sm font-semibold text-primary">Forgot password?</Link></div>
        </form>
      </Card>

      <Card className="mt-4 rise">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Demo — instant login</p>
        <div className="space-y-2">
          <Button variant="soft" block loading={busy === "therapist"} onClick={() => demo("therapist")} icon={<Stethoscope className="size-5" />}>Log in as therapist <span className="font-normal text-muted">· Dr. Nasrin</span></Button>
          <Button variant="soft" block loading={busy === "parent"} onClick={() => demo("parent")} icon={<Users className="size-5" />}>Log in as parent <span className="font-normal text-muted">· Ayesha</span></Button>
          <Button variant="soft" block loading={busy === "admin"} onClick={() => demo("admin")} icon={<Building2 className="size-5" />}>Log in as centre admin <span className="font-normal text-muted">· Farhana</span></Button>
        </div>
        <p className="mt-3 text-xs text-muted">Demo accounts use the password <code>demo1234</code> (e.g. nasrin@hope.demo).</p>
      </Card>
    </main>
  );
}
