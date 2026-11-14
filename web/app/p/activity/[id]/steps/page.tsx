"use client";
// P-04 Step viewer → "How did it go?" → P-05 feedback sheet → confirmation.
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmergencyBox } from "@/components/emergency";
import { Icon } from "@/components/legacy/icons";
import { Tiger } from "@/components/legacy/mascots";
import { MicButton, useFilePicker } from "@/components/media";
import { canSpeak, ParentTopBar, speak } from "@/components/parent/common";
import { ThanksCard } from "@/components/parent/thanks";
import { ActivityArt, Button, Card, ErrorState, MoodPicker, Skeleton } from "@/components/ui";
import { useLoad, useMounted } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn, num } from "@/lib/labels";
import { childService, feedbackService, libraryService, planService } from "@/lib/services";
import type { Activity, Mood } from "@/lib/types";

type Stage = "steps" | "mood" | "feedback" | "sending" | "alert" | "thanks";

function StepImage({ src, activity, step }: { src: string; activity: Pick<Activity, "id" | "domain">; step: number }) {
  const [ok, setOk] = useState(true);
  if (ok && src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" onError={() => setOk(false)} className="pic" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }} />;
  }
  return <ActivityArt activity={activity} step={step} className="pic" style={{ width: "100%", height: "100%", borderRadius: 20 }} />;
}

export default function Steps() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang, L } = useLang();
  const [i, setI] = useState(0);
  const [stage, setStage] = useState<Stage>("steps");
  const [mood, setMood] = useState<Mood | null>(null);
  const [logId, setLogId] = useState<string | undefined>();
  const [extra, setExtra] = useState<{ type: "photo" | "video" | "text"; url?: string } | null>(null);
  const [text, setText] = useState("");
  const touchX = useRef<number | null>(null);

  const speakOk = useMounted() && canSpeak();
  useEffect(() => () => {
    if (canSpeak()) window.speechSynthesis.cancel();
  }, []);

  const { data, loading, error, reload } = useLoad(async () => {
    const [activity, today, child] = await Promise.all([
      libraryService.getActivity(id),
      planService.getToday(),
      childService.getMyChild(),
    ]);
    return { activity, item: today.find((t) => t.activity.id === id)?.item, child };
  }, [id]);

  const photo = useFilePicker("image/*", (f) => setExtra({ type: "photo", url: f.url }));
  const video = useFilePicker("video/*", (f) => setExtra({ type: "video", url: f.url }), 30);

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="pad in" style={{ paddingTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-72 card" />
        <Skeleton className="h-16 card" />
      </div>
    );
  }

  const { activity, item, child } = data;
  const steps = activity.steps;
  const step = steps[i];
  const childName = nameIn(child.nickname, lang);

  const pickMood = async (m: Mood) => {
    setMood(m);
    if (item) {
      const log = await feedbackService.logActivity(item.id, m);
      setLogId(log.id);
    }
    setStage("feedback");
  };

  const send = async (input: { type: "voice" | "photo" | "video" | "text"; mediaUrl?: string; text?: string }) => {
    setStage("sending");
    const { alert } = await feedbackService.addFeedback({ ...input, activityId: activity.id, logId });
    setStage(alert ? "alert" : "thanks");
  };

  const next = () => (i < steps.length - 1 ? setI(i + 1) : setStage("mood"));
  const prev = () => i > 0 && setI(i - 1);

  if (stage === "steps") {
    return (
      <div
        className="scroll softbg pad"
        style={{ paddingBottom: 24, display: "flex", flexDirection: "column", minHeight: "100%" }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx < -50) next();
          else if (dx > 50) prev();
          touchX.current = null;
        }}
      >
        <ParentTopBar
          close={`/p/activity/${id}`}
          title={<span className="small">{lang === "bn" ? activity.title_bn : activity.title_en}</span>}
        />
        <div className="in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ height: 230, width: "100%", borderRadius: 20, overflow: "hidden", position: "relative" }}>
            <StepImage key={i} src={step.image} activity={activity} step={i + 1} />
          </div>

          <div className="pdots" style={{ margin: "14px 0 6px" }}>
            {steps.map((_, k) => (
              <span key={k} className={`pdot ${k === i ? "on" : ""}`} />
            ))}
          </div>

          <p className="small" style={{ textAlign: "center", color: "var(--p)", fontWeight: 600 }}>
            {L(`ধাপ ${num(i + 1, lang)} / ${num(steps.length, lang)}`, `Step ${i + 1} of ${steps.length}`)}
          </p>

          <p
            key={`t${i}`}
            className="h2"
            style={{ textAlign: "center", marginTop: 8, fontSize: 20, lineHeight: 1.4 }}
          >
            {lang === "bn" ? step.text_bn : step.text_en}
          </p>

          {speakOk && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
              <Button
                variant="soft"
                size="sm"
                icon={<Icon name="talk" />}
                onClick={() => speak(lang === "bn" ? step.text_bn : step.text_en, lang)}
              >
                {L("পড়ে শোনান", "Read aloud")}
              </Button>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {i < steps.length - 1 && (
            <button
              onClick={() => setStage("mood")}
              className="link"
              type="button"
              style={{ textAlign: "center", margin: "14px auto 8px", padding: 8 }}
            >
              {L("সব ধাপ দেখেছি →", "I’ve seen all the steps →")}
            </button>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginTop: 12 }}>
            <Button size="lg" variant="soft" onClick={prev} disabled={i === 0} icon={<Icon name="back" />}>
              {L("আগে", "Back")}
            </Button>
            <Button
              size="lg"
              variant="primary"
              onClick={next}
              icon={i === steps.length - 1 ? <Icon name="check" /> : <Icon name="next" />}
            >
              {i === steps.length - 1 ? L("শেষ হয়েছে", "Done") : L("পরের ধাপ", "Next")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll softbg pad in" style={{ paddingBottom: 40, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <ParentTopBar close="/p/today" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {stage === "mood" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 100, margin: "0 auto 12px" }}>
                <Tiger mood="hi" />
              </div>
              <h1 className="h1">{L("কেমন হলো?", "How did it go?")}</h1>
              <p className="small" style={{ marginTop: 4 }}>
                {L(`${childName}-এর সাথে আজকের খেলা`, `Today’s game with ${child.nickname}`)}
              </p>
            </div>

            <Card style={{ padding: 18 }}>
              <MoodPicker value={mood} onChange={pickMood} lang={lang} />
            </Card>

            <Button
              variant="ghost"
              block
              onClick={() => {
                setI(steps.length - 1);
                setStage("steps");
              }}
            >
              {L("ধাপগুলো আবার দেখুন", "See the steps again")}
            </Button>
          </div>
        )}

        {stage === "feedback" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <h1 className="h2">{L("থেরাপিস্টকে জানাতে চান?", "Want to tell your therapist?")}</h1>
              <p className="small" style={{ marginTop: 4 }}>
                {L("ইচ্ছা হলে বলুন কেমন গেল। না চাইলে শুধু শেষ করুন।", "Say how it went if you like. Or just finish.")}
              </p>
            </div>

            {!extra ? (
              <>
                <Card style={{ padding: 20 }}>
                  <MicButton
                    maxSeconds={60}
                    onDone={(r) => send({ type: "voice", mediaUrl: r.url })}
                    labels={{
                      idle: L("ভয়েস নোট পাঠান", "Send a voice note"),
                      recording: L("শেষ হলে চাপুন — পাঠানো হবে", "Tap when done — it will send"),
                      hint: L("সর্বোচ্চ ৬০ সেকেন্ড", "Up to 60 seconds"),
                    }}
                  />
                </Card>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { t: "photo" as const, icon: <Icon name="turn" />, l: L("ছবি", "Photo"), on: photo.open },
                    { t: "video" as const, icon: <Icon name="play" />, l: L("ভিডিও", "Video"), on: video.open },
                    { t: "text" as const, icon: <Icon name="doc" />, l: L("লিখুন", "Text"), on: () => setExtra({ type: "text" }) },
                  ].map((x) => (
                    <button
                      key={x.t}
                      onClick={x.on}
                      className="card"
                      type="button"
                      style={{
                        minHeight: 88,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        cursor: "pointer",
                      }}
                    >
                      <span className="ic t-purple" style={{ width: 36, height: 36, fontSize: 18 }}>
                        {x.icon}
                      </span>
                      <span className="small" style={{ fontWeight: 600 }}>
                        {x.l}
                      </span>
                    </button>
                  ))}
                </div>
                {photo.input}
                {video.input}
                {video.error && <p className="err">{L("৩০ সেকেন্ড বা তার কম ভিডিও বেছে নিন।", video.error)}</p>}

                <Button variant="ghost" block size="lg" onClick={() => setStage("thanks")}>
                  {L("শুধু শেষ করুন", "Just finish")}
                </Button>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {extra.type === "photo" && extra.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={extra.url} alt="" style={{ maxHeight: 260, width: "100%", borderRadius: 20, objectFit: "cover" }} />
                )}
                {extra.type === "video" && extra.url && (
                  <video src={extra.url} controls style={{ maxHeight: 260, width: "100%", borderRadius: 20 }} />
                )}
                {(extra.type === "text" || extra.type === "photo") && (
                  <textarea
                    className="field"
                    style={{ minHeight: 110, width: "100%", padding: 12, fontSize: 16 }}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={extra.type === "text" ? L("কেমন গেল লিখুন…", "Write how it went…") : L("কিছু লিখতে চাইলে (ঐচ্ছিক)", "Add a note (optional)")}
                    autoFocus={extra.type === "text"}
                  />
                )}
                <Button
                  block
                  size="lg"
                  variant="primary"
                  disabled={extra.type === "text" && !text.trim()}
                  onClick={() => send({ type: extra.type, mediaUrl: extra.url, text: text.trim() || undefined })}
                >
                  {L("পাঠান", "Send")}
                </Button>
                <Button
                  block
                  variant="ghost"
                  onClick={() => {
                    setExtra(null);
                    setText("");
                  }}
                >
                  {L("অন্যভাবে পাঠান", "Choose another way")}
                </Button>
              </div>
            )}
          </div>
        )}

        {stage === "sending" && (
          <div style={{ textAlign: "center" }}>
            <p className="h3" style={{ color: "var(--mute)" }}>
              {L("পাঠানো হচ্ছে…", "Sending…")}
            </p>
          </div>
        )}

        {stage === "alert" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <EmergencyBox />
            <Button block size="lg" variant="soft" onClick={() => setStage("thanks")}>
              {L("ঠিক আছে", "OK")}
            </Button>
          </div>
        )}

        {stage === "thanks" && (
          <ThanksCard onDone={() => router.push("/p/today")} doneLabel={L("আজকের কাজে ফিরে যান", "Back to today")} />
        )}
      </div>
    </div>
  );
}
