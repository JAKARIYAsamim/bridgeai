"use client";
// P-10 Help: emergency guidance, how-to, clinic contact (matches prototype parentHelp)
import { useState } from "react";
import { EmergencyBox } from "@/components/emergency";
import { Icon } from "@/components/legacy/icons";
import { Tiger } from "@/components/legacy/mascots";
import { Button, Card, ErrorState, Skeleton } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn } from "@/lib/labels";
import { authService, childService } from "@/lib/services";

const HOWTO = [
  {
    bn: "আজকের কাজ কীভাবে করব?",
    en: "How do I do today’s activity?",
    abn: "আজ পাতায় একটি কাজ বেছে নিন, ‘শুরু করুন’ চাপুন, তারপর ছবির ধাপগুলো একটা একটা করে দেখুন।",
    aen: "On Today, pick an activity, tap Start, then follow the picture steps one at a time.",
  },
  {
    bn: "ডাক্তারকে কীভাবে জানাব?",
    en: "How do I tell the therapist?",
    abn: "কাজ শেষে একটি মুখ বেছে নিন, তারপর ভয়েস নোট, ছবি, ভিডিও বা লেখা পাঠান। শুধু বলাই যথেষ্ট।",
    aen: "After an activity, pick a face, then send a voice note, photo, video or text. Just speaking is enough.",
  },
  {
    bn: "সব কাজ করতে না পারলে?",
    en: "What if I can’t do everything?",
    abn: "কোনো সমস্যা নেই। একটি ছোট খেলাও কাজে লাগে। ব্যস্ত দিনে ২ মিনিটই যথেষ্ট।",
    aen: "That’s fine. Even one small game helps. On busy days, 2 minutes is enough.",
  },
  {
    bn: "অসুস্থ বা ভ্রমণে থাকলে?",
    en: "What if we’re sick or travelling?",
    abn: "সেটিংসে ‘পরিকল্পনা বিরতি’ দিন। রিমাইন্ডার বন্ধ থাকবে, কোনো ক্ষতি হবে না।",
    aen: "Use ‘Pause plan’ in Settings. Reminders stop, and nothing counts against you.",
  },
  {
    bn: "শিশু অস্থির হলে কী করব?",
    en: "What if my child gets upset?",
    abn: "খেলা থামান, শান্তভাবে পাশে থাকুন, পরে বা কাল আবার চেষ্টা করুন। কখনো জোর করবেন না।",
    aen: "Stop, stay calmly beside your child, and try later or tomorrow. Never force.",
  },
];

export default function Help() {
  const { lang, L } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const { data, loading, error, reload } = useLoad(async () => {
    const [centre, child, therapists] = await Promise.all([
      authService.getCentre(),
      childService.getMyChild(),
      authService.listUsers("therapist"),
    ]);
    return { centre, therapist: therapists.find((u) => u.id === child.therapistId) };
  }, []);

  return (
    <div className="pad" style={{ paddingBottom: 24 }}>
      <div className="bar" style={{ padding: "4px 8px 12px" }}>
        <h1 className="h2 grow">{L("সাহায্য ও জরুরি তথ্য", "Help & Support")}</h1>
      </div>

      <div className="in">
        <div className="card helphero" style={{ marginBottom: 14 }}>
          <div className="m">
            <Tiger mood="hi" />
          </div>
          <div>
            <p className="h2" style={{ fontSize: 18 }}>
              {L("কীভাবে সাহায্য করতে পারি?", "How can we help?")}
            </p>
            <p className="small" style={{ marginTop: 3 }}>
              {L("যেকোনো প্রয়োজনে আপনার থেরাপিস্ট পাশে আছেন", "Advice comes directly from your therapist’s plan")}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <EmergencyBox lang={lang} compact />
        </div>

        <div className="sec">
          <h2 className="h2">{L("ক্লিনিকের সাথে যোগাযোগ", "Talk to the clinic")}</h2>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading || !data ? (
          <Skeleton className="h-36 card" />
        ) : (
          <Card style={{ marginBottom: 16 }}>
            <p className="h2">{nameIn(data.therapist?.name ?? "Dr. Nasrin", lang)}</p>
            <p className="small" style={{ marginTop: 2 }}>
              {data.centre.name}, {data.centre.city}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <Button href={`tel:${data.centre.phone}`} size="lg" variant="primary" icon={<Icon name="phone" />}>
                {L("কল করুন", "Call")}
              </Button>
              <Button
                href={`https://wa.me/${data.centre.whatsapp}`}
                size="lg"
                variant="soft"
                icon={<Icon name="talk" />}
              >
                WhatsApp
              </Button>
            </div>
          </Card>
        )}

        <div className="sec">
          <h2 className="h2">{L("সাধারণ প্রশ্নোত্তর", "Frequently asked questions")}</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {HOWTO.map((h, i) => {
            const isOpen = open === i;
            return (
              <Card key={i} style={{ padding: 0 }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  type="button"
                  style={{
                    display: "flex",
                    minHeight: 52,
                    width: "100%",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <span className="grow h3" style={{ fontWeight: 600 }}>
                    {L(h.bn, h.en)}
                  </span>
                  <span style={{ transform: isOpen ? "rotate(180deg)" : undefined, transition: "transform .2s" }}>
                    <Icon name="next" />
                  </span>
                </button>
                {isOpen && (
                  <p className="sub" style={{ padding: "0 16px 14px", fontSize: 15 }}>
                    {L(h.abn, h.aen)}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
