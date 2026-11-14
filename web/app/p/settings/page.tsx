"use client";
// P-11 Parent settings
import { Bell, ChevronRight, LogOut, Minus, PauseCircle, Plus, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Choice, ParentTopBar, ROUTINE_LABELS, todayKey } from "@/components/parent/common";
import { BottomSheet, Button, Card, ErrorState, inputCls, Segmented, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { fmtDate, num } from "@/lib/labels";
import { authService, childService, reminderService } from "@/lib/services";
import type { Caregiver } from "@/lib/types";

export default function ParentSettings() {
  const router = useRouter();
  const toast = useToast();
  const { lang, setLang, L } = useLang();
  const { data: cg, loading, error, reload } = useLoad(() => childService.getMyCaregiver(), []);
  const { data: centre } = useLoad(() => authService.getCentre(), []);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [reason, setReason] = useState("sick");
  const [days, setDays] = useState(3);
  const [inviteOpen, setInviteOpen] = useState(false);

  const update = async (patch: Partial<Caregiver>) => {
    await childService.updateMyCaregiver(patch);
  };

  if (error) return <div className="p-4"><ErrorState message={error} onRetry={reload} /></div>;
  const paused = !!cg?.pausedUntil && cg.pausedUntil >= todayKey();

  return (
    <div className="pb-6">
      <ParentTopBar back="/p/today" title={L("সেটিংস", "Settings")} />
      <div className="space-y-5 px-4">
        <section>
          <h2 className="mb-2 font-bold">{L("ভাষা", "Language")}</h2>
          <Segmented value={lang} onChange={(v) => { setLang(v); authService.updateUser({ language: v }); }}
            options={[{ value: "bn", label: <span className="bn px-2 text-[16px]">বাংলা</span> }, { value: "en", label: <span className="px-2 text-[16px]">English</span> }]} />
        </section>

        {loading || !cg ? <SkeletonList rows={3} h="h-28" /> : (
          <>
            <section>
              <h2 className="mb-2 font-bold">{L("পরিকল্পনা বিরতি", "Pause plan")}</h2>
              <Card className="flex items-center gap-3">
                <PauseCircle className="size-8 shrink-0 text-primary" />
                <div className="flex-1 text-[16px]">
                  {paused ? L(`${fmtDate(cg.pausedUntil!, "bn", { day: "numeric", month: "long" })} পর্যন্ত বিরতিতে`, `Paused until ${fmtDate(cg.pausedUntil!, "en", { day: "numeric", month: "long" })}`)
                    : L("অসুস্থ বা ভ্রমণে? কিছুদিনের বিরতি নিন।", "Sick or travelling? Take a short break.")}
                </div>
                {paused
                  ? <Button size="sm" variant="soft" onClick={async () => { await reminderService.resumePlan(); reload(); toast(L("আবার শুরু হয়েছে", "Plan resumed")); }}>{L("আবার শুরু", "Resume")}</Button>
                  : <Button size="sm" onClick={() => setPauseOpen(true)}>{L("বিরতি", "Pause")}</Button>}
              </Card>
            </section>

            <section>
              <h2 className="mb-2 flex items-center gap-2 font-bold"><Bell className="size-5 text-primary" />{L("রিমাইন্ডার", "Reminders")}</h2>
              <Card className="space-y-4">
                <div>
                  <p className="mb-2 text-[16px] font-semibold">{L("দিনে কয়টি রিমাইন্ডার?", "Reminders per day")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 2, 3] as const).map((n) => (
                      <Choice key={n} active={cg.remindersPerDay === n} onClick={() => update({ remindersPerDay: n })}>{num(n, lang)}</Choice>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[16px] font-semibold">{L("আপনার দিনের রুটিন", "Your daily routine")}</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {ROUTINE_LABELS.map((r) => (
                      <label key={r.k} className="block">
                        <span className="mb-1 block text-[14px] text-text-2">{L(r.bn, r.en)}</span>
                        <input type="time" className={inputCls()} defaultValue={cg.routineTimes[r.k]}
                          onBlur={(e) => e.target.value && update({ routineTimes: { ...cg.routineTimes, [r.k]: e.target.value } })} />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[16px] font-semibold">{L("চুপচাপ সময় (কোনো রিমাইন্ডার নয়)", "Quiet hours (no reminders)")}</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input type="time" aria-label={L("শুরু", "From")} className={inputCls()} defaultValue={cg.quietHours.from} onBlur={(e) => update({ quietHours: { ...cg.quietHours, from: e.target.value } })} />
                    <input type="time" aria-label={L("শেষ", "To")} className={inputCls()} defaultValue={cg.quietHours.to} onBlur={(e) => update({ quietHours: { ...cg.quietHours, to: e.target.value } })} />
                  </div>
                </div>
                <Link href="/p/settings/reminders" className="flex min-h-12 items-center justify-between rounded-xl bg-primary-soft px-4 font-semibold text-primary">
                  {L("রিমাইন্ডার কেমন দেখাবে", "Preview reminders")}<ChevronRight className="size-5" />
                </Link>
              </Card>
            </section>
          </>
        )}

        <section className="space-y-2">
          <Button variant="soft" block size="lg" icon={<UserPlus className="size-5" />} onClick={() => setInviteOpen(true)}>{L("আরেকজন যত্নকারী যোগ করুন", "Invite another caregiver")}</Button>
          <Card className="flex items-start gap-3 text-[15px] text-text-2">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-info" />
            {L("আপনার তথ্য শুধু আপনার ক্লিনিক দেখে। আপনি চাইলে যেকোনো সময় তথ্য দেখতে ও মুছতে পারবেন।", "Only your clinic sees your information. You can view or delete it any time.")}
          </Card>
          <Button variant="ghost" block size="lg" icon={<LogOut className="size-5" />} onClick={async () => { await authService.logOut(); router.replace("/"); }}>{L("লগ আউট", "Log out")}</Button>
        </section>
      </div>

      <BottomSheet open={pauseOpen} onClose={() => setPauseOpen(false)} title={L("পরিকল্পনা বিরতি", "Pause the plan")}>
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {[{ v: "sick", bn: "অসুস্থ", en: "Sick" }, { v: "travel", bn: "ভ্রমণ", en: "Travel" }, { v: "other", bn: "অন্য কিছু", en: "Other" }].map((r) => (
              <Choice key={r.v} active={reason === r.v} onClick={() => setReason(r.v)}>{L(r.bn, r.en)}</Choice>
            ))}
          </div>
          <div className="flex items-center justify-center gap-5">
            <button aria-label={L("কমান", "Fewer days")} onClick={() => setDays(Math.max(1, days - 1))} className="glass grid size-14 place-items-center rounded-full"><Minus /></button>
            <span className="min-w-28 text-center text-[24px] font-bold">{L(`${num(days, "bn")} দিন`, `${days} day${days > 1 ? "s" : ""}`)}</span>
            <button aria-label={L("বাড়ান", "More days")} onClick={() => setDays(Math.min(7, days + 1))} className="glass grid size-14 place-items-center rounded-full"><Plus /></button>
          </div>
          <p className="text-center text-[16px] text-text-2">{L("কোনো সমস্যা নেই — বিরতিতে কোনো ক্ষতি হয় না। রিমাইন্ডার বন্ধ থাকবে।", "No problem — a pause never counts against you. Reminders will stop.")}</p>
          <Button block size="lg" onClick={async () => { await reminderService.pausePlan(days, reason); setPauseOpen(false); reload(); toast(L("বিরতি দেওয়া হয়েছে", "Plan paused")); }}>{L("বিরতি দিন", "Pause")}</Button>
        </div>
      </BottomSheet>

      <BottomSheet open={inviteOpen} onClose={() => setInviteOpen(false)} title={L("আরেকজন যত্নকারী", "Another caregiver")}>
        <div className="space-y-4">
          <p className="text-[17px]">{L("পরিবারের আরেকজনকে যুক্ত করতে আপনার থেরাপিস্টের কাছ থেকে নতুন কোড নিন। তিনি অ্যাপে ‘কোড দিয়ে যোগ দিন’ চাপবেন।", "To add another family member, get a new code from your therapist. They tap ‘Join with code’ in the app.")}</p>
          <Button block size="lg" href={`https://wa.me/${centre?.whatsapp ?? ""}?text=${encodeURIComponent("আসসালামু আলাইকুম, পরিবারের আরেকজনকে BridgeAI-তে যুক্ত করতে একটি নতুন কোড পেতে পারি?")}`}>
            {L("ক্লিনিককে WhatsApp করুন", "WhatsApp the clinic")}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
