"use client";
// P-09 Story reader: swipeable picture story, Bangla first, read aloud.
import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { canSpeak, ParentTopBar, speak } from "@/components/parent/common";
import { Button, cx, ErrorState, Skeleton, tintBg } from "@/components/ui";
import { useLoad, useMounted } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { num } from "@/lib/labels";
import { libraryService } from "@/lib/services";

export default function StoryReader() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang, L } = useLang();
  const [p, setP] = useState(0);
  const startX = useRef<number | null>(null);
  const { data: story, loading, error, reload } = useLoad(() => libraryService.getStory(id), [id]);

  const speakOk = useMounted() && canSpeak();
  useEffect(() => () => { if (canSpeak()) window.speechSynthesis.cancel(); }, []);

  if (error) return <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading || !story) return <div className="space-y-4 p-4"><Skeleton className="h-12 w-24" /><Skeleton className="h-80" /><Skeleton className="h-20" /></div>;

  const page = story.pages[p];
  const last = p === story.pages.length - 1;
  const text = lang === "bn" ? page.text_bn : page.text_en;
  const next = () => (last ? router.push("/p/learn") : setP(p + 1));
  const prev = () => p > 0 && setP(p - 1);

  return (
    <div className="flex min-h-[calc(100dvh-28px)] flex-col"
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current == null) return;
        const dx = e.clientX - startX.current;
        if (dx < -50 && !last) setP(p + 1);
        else if (dx > 50) prev();
        startX.current = null;
      }}>
      <ParentTopBar close="/p/learn" title={<span className="text-[18px]">{lang === "bn" ? story.title_bn : story.title_en}</span>} />
      <div className="flex flex-1 flex-col px-4">
        <div key={p} className={cx("grid aspect-square w-full place-items-center rounded-[28px] text-[110px] rise", tintBg(page.tint))} aria-hidden>{page.emoji}</div>
        <div className="mt-4 flex justify-center gap-1.5">
          {story.pages.map((_, k) => <span key={k} className={cx("h-2 rounded-full transition-all", k === p ? "w-6 bg-primary" : "w-2 bg-line")} />)}
        </div>
        <p key={`t${p}`} className="mt-4 text-center text-[24px] font-semibold leading-relaxed rise">{text}</p>
        {speakOk && (
          <div className="mt-3 flex justify-center">
            <Button variant="soft" size="sm" icon={<Volume2 className="size-5" />} onClick={() => speak(text, lang)}>{L("পড়ে শোনান", "Read aloud")}</Button>
          </div>
        )}
        <p className="mt-2 text-center text-[14px] text-muted">{L(`পাতা ${num(p + 1, "bn")} / ${num(story.pages.length, "bn")}`, `Page ${p + 1} of ${story.pages.length}`)}</p>
        <div className="flex-1" />
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-3 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        <Button size="lg" variant="soft" disabled={p === 0} onClick={prev} icon={<ArrowLeft className="size-6" />}>{L("আগে", "Back")}</Button>
        <Button size="lg" onClick={next} icon={last ? undefined : <ArrowRight className="size-6" />}>{last ? L("শেষ 🌟", "The end 🌟") : L("পরের পাতা", "Next page")}</Button>
      </div>
    </div>
  );
}
