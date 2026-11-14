"use client";
// In-app reminder notification (Phase 1 stands in for web push).
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { num } from "@/lib/labels";
import { reminderService } from "@/lib/services";
import type { Reminder } from "@/lib/types";

export function ReminderBanner({ reminder, onClose }: { reminder: Reminder; onClose: () => void }) {
  const router = useRouter();
  const { lang, L } = useLang();
  return (
    <div className="fixed inset-x-0 top-9 z-50 mx-auto max-w-[480px] px-3 rise" role="status">
      <div className="glass-strong flex items-center gap-3 rounded-3xl p-2 pl-4">
        <button className="flex min-h-14 flex-1 items-center gap-3 text-left" onClick={() => { onClose(); router.push(`/p/activity/${reminder.activityId}`); }}>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-white"><Bell className="size-5" /></span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-muted">BridgeAI · {num(reminder.time, lang)} · {L("খুলতে চাপুন", "Tap to open")}</span>
            <span className="block text-[16px] font-semibold leading-snug">{lang === "bn" ? reminder.text_bn : reminder.text_en}</span>
          </span>
        </button>
        <button aria-label={L("বন্ধ করুন", "Dismiss")} onClick={onClose} className="grid size-12 shrink-0 place-items-center rounded-full text-muted"><X className="size-5" /></button>
      </div>
    </div>
  );
}

/** Shows the next due reminder once per session. */
export function NextReminder() {
  const [r, setR] = useState<Reminder | null>(null);
  useEffect(() => {
    let off = false;
    const seen = (() => { try { return sessionStorage.getItem("bridgeai-reminder-shown"); } catch { return "1"; } })();
    if (seen) return;
    reminderService.getSchedule().then((list) => {
      if (off || !list.length) return;
      const now = new Date().toTimeString().slice(0, 5);
      const due = [...list].reverse().find((x) => x.time <= now) ?? list[0];
      setR(due);
      try { sessionStorage.setItem("bridgeai-reminder-shown", "1"); } catch { /* ignore */ }
    }).catch(() => {});
    return () => { off = true; };
  }, []);
  if (!r) return null;
  return <ReminderBanner reminder={r} onClose={() => setR(null)} />;
}
