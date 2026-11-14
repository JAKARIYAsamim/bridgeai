"use client";
// P-06 Daily check-in: one screen, four rows, under 15 seconds.
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { EmergencyBox } from "@/components/emergency";
import { Icon } from "@/components/legacy/icons";
import { Tiger } from "@/components/legacy/mascots";
import { MediaChip, MicButton } from "@/components/media";
import { ParentTopBar } from "@/components/parent/common";
import { Button, Card, ErrorState, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn } from "@/lib/labels";
import { childService, feedbackService } from "@/lib/services";
import { uploadMedia } from "@/lib/supabase/media";
import type { Checkin } from "@/lib/types";

type Opt<T> = { v: T; bn: string; en: string };

function ChoiceRow<T extends string>({
  title,
  opts,
  value,
  onChange,
}: {
  title: ReactNode;
  opts: Opt<T>[];
  value?: T;
  onChange: (v: T) => void;
}) {
  const { L } = useLang();
  return (
    <div style={{ marginBottom: 16 }}>
      <p className="h3" style={{ marginBottom: 8 }}>
        {title}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${opts.length}, 1fr)`, gap: 8 }}>
        {opts.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={`choice ${active ? "on" : ""}`}
              style={{
                minHeight: 48,
                padding: "10px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: active ? 600 : 500,
                fontSize: 15,
              }}
            >
              {L(o.bn, o.en)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CheckinPage() {
  const router = useRouter();
  const toast = useToast();
  const { lang, L } = useLang();
  const { data, loading, error, reload } = useLoad(
    async () => ({
      child: await childService.getMyChild(),
      existing: await feedbackService.getTodayCheckin(),
    }),
    []
  );
  const [edited, setF] = useState<Partial<Checkin> | null>(null);
  const f: Partial<Checkin> = edited ?? data?.existing ?? {};
  const [noteMode, setNoteMode] = useState<"none" | "voice" | "text">("none");
  const [voiceBlob, setVoiceBlob] = useState<Blob | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [alerted, setAlerted] = useState(false);

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const name = data ? nameIn(data.child.nickname, lang) : "";
  const ready = f.mood && f.sleep && f.meals && f.meltdowns;

  const save = async () => {
    if (!ready) return;
    setBusy(true);
    // f.voiceUrl may still be a local blob: URL (only resolves in this tab) — upload it
    // so the recording survives past this session.
    const voiceUrl = voiceBlob && data ? await uploadMedia(data.child.id, "checkin", voiceBlob, "webm") : f.voiceUrl;
    const { alert } = await feedbackService.saveCheckin({
      mood: f.mood!,
      sleep: f.sleep!,
      meals: f.meals!,
      meltdowns: f.meltdowns!,
      voiceUrl,
      note: f.note,
    });
    setBusy(false);
    if (alert) {
      setAlerted(true);
    } else {
      toast(L("চেক-ইন সংরক্ষণ হয়েছে", "Check-in saved"));
      router.push("/p/today");
    }
  };

  if (alerted) {
    return (
      <div className="pad in" style={{ paddingTop: 32, paddingBottom: 40 }}>
        <EmergencyBox />
        <div style={{ marginTop: 16 }}>
          <Button block size="lg" variant="soft" href="/p/today">
            {L("আজকের পাতায় ফিরুন", "Back to today")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pad" style={{ paddingBottom: 24 }}>
      <ParentTopBar back="/p/today" title={L("আজকের চেক-ইন", "Daily check-in")} />

      <div className="in">
        {loading || !data ? (
          <SkeletonList rows={4} h="h-24" />
        ) : (
          <>
            <div className="card helphero" style={{ marginBottom: 16 }}>
              <div className="m">
                <Tiger mood="hi" />
              </div>
              <div>
                <p className="h2" style={{ fontSize: 18 }}>
                  {L(`আজ ${name}-এর দিন কেমন ছিল?`, `How was ${name}’s day today?`)}
                </p>
                <p className="small" style={{ marginTop: 3 }}>
                  {L("মাত্র ১৫ সেকেন্ডের সহজ চেক-ইন", "A 15-second check-in for Dr. Nasrin")}
                </p>
              </div>
            </div>

            {data.existing && (
              <p className="small" style={{ marginBottom: 12, padding: "0 4px" }}>
                {L("আজকের চেক-ইন আগেই হয়েছে — বদলালে আগেরটার জায়গায় বসবে।", "Already checked in today — saving replaces it.")}
              </p>
            )}

            <Card style={{ padding: 16, marginBottom: 16 }}>
              <ChoiceRow
                title={L(`আজ ${name}-এর মেজাজ`, `${data.child.nickname}’s mood today`)}
                value={f.mood}
                onChange={(v) => setF({ ...f, mood: v })}
                opts={[
                  { v: "happy", bn: "😀 ভালো", en: "😀 Happy" },
                  { v: "neutral", bn: "😐 স্বাভাবিক", en: "😐 Neutral" },
                  { v: "sad", bn: "😟 অস্থির", en: "😟 Upset" },
                ]}
              />

              <ChoiceRow
                title={L("গত রাতের ঘুম", "Sleep last night")}
                value={f.sleep}
                onChange={(v) => setF({ ...f, sleep: v })}
                opts={[
                  { v: "good", bn: "ভালো", en: "Good" },
                  { v: "ok", bn: "মোটামুটি", en: "OK" },
                  { v: "poor", bn: "খারাপ", en: "Poor" },
                ]}
              />

              <ChoiceRow
                title={L("খাওয়া", "Meals")}
                value={f.meals}
                onChange={(v) => setF({ ...f, meals: v })}
                opts={[
                  { v: "well", bn: "ভালো খেয়েছে", en: "Ate well" },
                  { v: "some", bn: "কিছুটা", en: "Some" },
                  { v: "little", bn: "খুব কম", en: "Very little" },
                ]}
              />

              <ChoiceRow
                title={L("অস্থিরতা / কান্না", "Meltdowns")}
                value={f.meltdowns}
                onChange={(v) => setF({ ...f, meltdowns: v })}
                opts={[
                  { v: "none", bn: "একবারও না", en: "None" },
                  { v: "few", bn: "১–২ বার", en: "1–2" },
                  { v: "many", bn: "৩ বা বেশি", en: "3 or more" },
                ]}
              />
            </Card>

            <div className="card" style={{ padding: 16, marginBottom: 20 }}>
              <p className="h3" style={{ marginBottom: 4 }}>
                {L("কিছু বলতে চান?", "Anything to add?")}{" "}
                <span className="small" style={{ fontWeight: 400 }}>
                  {L("(ঐচ্ছিক)", "(optional)")}
                </span>
              </p>

              {f.voiceUrl ? (
                <div style={{ marginTop: 8 }}>
                  <MediaChip
                    type="voice"
                    label={L("ভয়েস নোট যুক্ত হয়েছে", "Voice note added")}
                    onRemove={() => { setF({ ...f, voiceUrl: undefined }); setVoiceBlob(undefined); }}
                  />
                </div>
              ) : noteMode === "voice" ? (
                <div style={{ padding: "16px 0" }}>
                  <MicButton
                    size="md"
                    maxSeconds={60}
                    onDone={(r) => {
                      setF({ ...f, voiceUrl: r.url });
                      setVoiceBlob(r.blob);
                      setNoteMode("none");
                    }}
                    labels={{
                      idle: L("রেকর্ড করতে চাপুন", "Tap to record"),
                      recording: L("শেষ হলে চাপুন", "Tap when done"),
                    }}
                  />
                </div>
              ) : noteMode === "text" ? (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    className="field"
                    style={{ minHeight: 96, width: "100%", padding: 12, fontSize: 16 }}
                    value={f.note ?? ""}
                    onChange={(e) => setF({ ...f, note: e.target.value })}
                    placeholder={L("এখানে লিখুন…", "Write here…")}
                  />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <Button
                    variant="soft"
                    icon={<Icon name="mic" />}
                    onClick={() => setNoteMode("voice")}
                  >
                    {L("ভয়েস নোট", "Voice note")}
                  </Button>
                  <Button
                    variant="soft"
                    icon={<Icon name="edit" />}
                    onClick={() => setNoteMode("text")}
                  >
                    {L("লিখুন", "Type")}
                  </Button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <Button
                block
                size="lg"
                variant="primary"
                disabled={!ready}
                loading={busy}
                onClick={save}
              >
                {L("সংরক্ষণ করুন", "Save check-in")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
