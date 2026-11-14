"use client";
// T-03 Smart intake: add notes by voice, photo, text or video; AI drafts the plan.
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { fmtSecs, MediaChip, MediaPicker, MicButton, useFilePicker } from "@/components/media";
import {
  BottomSheet,
  Button,
  Card,
  ErrorState,
  SkeletonList,
  StepLoader,
} from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { AGE_BANDS, nameIn, num } from "@/lib/labels";
import { aiService, childService, planService } from "@/lib/services";
import type { IntakeInput, MediaType } from "@/lib/types";

const MENTION_DATA = [
  { bn: "দক্ষতা ও পছন্দের কাজ", en: "Strengths and interests" },
  { bn: "যোগাযোগের ধরন", en: "Communication" },
  { bn: "খেলার ধরন", en: "Play" },
  { bn: "সংবেদনশীলতা / সেন্সরি প্রতিক্রিয়া", en: "Sensory reactions" },
  { bn: "খাওয়া, ঘুম ও টয়লেট", en: "Eating, sleep and toileting" },
  { bn: "আচরণগত সমস্যা", en: "Behaviour concerns" },
  { bn: "পরিবারের চাওয়া ও লক্ষ্য", en: "The family's goals" },
  { bn: "নিরাপত্তা ঝুঁকি", en: "Safety risks" },
];
const MAX_PHOTOS = 5;

export default function SmartIntake() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang, L } = useLang();
  const { data: child, loading, error, reload } = useLoad(() => childService.getChild(id), [id]);
  const [inputs, setInputs] = useState<IntakeInput[]>([]);
  const [sheet, setSheet] = useState<MediaType | null>(null);
  const [text, setText] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const add = (i: Omit<IntakeInput, "id">) =>
    setInputs((l) => [...l, { ...i, id: `in_${Date.now()}_${l.length}` }]);
  const photos = inputs.filter((i) => i.type === "photo").length;
  const photo = useFilePicker("image/*", (f) =>
    add({ type: "photo", label: `${L("ছবি", "Photo")} · ${f.name.slice(0, 18)}`, url: f.url })
  );
  const video = useFilePicker(
    "video/*",
    (f) =>
      add({
        type: "video",
        label: `${L("ভিডিও", "Video")} · ${f.seconds ? fmtSecs(f.seconds) : f.name.slice(0, 14)}`,
        url: f.url,
        seconds: f.seconds,
      }),
    60
  );

  const pick = (t: MediaType) => {
    if (t === "photo") {
      if (photos < MAX_PHOTOS) photo.open();
    } else if (t === "video") video.open();
    else setSheet(t);
  };

  const create = async () => {
    setBusy(true);
    setFail(null);
    try {
      const draft = await aiService.draftPlanFromIntake(id, inputs);
      await planService.saveDraft(id, draft);
      router.push(`/t/children/${id}/intake/review`);
    } catch (e) {
      setFail(e instanceof Error ? e.message : L("খসড়া তৈরি করা যায়নি।", "The draft could not be created."));
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }
  if (loading || !child) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <SkeletonList rows={4} />
      </div>
    );
  }

  const cName = nameIn(child.nickname, lang);

  if (busy) {
    return (
      <div className="scroll softbg pad in" style={{ paddingTop: 48, textAlign: "center" }} lang={lang}>
        <StepLoader steps={[L("নোট পড়া হচ্ছে…", "Reading your notes"), L("লক্ষ্য খোঁজা হচ্ছে…", "Finding goals"), L("অ্যাক্টিভিটি সাজানো হচ্ছে…", "Choosing activities")]} />
        <p className="small" style={{ marginTop: 14 }}>
          {L("AI কেবল আপনার লাইব্রেরি থেকেই অ্যাক্টিভিটি বাছাই করে। আপনি সবকিছু যাচাই করতে পারবেন।", "The AI only picks activities from your library. You review everything next.")}
        </p>
      </div>
    );
  }

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 88 }} lang={lang}>
      <div className="bar" style={{ padding: "4px 8px 10px" }}>
        <Link href={`/t/children/${id}`} className="hbtn" aria-label={L("ফিরে যান", "Back")}>
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            {L(`ইনটেক: ${cName}`, `Intake: ${child.nickname}`)}
          </h1>
          <p className="small">{L(`বয়স: ${lang === "bn" ? AGE_BANDS[child.ageBand].bn : AGE_BANDS[child.ageBand].en}`, `Age ${AGE_BANDS[child.ageBand].en}`)}</p>
        </div>
      </div>

      <div className="in">
        <div className="note2" style={{ marginBottom: 14 }}>
          <p className="small" style={{ fontWeight: 600, color: "var(--p)", marginBottom: 2 }}>
            <Icon name="spark" style={{ marginRight: 6 }} />
            {L("AI খসড়া বানাবে, সিদ্ধান্ত আপনার", "AI drafts, you decide")}
          </p>
          <p className="sub" style={{ fontSize: 13 }}>
            {L(
              "প্রথম সেশনের তথ্য যেকোনোভাবে দিন: ভয়েস নোট, প্রেসক্রিপশন বা কাগজের ছবি, অথবা লিখে।",
              "Add your first-session notes in any form: voice note, photo of paper notes, or text."
            )}
          </p>
        </div>

        <Card style={{ padding: 14, marginBottom: 14 }}>
          <p className="h3" style={{ marginBottom: 8 }}>
            {L("নোট যুক্ত করুন", "Add notes")}
          </p>
          <MediaPicker
            onPick={pick}
            disabled={photos >= MAX_PHOTOS ? ["photo"] : []}
            labels={{
              voice: L("ভয়েস · ৫ মি.", "Voice · 5 min"),
              photo: L(`ছবি · ${num(photos, lang)}/${num(MAX_PHOTOS, lang)}`, `Photo · ${photos}/${MAX_PHOTOS}`),
              video: L("ভিডিও · ৬০ সে.", "Video · 60 s"),
              text: L("লেখা", "Text"),
            }}
          />
          {photo.input}
          {video.input}
          {video.error && <p className="err" style={{ marginTop: 8 }}>{video.error}</p>}

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className="link"
              disabled={photos >= MAX_PHOTOS}
              onClick={() =>
                add({
                  type: "photo",
                  label: L("ছবি · প্রেসক্রিপশন নোট", "Photo · session notes"),
                  url: "/demo/intake-notes.svg",
                })
              }
            >
              {L("+ নমুনা নোটের ছবি ব্যবহার করুন", "+ Use sample notes photo")}
            </button>
          </div>

          {inputs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
              {inputs.map((i) => (
                <MediaChip
                  key={i.id}
                  type={i.type}
                  label={i.label}
                  onPlay={
                    i.type === "voice" && i.url
                      ? () => {
                          if (audio.current) {
                            audio.current.src = i.url!;
                            audio.current.play().catch(() => {});
                          }
                        }
                      : undefined
                  }
                  onRemove={() => setInputs(inputs.filter((x) => x.id !== i.id))}
                />
              ))}
              <audio ref={audio} hidden />
            </div>
          )}
        </Card>

        {/* What to mention accordion */}
        <Card style={{ padding: 0, marginBottom: 16 }}>
          <button
            onClick={() => setMentionOpen(!mentionOpen)}
            aria-expanded={mentionOpen}
            type="button"
            style={{
              display: "flex",
              minHeight: 48,
              width: "100%",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Icon name="doc" style={{ color: "var(--p)" }} />
            <span className="grow h3" style={{ fontSize: 14 }}>
              {L("নোটে কী কী তথ্য উল্লেখ করতে পারেন", "What to mention in your notes")}
            </span>
            <span style={{ transform: mentionOpen ? "rotate(180deg)" : undefined, transition: "transform .2s" }}>
              <Icon name="next" />
            </span>
          </button>
          {mentionOpen && (
            <div style={{ padding: "0 14px 12px", borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <ul className="steps plain" style={{ padding: 0, margin: 0 }}>
                {MENTION_DATA.map((m, idx) => (
                  <li key={idx} style={{ fontSize: 13 }}>
                    {L(m.bn, m.en)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {fail && <ErrorState message={fail} onRetry={create} />}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {inputs.length === 0 && (
            <p className="small" style={{ textAlign: "center", color: "var(--mute)" }}>
              {L("এগিয়ে যেতে অন্তত একটি নোট যুক্ত করুন।", "Add at least one note to continue.")}
            </p>
          )}
          <Button
            block
            size="lg"
            variant="primary"
            disabled={inputs.length === 0}
            onClick={create}
            icon={<Icon name="spark" />}
          >
            {L("খসড়া পরিকল্পনা তৈরি করুন", "Create draft plan")}
          </Button>
        </div>
      </div>

      <BottomSheet open={sheet === "voice"} onClose={() => setSheet(null)} title={L("ভয়েস নোট", "Voice note")}>
        <div style={{ padding: "10px 0" }}>
          <p className="small" style={{ marginBottom: 14 }}>
            {L("বাংলা বা ইংরেজিতে কথা বলুন, সর্বোচ্চ ৫ মিনিট।", "Speak in Bangla or English, up to 5 minutes.")}
          </p>
          <MicButton
            maxSeconds={300}
            onDone={(r) => {
              add({
                type: "voice",
                label: `${L("ভয়েস নোট", "Voice note")} · ${fmtSecs(r.seconds)}`,
                url: r.url,
                seconds: r.seconds,
              });
              setSheet(null);
            }}
          />
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === "text"} onClose={() => setSheet(null)} title={L("নোট লিখুন বা পেস্ট করুন", "Type or paste notes")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <textarea
            autoFocus
            className="field"
            style={{ minHeight: 140, width: "100%", padding: 10, fontSize: 15 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={L("যেমন: রাফি কথা না বলে হাত ধরে ফ্রিজের কাছে নিয়ে যায়…", "e.g. He pulls my hand to the fridge instead of asking…")}
          />
          <Button
            block
            size="lg"
            variant="primary"
            disabled={!text.trim()}
            onClick={() => {
              add({
                type: "text",
                label: `${L("লেখা", "Text")} · ${num(text.trim().split(/\s+/).length, lang)} ${L("শব্দ", "words")}`,
                text: text.trim(),
              });
              setText("");
              setSheet(null);
            }}
          >
            {L("নোট যুক্ত করুন", "Add notes")}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
