"use client";
// P-08 Learn: 5 short parent lessons, then social stories.
import { ChevronDown, ChevronRight, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, cx, EmptyState, ErrorState, Skeleton, SkeletonList, tintBg } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { num } from "@/lib/labels";
import { libraryService } from "@/lib/services";

export default function Learn() {
  const { lang, L } = useLang();
  const [open, setOpen] = useState<string | null>(null);
  const { data, loading, error, reload } = useLoad(async () => ({ lessons: await libraryService.listLessons(), stories: await libraryService.listStories() }), []);

  if (error) return <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>;
  return (
    <div className="px-4 pt-4">
      <h1 className="text-[26px] font-bold">{L("শিখুন", "Learn")}</h1>
      <p className="mt-1 text-text-2">{L("ছোট ছোট পাঠ — প্রতিটি মাত্র ১ মিনিটের।", "Short lessons — one minute each.")}</p>

      {loading || !data ? <div className="mt-4"><SkeletonList rows={5} h="h-20" /><Skeleton className="mt-6 h-40" /></div> : (
        <>
          <div className="mt-4 space-y-2.5">
            {data.lessons.length === 0 && <EmptyState title={L("পাঠ শীঘ্রই আসছে।", "Lessons coming soon.")} />}
            {data.lessons.map((ls) => {
              const isOpen = open === ls.id;
              return (
                <Card key={ls.id} className="p-0">
                  <button onClick={() => setOpen(isOpen ? null : ls.id)} aria-expanded={isOpen} className="flex min-h-16 w-full items-center gap-3 p-4 text-left">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-white">{num(ls.n, lang)}</span>
                    <span className="flex-1 font-semibold leading-snug">{lang === "bn" ? ls.title_bn : ls.title_en}</span>
                    <ChevronDown className={cx("size-6 text-muted transition", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div className="space-y-3 px-4 pb-4 rise">
                      <div className="flex min-h-28 items-center justify-center gap-2 rounded-2xl bg-primary-soft text-primary">
                        <PlayCircle className="size-10" /><span className="font-semibold">{L("১ মিনিটের ভিডিও (শীঘ্রই)", "1-minute video (coming soon)")}</span>
                      </div>
                      {ls.tips.map((t, k) => (
                        <div key={k} className="flex items-start gap-3">
                          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-celebrate-soft text-2xl">{t.emoji}</span>
                          <p className="pt-2 text-[17px]">{lang === "bn" ? t.text_bn : t.text_en}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <h2 className="mb-2 mt-7 text-[22px] font-bold">{L("সামাজিক গল্প", "Social stories")}</h2>
          <p className="mb-3 text-[15px] text-text-2">{L("নতুন কিছুর আগে শিশুর সাথে একসাথে পড়ুন।", "Read together before something new happens.")}</p>
          <div className="grid grid-cols-2 gap-3">
            {data.stories.map((s, k) => (
              <Link key={s.id} href={`/p/learn/story/${s.id}`} className="glass overflow-hidden rounded-[12px] active:scale-[0.98]">
                <div className={cx("grid h-28 place-items-center text-5xl", tintBg(s.pages[0]?.tint ?? ["blue", "orange", "green"][k % 3]))}>{s.cover}</div>
                <div className="flex min-h-14 items-center gap-1 p-3 font-semibold leading-snug">
                  <span className="flex-1">{lang === "bn" ? s.title_bn : s.title_en}</span><ChevronRight className="size-5 text-muted" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
