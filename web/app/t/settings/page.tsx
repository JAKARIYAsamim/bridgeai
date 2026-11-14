"use client";
// T-12 Therapist settings — matches prototype settings()
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Ele } from "@/components/legacy/mascots";
import { Button, Card, ErrorState, Field, Modal, Segmented, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn, PROFESSIONS, PROFESSIONS_DATA } from "@/lib/labels";
import { authService, resetDemoData } from "@/lib/services";
import type { Lang } from "@/lib/types";

export default function TherapistSettings() {
  const router = useRouter();
  const toast = useToast();
  const { lang, setLang, L } = useLang();
  const { data: user, loading, error, reload } = useLoad(() => authService.currentUser(), []);
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (user && loadedFor !== user.id) {
    setLoadedFor(user.id);
    setName(user.name);
    setProfession(user.profession ?? PROFESSIONS[0]);
  }

  if (error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }
  if (loading || !user) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <SkeletonList rows={3} />
      </div>
    );
  }

  return (
    <div className="pad" style={{ paddingBottom: 88 }} lang={lang}>
      <div className="bar" style={{ padding: "4px 8px 12px" }}>
        <h1 className="h2 grow">{L("সেটিংস", "Settings")}</h1>
      </div>

      <div className="in">
        <div className="card" style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <span className="persona" style={{ width: "auto", padding: 0, margin: 0, background: "none" }}>
            <span className="m t-purple">
              <Ele mood="calm" extra="doctor" />
            </span>
          </span>
          <div>
            <p className="h2">{nameIn(user.name, lang)}</p>
            <p className="small">{L("ডা. নাসরিন, ক্লিনিকের থেরাপিস্ট", "Dr. Nasrin, Therapist at the clinic")}</p>
          </div>
        </div>

        <div className="sec">
          <h2 className="h2">{L("প্রোফাইল", "Profile")}</h2>
        </div>
        <Card style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
          <Field label={L("নাম", "Name")}>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label={L("পেশা", "Profession")}>
            <select
              className="field"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            >
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>
                  {lang === "bn" ? PROFESSIONS_DATA[p]?.bn ?? p : p}
                </option>
              ))}
            </select>
          </Field>
          <Field label={L("ইমেইল", "Email")}>
            <input className="field" value={user.email} disabled />
          </Field>
          <Button
            variant="primary"
            loading={saving}
            disabled={!name.trim()}
            onClick={async () => {
              setSaving(true);
              await authService.updateUser({ name: name.trim(), profession });
              setSaving(false);
              toast(L("প্রোফাইল সংরক্ষণ হয়েছে", "Profile saved"));
            }}
          >
            {L("প্রোফাইল সংরক্ষণ করুন", "Save profile")}
          </Button>
        </Card>

        <div className="sec">
          <h2 className="h2">{L("ভাষা", "Language")}</h2>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Segmented<Lang>
            value={lang}
            onChange={setLang}
            options={[
              { value: "bn", label: <span className="bn">বাংলা</span> },
              { value: "en", label: "English" },
            ]}
          />
        </div>

        <div className="sec">
          <h2 className="h2">{L("ডেমো তথ্য", "Demo data")}</h2>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <p className="sub" style={{ fontSize: 14, marginBottom: 10 }}>
            {L("ডেমো পুনরায় শুরু করতে প্রাথমিক নমুনা তথ্য ফিরিয়ে আনুন।", "Bring back the sample children and demo data before each rehearsal.")}
          </p>
          <Button
            block
            variant="soft"
            icon={<Icon name="refresh" />}
            onClick={() => setConfirm(true)}
          >
            {L("ডেমো তথ্য রিসেট করুন", "Reset demo data")}
          </Button>
        </Card>

        <Button
          block
          size="lg"
          variant="ghost"
          icon={<Icon name="x" />}
          onClick={async () => {
            await authService.logOut();
            router.replace("/");
          }}
        >
          {L("লগআউট", "Log out")}
        </Button>

        <Modal open={confirm} onClose={() => setConfirm(false)} title={L("ডেমো তথ্য রিসেট করবেন?", "Reset demo data?")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="small">
              {L(
                "এটি এই ব্রাউজারের সমস্ত পরিবর্তন মুছে প্রাথমিক নমুনা তথ্য, লগ ও রিপোর্ট ফিরিয়ে আনবে।",
                "This removes every change made in this browser and brings back the initial sample children, logs, and reports."
              )}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                {L("বাতিল", "Cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  resetDemoData();
                  setConfirm(false);
                  toast(L("ডেমো তথ্য রিসেট হয়েছে", "Demo data reset"));
                  reload();
                }}
              >
                {L("রিসেট করুন", "Reset")}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
