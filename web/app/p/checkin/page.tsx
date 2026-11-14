"use client";
// P-06 Daily check-in: one screen, four rows, under 15 seconds.
import { Keyboard, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { EmergencyBox } from "@/components/emergency";
import { MediaChip, MicButton } from "@/components/media";
import { Choice, ParentTopBar } from "@/components/parent/common";
import { Button, ErrorState, inputCls, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn } from "@/lib/labels";
import { childService, feedbackService } from "@/lib/services";
import type { Checkin } from "@/lib/types";

type Opt<T> = { v: T; bn: string; en: string };
function Row<T extends string>({ title, opts, value, onChange }: { title: ReactNode; opts: Opt<T>[]; value?: T; onChange: (v: T) => void }) {
  const { L } = useLang();
  return (
    <section>
      <h2 className="mb-2 px-1 text-[17px] font-bold">{title}</h2>
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => <Choice key={o.v} active={value === o.v} onClick={() => onChange(o.v)}>{L(o.bn, o.en)}</Choice>)}
      </div>
    </section>
  );
}

export default function CheckinPage() {
  const router = useRouter();
  const toast = useToast();
  const { lang, L } = useLang();
  const { data, loading, error, reload } = useLoad(async () => ({ child: await childService.getMyChild(), existing: await feedbackService.getTodayCheckin() }), []);
  const [edited, setF] = useState<Partial<Checkin> | null>(null);
  const f: Partial<Checkin> = edited ?? data?.existing ?? {};
  const [noteMode, setNoteMode] = useState<"none" | "voice" | "text">("none");
  const [busy, setBusy] = useState(false);
  const [alerted, setAlerted] = useState(false);

  if (error) return <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>;
  const name = data ? nameIn(data.child.nickname, lang) : "";
  const ready = f.mood && f.sleep && f.meals && f.meltdowns;

  const save = async () => {
    if (!ready) return;
    setBusy(true);
    const { alert } = await feedbackService.saveCheckin({ mood: f.mood!, sleep: f.sleep!, meals: f.meals!, meltdowns: f.meltdowns!, voiceUrl: f.voiceUrl, note: f.note });
    setBusy(false);
    if (alert) setAlerted(true);
    else {
      toast(L("চেক-ইন সংরক্ষণ হয়েছে", "Check-in saved"));
      router.push("/p/today");
    }
  };

  if (alerted)
    return (
      <div className="space-y-4 p-4 pt-10">
        <EmergencyBox />
        <Button block size="lg" variant="soft" href="/p/today">{L("আজকের পাতায় ফিরুন", "Back to today")}</Button>
      </div>
    );

  return (
    <div className="pb-6">
      <ParentTopBar back="/p/today" title={L("আজকের চেক-ইন", "Daily check-in")} />
      <div className="space-y-5 px-4">
        {loading || !data ? <SkeletonList rows={4} h="h-24" /> : (
          <>
            {data.existing && <p className="text-[15px] text-text-2">{L("আজকের চেক-ইন আগেই হয়েছে — বদলালে আগেরটার জায়গায় বসবে।", "Already checked in today — saving replaces it.")}</p>}
            <Row title={L(`আজ ${name}-এর মেজাজ`, `${data.child.nickname}'s mood today`)} value={f.mood} onChange={(v) => setF({ ...f, mood: v })}
              opts={[{ v: "happy", bn: "😀", en: "😀" }, { v: "neutral", bn: "😐", en: "😐" }, { v: "sad", bn: "😟", en: "😟" }]} />
            <Row title={L("গত রাতের ঘুম", "Sleep last night")} value={f.sleep} onChange={(v) => setF({ ...f, sleep: v })}
              opts={[{ v: "good", bn: "ভালো", en: "Good" }, { v: "ok", bn: "মোটামুটি", en: "OK" }, { v: "poor", bn: "খারাপ", en: "Poor" }]} />
            <Row title={L("খাওয়া", "Meals")} value={f.meals} onChange={(v) => setF({ ...f, meals: v })}
              opts={[{ v: "well", bn: "ভালো খেয়েছে", en: "Ate well" }, { v: "some", bn: "কিছুটা", en: "Some" }, { v: "little", bn: "খুব কম", en: "Very little" }]} />
            <Row title={L("অস্থিরতা / কান্না", "Meltdowns")} value={f.meltdowns} onChange={(v) => setF({ ...f, meltdowns: v })}
              opts={[{ v: "none", bn: "একবারও না", en: "None" }, { v: "few", bn: "১–২ বার", en: "1–2" }, { v: "many", bn: "৩ বা বেশি", en: "3 or more" }]} />

            <section>
              <h2 className="mb-2 px-1 text-[17px] font-bold">{L("কিছু বলতে চান?", "Anything to add?")} <span className="text-[14px] font-normal text-muted">{L("(ঐচ্ছিক)", "(optional)")}</span></h2>
              {f.voiceUrl ? (
                <MediaChip type="voice" label={L("ভয়েস নোট যুক্ত হয়েছে", "Voice note added")} onRemove={() => setF({ ...f, voiceUrl: undefined })} />
              ) : noteMode === "voice" ? (
                <div className="glass rounded-3xl py-5">
                  <MicButton size="md" maxSeconds={60} onDone={(r) => { setF({ ...f, voiceUrl: r.url }); setNoteMode("none"); }}
                    labels={{ idle: L("রেকর্ড করতে চাপুন", "Tap to record"), recording: L("শেষ হলে চাপুন", "Tap when done") }} />
                </div>
              ) : noteMode === "text" ? (
                <textarea className={inputCls() + " min-h-24 py-3 text-[17px]"} value={f.note ?? ""} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder={L("এখানে লিখুন…", "Write here…")} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="soft" icon={<Mic className="size-5" />} onClick={() => setNoteMode("voice")}>{L("ভয়েস নোট", "Voice note")}</Button>
                  <Button variant="soft" icon={<Keyboard className="size-5" />} onClick={() => setNoteMode("text")}>{L("লিখুন", "Type")}</Button>
                </div>
              )}
            </section>

            <div className="sticky bottom-24 pt-2">
              <Button block size="lg" disabled={!ready} loading={busy} onClick={save}>{L("সংরক্ষণ করুন", "Save")}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
