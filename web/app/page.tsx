"use client";
// A-01 Welcome / Persona picker in prototype's exact picker() style.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@/components/legacy/icons";
import { Ele, Tiger } from "@/components/legacy/mascots";
import { HOME } from "@/components/shells";
import { Button } from "@/components/ui";
import { useSession } from "@/lib/hooks";

export default function Welcome() {
  const { user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(HOME[user.role]);
  }, [user, router]);

  return (
    <section className="pick pad">
      <div className="logo">
        <Icon name="logo" /> BridgeAI
      </div>
      <h1 className="big">
        Therapy that<br />
        <em>continues at home.</em>
      </h1>
      <p className="tagline">
        One small step a day, shared between doctor and parent.
      </p>

      <div className="duo2">
        <div style={{ left: 42, width: 150 }}>
          <Ele extra="doctor" />
        </div>
        <div style={{ right: 40, width: 110, bottom: 14 }}>
          <Tiger />
        </div>
      </div>

      <div className="sheet0">
        <h1 className="h1">Welcome</h1>
        <p className="sub" style={{ marginTop: 4, marginBottom: 14 }}>
          Log in or join your child&apos;s plan with an invite code.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button href="/login" size="md" block>
            Log in
          </Button>
          <Button href="/join" size="md" variant="soft" block>
            Join with code <span className="bn" style={{ opacity: 0.9 }}>· কোড দিয়ে যোগ দিন</span>
          </Button>
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <Link href="/signup" className="link" style={{ fontSize: 14 }}>
              Sign up as a therapist or centre
            </Link>
          </div>
          <p className="small" style={{ textAlign: "center", marginTop: 2 }}>
            Parents join through their therapist&apos;s invite code.
          </p>
        </div>
      </div>
    </section>
  );
}
