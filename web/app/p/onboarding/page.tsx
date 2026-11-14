"use client";
// P-01 Parent onboarding: welcome + language → consent → routine → meet your plan.
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/legacy/icons";
import { Ele } from "@/components/legacy/mascots";
import { ROUTINE_LABELS } from "@/components/parent/common";
import { ActivityArt, Button, Card, Chip, ErrorState, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { DOMAINS, nameIn, num } from "@/lib/labels";
import { authService, childService, libraryService, planService } from "@/lib/services";
import type { Activity, Caregiver } from "@/lib/types";

function Toggle({
  on,
  onChange,
  title,
  desc,
  required,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
  required?: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      type="button"
      className="card"
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 12,
        padding: 14,
        textAlign: "left",
        cursor: "pointer",
        marginBottom: 8,
      }}
    >
      <div className="grow">
        <p className="h3">
          {title}{" "}
          {required && (
            <span className="small" style={{ fontWeight: 400 }}>
              ({required})
            </span>
          )}
        </p>
        <p className="small" style={{ marginTop: 2 }}>
          {desc}
        </p>
      </div>
      <span
        style={{
          width: 50,
          height: 28,
          borderRadius: 14,
          background: on ? "var(--p)" : "rgba(100, 100, 120, 0.2)",
          position: "relative",
          flex: "none",
          transition: "background .2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: on ? 25 : 3,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transition: "left .2s",
          }}
        />
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
      childService.getMyCaregiver(),
      childService.getMyChild(),
      authService.listUsers("therapist"),
      libraryService.listActivities(),
    ]);
    const roadmap = await planService.getRoadmap(child.id);
    return { cg, child, therapist: therapists.find((u) => u.id === child.therapistId), roadmap, library };
  }, []);
  const [edited, setCg] = useState<Caregiver | null>(null);
  const cg = edited ?? data?.cg ?? null;
  const [busy, setBusy] = useState(false);

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  if (loading || !data || !cg) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <SkeletonList rows={4} />
      </div>
    );
  }

  const name = nameIn(data.child.nickname, lang);
  const therapistName = nameIn(data.therapist?.name ?? "Dr. Nasrin", lang);
  const byId = new Map<string, Activity>(data.library.map((a) => [a.id, a]));
  const rm = data.roadmap;
  const phaseActs = rm
    ? [
        ...new Set(
          rm.items.filter((i) => i.phase === rm.currentPhase && i.active).map((i) => i.activityId)
        ),
      ]
        .map((id) => byId.get(id))
        .filter(Boolean) as Activity[]
    : [];

  const finish = async (to: string) => {
    setBusy(true);
    await childService.updateMyCaregiver({ ...cg, onboarded: true });
    await authService.updateUser({ language: lang });
    router.replace(to);
  };

  const screens: { body: ReactNode; next?: ReactNode }[] = [
    {
      body: (
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 140, margin: "0 auto 8px" }}>
            <Ele mood="hi" />
          </div>
          <div>
            <h1 className="h1">{L("BridgeAI-তে স্বাগতম", "Welcome to BridgeAI")}</h1>
            <p className="small" style={{ marginTop: 6, fontSize: 16 }}>
              {L(
                `${therapistName} আর আপনি একসাথে ${name}-এর পাশে থাকবেন।`,
                `You and ${therapistName} will support ${data.child.nickname} together.`
              )}
            </p>
          </div>
          <div>
            <p className="small" style={{ fontWeight: 600, marginBottom: 8 }}>
              {L("ভাষা বেছে নিন", "Choose your language")}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                type="button"
                className={`choice ${lang === "bn" ? "on" : ""}`}
                onClick={() => setLang("bn")}
                style={{ minHeight: 48, fontWeight: 600 }}
              >
                <span className="bn">বাংলা</span>
              </button>
              <button
                type="button"
                className={`choice ${lang === "en" ? "on" : ""}`}
                onClick={() => setLang("en")}
                style={{ minHeight: 48, fontWeight: 600 }}
              >
                English
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      body: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 className="h2">{L("আপনার সম্মতি", "Your consent")}</h1>
          <p className="small">
            {L("আপনি পরে সেটিংসে এগুলো বদলাতে পারবেন।", "You can change these later in Settings.")}
          </p>
          <Toggle
            on={cg.consent.clinic}
            onChange={(v) => setCg({ ...cg, consent: { ...cg.consent, clinic: v } })}
            required={L("প্রয়োজন", "required")}
            title={L("ক্লিনিকের সাথে তথ্য শেয়ার", "Share with the clinic")}
            desc={L("আপনার নোট ও অগ্রগতি শুধু আপনার থেরাপিস্ট দেখবেন।", "Only your therapist sees your notes and progress.")}
          />
          <Toggle
            on={cg.consent.ai}
            onChange={(v) => setCg({ ...cg, consent: { ...cg.consent, ai: v } })}
            required={L("ঐচ্ছিক", "optional")}
            title={L("ভয়েস নোটে AI সাহায্য", "AI help with voice notes")}
            desc={L("AI আপনার ভয়েস নোট লিখে দেয়, যাতে ডাক্তার দ্রুত পড়তে পারেন।", "AI writes out your voice notes so the therapist can read them quickly.")}
          />
          <Toggle
            on={cg.consent.video}
            onChange={(v) => setCg({ ...cg, consent: { ...cg.consent, video: v } })}
            required={L("ঐচ্ছিক", "optional")}
            title={L("ভিডিও পাঠানো", "Sending videos")}
            desc={L("ছোট ভিডিও পাঠালে ডাক্তার ভালো পরামর্শ দিতে পারেন।", "Short videos help the therapist give better advice.")}
          />
        </div>
      ),
    },
    {
      body: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h1 className="h2">{L("আপনার দিনের রুটিন", "Your daily routine")}</h1>
          <p className="small">
            {L("এই সময়গুলোতে আমরা আলতো করে মনে করিয়ে দেব।", "We’ll send gentle reminders around these times.")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {ROUTINE_LABELS.map((r) => (
              <label key={r.k} style={{ display: "block" }}>
                <span className="small" style={{ display: "block", marginBottom: 4 }}>
                  {L(r.bn, r.en)}
                </span>
                <input
                  type="time"
                  className="field"
                  value={cg.routineTimes[r.k]}
                  onChange={(e) =>
                    setCg({ ...cg, routineTimes: { ...cg.routineTimes, [r.k]: e.target.value } })
                  }
                />
              </label>
            ))}
          </div>
          <div>
            <p className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
              {L("দিনে কয়টি রিমাইন্ডার?", "Reminders per day")}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`choice ${cg.remindersPerDay === n ? "on" : ""}`}
                  onClick={() => setCg({ ...cg, remindersPerDay: n })}
                  style={{ minHeight: 44, fontWeight: 600 }}
                >
                  {num(n, lang)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
              {L("চুপচাপ সময়", "Quiet hours")}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input
                type="time"
                aria-label={L("শুরু", "From")}
                className="field"
                value={cg.quietHours.from}
                onChange={(e) => setCg({ ...cg, quietHours: { ...cg.quietHours, from: e.target.value } })}
              />
              <input
                type="time"
                aria-label={L("শেষ", "To")}
                className="field"
                value={cg.quietHours.to}
                onChange={(e) => setCg({ ...cg, quietHours: { ...cg.quietHours, to: e.target.value } })}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      body: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h1 className="h2">{L(`${name}-এর পরিকল্পনা`, `${data.child.nickname}’s plan`)}</h1>
          <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              className="av t-purple"
              style={{ width: 46, height: 46, fontSize: 18 }}
            >
              {(data.therapist?.name ?? "N").replace(/^Dr\.?\s+/, "")[0]}
            </span>
            <div>
              <p className="h3">{therapistName}</p>
              <p className="small">{L("আপনার থেরাপিস্ট", "Your therapist")}</p>
            </div>
          </Card>
          {!rm ? (
            <Card>
              <p className="sub">{L("আপনার থেরাপিস্ট শীঘ্রই পরিকল্পনা পাঠাবেন।", "Your therapist will share the plan soon.")}</p>
            </Card>
          ) : (
            <>
              <div>
                <p className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
                  {L("আমরা যা শিখছি", "Skills we’re practising")}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rm.goals.map((g) => (
                    <div key={g.id} className="row" style={{ alignItems: "center" }}>
                      <Icon name="check" style={{ color: "var(--green)", flex: "none" }} />
                      <span className="grow sub" style={{ fontSize: 15 }}>
                        {lang === "bn" && g.text_bn ? g.text_bn : g.text}
                      </span>
                      <Chip>{DOMAINS[g.domain].emoji}</Chip>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
                  {L("এই সময়ের খেলা", "This phase’s activities")}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {phaseActs.map((a) => (
                    <div key={a.id} className="row" style={{ alignItems: "center" }}>
                      <div style={{ width: 36, height: 36, flex: "none" }}>
                        <ActivityArt activity={a} />
                      </div>
                      <span className="grow h3" style={{ fontSize: 15 }}>
                        {lang === "bn" ? a.title_bn : a.title_en}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ),
      next: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          <Button block size="lg" variant="primary" loading={busy} onClick={() => finish("/p/today")}>
            {L("আজই শুরু করুন", "Start today")}
          </Button>
          <Button
            block
            variant="ghost"
            icon={<Icon name="book" />}
            disabled={busy}
            onClick={() => finish("/p/learn")}
          >
            {L("আগে পাঠ ১ দেখুন", "Watch lesson 1 first")}
          </Button>
        </div>
      ),
    },
  ];

  const s = screens[step];
  return (
    <div className="pad" style={{ minHeight: "100%", display: "flex", flexDirection: "column", paddingBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            type="button"
            className="hbtn"
            style={{ width: 40, height: 40 }}
          >
            <Icon name="back" />
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}
        <div className="pdots">
          {screens.map((_, k) => (
            <span key={k} className={`pdot ${k === step ? "on" : ""}`} />
          ))}
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div className="in" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {s.body}
        {s.next ?? (
          <div style={{ marginTop: 24 }}>
            <Button
              block
              size="lg"
              variant="primary"
              disabled={step === 1 && !cg.consent.clinic}
              onClick={() => setStep(step + 1)}
            >
              {L("এগিয়ে যান", "Continue")}
            </Button>
            {step === 1 && !cg.consent.clinic && (
              <p className="small" style={{ textAlign: "center", marginTop: 8, color: "var(--pink)" }}>
                {L("এগোতে ক্লিনিকের সাথে শেয়ার করা চালু করুন।", "Turn on clinic sharing to continue.")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
