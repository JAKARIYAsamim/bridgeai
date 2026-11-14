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
import { useLang } from "@/lib/i18n";

export default function Welcome() {
  const { user } = useSession();
  const router = useRouter();
  const { lang, toggleLang, L } = useLang();

  useEffect(() => {
    if (user) router.replace(HOME[user.role]);
  }, [user, router]);

  return (
    <section className="pick pad" lang={lang}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="logo" style={{ margin: 0 }}>
          <Icon name="logo" /> BridgeAI
        </div>
        <button
          onClick={toggleLang}
          type="button"
          className="hbtn"
          style={{ fontSize: 13, fontWeight: 700, minWidth: 42, height: 36, padding: "0 10px" }}
          aria-label="Toggle language"
        >
          {lang === "bn" ? "EN" : "বাং"}
        </button>
      </div>

      <h1 className="big" style={{ marginTop: 14 }}>
        {lang === "bn" ? (
          <>
            ঘরেও চলবে<br />
            <em>শিশুর থেরাপি।</em>
          </>
        ) : (
          <>
            Therapy that<br />
            <em>continues at home.</em>
          </>
        )}
      </h1>
      <p className="tagline">
        {L(
          "প্রতিদিন ছোট এক ধাপ — ডাক্তার ও অভিভাবক একসাথে।",
          "One small step a day, shared between doctor and parent."
        )}
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
        <h2 className="h1">{L("স্বাগতম", "Welcome")}</h2>
        <p className="sub" style={{ marginTop: 4, marginBottom: 14 }}>
          {L(
            "লগইন করুন অথবা আমন্ত্রণ কোড দিয়ে যোগ দিন।",
            "Log in or join your child’s plan with an invite code."
          )}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button href="/login" size="md" block>
            {L("লগইন", "Log in")}
          </Button>
          <Button href="/join" size="md" variant="soft" block>
            {L("কোড দিয়ে যোগ দিন", "Join with code")}
          </Button>
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <Link href="/signup" className="link" style={{ fontSize: 14 }}>
              {L("থেরাপিস্ট বা সেন্টার হিসেবে সাইন আপ", "Sign up as a therapist or centre")}
            </Link>
          </div>
          <p className="small" style={{ textAlign: "center", marginTop: 2 }}>
            {L(
              "অভিভাবকরা থেরাপিস্টের দেওয়া কোড দিয়ে যুক্ত হবেন।",
              "Parents join through their therapist’s invite code."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
