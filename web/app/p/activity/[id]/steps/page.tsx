"use client";
// P-04 Step viewer → "How did it go?" → P-05 feedback sheet → confirmation.
// Happy path without typing: Start → "I've seen all steps" → face → record → stop (sends) = 5 taps.
import { ArrowLeft, ArrowRight, Camera, FileText, Video, Volume2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmergencyBox } from "@/components/emergency";
import { MicButton, useFilePicker } from "@/components/media";
import { canSpeak, ParentTopBar, speak } from "@/components/parent/common";
import { ThanksCard } from "@/components/parent/thanks";
import { ActivityArt, Button, cx, ErrorState, inputCls, MoodPicker, Skeleton } from "@/components/ui";
import { useLoad, useMounted } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn, num } from "@/lib/labels";
import { childService, feedbackService, libraryService, planService } from "@/lib/services";
import type { Activity, Mood } from "@/lib/types";

type Stage = "steps" | "mood" | "feedback" | "sending" | "alert" | "thanks";

function StepImage({ src, activity, step }: { src: string; activity: Pick<Activity, "id" | "domain">; step: number }) {
  const [ok, setOk] = useState(true);
  if (ok && src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" onError={() => setOk(false)} className="h-full w-full rounded-3xl object-cover" />;
  return <ActivityArt activity={activity} step={step} className="h-full w-full rounded-3xl" />;
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
  useEffect(() => () => { if (canSpeak()) window.speechSynthesis.cancel(); }, []);

  const { data, loading, error, reload } = useLoad(async () => {
    const [activity, today, child] = await Promise.all([libraryService.getActivity(id), planService.getToday(), childService.getMyChild()]);
    return { activity, item: today.find((t) => t.activity.id === id)?.item, child };
  }, [id]);

  const photo = useFilePicker("image/*", (f) => setExtra({ type: "photo", url: f.url }));
  const video = useFilePicker("video/*", (f) => setExtra({ type: "video", url: f.url }), 30);

  if (error) return <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading || !data) return <div className="space-y-4 p-4"><Skeleton className="h-12 w-24" /><Skeleton className="h-72" /><Skeleton className="h-16" /></div>;

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

  if (stage === "steps")
    return (
      <div className="flex min-h-[calc(100dvh-28px)] flex-col"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx < -50) next();
          else if (dx > 50) prev();
          touchX.current = null;
        }}>
        <ParentTopBar close={`/p/activity/${id}`} title={<span className="text-[17px] text-text-2">{lang === "bn" ? activity.title_bn : activity.title_en}</span>} />
        <div className="flex flex-1 flex-col px-4">
          <div className="aspect-[4/3] w-full">
            <StepImage key={i} src={step.image} activity={activity} step={i + 1} />
          </div>
          <div className="mt-3 flex justify-center gap-1.5" aria-label={L(`ধাপ ${num(i + 1, "bn")} / ${num(steps.length, "bn")}`, `Step ${i + 1} of ${steps.length}`)}>
            {steps.map((_, k) => <span key={k} className={cx("h-2 rounded-full transition-all", k === i ? "w-6 bg-primary" : "w-2 bg-line")} />)}
          </div>
          <p className="mt-2 text-center text-[15px] font-semibold text-primary">{L(`ধাপ ${num(i + 1, "bn")} / ${num(steps.length, "bn")}`, `Step ${i + 1} of ${steps.length}`)}</p>
          <p key={`t${i}`} className="mt-2 text-center text-[22px] font-semibold leading-snug rise">{lang === "bn" ? step.text_bn : step.text_en}</p>
          {speakOk && (
            <div className="mt-3 flex justify-center">
              <Button variant="soft" size="sm" icon={<Volume2 className="size-5" />} onClick={() => speak(lang === "bn" ? step.text_bn : step.text_en, lang)}>{L("পড়ে শোনান", "Read aloud")}</Button>
            </div>
          )}
          <div className="flex-1" />
          {i < steps.length - 1 && (
            <button onClick={() => setStage("mood")} className="mx-auto mb-2 min-h-12 px-4 text-[15px] font-semibold text-primary">{L("সব ধাপ দেখেছি →", "I've seen all the steps →")}</button>
          )}
        </div>
        <div className="grid grid-cols-[1fr_2fr] gap-3 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
          <Button size="lg" variant="soft" onClick={prev} disabled={i === 0} icon={<ArrowLeft className="size-6" />}>{L("আগে", "Back")}</Button>
          <Button size="lg" onClick={next} icon={i === steps.length - 1 ? undefined : <ArrowRight className="size-6" />}>
            {i === steps.length - 1 ? L("শেষ হয়েছে", "Done") : L("পরের ধাপ", "Next")}
          </Button>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-[calc(100dvh-28px)] flex-col">
      <ParentTopBar close="/p/today" />
      <div className="flex flex-1 flex-col px-4 pb-6">
        {stage === "mood" && (
          <div className="my-auto space-y-6 rise">
            <h1 className="text-center text-[26px] font-bold">{L("কেমন হলো?", "How did it go?")}</h1>
            <p className="text-center text-text-2">{L(`${childName}-এর সাথে আজকের খেলা`, `Today's game with ${child.nickname}`)}</p>
            <MoodPicker value={mood} onChange={pickMood} lang={lang} />
            <Button variant="ghost" block onClick={() => { setI(steps.length - 1); setStage("steps"); }}>{L("ধাপগুলো আবার দেখুন", "See the steps again")}</Button>
          </div>
        )}

        {stage === "feedback" && (
          <div className="space-y-5 rise">
            <div className="text-center">
              <h1 className="text-[24px] font-bold">{L("ডাক্তারকে জানাতে চান?", "Want to tell your therapist?")}</h1>
              <p className="mt-1 text-text-2">{L("ইচ্ছা হলে বলুন কেমন গেল। না চাইলে শুধু শেষ করুন।", "Say how it went if you like. Or just finish.")}</p>
            </div>
            {!extra ? (
              <>
                <div className="glass rounded-3xl py-6">
                  <MicButton maxSeconds={60} onDone={(r) => send({ type: "voice", mediaUrl: r.url })}
                    labels={{ idle: L("ভয়েস নোট পাঠান", "Send a voice note"), recording: L("শেষ হলে চাপুন — পাঠানো হবে", "Tap when done — it will send"), hint: L("সর্বোচ্চ ৬০ সেকেন্ড", "Up to 60 seconds") }} />
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { t: "photo" as const, icon: <Camera className="size-7" />, l: L("ছবি", "Photo"), on: photo.open },
                    { t: "video" as const, icon: <Video className="size-7" />, l: L("ভিডিও", "Video"), on: video.open },
                    { t: "text" as const, icon: <FileText className="size-7" />, l: L("লিখুন", "Text"), on: () => setExtra({ type: "text" }) },
                  ].map((x) => (
                    <button key={x.t} onClick={x.on} className="glass flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl text-primary active:scale-95">
                      {x.icon}<span className="text-[15px] font-semibold text-text">{x.l}</span>
                    </button>
                  ))}
                </div>
                {photo.input}{video.input}
                {video.error && <p className="text-center text-[15px] text-text-2">{L("৩০ সেকেন্ড বা তার কম ভিডিও বেছে নিন।", video.error)}</p>}
                <Button variant="ghost" block size="lg" onClick={() => setStage("thanks")}>{L("শুধু শেষ করুন", "Just finish")}</Button>
              </>
            ) : (
              <div className="space-y-3">
                {extra.type === "photo" && extra.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={extra.url} alt="" className="max-h-72 w-full rounded-3xl object-cover" />
                )}
                {extra.type === "video" && extra.url && <video src={extra.url} controls className="max-h-72 w-full rounded-3xl" />}
                {(extra.type === "text" || extra.type === "photo") && (
                  <textarea className={inputCls() + " min-h-28 py-3 text-[17px]"} value={text} onChange={(e) => setText(e.target.value)}
                    placeholder={extra.type === "text" ? L("কেমন গেল লিখুন…", "Write how it went…") : L("কিছু লিখতে চাইলে (ঐচ্ছিক)", "Add a note (optional)")} autoFocus={extra.type === "text"} />
                )}
                <Button block size="lg" disabled={extra.type === "text" && !text.trim()}
                  onClick={() => send({ type: extra.type, mediaUrl: extra.url, text: text.trim() || undefined })}>{L("পাঠান", "Send")}</Button>
                <Button block variant="ghost" onClick={() => { setExtra(null); setText(""); }}>{L("অন্যভাবে পাঠান", "Choose another way")}</Button>
              </div>
            )}
          </div>
        )}

        {stage === "sending" && <div className="my-auto text-center text-lg text-muted">{L("পাঠানো হচ্ছে…", "Sending…")}</div>}

        {stage === "alert" && (
          <div className="my-auto space-y-4 rise">
            <EmergencyBox />
            <Button block size="lg" variant="soft" onClick={() => setStage("thanks")}>{L("ঠিক আছে", "OK")}</Button>
          </div>
        )}

        {stage === "thanks" && (
          <div className="my-auto rise">
            <ThanksCard onDone={() => router.push("/p/today")} doneLabel={L("আজকের কাজে ফিরে যান", "Back to today")} />
          </div>
        )}
      </div>
    </div>
  );
}
