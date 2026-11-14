"use client";
// T-08 Feedback inbox: parent voice notes, photos, videos and texts with AI summaries.
import { ArrowLeft, Check, Flag, Mic, Reply, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AudioPlayer, fmtSecs, MicButton } from "@/components/media";
import { AIBlock, Button, Card, Chip, cx, EmptyState, ErrorState, FilterChip, inputCls, PageTitle, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { ago, FEEDBACK_FLAGS, MOODS } from "@/lib/labels";
import { childService, feedbackService, libraryService } from "@/lib/services";
import type { Activity, ActivityLog, Feedback, MediaType } from "@/lib/types";

const TYPES: { v: MediaType; label: string }[] = [
  { v: "voice", label: "Voice" }, { v: "photo", label: "Photo" }, { v: "video", label: "Video" }, { v: "text", label: "Text" },
];

export default function FeedbackInbox() {
  const { id } = useParams<{ id: string }>();
  const child = useLoad(() => childService.getChild(id), [id]);
  const fb = useLoad(() => feedbackService.listFeedback(id), [id]);
  const cgs = useLoad(() => childService.getCaregivers(id), [id]);
  const logs = useLoad(() => feedbackService.listLogs(id, 60), [id]);
  const lib = useLoad(() => libraryService.listActivities({ includeDrafts: true }), []);
  const [activity, setActivity] = useState("");
  const [types, setTypes] = useState<MediaType[]>([]);
  const [flagged, setFlagged] = useState(false);
  const [unreviewed, setUnreviewed] = useState(false);

  const list = useMemo(() => (fb.data ?? []).filter((f) =>
    (!activity || f.activityId === activity) &&
    (!types.length || types.includes(f.type)) &&
    (!flagged || f.flags.some((x) => x !== "success")) &&
    (!unreviewed || !f.reviewedAt)), [fb.data, activity, types, flagged, unreviewed]);

  if (fb.loading || child.loading || lib.loading) return <SkeletonList rows={4} h="h-40" />;
  if (fb.error || child.error) return <ErrorState message={fb.error || child.error || ""} onRetry={fb.reload} />;

  const byId = new Map((lib.data ?? []).map((a) => [a.id, a]));
  const names = new Map((cgs.data ?? []).map((c) => [c.userId, `${c.user.name} (${c.relation})`]));
  const activityIds = [...new Set((fb.data ?? []).map((f) => f.activityId).filter(Boolean))] as string[];
  const open = (fb.data ?? []).filter((f) => !f.reviewedAt).length;

  return (
    <div>
      <Link href={`/t/children/${id}`} className="mb-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="size-4" />{child.data!.nickname}</Link>
      <PageTitle title="Feedback inbox" sub={`${(fb.data ?? []).length} items from ${child.data!.nickname}'s family · ${open} not reviewed`} />

      <Card className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Filter by activity" className={cx(inputCls(), "w-auto min-w-56")} value={activity} onChange={(e) => setActivity(e.target.value)}>
            <option value="">All activities</option>
            {activityIds.map((a) => <option key={a} value={a}>{byId.get(a)?.title_en ?? a}</option>)}
          </select>
          {TYPES.map((t) => (
            <FilterChip key={t.v} active={types.includes(t.v)} onClick={() => setTypes(types.includes(t.v) ? types.filter((x) => x !== t.v) : [...types, t.v])}>{t.label}</FilterChip>
          ))}
          <FilterChip active={flagged} onClick={() => setFlagged(!flagged)}>Flagged only</FilterChip>
          <FilterChip active={unreviewed} onClick={() => setUnreviewed(!unreviewed)}>Not reviewed</FilterChip>
        </div>
      </Card>

      {!list.length ? (
        <EmptyState emoji="📭" title={(fb.data ?? []).length ? "Nothing matches these filters." : "No feedback yet. It appears here when the family logs an activity."} />
      ) : (
        <div className="space-y-3">
          {list.map((f) => (
            <FeedbackItem key={f.id} f={f} activity={f.activityId ? byId.get(f.activityId) : undefined}
              who={names.get(f.caregiverId) ?? "Caregiver"} log={(logs.data ?? []).find((l) => l.id === f.logId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackItem({ f, activity, who, log }: { f: Feedback; activity?: Activity; who: string; log?: ActivityLog }) {
  const toast = useToast();
  const [replying, setReplying] = useState(false);
  const [voice, setVoice] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const safety = f.flags.includes("safety_concern");

  const send = async (msg: string) => {
    setBusy(true);
    await feedbackService.reply(f.id, msg);
    setBusy(false);
    setReplying(false);
    setVoice(false);
    setText("");
    toast("Reply sent to the family");
  };

  return (
    <Card className={cx(safety && "ring-2 ring-alert/50")}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="text-3xl" aria-label={log ? MOODS[log.mood].en : undefined}>{log ? MOODS[log.mood].emoji : "💬"}</div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{activity?.title_en ?? "General note"}</div>
          <div className="text-sm text-muted">{who} · {ago(f.createdAt)} · {f.type}</div>
        </div>
        <div className="flex flex-wrap gap-1">
          {f.flags.map((fl) => <Chip key={fl} tone={FEEDBACK_FLAGS[fl]?.tone ?? "muted"} icon={fl === "safety_concern" ? <Flag className="size-3" /> : undefined}>{FEEDBACK_FLAGS[fl]?.en ?? fl}</Chip>)}
          {f.reviewedAt ? <Chip tone="success" icon={<Check className="size-3" />}>Reviewed</Chip> : <Chip tone="primary">New</Chip>}
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {f.type === "voice" && <AudioPlayer src={f.mediaUrl} label="Original voice note" />}
        {f.type === "photo" && f.mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.mediaUrl} alt={f.text ?? "Photo from the family"} className="max-h-64 rounded-xl border border-line" />
        )}
        {f.type === "video" && f.mediaUrl && <video src={f.mediaUrl} controls className="max-h-72 rounded-xl" />}
        {f.text && <blockquote className="border-l-4 border-primary/40 pl-3 text-[15px]">“{f.text}”</blockquote>}
        {(f.transcript || f.summary_en) && (
          <AIBlock label="AI transcript and summary">
            {f.transcript && <p className="bn mb-1.5 text-[15px]">{f.transcript}</p>}
            {f.summary_en && <p className="text-text-2">{f.summary_en}</p>}
          </AIBlock>
        )}
        {f.therapistReply && (
          <div className="rounded-xl bg-primary-soft p-3 text-sm">
            <div className="mb-0.5 text-xs font-bold text-primary">Your reply · {f.repliedAt ? ago(f.repliedAt) : ""}</div>{f.therapistReply}
          </div>
        )}
      </div>

      {replying ? (
        <div className="mt-3 space-y-2">
          {voice ? (
            <div className="rounded-xl border border-line p-4">
              <MicButton size="md" maxSeconds={60} onDone={(r) => send(`🎤 Voice reply (${fmtSecs(r.seconds)})`)} labels={{ idle: "Tap to record a voice reply", recording: "Tap to stop and send" }} />
            </div>
          ) : (
            <textarea autoFocus className={cx(inputCls(), "min-h-24 py-3")} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a short, encouraging reply…" />
          )}
          <div className="flex flex-wrap gap-2">
            {!voice && <Button size="sm" icon={<Send className="size-4" />} disabled={!text.trim()} loading={busy} onClick={() => send(text.trim())}>Send reply</Button>}
            <Button size="sm" variant="ghost" icon={<Mic className="size-4" />} onClick={() => setVoice(!voice)}>{voice ? "Type instead" : "Voice reply"}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setReplying(false); setVoice(false); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="soft" icon={<Reply className="size-4" />} onClick={() => setReplying(true)}>{f.therapistReply ? "Reply again" : "Reply"}</Button>
          {!f.reviewedAt && <Button size="sm" variant="ghost" icon={<Check className="size-4" />} onClick={async () => { await feedbackService.markReviewed(f.id); toast("Marked reviewed"); }}>Mark reviewed</Button>}
        </div>
      )}
    </Card>
  );
}
