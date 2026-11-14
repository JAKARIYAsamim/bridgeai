"use client";
// In-app reminder notification styled like prototype msg / note2.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { useLang } from "@/lib/i18n";
import { num } from "@/lib/labels";
import { reminderService } from "@/lib/services";
import type { Reminder } from "@/lib/types";

export function ReminderBanner({ reminder, onClose }: { reminder: Reminder; onClose: () => void }) {
  const router = useRouter();
  const { lang, L } = useLang();

  return (
    <div
      className="card note2"
      role="status"
      style={{
        margin: "8px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "var(--shadow)",
      }}
    >
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          textAlign: "left",
          minWidth: 0,
        }}
        onClick={() => {
          onClose();
          router.push(`/p/activity/${reminder.activityId}`);
        }}
        type="button"
      >
        <span className="ic t-orange" style={{ width: 36, height: 36, fontSize: 18 }}>
          <Icon name="bell" />
        </span>
        <span className="grow truncate">
          <span className="small" style={{ display: "block", color: "inherit", opacity: 0.85 }}>
            BridgeAI · {num(reminder.time, lang)} · {L("খুলতে চাপুন", "Tap to open")}
          </span>
          <span className="h3" style={{ display: "block", color: "inherit", fontSize: 14 }}>
            {lang === "bn" ? reminder.text_bn : reminder.text_en}
          </span>
        </span>
      </button>
      <button
        aria-label={L("বন্ধ করুন", "Dismiss")}
        onClick={onClose}
        className="xb"
        type="button"
        style={{ width: 28, height: 28, fontSize: 13 }}
      >
        <Icon name="x" />
      </button>
    </div>
  );
}

/** Shows the next due reminder once per session. */
export function NextReminder() {
  const [r, setR] = useState<Reminder | null>(null);

  useEffect(() => {
    let off = false;
    const seen = (() => {
      try {
        return sessionStorage.getItem("bridgeai-reminder-shown");
      } catch {
        return "1";
      }
    })();
    if (seen) return;
    reminderService
      .getSchedule()
      .then((list) => {
        if (off || !list.length) return;
        const now = new Date().toTimeString().slice(0, 5);
        const due = [...list].reverse().find((x) => x.time <= now) ?? list[0];
        setR(due);
        try {
          sessionStorage.setItem("bridgeai-reminder-shown", "1");
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  if (!r) return null;
  return <ReminderBanner reminder={r} onClose={() => setR(null)} />;
}
