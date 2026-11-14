"use client";
// T-02 Add child, then the "how do you want to build the plan" choice.
import { ChevronDown, Lock, Plus, Sparkles, Trash2, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Chip, cx, Field, inputCls, PageTitle, useToast } from "@/components/ui";
import { AGE_BANDS, SAFETY_FLAGS, SENSORY_FLAGS } from "@/lib/labels";
import { ageBandFromDob } from "@/lib/matching";
import { childService } from "@/lib/services";
import type { AgeBand, Assessment, Child } from "@/lib/types";

const TOOLS = ["M-CHAT-R/F", "CARS-2", "ADOS-2", "Vineland-3"];

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
  const [assessments, setAssessments] = useState<Assessment[]>([]);
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
  const toggle = (list: string[], set: (l: string[]) => void, k: string) => set(list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

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
        clinical: { diagnosisNotes: diagnosis, assessments: assessments.filter((a) => a.tool.trim()), coOccurring },
      });
      toast(`${child.nickname} added`);
      setSaved(child);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  if (saved)
    return (
      <div className="mx-auto max-w-3xl rise">
        <PageTitle title={`How do you want to build ${saved.nickname}'s plan?`} sub="You can change the plan at any time." />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-3 ring-2 ring-primary" onClick={() => router.push(`/t/children/${saved.id}/intake`)}>
            <div className="flex items-center justify-between">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary text-white"><Sparkles className="size-6" /></span>
              <Chip tone="primary">Recommended</Chip>
            </div>
            <h2 className="text-xl font-bold">Smart intake</h2>
            <p className="text-text-2">Add your session notes by voice, photo, text or video and let AI draft the plan. You review every part.</p>
          </Card>
          <Card className="flex flex-col gap-3" onClick={() => router.push(`/t/children/${saved.id}/roadmap`)}>
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><Wrench className="size-6" /></span>
            <h2 className="text-xl font-bold">Build it myself</h2>
            <p className="text-text-2">Go to an empty roadmap and pick activities from the library.</p>
          </Card>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Add child" sub="Takes under a minute. Everything else can come from the smart intake." />
      <Card strong className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Child's nickname" error={errors.nickname} hint="Parents and AI only see the nickname. No full name needed.">
            <input className={inputCls(!!errors.nickname)} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Mitu" />
          </Field>
          <Field label="First session date" error={errors.firstSession}>
            <input type="date" className={inputCls(!!errors.firstSession)} value={firstSession} onChange={(e) => setFirstSession(e.target.value)} />
          </Field>
          <Field label="Date of birth" error={errors.dob}>
            <input type="date" className={inputCls(!!errors.dob)} value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => onDob(e.target.value)} />
          </Field>
          <Field label="Age band" hint={dob ? "Worked out from the date of birth. You can change it." : "Add the date of birth to fill this in."}>
            <select className={inputCls()} value={ageBand} onChange={(e) => { setAgeBand(e.target.value as AgeBand); setAgeTouched(true); }}>
              <option value="">—</option>
              {(Object.keys(AGE_BANDS) as AgeBand[]).map((a) => <option key={a} value={a}>{AGE_BANDS[a].en}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 border-t border-line pt-5 md:grid-cols-3">
          <Field label="Gender" optional>
            <select className={inputCls()} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Prefer not to say</option><option>Girl</option><option>Boy</option><option>Other</option>
            </select>
          </Field>
          <Field label="Primary caregiver's name" optional>
            <input className={inputCls()} value={cgName} onChange={(e) => setCgName(e.target.value)} />
          </Field>
          <Field label="Caregiver's phone" optional>
            <input type="tel" className={inputCls()} value={cgPhone} onChange={(e) => setCgPhone(e.target.value)} placeholder="+8801…" />
          </Field>
        </div>

        <div className="rounded-2xl border border-line">
          <button type="button" onClick={() => setClinicalOpen(!clinicalOpen)} aria-expanded={clinicalOpen} className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
            <Lock className="size-5 text-primary" />
            <span className="flex-1 font-semibold">Clinical record <span className="font-normal text-muted">(therapist only · optional)</span></span>
            <ChevronDown className={cx("size-5 transition", clinicalOpen && "rotate-180")} />
          </button>
          {clinicalOpen && (
            <div className="space-y-4 border-t border-line p-4">
              <p className="text-xs text-muted">Never shown to parents or sent to AI.</p>
              <Field label="Diagnosis notes" hint="As the clinician wrote them, e.g. “ASD, DSM-5-TR Level 2, with language impairment”.">
                <textarea className={cx(inputCls(), "min-h-24 py-3")} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              </Field>
              <div>
                <div className="mb-1.5 text-sm font-semibold">Assessments used</div>
                <datalist id="tools">{TOOLS.map((t) => <option key={t} value={t} />)}</datalist>
                <div className="space-y-2">
                  {assessments.map((a, i) => (
                    <div key={i} className="grid grid-cols-[1fr_150px_100px_48px] gap-2">
                      <input list="tools" aria-label="Tool" placeholder="Tool" className={inputCls()} value={a.tool} onChange={(e) => setAssessments(assessments.map((x, j) => (j === i ? { ...x, tool: e.target.value } : x)))} />
                      <input type="date" aria-label="Date" className={inputCls()} value={a.date} onChange={(e) => setAssessments(assessments.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} />
                      <input aria-label="Score" placeholder="Score" className={inputCls()} value={a.score} onChange={(e) => setAssessments(assessments.map((x, j) => (j === i ? { ...x, score: e.target.value } : x)))} />
                      <button type="button" aria-label="Remove assessment" className="grid size-12 place-items-center rounded-xl text-muted hover:bg-primary-soft" onClick={() => setAssessments(assessments.filter((_, j) => j !== i))}><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
                <Button type="button" size="sm" variant="ghost" className="mt-2" icon={<Plus className="size-4" />} onClick={() => setAssessments([...assessments, { tool: "", date: "", score: "" }])}>Add assessment</Button>
              </div>
              <Field label="Co-occurring conditions">
                <input className={inputCls()} value={coOccurring} onChange={(e) => setCoOccurring(e.target.value)} />
              </Field>
              <FlagGroup title="Safety flags" options={SAFETY_FLAGS} value={safety} onToggle={(k) => toggle(safety, setSafety, k)} />
              <FlagGroup title="Sensory flags" options={SENSORY_FLAGS} value={sensory} onToggle={(k) => toggle(sensory, setSensory, k)} />
            </div>
          )}
        </div>

        {errors.form && <p role="alert" className="text-sm font-semibold text-[#c2410c]">{errors.form}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" href="/t">Cancel</Button>
          <Button size="lg" loading={saving} onClick={save}>Save and continue</Button>
        </div>
      </Card>
    </div>
  );
}

function FlagGroup({ title, options, value, onToggle }: { title: string; options: Record<string, string>; value: string[]; onToggle: (k: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(([k, label]) => (
          <label key={k} className={cx("flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-medium", value.includes(k) ? "border-primary bg-primary-soft text-primary" : "border-line")}>
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={value.includes(k)} onChange={() => onToggle(k)} />{label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
