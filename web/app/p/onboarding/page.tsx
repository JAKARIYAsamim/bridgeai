"use client";
// P-01 Parent onboarding: welcome + language → consent → routine → meet your plan.
import { ArrowLeft, BookOpen, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Choice, ROUTINE_LABELS } from "@/components/parent/common";
import { ActivityArt, Button, Card, Chip, cx, ErrorState, inputCls, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { DOMAINS, nameIn, num } from "@/lib/labels";
import { authService, childService, libraryService, planService } from "@/lib/services";
import type { Activity, Caregiver } from "@/lib/types";

function Toggle({ on, onChange, title, desc, required }: { on: boolean; onChange: (v: boolean) => void; title: string; desc: string; required?: string }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on} className="glass flex w-full items-center gap-3 rounded-[12px] p-4 text-left">
      <div className="flex-1">
        <p className="font-semibold">{title} {required && <span className="text-[14px] font-normal text-muted">({required})</span>}</p>
        <p className="mt-0.5 text-[15px] text-text-2">{desc}</p>
      </div>
      <span className={cx("relative h-8 w-14 shrink-0 rounded-full transition", on ? "bg-primary" : "bg-line")}>
        <span className={cx("absolute top-1 size-6 rounded-full bg-white shadow transition-all", on ? "left-7" : "left-1")} />
      </span>
    </button>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { lang, setLang, L } = useLang();
  const [step, setStep] = useState(0);
  const { data, loading, error, reload } = useLoad(async () => {
    const [cg, child, therapists, library] = await Promise.all([
      childService.getMyCaregiver(), childService.getMyChild(), authService.listUsers("therapist"), libraryService.listActivities(),
    ]);
    const roadmap = await planService.getRoadmap(child.id);
    return { cg, child, therapist: therapists.find((u) => u.id === child.therapistId), roadmap, library };
  }, []);
  const [edited, setCg] = useState<Caregiver | null>(null);
  const cg = edited ?? data?.cg ?? null;
  const [busy, setBusy] = useState(false);

  if (error) return <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading || !data || !cg) return <div className="p-4 pt-10"><SkeletonList rows={4} /></div>;

  const name = nameIn(data.child.nickname, lang);
  const therapistName = nameIn(data.therapist?.name ?? "Dr. Nasrin", lang);
  const byId = new Map<string, Activity>(data.library.map((a) => [a.id, a]));
  const rm = data.roadmap;
  const phaseActs = rm ? [...new Set(rm.items.filter((i) => i.phase === rm.currentPhase && i.active).map((i) => i.activityId))].map((id) => byId.get(id)).filter(Boolean) as Activity[] : [];

  const finish = async (to: string) => {
    setBusy(true);
    await childService.updateMyCaregiver({ ...cg, onboarded: true });
    await authService.updateUser({ language: lang });
    router.replace(to);
  };

  const screens: { body: ReactNode; next?: ReactNode }[] = [
    {
      body: (
        <div className="space-y-6 text-center">
          <div className="mx-auto grid size-24 place-items-center rounded-[28px] bg-primary text-white shadow-[0_18px_40px_-14px_var(--primary)]"><Sparkles className="size-12" /></div>
          <div>
            <h1 className="text-[26px] font-bold">{L("BridgeAI-তে স্বাগতম", "Welcome to BridgeAI")}</h1>
            <p className="mt-2 text-text-2">{L(`${therapistName} আর আপনি একসাথে ${name}-এর পাশে থাকবেন।`, `You and ${therapistName} will support ${data.child.nickname} together.`)}</p>
          </div>
          <div>
            <p className="mb-2 font-semibold">{L("ভাষা বেছে নিন", "Choose your language")}</p>
            <div className="grid grid-cols-2 gap-2.5">
              <Choice active={lang === "bn"} onClick={() => setLang("bn")}><span className="bn">বাংলা</span></Choice>
              <Choice active={lang === "en"} onClick={() => setLang("en")}>English</Choice>
            </div>
          </div>
        </div>
      ),
    },
    {
      body: (
        <div className="space-y-3">
          <h1 className="text-[24px] font-bold">{L("আপনার সম্মতি", "Your consent")}</h1>
          <p className="text-text-2">{L("আপনি পরে সেটিংসে এগুলো বদলাতে পারবেন।", "You can change these later in Settings.")}</p>
          <Toggle on={cg.consent.clinic} onChange={(v) => setCg({ ...cg, consent: { ...cg.consent, clinic: v } })} required={L("প্রয়োজন", "required")}
            title={L("ক্লিনিকের সাথে তথ্য শেয়ার", "Share with the clinic")} desc={L("আপনার নোট ও অগ্রগতি শুধু আপনার থেরাপিস্ট দেখবেন।", "Only your therapist sees your notes and progress.")} />
          <Toggle on={cg.consent.ai} onChange={(v) => setCg({ ...cg, consent: { ...cg.consent, ai: v } })} required={L("ঐচ্ছিক", "optional")}
            title={L("ভয়েস নোটে AI সাহায্য", "AI help with voice notes")} desc={L("AI আপনার ভয়েস নোট লিখে দেয়, যাতে ডাক্তার দ্রুত পড়তে পারেন।", "AI writes out your voice notes so the therapist can read them quickly.")} />
          <Toggle on={cg.consent.video} onChange={(v) => setCg({ ...cg, consent: { ...cg.consent, video: v } })} required={L("ঐচ্ছিক", "optional")}
            title={L("ভিডিও পাঠানো", "Sending videos")} desc={L("ছোট ভিডিও পাঠালে ডাক্তার ভালো পরামর্শ দিতে পারেন।", "Short videos help the therapist give better advice.")} />
        </div>
      ),
    },
    {
      body: (
        <div className="space-y-4">
          <h1 className="text-[24px] font-bold">{L("আপনার দিনের রুটিন", "Your daily routine")}</h1>
          <p className="text-text-2">{L("এই সময়গুলোতে আমরা আলতো করে মনে করিয়ে দেব।", "We'll send gentle reminders around these times.")}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {ROUTINE_LABELS.map((r) => (
              <label key={r.k} className="block">
                <span className="mb-1 block text-[14px] text-text-2">{L(r.bn, r.en)}</span>
                <input type="time" className={inputCls()} value={cg.routineTimes[r.k]} onChange={(e) => setCg({ ...cg, routineTimes: { ...cg.routineTimes, [r.k]: e.target.value } })} />
              </label>
            ))}
          </div>
          <div>
            <p className="mb-2 font-semibold">{L("দিনে কয়টি রিমাইন্ডার?", "Reminders per day")}</p>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((n) => <Choice key={n} active={cg.remindersPerDay === n} onClick={() => setCg({ ...cg, remindersPerDay: n })}>{num(n, lang)}</Choice>)}
            </div>
          </div>
          <div>
            <p className="mb-2 font-semibold">{L("চুপচাপ সময়", "Quiet hours")}</p>
            <div className="grid grid-cols-2 gap-2.5">
              <input type="time" aria-label={L("শুরু", "From")} className={inputCls()} value={cg.quietHours.from} onChange={(e) => setCg({ ...cg, quietHours: { ...cg.quietHours, from: e.target.value } })} />
              <input type="time" aria-label={L("শেষ", "To")} className={inputCls()} value={cg.quietHours.to} onChange={(e) => setCg({ ...cg, quietHours: { ...cg.quietHours, to: e.target.value } })} />
            </div>
          </div>
        </div>
      ),
    },
    {
      body: (
        <div className="space-y-4">
          <h1 className="text-[24px] font-bold">{L(`${name}-এর পরিকল্পনা`, `${data.child.nickname}'s plan`)}</h1>
          <Card className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-xl font-bold text-primary">{(data.therapist?.name ?? "N").replace(/^Dr\.?\s+/, "")[0]}</span>
            <div><p className="font-bold">{therapistName}</p><p className="text-[15px] text-text-2">{L("আপনার থেরাপিস্ট", "Your therapist")}</p></div>
          </Card>
          {!rm ? (
            <Card className="text-text-2">{L("আপনার থেরাপিস্ট শীঘ্রই পরিকল্পনা পাঠাবেন।", "Your therapist will share the plan soon.")}</Card>
          ) : (
            <>
              <div>
                <p className="mb-2 font-semibold">{L("আমরা যা শিখছি", "Skills we're practising")}</p>
                <ul className="space-y-2">
                  {rm.goals.map((g) => (
                    <li key={g.id} className="glass flex items-start gap-2 rounded-[12px] p-3">
                      <Check className="mt-1 size-5 shrink-0 text-celebrate" />
                      <span className="flex-1">{lang === "bn" && g.text_bn ? g.text_bn : g.text}</span>
                      <Chip>{DOMAINS[g.domain].emoji}</Chip>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">{L("এই সময়ের খেলা", "This phase's activities")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {phaseActs.map((a) => (
                    <div key={a.id} className="glass flex items-center gap-2 rounded-[12px] p-2">
                      <ActivityArt activity={a} className="size-10 shrink-0 rounded-xl" />
                      <span className="text-[15px] font-semibold leading-tight">{lang === "bn" ? a.title_bn : a.title_en}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ),
      next: (
        <div className="space-y-2">
          <Button block size="lg" loading={busy} onClick={() => finish("/p/today")}>{L("আজই শুরু করুন", "Start today")}</Button>
          <Button block variant="ghost" icon={<BookOpen className="size-5" />} disabled={busy} onClick={() => finish("/p/learn")}>{L("আগে পাঠ ১ দেখুন", "Watch lesson 1 first")}</Button>
        </div>
      ),
    },
  ];

  const s = screens[step];
  return (
    <div className="flex min-h-[calc(100dvh-28px)] flex-col px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
      <div className="flex items-center gap-2">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="glass flex min-h-12 items-center gap-1 rounded-full pl-2.5 pr-4 text-[15px] font-semibold"><ArrowLeft className="size-5" />{L("আগে", "Back")}</button>
        ) : <div className="h-12" />}
        <div className="flex flex-1 justify-center gap-1.5" aria-label={L(`ধাপ ${num(step + 1, "bn")} / ৪`, `Step ${step + 1} of 4`)}>
          {screens.map((_, k) => <span key={k} className={cx("h-2 rounded-full transition-all", k === step ? "w-6 bg-primary" : k < step ? "w-2 bg-primary/50" : "w-2 bg-line")} />)}
        </div>
        <div className="w-[88px]" />
      </div>
      <div key={step} className="flex-1 py-6 rise">{s.body}</div>
      {s.next ?? (
        <Button block size="lg" disabled={step === 1 && !cg.consent.clinic} onClick={() => setStep(step + 1)}>{L("এগিয়ে যান", "Continue")}</Button>
      )}
      {step === 1 && !cg.consent.clinic && <p className="mt-2 text-center text-[14px] text-text-2">{L("এগোতে ক্লিনিকের সাথে শেয়ার করা চালু করুন।", "Turn on clinic sharing to continue.")}</p>}
    </div>
  );
}
