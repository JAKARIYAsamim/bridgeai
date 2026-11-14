"use client";
// Floating mic → quick voice (or text) note about anything.
import { Keyboard, Mic } from "lucide-react";
import { useState } from "react";
import { EmergencyBox } from "@/components/emergency";
import { MicButton } from "@/components/media";
import { BottomSheet, Button, inputCls } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { feedbackService } from "@/lib/services";
import { ThanksCard } from "./thanks";

export function QuickNoteFab() {
  const { L } = useLang();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"ok" | "alert" | null>(null);

  const close = () => { setOpen(false); setResult(null); setText(""); setMode("voice"); };
  const send = async (input: { type: "voice"; mediaUrl: string } | { type: "text"; text: string }) => {
    setBusy(true);
    try {
      const { alert } = await feedbackService.addFeedback(input);
      setResult(alert ? "alert" : "ok");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-24 right-[max(16px,calc(50vw-224px))] z-40 flex min-h-14 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-white shadow-[0_14px_30px_-10px_var(--primary)] active:scale-95">
        <Mic className="size-6" />{L("ভয়েস নোট", "Voice note")}
      </button>
      <BottomSheet open={open} onClose={close} title={L("ডাক্তারকে কিছু জানান", "Tell your therapist")}>
        {result === "alert" ? (
          <div className="space-y-4"><EmergencyBox /><Button block size="lg" variant="soft" onClick={close}>{L("ঠিক আছে", "OK")}</Button></div>
        ) : result === "ok" ? (
          <ThanksCard onDone={close} doneLabel={L("ঠিক আছে", "OK")} />
        ) : busy ? (
          <div className="py-10 text-center text-muted">{L("পাঠানো হচ্ছে…", "Sending…")}</div>
        ) : mode === "voice" ? (
          <div className="space-y-5 py-2">
            <p className="text-center text-[17px] text-text-2">{L("যেকোনো কিছু বলুন — কেমন গেল, কী চিন্তা হচ্ছে।", "Say anything — how it went, what's worrying you.")}</p>
            <MicButton maxSeconds={60} onDone={(r) => send({ type: "voice", mediaUrl: r.url })}
              labels={{ idle: L("রেকর্ড করতে চাপুন", "Tap to record"), recording: L("শেষ হলে চাপুন", "Tap when done"), hint: L("সর্বোচ্চ ৬০ সেকেন্ড", "Up to 60 seconds") }} />
            <Button block variant="ghost" icon={<Keyboard className="size-5" />} onClick={() => setMode("text")}>{L("লিখে পাঠান", "Type instead")}</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea className={inputCls() + " min-h-32 py-3 text-[17px]"} value={text} onChange={(e) => setText(e.target.value)} placeholder={L("এখানে লিখুন…", "Write here…")} autoFocus />
            <Button block size="lg" disabled={!text.trim()} onClick={() => send({ type: "text", text: text.trim() })}>{L("পাঠান", "Send")}</Button>
            <Button block variant="ghost" icon={<Mic className="size-5" />} onClick={() => setMode("voice")}>{L("ভয়েসে বলুন", "Use voice")}</Button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
