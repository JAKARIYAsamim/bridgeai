"use client";
// P-11 Parent settings — matches prototype settings()
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Tiger } from "@/components/legacy/mascots";
import { ParentTopBar, ROUTINE_LABELS, todayKey } from "@/components/parent/common";
import { BottomSheet, Button, Card, ErrorState, Segmented, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { fmtDate, num } from "@/lib/labels";
import { authService, childService, reminderService } from "@/lib/services";
import type { Caregiver } from "@/lib/types";

export default function ParentSettings() {
  const router = useRouter();
  const toast = useToast();
  const { lang, setLang, L } = useLang();
  const { data: user } = useLoad(() => authService.currentUser(), []);
  const { data: child } = useLoad(() => childService.getMyChild(), []);
  const { data: cg, loading, error, reload } = useLoad(() => childService.getMyCaregiver(), []);
  const { data: centre } = useLoad(() => authService.getCentre(), []);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [reason, setReason] = useState("sick");
  const [days, setDays] = useState(3);
  const [inviteOpen, setInviteOpen] = useState(false);

  const update = async (patch: Partial<Caregiver>) => {
    await childService.updateMyCaregiver(patch);
  };

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const paused = !!cg?.pausedUntil && cg.pausedUntil >= todayKey();

  return (
    <div className="pad" style={{ paddingBottom: 24 }}>
      <ParentTopBar back="/p/today" title={L("সেটিংস", "Settings")} />

      <div className="in">
        <div className="card" style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <span className="persona" style={{ width: "auto", padding: 0, margin: 0, background: "none" }}>
            <span className="m t-orange">
              <Tiger mood="hi" />
            </span>
          </span>
          <div>
            <p className="h2">{user?.name ?? L("নুসরাত", "Parent")}</p>
            <p className="small">
              {L(
                `${child?.nickname ?? "রাফি"}-এর অভিভাবক`,
                `Parent of ${child?.nickname ?? "Rafi"}`
              )}
            </p>
          </div>
        </div>

        <div className="sec">
          <h2 className="h2">{L("ভাষা", "Language")}</h2>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Segmented
            value={lang}
            onChange={(v) => {
              setLang(v);
              authService.updateUser({ language: v });
            }}
            options={[
              { value: "bn", label: <span className="bn">বাংলা</span> },
              { value: "en", label: <span>English</span> },
            ]}
          />
        </div>

        {loading || !cg ? (
          <SkeletonList rows={3} h="h-28" />
        ) : (
          <>
            <div className="sec">
              <h2 className="h2">{L("পরিকল্পনা বিরতি", "Pause plan")}</h2>
            </div>
            <Card style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span className="ic t-purple" style={{ width: 44, height: 44, fontSize: 22 }}>
                <Icon name="turn" />
              </span>
              <div className="grow">
                <p className="sub" style={{ fontSize: 15, color: "var(--ink)" }}>
                  {paused
                    ? L(
                        `${fmtDate(cg.pausedUntil!, "bn", { day: "numeric", month: "long" })} পর্যন্ত বিরতিতে`,
                        `Paused until ${fmtDate(cg.pausedUntil!, "en", { day: "numeric", month: "long" })}`
                      )
                    : L("অসুস্থ বা ভ্রমণে? কিছুদিনের বিরতি নিন।", "Sick or travelling? Take a short break.")}
                </p>
              </div>
              {paused ? (
                <Button
                  size="sm"
                  variant="soft"
                  onClick={async () => {
                    await reminderService.resumePlan();
                    reload();
                    toast(L("আবার শুরু হয়েছে", "Plan resumed"));
                  }}
                >
                  {L("আবার শুরু", "Resume")}
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={() => setPauseOpen(true)}>
                  {L("বিরতি", "Pause")}
                </Button>
              )}
            </Card>

            <div className="sec">
              <h2 className="h2">{L("রিমাইন্ডার ও রুটিন", "Reminders & routine")}</h2>
            </div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 14 }}>
                <p className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
                  {L("দিনে কয়টি রিমাইন্ডার?", "Reminders per day")}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {([1, 2, 3] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => update({ remindersPerDay: n })}
                      className={`choice ${cg.remindersPerDay === n ? "on" : ""}`}
                      style={{ minHeight: 44, fontWeight: 600 }}
                    >
                      {num(n, lang)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <p className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
                  {L("আপনার দিনের রুটিন", "Your daily routine")}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {ROUTINE_LABELS.map((r) => (
                    <label key={r.k} style={{ display: "block" }}>
                      <span className="small" style={{ display: "block", marginBottom: 4 }}>
                        {L(r.bn, r.en)}
                      </span>
                      <input
                        type="time"
                        className="field"
                        defaultValue={cg.routineTimes[r.k]}
                        onBlur={(e) =>
                          e.target.value &&
                          update({ routineTimes: { ...cg.routineTimes, [r.k]: e.target.value } })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <p className="small" style={{ fontWeight: 600, marginBottom: 6 }}>
                  {L("চুপচাপ সময় (কোনো রিমাইন্ডার নয়)", "Quiet hours (no reminders)")}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="time"
                    aria-label={L("শুরু", "From")}
                    className="field"
                    defaultValue={cg.quietHours.from}
                    onBlur={(e) => update({ quietHours: { ...cg.quietHours, from: e.target.value } })}
                  />
                  <input
                    type="time"
                    aria-label={L("শেষ", "To")}
                    className="field"
                    defaultValue={cg.quietHours.to}
                    onBlur={(e) => update({ quietHours: { ...cg.quietHours, to: e.target.value } })}
                  />
                </div>
              </div>

              <Link
                href="/p/settings/reminders"
                className="row"
                style={{ background: "rgba(131, 119, 238, 0.08)", textDecoration: "none" }}
              >
                <span className="ic t-purple" style={{ width: 36, height: 36, fontSize: 18 }}>
                  <Icon name="bell" />
                </span>
                <span className="grow h3" style={{ fontSize: 15 }}>
                  {L("রিমাইন্ডার কেমন দেখাবে", "Preview reminders")}
                </span>
                <Icon name="next" />
              </Link>
            </Card>
          </>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <Button
            variant="soft"
            block
            size="lg"
            icon={<Icon name="users" />}
            onClick={() => setInviteOpen(true)}
          >
            {L("আরেকজন যত্নকারী যোগ করুন", "Invite another caregiver")}
          </Button>

          <Card style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span className="ic t-green" style={{ width: 36, height: 36, fontSize: 18, flex: "none" }}>
              <Icon name="shield" />
            </span>
            <p className="small">
              {L(
                "আপনার তথ্য শুধু আপনার ক্লিনিক দেখে। আপনি চাইলে যেকোনো সময় তথ্য দেখতে ও মুছতে পারবেন।",
                "Only your clinic sees your information. You can view or delete it any time."
              )}
            </p>
          </Card>

          <Button
            variant="ghost"
            block
            size="lg"
            icon={<Icon name="x" />}
            onClick={async () => {
              await authService.logOut();
              router.replace("/");
            }}
          >
            {L("লগ আউট", "Log out")}
          </Button>
        </div>
      </div>

      <BottomSheet open={pauseOpen} onClose={() => setPauseOpen(false)} title={L("পরিকল্পনা বিরতি", "Pause the plan")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { v: "sick", bn: "অসুস্থ", en: "Sick" },
              { v: "travel", bn: "ভ্রমণ", en: "Travel" },
              { v: "other", bn: "অন্য কিছু", en: "Other" },
            ].map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => setReason(r.v)}
                className={`choice ${reason === r.v ? "on" : ""}`}
                style={{ minHeight: 44, fontWeight: 600 }}
              >
                {L(r.bn, r.en)}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <button
              aria-label={L("কমান", "Fewer days")}
              type="button"
              onClick={() => setDays(Math.max(1, days - 1))}
              className="hbtn"
              style={{ width: 44, height: 44 }}
            >
              <Icon name="back" />
            </button>
            <span className="h1" style={{ minWidth: 100, textAlign: "center" }}>
              {L(`${num(days, lang)} দিন`, `${days} day${days > 1 ? "s" : ""}`)}
            </span>
            <button
              aria-label={L("বাড়ান", "More days")}
              type="button"
              onClick={() => setDays(Math.min(7, days + 1))}
              className="hbtn"
              style={{ width: 44, height: 44 }}
            >
              <Icon name="next" />
            </button>
          </div>

          <p className="small" style={{ textAlign: "center" }}>
            {L(
              "কোনো সমস্যা নেই — বিরতিতে কোনো ক্ষতি হয় না। রিমাইন্ডার বন্ধ থাকবে।",
              "No problem — a pause never counts against you. Reminders will stop."
            )}
          </p>

          <Button
            block
            size="lg"
            variant="primary"
            onClick={async () => {
              await reminderService.pausePlan(days, reason);
              setPauseOpen(false);
              reload();
              toast(L("বিরতি দেওয়া হয়েছে", "Plan paused"));
            }}
          >
            {L("বিরতি দিন", "Pause")}
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={inviteOpen} onClose={() => setInviteOpen(false)} title={L("আরেকজন যত্নকারী", "Another caregiver")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p className="sub" style={{ fontSize: 16 }}>
            {L(
              "পরিবারের আরেকজনকে যুক্ত করতে আপনার থেরাপিস্টের কাছ থেকে নতুন কোড নিন। তিনি অ্যাপে ‘কোড দিয়ে যোগ দিন’ চাপবেন।",
              "To add another family member, get a new code from your therapist. They tap ‘Join with code’ in the app."
            )}
          </p>
          <Button
            block
            size="lg"
            variant="primary"
            href={`https://wa.me/${centre?.whatsapp ?? ""}?text=${encodeURIComponent(
              "আসসালামু আলাইকুম, পরিবারের আরেকজনকে BridgeAI-তে যুক্ত করতে একটি নতুন কোড পেতে পারি?"
            )}`}
          >
            {L("ক্লিনিককে WhatsApp করুন", "WhatsApp the clinic")}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
