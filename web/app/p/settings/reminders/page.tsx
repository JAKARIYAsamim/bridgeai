"use client";
// Preview reminders (demo): today's reminders and a "Send now" button.
import { Bell, Send } from "lucide-react";
import { useState } from "react";
import { ParentTopBar } from "@/components/parent/common";
import { ReminderBanner } from "@/components/parent/reminder-banner";
import { Button, Card, EmptyState, ErrorState, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { num } from "@/lib/labels";
import { reminderService } from "@/lib/services";
import type { Reminder } from "@/lib/types";

export default function ReminderPreview() {
  const { lang, L } = useLang();
  const { data, loading, error, reload } = useLoad(() => reminderService.previewReminders(), []);
  const [shown, setShown] = useState<Reminder | null>(null);

  return (
    <div className="pb-6">
      <ParentTopBar back="/p/settings" title={L("রিমাইন্ডার", "Reminders")} />
      <div className="space-y-3 px-4">
        <p className="text-[16px] text-text-2">{L("সর্বোচ্চ দিনে ৩টি, শেষ হওয়া কাজের জন্য কোনো রিমাইন্ডার নয়।", "At most 3 a day, never for an activity already done.")}</p>
        {error ? <ErrorState message={error} onRetry={reload} /> : loading || !data ? <SkeletonList rows={3} /> : data.length === 0 ? (
          <EmptyState emoji="🔕" title={L("আজ আর কোনো রিমাইন্ডার নেই।", "No more reminders today.")} />
        ) : (
          data.map((r, i) => (
            <Card key={i} className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><Bell className="size-5" /></span>
                <div>
                  <p className="text-[15px] font-bold text-primary">{num(r.time, lang)}</p>
                  <p className="text-[17px]">{lang === "bn" ? r.text_bn : r.text_en}</p>
                </div>
              </div>
              <Button variant="soft" block icon={<Send className="size-5" />} onClick={() => setShown(r)}>{L("এখনই পাঠান", "Send now")}</Button>
            </Card>
          ))
        )}
      </div>
      {shown && <ReminderBanner reminder={shown} onClose={() => setShown(null)} />}
    </div>
  );
}
