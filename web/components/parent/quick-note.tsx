"use client";
// Quick note floating button / bottom sheet matching the old prototype's noteScreen.
import { useState } from "react";
import { EmergencyBox } from "@/components/emergency";
import { Icon } from "@/components/legacy/icons";
import { MicButton } from "@/components/media";
import { BottomSheet, Button } from "@/components/ui";
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

  const close = () => {
    setOpen(false);
    setResult(null);
    setText("");
    setMode("voice");
  };

  const send = async (
    input: { type: "voice"; mediaUrl: string } | { type: "text"; text: string },
  ) => {
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
      <button
        onClick={() => setOpen(true)}
        type="button"
        className="btn p"
        style={{
          position: "absolute",
          bottom: 84,
          right: 20,
          zIndex: 35,
          height: 48,
          padding: "0 18px",
          borderRadius: 24,
          boxShadow: "0 12px 26px -8px rgba(88, 86, 214, 0.9)",
        }}
      >
        <Icon name="mic" style={{ fontSize: 20 }} />
        <span>{L("ভয়েস নোট", "Voice note")}</span>
      </button>

      <BottomSheet open={open} onClose={close} title={L("ডাক্তারকে কিছু জানান", "Tell your therapist")}>
        {result === "alert" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <EmergencyBox />
            <Button block size="md" variant="soft" onClick={close}>
              {L("ঠিক আছে", "OK")}
            </Button>
          </div>
        ) : result === "ok" ? (
          <ThanksCard onDone={close} doneLabel={L("ঠিক আছে", "OK")} />
        ) : busy ? (
          <div className="card thinking">
            <p className="sub">{L("পাঠানো হচ্ছে…", "Sending…")}</p>
          </div>
        ) : mode === "voice" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
            <p className="sub" style={{ textAlign: "center" }}>
              {L("যেকোনো কিছু বলুন — কেমন গেল, কী চিন্তা হচ্ছে।", "Say anything — how it went, what's worrying you.")}
            </p>
            <MicButton
              maxSeconds={60}
              onDone={(r) => send({ type: "voice", mediaUrl: r.url })}
              labels={{
                idle: L("রেকর্ড করতে চাপুন", "Tap to record"),
                recording: L("শেষ হলে চাপুন", "Tap when done"),
                hint: L("সর্বোচ্চ ৬০ সেকেন্ড", "Up to 60 seconds"),
              }}
            />
            <button
              className="link"
              type="button"
              onClick={() => setMode("text")}
              style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Icon name="type" />
              <span>{L("লিখে পাঠান", "Type instead")}</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="ask" style={{ margin: 0 }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={L("এখানে লিখুন…", "Write here…")}
                autoFocus
              />
            </div>
            <Button
              block
              disabled={!text.trim()}
              onClick={() => send({ type: "text", text: text.trim() })}
            >
              {L("পাঠান", "Send")}
            </Button>
            <button
              className="link"
              type="button"
              onClick={() => setMode("voice")}
              style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Icon name="mic" />
              <span>{L("ভয়েসে বলুন", "Use voice")}</span>
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
