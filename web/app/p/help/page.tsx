"use client";
// P-10 Help: emergency guidance, how-to, clinic contact.
import { ChevronDown, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { EmergencyBox } from "@/components/emergency";
import { Button, Card, cx, ErrorState, Skeleton } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn } from "@/lib/labels";
import { authService, childService } from "@/lib/services";

const HOWTO = [
  { bn: "আজকের কাজ কীভাবে করব?", en: "How do I do today's activity?", abn: "আজ পাতায় একটি কাজ বেছে নিন, ‘শুরু করুন’ চাপুন, তারপর ছবির ধাপগুলো একটা একটা করে দেখুন।", aen: "On Today, pick an activity, tap Start, then follow the picture steps one at a time." },
  { bn: "ডাক্তারকে কীভাবে জানাব?", en: "How do I tell the therapist?", abn: "কাজ শেষে একটি মুখ বেছে নিন, তারপর ভয়েস নোট, ছবি, ভিডিও বা লেখা পাঠান। শুধু বলাই যথেষ্ট।", aen: "After an activity, pick a face, then send a voice note, photo, video or text. Just speaking is enough." },
  { bn: "সব কাজ করতে না পারলে?", en: "What if I can't do everything?", abn: "কোনো সমস্যা নেই। একটি ছোট খেলাও কাজে লাগে। ব্যস্ত দিনে ২ মিনিটই যথেষ্ট।", aen: "That's fine. Even one small game helps. On busy days, 2 minutes is enough." },
  { bn: "অসুস্থ বা ভ্রমণে থাকলে?", en: "What if we're sick or travelling?", abn: "সেটিংসে ‘পরিকল্পনা বিরতি’ দিন। রিমাইন্ডার বন্ধ থাকবে, কোনো ক্ষতি হবে না।", aen: "Use ‘Pause plan’ in Settings. Reminders stop, and nothing counts against you." },
  { bn: "শিশু অস্থির হলে কী করব?", en: "What if my child gets upset?", abn: "খেলা থামান, শান্তভাবে পাশে থাকুন, পরে বা কাল আবার চেষ্টা করুন। কখনো জোর করবেন না।", aen: "Stop, stay calmly beside your child, and try later or tomorrow. Never force." },
];

export default function Help() {
  const { lang, L } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const { data, loading, error, reload } = useLoad(async () => {
    const [centre, child, therapists] = await Promise.all([authService.getCentre(), childService.getMyChild(), authService.listUsers("therapist")]);
    return { centre, therapist: therapists.find((u) => u.id === child.therapistId) };
  }, []);

  return (
    <div className="space-y-5 px-4 pt-4">
      <h1 className="text-[26px] font-bold">{L("সাহায্য", "Help")}</h1>
      <EmergencyBox lang={lang} compact />

      <section>
        <h2 className="mb-2 text-[20px] font-bold">{L("ক্লিনিকের সাথে কথা বলুন", "Talk to the clinic")}</h2>
        {error ? <ErrorState message={error} onRetry={reload} /> : loading || !data ? <Skeleton className="h-36" /> : (
          <Card>
            <p className="text-[18px] font-bold">{nameIn(data.therapist?.name ?? "Dr. Nasrin", lang)}</p>
            <p className="text-[15px] text-text-2">{data.centre.name}, {data.centre.city}</p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Button href={`tel:${data.centre.phone}`} size="lg" icon={<Phone className="size-5" />}>{L("কল করুন", "Call")}</Button>
              <Button href={`https://wa.me/${data.centre.whatsapp}`} size="lg" variant="soft" icon={<MessageCircle className="size-5" />}>WhatsApp</Button>
            </div>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-[20px] font-bold">{L("কীভাবে ব্যবহার করবেন", "How to use the app")}</h2>
        <div className="space-y-2">
          {HOWTO.map((h, i) => (
            <Card key={i} className="p-0">
              <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex min-h-14 w-full items-center gap-2 p-4 text-left font-semibold">
                <span className="flex-1">{L(h.bn, h.en)}</span>
                <ChevronDown className={cx("size-5 text-muted transition", open === i && "rotate-180")} />
              </button>
              {open === i && <p className="px-4 pb-4 text-[17px] text-text-2 rise">{L(h.abn, h.aen)}</p>}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
