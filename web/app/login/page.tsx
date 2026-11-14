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
    <div className="scroll softbg pad" style={{ paddingBottom: 32 }}>
      <div className="bar" style={{ padding: "4px 16px 12px" }}>
        <Link href="/" className="hbtn" aria-label="Back">
          <Icon name="back" />
        </Link>
        <h1 className="h2 grow" style={{ paddingLeft: 4 }}>Log in</h1>
      </div>

      <div className="in">
        <Card>
          <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

            <Field label="Password">
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
                  aria-label={show ? "Hide password" : "Show password"}
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
              Log in
            </Button>

            <div style={{ textAlign: "center", marginTop: 2 }}>
              <Link href="/forgot" className="link" style={{ fontSize: 14 }}>
                Forgot password?
              </Link>
            </div>
          </form>
        </Card>

        <div className="sec">
          <h2 className="h2" style={{ fontSize: 16 }}>Demo — instant login</h2>
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
            <span className="h3" style={{ display: "block" }}>Log in as therapist</span>
            <span className="small">Dr. Nasrin, at the clinic</span>
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
            <span className="h3" style={{ display: "block" }}>Log in as parent</span>
            <span className="small">Ayesha, at home with Rafi</span>
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
            <span className="h3" style={{ display: "block" }}>Log in as centre admin</span>
            <span className="small">Farhana, running the centre</span>
          </span>
          <span className="go"><Icon name="next" /></span>
        </button>

        <p className="small" style={{ textAlign: "center", marginTop: 14 }}>
          Demo accounts use password <code>demo1234</code>.
        </p>
      </div>
    </div>
  );
}
