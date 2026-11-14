"use client";
// T-12 Therapist settings — matches prototype settings()
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Ele } from "@/components/legacy/mascots";
import { Button, Card, ErrorState, Field, Modal, Segmented, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { PROFESSIONS } from "@/lib/labels";
import { authService, resetDemoData } from "@/lib/services";
import type { Lang } from "@/lib/types";

export default function TherapistSettings() {
  const router = useRouter();
  const toast = useToast();
  const { lang, setLang } = useLang();
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
    <div className="pad" style={{ paddingBottom: 88 }}>
      <div className="bar" style={{ padding: "4px 8px 12px" }}>
        <h1 className="h2 grow">Settings</h1>
      </div>

      <div className="in">
        <div className="card" style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <span className="persona" style={{ width: "auto", padding: 0, margin: 0, background: "none" }}>
            <span className="m t-purple">
              <Ele mood="calm" extra="doctor" />
            </span>
          </span>
          <div>
            <p className="h2">{user.name}</p>
            <p className="small">Dr. Nasrin, Therapist at the clinic</p>
          </div>
        </div>

        <div className="sec">
          <h2 className="h2">Profile</h2>
        </div>
        <Card style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
          <Field label="Name">
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Profession">
            <select
              className="field"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            >
              {PROFESSIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Email">
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
              toast("Profile saved");
            }}
          >
            Save profile
          </Button>
        </Card>

        <div className="sec">
          <h2 className="h2">Language</h2>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Segmented<Lang>
            value={lang}
            onChange={setLang}
            options={[
              { value: "en", label: "English" },
              { value: "bn", label: <span className="bn">বাংলা</span> },
            ]}
          />
        </div>

        <div className="sec">
          <h2 className="h2">Demo data</h2>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <p className="sub" style={{ fontSize: 14, marginBottom: 10 }}>
            Bring back the sample children and demo data before each rehearsal.
          </p>
          <Button
            block
            variant="soft"
            icon={<Icon name="refresh" />}
            onClick={() => setConfirm(true)}
          >
            Reset demo data
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
          Log out
        </Button>

        <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset demo data?">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="small">
              This removes every change made in this browser and brings back the initial sample children, logs, and reports.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  resetDemoData();
                  setConfirm(false);
                  toast("Demo data reset");
                  reload();
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
