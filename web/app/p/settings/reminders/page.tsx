"use client";
// Preview reminders (demo): today's reminders and a "Send now" button.
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
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
    <div className="pad" style={{ paddingBottom: 24 }}>
      <ParentTopBar back="/p/settings" title={L("রিমাইন্ডার", "Reminders")} />

      <div className="in">
        <p className="small" style={{ marginBottom: 12, padding: "0 4px" }}>
          {L("সর্বোচ্চ দিনে ৩টি, শেষ হওয়া কাজের জন্য কোনো রিমাইন্ডার নয়।", "At most 3 a day, never for an activity already done.")}
        </p>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading || !data ? (
          <SkeletonList rows={3} />
        ) : data.length === 0 ? (
          <EmptyState title={L("আজ আর কোনো রিমাইন্ডার নেই।", "No more reminders today.")} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.map((r, i) => (
              <Card key={i} style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                  <span className="ic t-purple" style={{ width: 40, height: 40, fontSize: 18 }}>
                    <Icon name="bell" />
                  </span>
                  <div className="grow">
                    <p className="small" style={{ fontWeight: 700, color: "var(--p)" }}>
                      {num(r.time, lang)}
                    </p>
                    <p className="sub" style={{ fontSize: 15, color: "var(--ink)", marginTop: 2 }}>
                      {lang === "bn" ? r.text_bn : r.text_en}
                    </p>
                  </div>
                </div>
                <Button
                  variant="soft"
                  block
                  icon={<Icon name="send" />}
                  onClick={() => setShown(r)}
                >
                  {L("এখনই পাঠান", "Send now")}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
      {shown && <ReminderBanner reminder={shown} onClose={() => setShown(null)} />}
    </div>
  );
}
