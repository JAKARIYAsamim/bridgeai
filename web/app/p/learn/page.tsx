"use client";
// P-08 Learn: short lessons & social stories
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Card, EmptyState, ErrorState, Skeleton, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { num } from "@/lib/labels";
import { libraryService } from "@/lib/services";

export default function Learn() {
  const { lang, L } = useLang();
  const [open, setOpen] = useState<string | null>(null);
  const { data, loading, error, reload } = useLoad(
    async () => ({
      lessons: await libraryService.listLessons(),
      stories: await libraryService.listStories(),
    }),
    []
  );

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="pad" style={{ paddingBottom: 24 }}>
      <div className="bar" style={{ padding: "4px 8px 12px" }}>
        <div className="grow">
          <h1 className="h2">{L("শিখুন ও জানুন", "Learn")}</h1>
          <p className="small">{L("ছোট ছোট পাঠ — প্রতিটি মাত্র ১ মিনিটের।", "Short lessons — one minute each.")}</p>
        </div>
      </div>

      <div className="in">
        {loading || !data ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonList rows={4} h="h-20" />
            <Skeleton className="h-40 card" />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.lessons.length === 0 && <EmptyState title={L("পাঠ শীঘ্রই আসছে।", "Lessons coming soon.")} />}
              {data.lessons.map((ls) => {
                const isOpen = open === ls.id;
                return (
                  <Card key={ls.id} style={{ padding: 0 }}>
                    <button
                      onClick={() => setOpen(isOpen ? null : ls.id)}
                      aria-expanded={isOpen}
                      type="button"
                      style={{
                        display: "flex",
                        minHeight: 56,
                        width: "100%",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 16px",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        className="ic t-purple"
                        style={{ width: 36, height: 36, fontSize: 16, fontWeight: 700, borderRadius: "50%" }}
                      >
                        {num(ls.n, lang)}
                      </span>
                      <span className="grow h3" style={{ fontWeight: 600 }}>
                        {lang === "bn" ? ls.title_bn : ls.title_en}
                      </span>
                      <span style={{ transform: isOpen ? "rotate(180deg)" : undefined, transition: "transform .2s" }}>
                        <Icon name="next" />
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                        <div
                          className="card"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: 14,
                            background: "rgba(131, 119, 238, 0.08)",
                          }}
                        >
                          <Icon name="play" style={{ color: "var(--p)", fontSize: 20 }} />
                          <span className="small" style={{ fontWeight: 600, color: "var(--p)" }}>
                            {L("১ মিনিটের ভিডিও (শীঘ্রই)", "1-minute video (coming soon)")}
                          </span>
                        </div>
                        {ls.tips.map((t, k) => (
                          <div key={k} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <span style={{ fontSize: 22, flex: "none" }}>{t.emoji}</span>
                            <p className="sub" style={{ fontSize: 15, paddingTop: 2 }}>
                              {lang === "bn" ? t.text_bn : t.text_en}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="sec" style={{ marginTop: 20 }}>
              <h2 className="h2">{L("সামাজিক গল্প", "Social stories")}</h2>
              <span className="small">{L("একসাথে পড়ুন", "Read together")}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.stories.map((s, k) => {
                const tints = ["t-blue", "t-orange", "t-green", "t-purple"];
                const tint = tints[k % tints.length];
                return (
                  <Link
                    key={s.id}
                    href={`/p/learn/story/${s.id}`}
                    className="storycard"
                    style={{ textDecoration: "none" }}
                  >
                    <span
                      className={`ic ${tint}`}
                      style={{ width: 50, height: 50, fontSize: 28, display: "grid", placeItems: "center", borderRadius: 14 }}
                    >
                      {s.cover}
                    </span>
                    <span className="grow">
                      <span className="h3" style={{ display: "block" }}>
                        {lang === "bn" ? s.title_bn : s.title_en}
                      </span>
                      <span className="small">
                        {num(s.pages.length, lang)} {L("পাতা · সহজ ভাষা", "pages · simple words")}
                      </span>
                    </span>
                    <span className="pill dark" style={{ marginRight: 6 }}>
                      {L("পড়ুন", "Read")}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
