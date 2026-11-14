"use client";
// P-03 Activity detail
import { useParams } from "next/navigation";
import { ActivityDetailView } from "@/components/activity-view";
import { Icon } from "@/components/legacy/icons";
import { ParentTopBar } from "@/components/parent/common";
import { Button, ErrorState, Skeleton } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn } from "@/lib/labels";
import { authService, childService, feedbackService, libraryService, planService } from "@/lib/services";

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang, L } = useLang();
  const { data, loading, error, reload } = useLoad(async () => {
    const [activity, child, today, replies, therapists] = await Promise.all([
      libraryService.getActivity(id),
      childService.getMyChild(),
      planService.getToday(),
      feedbackService.myReplies(),
      authService.listUsers("therapist"),
    ]);
    const therapist = therapists.find((u) => u.id === child.therapistId)?.name ?? "Dr. Nasrin";
    const reply = replies.find((f) => f.activityId === id);
    return {
      activity,
      child,
      inPlan: today.some((t) => t.activity.id === id),
      reply: reply ? { text: reply.therapistReply!, from: nameIn(therapist, lang) } : null,
    };
  }, [id, lang]);

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 96 }}>
      <ParentTopBar back="/p/today" />
      <div className="in">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading || !data ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton className="h-44 card" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 card" />
            <Skeleton className="h-24 card" />
          </div>
        ) : (
          <>
            <ActivityDetailView
              activity={data.activity}
              lang={lang}
              childName={nameIn(data.child.nickname, lang)}
              reply={data.reply}
            />
            <div style={{ marginTop: 16 }}>
              <Button
                href={`/p/activity/${id}/steps`}
                size="lg"
                block
                variant="primary"
                icon={<Icon name="play" />}
              >
                {L("শুরু করুন", "Start")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
