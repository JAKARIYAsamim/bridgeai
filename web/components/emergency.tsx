"use client";
// Emergency guidance shown to a parent when a safety keyword is found.
// Strictly uses .alertcard and .btn.danger / .btn.line from legacy styles.
import { Icon } from "@/components/legacy/icons";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { authService } from "@/lib/services";
import { Button } from "./ui";

export function EmergencyBox({ lang: langProp, compact }: { lang?: "bn" | "en"; compact?: boolean }) {
  const { lang: currentLang } = useLang();
  const lang = langProp ?? currentLang ?? "bn";
  const { data: centre } = useLoad(() => authService.getCentre(), []);
  const bn = lang === "bn";

  return (
    <div role="alert" className="alertcard" style={{ padding: compact ? 14 : 18 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span
          className="ic"
          style={{
            width: 46,
            height: 46,
            fontSize: 24,
            background: "#e0213f",
            color: "#fff",
            flex: "none",
          }}
        >
          <Icon name="alert" />
        </span>
        <div className="grow">
          <p className={bn ? "bn h2" : "h2"} style={{ color: "#6d0f27" }}>
            {bn ? "জরুরি অবস্থা হলে" : "If this is an emergency"}
          </p>
          <p
            className={bn ? "bn sub" : "sub"}
            style={{ marginTop: 6, color: "rgba(109, 15, 39, 0.85)", fontSize: 15 }}
          >
            {bn
              ? "আপনার শিশু আঘাত পেলে বা খিঁচুনি হলে এখনই ৯৯৯-এ কল করুন অথবা নিকটস্থ হাসপাতালে যান।"
              : "If your child is injured or has a seizure, call 999 or go to the nearest hospital."}
          </p>
          {!compact && (
            <p
              className={bn ? "bn small" : "small"}
              style={{ marginTop: 6, color: "rgba(109, 15, 39, 0.75)" }}
            >
              {bn ? "আপনার থেরাপিস্টকেও জানানো হয়েছে।" : "Your therapist has also been told."}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
        <Button href="tel:999" variant="danger" size="md" icon={<Icon name="phone" />}>
          <span className={bn ? "bn" : ""}>{bn ? "৯৯৯ কল" : "Call 999"}</span>
        </Button>
        <Button
          href={`tel:${centre?.phone ?? ""}`}
          variant="outline"
          size="md"
          icon={<Icon name="phone" />}
        >
          <span className={bn ? "bn" : ""}>{bn ? "ক্লিনিকে কল" : "Call clinic"}</span>
        </Button>
      </div>
    </div>
  );
}
