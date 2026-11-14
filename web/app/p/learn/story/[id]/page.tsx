"use client";
// P-09 Story reader: picture story matching prototype .reader
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { turnPage } from "@/components/legacy/motion";
import { canSpeak, ParentTopBar, speak } from "@/components/parent/common";
import { Button, ErrorState, Skeleton } from "@/components/ui";
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
  useEffect(() => () => {
    if (canSpeak()) window.speechSynthesis.cancel();
  }, []);

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (loading || !story) {
    return (
      <div className="pad in" style={{ paddingTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-80 card" />
        <Skeleton className="h-20 card" />
      </div>
    );
  }

  const page = story.pages[p];
  const last = p === story.pages.length - 1;
  const text = lang === "bn" ? page.text_bn : page.text_en;
  const next = () => {
    turnPage(1);
    if (last) router.push("/p/learn");
    else setP(p + 1);
  };
  const prev = () => {
    if (p > 0) {
      turnPage(-1);
      setP(p - 1);
    }
  };

  const tints = ["t-blue", "t-orange", "t-green", "t-purple"];
  const tint = tints[p % tints.length];

  return (
    <div
      className="scroll softbg pad"
      style={{ paddingBottom: 24, display: "flex", flexDirection: "column", minHeight: "100%" }}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current == null) return;
        const dx = e.clientX - startX.current;
        if (dx < -50 && !last) next();
        else if (dx > 50 && p > 0) prev();
        startX.current = null;
      }}
    >
      <ParentTopBar
        close="/p/learn"
        title={<span className="small">{lang === "bn" ? story.title_bn : story.title_en}</span>}
      />

      <div className="in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          className={`card pic story-pic ${tint}`}
          style={{
            height: 220,
            display: "grid",
            placeItems: "center",
            fontSize: 96,
            borderRadius: 24,
            marginBottom: 14,
          }}
          aria-hidden
        >
          {page.emoji}
        </div>

        <div className="pdots" style={{ margin: "10px 0 6px" }}>
          {story.pages.map((_, k) => (
            <span key={k} className={`pdot ${k === p ? "on" : ""}`} />
          ))}
        </div>

        <p
          className="h2 words story-words"
          style={{ textAlign: "center", fontSize: 22, lineHeight: 1.4, margin: "12px 0 8px" }}
        >
          {text}
        </p>

        {speakOk && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <Button
              variant="soft"
              size="sm"
              icon={<Icon name="talk" />}
              onClick={() => speak(text, lang)}
            >
              {L("পড়ে শোনান", "Read aloud")}
            </Button>
          </div>
        )}

        <p className="small" style={{ textAlign: "center", marginTop: 8 }}>
          {L(`পাতা ${num(p + 1, "bn")} / ${num(story.pages.length, "bn")}`, `Page ${p + 1} of ${story.pages.length}`)}
        </p>

        <div style={{ flex: 1 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginTop: 16 }}>
          <Button size="lg" variant="soft" disabled={p === 0} onClick={prev} icon={<Icon name="back" />}>
            {L("আগে", "Back")}
          </Button>
          <Button
            size="lg"
            variant="primary"
            onClick={next}
            icon={last ? <Icon name="check" /> : <Icon name="next" />}
          >
            {last ? L("শেষ 🌟", "The end 🌟") : L("পরের পাতা", "Next page")}
          </Button>
        </div>
      </div>
    </div>
  );
}
