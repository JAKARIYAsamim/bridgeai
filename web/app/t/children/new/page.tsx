"use client";
// T-02 Add child, then the "how do you want to build the plan" choice.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Button, Card, Field, useToast } from "@/components/ui";
import { AGE_BANDS, SAFETY_FLAGS, SENSORY_FLAGS } from "@/lib/labels";
import { ageBandFromDob } from "@/lib/matching";
import { childService } from "@/lib/services";
import type { AgeBand, Child } from "@/lib/types";

export default function AddChild() {
  const router = useRouter();
  const toast = useToast();
  const [nickname, setNickname] = useState("");
  const [dob, setDob] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand | "">("");
  const [ageTouched, setAgeTouched] = useState(false);
  const [firstSession, setFirstSession] = useState(new Date().toISOString().slice(0, 10));
  const [gender, setGender] = useState("");
  const [cgName, setCgName] = useState("");
  const [cgPhone, setCgPhone] = useState("");
  const [clinicalOpen, setClinicalOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const assessments: { tool: string; date: string; score: string }[] = [];
  const [coOccurring, setCoOccurring] = useState("");
  const [safety, setSafety] = useState<string[]>([]);
  const [sensory, setSensory] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Child | null>(null);

  const onDob = (v: string) => {
    setDob(v);
    if (v && !ageTouched) setAgeBand(ageBandFromDob(v));
  };
  const toggle = (list: string[], set: (l: string[]) => void, k: string) =>
    set(list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

  const save = async () => {
    const e: Record<string, string> = {};
    if (!nickname.trim()) e.nickname = "Please add the nickname";
    if (!dob) e.dob = "Please add the date of birth";
    else if (new Date(dob) > new Date()) e.dob = "Date of birth can't be in the future";
    if (!firstSession) e.firstSession = "Please add the first session date";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const child = await childService.createChild({
        nickname: nickname.trim(),
        dob,
        ageBand: (ageBand || ageBandFromDob(dob)) as AgeBand,
        firstSessionDate: firstSession,
        gender: gender || undefined,
        caregiverName: cgName || undefined,
        caregiverPhone: cgPhone || undefined,
        sensoryFlags: sensory,
        safetyFlags: safety,
        clinical: {
          diagnosisNotes: diagnosis,
          assessments: assessments.filter((a) => a.tool.trim()),
          coOccurring,
        },
      });
      toast(`${child.nickname} added`);
      setSaved(child);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="pad" style={{ paddingBottom: 88 }}>
        <div className="bar" style={{ padding: "4px 8px 12px" }}>
          <h1 className="h2 grow">How do you want to build {saved.nickname}’s plan?</h1>
        </div>
        <div className="in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card
            style={{ cursor: "pointer", border: "2px solid var(--p)" }}
            onClick={() => router.push(`/t/children/${saved.id}/intake`)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="ic t-purple" style={{ width: 44, height: 44, fontSize: 20 }}>
                <Icon name="spark" />
              </span>
              <span className="pill good">Recommended</span>
            </div>
            <p className="h2" style={{ fontSize: 18, marginBottom: 4 }}>
              Smart intake
            </p>
            <p className="sub" style={{ fontSize: 14 }}>
              Add notes by voice, photo of paper notes, text or video, and let AI draft the plan.
            </p>
          </Card>

          <Card
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/t/children/${saved.id}/roadmap`)}
          >
            <div style={{ marginBottom: 8 }}>
              <span className="ic t-blue" style={{ width: 44, height: 44, fontSize: 20 }}>
                <Icon name="turn" />
              </span>
            </div>
            <p className="h2" style={{ fontSize: 18, marginBottom: 4 }}>
              Build it myself
            </p>
            <p className="sub" style={{ fontSize: 14 }}>
              Start with an empty roadmap and pick activities directly from the library.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pad" style={{ paddingBottom: 88 }}>
      <div className="bar" style={{ padding: "4px 8px 10px" }}>
        <Link href="/t" className="hbtn" aria-label="Back">
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            Add child
          </h1>
          <p className="small">Takes under a minute</p>
        </div>
      </div>

      <div className="in">
        <Card style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
          <Field
            label="Child's nickname"
            error={errors.nickname}
            hint="Caregiver and AI only see the nickname. No full name needed."
          >
            <input
              className="field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Mitu"
            />
          </Field>

          <Field label="First session date" error={errors.firstSession}>
            <input
              type="date"
              className="field"
              value={firstSession}
              onChange={(e) => setFirstSession(e.target.value)}
            />
          </Field>

          <Field label="Date of birth" error={errors.dob}>
            <input
              type="date"
              className="field"
              value={dob}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => onDob(e.target.value)}
            />
          </Field>

          <Field
            label="Age band"
            hint={dob ? "Worked out from date of birth. You can adjust." : "Add date of birth to fill."}
          >
            <select
              className="field"
              value={ageBand}
              onChange={(e) => {
                setAgeBand(e.target.value as AgeBand);
                setAgeTouched(true);
              }}
            >
              <option value="">—</option>
              {(Object.keys(AGE_BANDS) as AgeBand[]).map((a) => (
                <option key={a} value={a}>
                  {AGE_BANDS[a].en}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Gender" optional>
            <select className="field" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Prefer not to say</option>
              <option>Girl</option>
              <option>Boy</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Primary caregiver's name" optional>
            <input className="field" value={cgName} onChange={(e) => setCgName(e.target.value)} />
          </Field>

          <Field label="Caregiver's phone" optional>
            <input
              type="tel"
              className="field"
              value={cgPhone}
              onChange={(e) => setCgPhone(e.target.value)}
              placeholder="+8801…"
            />
          </Field>
        </Card>

        {/* Clinical record toggle */}
        <Card style={{ padding: 0, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setClinicalOpen(!clinicalOpen)}
            aria-expanded={clinicalOpen}
            style={{
              display: "flex",
              minHeight: 48,
              width: "100%",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Icon name="shield" style={{ color: "var(--p)", fontSize: 18 }} />
            <span className="grow h3" style={{ fontSize: 14 }}>
              Clinical record <span className="small">(optional)</span>
            </span>
            <span style={{ transform: clinicalOpen ? "rotate(180deg)" : undefined, transition: "transform .2s" }}>
              <Icon name="next" />
            </span>
          </button>
          {clinicalOpen && (
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <p className="small">Never shown to parents or sent to AI.</p>
              <Field label="Diagnosis notes">
                <textarea
                  className="field"
                  style={{ minHeight: 70 }}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </Field>

              <Field label="Co-occurring conditions">
                <input className="field" value={coOccurring} onChange={(e) => setCoOccurring(e.target.value)} />
              </Field>

              <FlagGroup title="Safety flags" options={SAFETY_FLAGS} value={safety} onToggle={(k) => toggle(safety, setSafety, k)} />
              <FlagGroup title="Sensory flags" options={SENSORY_FLAGS} value={sensory} onToggle={(k) => toggle(sensory, setSensory, k)} />
            </div>
          )}
        </Card>

        {errors.form && <p className="err" style={{ marginBottom: 10 }}>{errors.form}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button block size="lg" variant="primary" loading={saving} onClick={save}>
            Save and continue
          </Button>
          <Button block variant="ghost" href="/t">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function FlagGroup({
  title,
  options,
  value,
  onToggle,
}: {
  title: string;
  options: Record<string, string>;
  value: string[];
  onToggle: (k: string) => void;
}) {
  return (
    <div>
      <p className="small" style={{ fontWeight: 600, marginBottom: 6 }}>{title}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {Object.entries(options).map(([k, label]) => {
          const on = value.includes(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => onToggle(k)}
              className={`chipb ${on ? "on" : ""}`}
              style={{ fontSize: 13 }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
