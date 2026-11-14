"use client";
// T-03 Smart intake: add notes by voice, photo, text or video; AI drafts the plan.
import { ChevronDown, ListChecks, Sparkles } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MediaChip, MediaPicker, MicButton, fmtSecs, useFilePicker } from "@/components/media";
import { BottomSheet, Button, Card, Chip, cx, ErrorState, inputCls, PageTitle, SkeletonList, StepLoader } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { AGE_BANDS } from "@/lib/labels";
import { aiService, childService, planService } from "@/lib/services";
import type { IntakeInput, MediaType } from "@/lib/types";

const MENTION = [
  "Strengths and interests", "Communication", "Play", "Sensory reactions", "Eating, sleep and toileting",
  "Behaviour concerns", "The family's goals", "Safety risks",
];
const MAX_PHOTOS = 5;

export default function SmartIntake() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: child, loading, error, reload } = useLoad(() => childService.getChild(id), [id]);
  const [inputs, setInputs] = useState<IntakeInput[]>([]);
  const [sheet, setSheet] = useState<MediaType | null>(null);
  const [text, setText] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const add = (i: Omit<IntakeInput, "id">) => setInputs((l) => [...l, { ...i, id: `in_${Date.now()}_${l.length}` }]);
  const photos = inputs.filter((i) => i.type === "photo").length;
  const photo = useFilePicker("image/*", (f) => add({ type: "photo", label: `Photo · ${f.name.slice(0, 18)}`, url: f.url }));
  const video = useFilePicker("video/*", (f) => add({ type: "video", label: `Video · ${f.seconds ? fmtSecs(f.seconds) : f.name.slice(0, 14)}`, url: f.url, seconds: f.seconds }), 60);

  const pick = (t: MediaType) => {
    if (t === "photo") { if (photos < MAX_PHOTOS) photo.open(); }
    else if (t === "video") video.open();
    else setSheet(t);
  };

  const create = async () => {
    setBusy(true);
    setFail(null);
    try {
      const draft = await aiService.draftPlanFromIntake(id, inputs);
      await planService.saveDraft(id, draft);
      router.push(`/t/children/${id}/intake/review`);
    } catch (e) {
      setFail(e instanceof Error ? e.message : "The draft could not be created.");
      setBusy(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !child) return <SkeletonList rows={4} />;

  if (busy)
    return (
      <div className="py-16">
        <StepLoader steps={["Reading your notes", "Finding goals", "Choosing activities"]} />
        <p className="mt-4 text-center text-sm text-muted">The AI only picks activities from your library. You review everything next.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title={`Tell us about ${child.nickname}`}
        sub={<span className="flex flex-wrap items-center gap-2">Age {AGE_BANDS[child.ageBand].en} <Chip tone="info" icon={<Sparkles className="size-3.5" />}>AI drafts, you decide</Chip></span>}
      />
      <Card strong className="space-y-5">
        <div>
          <p className="mb-3 text-[15px] text-text-2">Add your first-session notes in any form. You can combine several.</p>
          <MediaPicker
            onPick={pick}
            disabled={photos >= MAX_PHOTOS ? ["photo"] : []}
            labels={{ voice: "Voice · 5 min", photo: `Photo · ${photos}/${MAX_PHOTOS}`, video: "Video · 60 s", text: "Text" }}
          />
          {photo.input}
          {video.input}
          {video.error && <p className="mt-2 text-sm font-semibold text-[#c2410c]">{video.error}</p>}
          <p className="mt-2 text-xs text-muted">
            Video of the child only with written parent consent. For the demo, use team-recorded clips.{" "}
            <button className="font-semibold text-primary underline-offset-2 hover:underline" disabled={photos >= MAX_PHOTOS}
              onClick={() => add({ type: "photo", label: "Photo · session notes", url: "/demo/intake-notes.svg" })}>Use sample notes photo</button>
          </p>
        </div>

        {inputs.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Added notes">
            {inputs.map((i) => (
              <MediaChip key={i.id} type={i.type} label={i.label}
                onPlay={i.type === "voice" && i.url ? () => { if (audio.current) { audio.current.src = i.url!; audio.current.play().catch(() => {}); } } : undefined}
                onRemove={() => setInputs(inputs.filter((x) => x.id !== i.id))} />
            ))}
            <audio ref={audio} hidden />
          </div>
        )}

        <div className="rounded-2xl border border-line">
          <button onClick={() => setMentionOpen(!mentionOpen)} aria-expanded={mentionOpen} className="flex min-h-12 w-full items-center gap-2 px-4 text-left font-semibold">
            <ListChecks className="size-5 text-primary" /><span className="flex-1">What to mention</span>
            <ChevronDown className={cx("size-5 transition", mentionOpen && "rotate-180")} />
          </button>
          {mentionOpen && (
            <ul className="grid gap-1.5 border-t border-line p-4 text-sm sm:grid-cols-2">
              {MENTION.map((m) => <li key={m} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" />{m}</li>)}
            </ul>
          )}
        </div>

        {fail && <ErrorState message={fail} onRetry={create} />}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {inputs.length === 0 && <span className="text-sm text-muted">Add at least one note to continue.</span>}
          <Button size="lg" disabled={inputs.length === 0} onClick={create} icon={<Sparkles className="size-5" />}>Create draft plan</Button>
        </div>
      </Card>

      <BottomSheet open={sheet === "voice"} onClose={() => setSheet(null)} title="Voice note">
        <p className="mb-4 text-sm text-text-2">Speak in Bangla or English, up to 5 minutes.</p>
        <MicButton maxSeconds={300} onDone={(r) => { add({ type: "voice", label: `Voice note · ${fmtSecs(r.seconds)}`, url: r.url, seconds: r.seconds }); setSheet(null); }} />
      </BottomSheet>
      <BottomSheet open={sheet === "text"} onClose={() => setSheet(null)} title="Type or paste notes">
        <textarea autoFocus className={cx(inputCls(), "min-h-48 py-3")} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. He pulls my hand to the fridge instead of asking…" />
        <Button block size="lg" className="mt-3" disabled={!text.trim()} onClick={() => {
          add({ type: "text", label: `Text · ${text.trim().split(/\s+/).length} words`, text: text.trim() });
          setText("");
          setSheet(null);
        }}>Add notes</Button>
      </BottomSheet>
    </div>
  );
}
