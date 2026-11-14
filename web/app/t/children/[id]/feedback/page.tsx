"use client";
// T-08 Feedback inbox: parent notes, photos, videos and texts (matches prototype notesTab)
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { AudioPlayer, fmtSecs, MicButton } from "@/components/media";
import {
  AIBlock,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  FilterChip,
  SkeletonList,
  useToast,
} from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { ago, FEEDBACK_FLAGS, MOODS } from "@/lib/labels";
import { childService, feedbackService, libraryService } from "@/lib/services";
import type { Activity, ActivityLog, Feedback, MediaType } from "@/lib/types";

const TYPES: { v: MediaType; label: string }[] = [
  { v: "voice", label: "Voice" },
  { v: "photo", label: "Photo" },
  { v: "video", label: "Video" },
  { v: "text", label: "Text" },
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

  const list = useMemo(
    () =>
      (fb.data ?? []).filter(
        (f) =>
          (!activity || f.activityId === activity) &&
          (!types.length || types.includes(f.type)) &&
          (!flagged || f.flags.some((x) => x !== "success")) &&
          (!unreviewed || !f.reviewedAt)
      ),
    [fb.data, activity, types, flagged, unreviewed]
  );

  if (fb.loading || child.loading || lib.loading) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <SkeletonList rows={4} h="h-40" />
      </div>
    );
  }
  if (fb.error || child.error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={fb.error || child.error || ""} onRetry={fb.reload} />
      </div>
    );
  }

  const byId = new Map((lib.data ?? []).map((a) => [a.id, a]));
  const names = new Map((cgs.data ?? []).map((c) => [c.userId, `${c.user.name} (${c.relation})`]));
  const activityIds = [...new Set((fb.data ?? []).map((f) => f.activityId).filter(Boolean))] as string[];
  const open = (fb.data ?? []).filter((f) => !f.reviewedAt).length;

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 88 }}>
      <div className="bar" style={{ padding: "4px 8px 10px" }}>
        <Link href={`/t/children/${id}`} className="hbtn" aria-label="Back">
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            {child.data!.nickname}’s notes
          </h1>
          <p className="small">
            {(fb.data ?? []).length} items · {open} not reviewed
          </p>
        </div>
      </div>

      <div className="in">
        {/* Filters */}
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <select
              aria-label="Filter by activity"
              className="field"
              style={{ width: "auto", minWidth: 150, padding: 6, fontSize: 13 }}
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            >
              <option value="">All activities</option>
              {activityIds.map((a) => (
                <option key={a} value={a}>
                  {byId.get(a)?.title_en ?? a}
                </option>
              ))}
            </select>
            {TYPES.map((t) => (
              <FilterChip
                key={t.v}
                active={types.includes(t.v)}
                onClick={() =>
                  setTypes(types.includes(t.v) ? types.filter((x) => x !== t.v) : [...types, t.v])
                }
              >
                {t.label}
              </FilterChip>
            ))}
            <FilterChip active={flagged} onClick={() => setFlagged(!flagged)}>
              Flagged
            </FilterChip>
            <FilterChip active={unreviewed} onClick={() => setUnreviewed(!unreviewed)}>
              Unreviewed
            </FilterChip>
          </div>
        </Card>

        {!list.length ? (
          <EmptyState
            title={
              (fb.data ?? []).length
                ? "Nothing matches these filters."
                : "No notes yet. They appear here when caregiver notes an activity."
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((f) => (
              <FeedbackCard
                key={f.id}
                f={f}
                activity={f.activityId ? byId.get(f.activityId) : undefined}
                who={names.get(f.caregiverId) ?? "Caregiver"}
                log={(logs.data ?? []).find((l) => l.id === f.logId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackCard({
  f,
  activity,
  who,
  log,
}: {
  f: Feedback;
  activity?: Activity;
  who: string;
  log?: ActivityLog;
}) {
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
    toast("Reply sent to family");
  };

  return (
    <Card style={{ padding: 14, borderColor: safety ? "var(--pink)" : undefined }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>{log ? MOODS[log.mood].emoji : "💬"}</span>
        <div className="grow" style={{ minWidth: 0 }}>
          <p className="h3" style={{ fontSize: 15, margin: 0 }}>
            {activity?.title_en ?? "General note"}
          </p>
          <p className="small" style={{ margin: "2px 0 0" }}>
            {who} · {ago(f.createdAt)} · {f.type}
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {f.flags.map((fl) => (
            <Chip key={fl} tone={FEEDBACK_FLAGS[fl]?.tone ?? "muted"}>
              {FEEDBACK_FLAGS[fl]?.en ?? fl}
            </Chip>
          ))}
          {f.reviewedAt ? <span className="pill good">Reviewed</span> : <span className="pill dark">New</span>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {f.type === "voice" && <AudioPlayer src={f.mediaUrl} label="Original voice note" />}
        {f.type === "photo" && f.mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={f.mediaUrl}
            alt={f.text ?? "Photo from family"}
            style={{ maxHeight: 200, width: "100%", objectFit: "cover", borderRadius: 12 }}
          />
        )}
        {f.type === "video" && f.mediaUrl && (
          <video src={f.mediaUrl} controls style={{ maxHeight: 200, width: "100%", borderRadius: 12 }} />
        )}
        {f.text && (
          <blockquote style={{ borderLeft: "3px solid var(--p)", paddingLeft: 10, margin: 0, fontStyle: "italic" }}>
            &ldquo;{f.text}&rdquo;
          </blockquote>
        )}
        {(f.transcript || f.summary_en) && (
          <AIBlock label="AI transcript and summary">
            {f.transcript && <p className="bn sub" style={{ marginBottom: 4 }}>{f.transcript}</p>}
            {f.summary_en && <p className="small">{f.summary_en}</p>}
          </AIBlock>
        )}
        {f.therapistReply && (
          <div className="note2" style={{ padding: "8px 12px" }}>
            <p className="small" style={{ fontWeight: 600, color: "var(--p)" }}>
              Your reply · {f.repliedAt ? ago(f.repliedAt) : ""}
            </p>
            <p className="sub" style={{ fontSize: 14 }}>{f.therapistReply}</p>
          </div>
        )}
      </div>

      {replying ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {voice ? (
            <div style={{ padding: 12 }}>
              <MicButton
                size="md"
                maxSeconds={60}
                onDone={(r) => send(`🎤 Voice reply (${fmtSecs(r.seconds)})`)}
                labels={{ idle: "Tap to record reply", recording: "Tap to stop and send" }}
              />
            </div>
          ) : (
            <textarea
              autoFocus
              className="field"
              style={{ minHeight: 80, width: "100%", padding: 10, fontSize: 14 }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write an encouraging reply…"
            />
          )}
          <div style={{ display: "flex", gap: 6 }}>
            {!voice && (
              <Button
                size="sm"
                variant="primary"
                icon={<Icon name="send" />}
                disabled={!text.trim()}
                loading={busy}
                onClick={() => send(text.trim())}
              >
                Send reply
              </Button>
            )}
            <Button size="sm" variant="soft" icon={<Icon name="mic" />} onClick={() => setVoice(!voice)}>
              {voice ? "Type instead" : "Voice reply"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setReplying(false);
                setVoice(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <Button size="sm" variant="soft" icon={<Icon name="talk" />} onClick={() => setReplying(true)}>
            {f.therapistReply ? "Reply again" : "Reply"}
          </Button>
          {!f.reviewedAt && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Icon name="check" />}
              onClick={async () => {
                await feedbackService.markReviewed(f.id);
                toast("Marked reviewed");
              }}
            >
              Mark reviewed
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
