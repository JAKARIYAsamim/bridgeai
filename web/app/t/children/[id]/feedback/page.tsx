"use client";
// T-08 Feedback inbox: parent notes, photos, videos and texts (matches prototype notesTab)
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { AudioPlayer, MicButton } from "@/components/media";
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
import { useLang } from "@/lib/i18n";
import { ago, FEEDBACK_FLAGS, MOODS, nameIn, num } from "@/lib/labels";
import { childService, feedbackService, libraryService } from "@/lib/services";
import { uploadMedia, useMediaUrl } from "@/lib/supabase/media";
import type { Activity, ActivityLog, Feedback, MediaType } from "@/lib/types";

export default function FeedbackInbox() {
  const { id } = useParams<{ id: string }>();
  const { lang, L } = useLang();
  const child = useLoad(() => childService.getChild(id), [id]);
  const fb = useLoad(() => feedbackService.listFeedback(id), [id]);
  const cgs = useLoad(() => childService.getCaregivers(id), [id]);
  const logs = useLoad(() => feedbackService.listLogs(id, 60), [id]);
  const lib = useLoad(() => libraryService.listActivities({ includeDrafts: true }), []);
  const [activity, setActivity] = useState("");
  const [types, setTypes] = useState<MediaType[]>([]);
  const [flagged, setFlagged] = useState(false);
  const [unreviewed, setUnreviewed] = useState(false);

  const typesList: { v: MediaType; label: string }[] = [
    { v: "voice", label: L("ভয়েস", "Voice") },
    { v: "photo", label: L("ছবি", "Photo") },
    { v: "video", label: L("ভিডিও", "Video") },
    { v: "text", label: L("লেখা", "Text") },
  ];

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
  const names = new Map((cgs.data ?? []).map((c) => [c.userId, `${nameIn(c.user.name, lang)}`]));
  const activityIds = [...new Set((fb.data ?? []).map((f) => f.activityId).filter(Boolean))] as string[];
  const open = (fb.data ?? []).filter((f) => !f.reviewedAt).length;
  const cName = nameIn(child.data!.nickname, lang);

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 88 }} lang={lang}>
      <div className="bar" style={{ padding: "4px 8px 10px" }}>
        <Link href={`/t/children/${id}`} className="hbtn" aria-label={L("ফিরে যান", "Back")}>
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            {L(`${cName}-এর নোট`, `${child.data!.nickname}’s notes`)}
          </h1>
          <p className="small">
            {L(`${num((fb.data ?? []).length, lang)}টি নোট · ${num(open, lang)}টি বাকি`, `${(fb.data ?? []).length} items · ${open} not reviewed`)}
          </p>
        </div>
      </div>

      <div className="in">
        {/* Filters */}
        <Card style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <select
              aria-label={L("অনুশীলন বেছে নিন", "Filter by activity")}
              className="field"
              style={{ width: "auto", minWidth: 150, padding: 6, fontSize: 13 }}
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            >
              <option value="">{L("সকল অনুশীলন", "All activities")}</option>
              {activityIds.map((a) => (
                <option key={a} value={a}>
                  {byId.get(a) ? (lang === "bn" ? byId.get(a)!.title_bn : byId.get(a)!.title_en) : a}
                </option>
              ))}
            </select>
            {typesList.map((t) => (
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
              {L("সতর্কতামূলক", "Flagged")}
            </FilterChip>
            <FilterChip active={unreviewed} onClick={() => setUnreviewed(!unreviewed)}>
              {L("অপর্যালোচিত", "Unreviewed")}
            </FilterChip>
          </div>
        </Card>

        {!list.length ? (
          <EmptyState
            title={
              (fb.data ?? []).length
                ? L("এই ফিল্টারে কোনো নোট মেলেনি।", "Nothing matches these filters.")
                : L("এখনো কোনো নোট আসেনি। অভিভাবক অ্যাক্টিভিটি করলে এখানে দেখাবে।", "No notes yet. They appear here when caregiver notes an activity.")
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((f) => (
              <FeedbackCard
                key={f.id}
                f={f}
                activity={f.activityId ? byId.get(f.activityId) : undefined}
                who={names.get(f.caregiverId) ?? L("অভিভাবক", "Caregiver")}
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
  const { lang, L } = useLang();
  const [replying, setReplying] = useState(false);
  const [voice, setVoice] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const safety = f.flags.includes("safety_concern");
  const mediaUrl = useMediaUrl(f.mediaUrl);

  const send = async (msg?: string, replyMediaUrl?: string) => {
    setBusy(true);
    await feedbackService.reply(f.id, msg, replyMediaUrl);
    setBusy(false);
    setReplying(false);
    setVoice(false);
    setText("");
    toast(L("উত্তর পাঠানো হয়েছে", "Reply sent to family"));
  };

  const sendVoice = async (blob: Blob) => {
    setBusy(true);
    const path = await uploadMedia(f.childId, "voice", blob, "webm");
    await send(undefined, path);
  };

  const actTitle = activity ? (lang === "bn" ? activity.title_bn : activity.title_en) : L("সাধারণ নোট", "General note");

  return (
    <Card style={{ padding: 14, borderColor: safety ? "var(--pink)" : undefined }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>{log ? MOODS[log.mood].emoji : "💬"}</span>
        <div className="grow" style={{ minWidth: 0 }}>
          <p className="h3" style={{ fontSize: 15, margin: 0 }}>
            {actTitle}
          </p>
          <p className="small" style={{ margin: "2px 0 0" }}>
            {who} · {ago(f.createdAt, lang)}
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {f.flags.map((fl) => (
            <Chip key={fl} tone={FEEDBACK_FLAGS[fl]?.tone ?? "muted"}>
              {FEEDBACK_FLAGS[fl] ? (lang === "bn" ? FEEDBACK_FLAGS[fl].bn : FEEDBACK_FLAGS[fl].en) : fl}
            </Chip>
          ))}
          {f.reviewedAt ? <span className="pill good">{L("পর্যালোচিত", "Reviewed")}</span> : <span className="pill dark">{L("নতুন", "New")}</span>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {f.type === "voice" && <AudioPlayer src={f.mediaUrl} label={L("মূল ভয়েস নোট", "Original voice note")} />}
        {f.type === "photo" && mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt={f.text ?? "Photo from family"}
            style={{ maxHeight: 200, width: "100%", objectFit: "cover", borderRadius: 12 }}
          />
        )}
        {f.type === "video" && mediaUrl && (
          <video src={mediaUrl} controls style={{ maxHeight: 200, width: "100%", borderRadius: 12 }} />
        )}
        {f.text && (
          <blockquote style={{ borderLeft: "3px solid var(--p)", paddingLeft: 10, margin: 0, fontStyle: "italic" }}>
            &ldquo;{f.text}&rdquo;
          </blockquote>
        )}
        {(f.transcript || f.summary_en || f.summary_bn) && (
          <AIBlock label={L("AI প্রতিলিপি ও সারাংশ", "AI transcript and summary")}>
            {f.transcript && <p className="bn sub" style={{ marginBottom: 4 }}>{f.transcript}</p>}
            {(lang === "bn" ? f.summary_bn || f.summary_en : f.summary_en || f.summary_bn) && (
              <p className="small">{lang === "bn" ? f.summary_bn || f.summary_en : f.summary_en || f.summary_bn}</p>
            )}
          </AIBlock>
        )}
        {(f.therapistReply || f.therapistReplyMediaUrl) && (
          <div className="note2" style={{ padding: "8px 12px" }}>
            <p className="small" style={{ fontWeight: 600, color: "var(--p)" }}>
              {L("আপনার উত্তর", "Your reply")} · {f.repliedAt ? ago(f.repliedAt, lang) : ""}
            </p>
            {f.therapistReply && <p className="sub" style={{ fontSize: 14 }}>{f.therapistReply}</p>}
            {f.therapistReplyMediaUrl && <AudioPlayer src={f.therapistReplyMediaUrl} label={L("ভয়েস উত্তর", "Voice reply")} />}
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
                onDone={(r) => r.blob && sendVoice(r.blob)}
                labels={{ idle: L("রেকর্ড করতে চাপুন", "Tap to record reply"), recording: L("শেষ হলে চাপুন", "Tap to stop and send") }}
              />
            </div>
          ) : (
            <textarea
              autoFocus
              className="field"
              style={{ minHeight: 80, width: "100%", padding: 10, fontSize: 14 }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={L("উৎসাহজনক একটি বার্তা লিখুন…", "Write an encouraging reply…")}
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
                {L("উত্তর পাঠান", "Send reply")}
              </Button>
            )}
            <Button size="sm" variant="soft" icon={<Icon name="mic" />} onClick={() => setVoice(!voice)}>
              {voice ? L("লিখে দিন", "Type instead") : L("ভয়েস উত্তর", "Voice reply")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setReplying(false);
                setVoice(false);
              }}
            >
              {L("বাতিল", "Cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <Button size="sm" variant="soft" icon={<Icon name="talk" />} onClick={() => setReplying(true)}>
            {f.therapistReply ? L("আবার উত্তর দিন", "Reply again") : L("উত্তর দিন", "Reply")}
          </Button>
          {!f.reviewedAt && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Icon name="check" />}
              onClick={async () => {
                await feedbackService.markReviewed(f.id);
                toast(L("পর্যালোচিত চিহ্নিত হয়েছে", "Marked reviewed"));
              }}
            >
              {L("পর্যালোচিত চিহ্নিত করুন", "Mark reviewed")}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
