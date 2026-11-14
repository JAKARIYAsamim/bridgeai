"use client";
// P-03 Activity detail
import { Play } from "lucide-react";
import { useParams } from "next/navigation";
import { ActivityDetailView } from "@/components/activity-view";
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
      libraryService.getActivity(id), childService.getMyChild(), planService.getToday(), feedbackService.myReplies(), authService.listUsers("therapist"),
    ]);
    const therapist = therapists.find((u) => u.id === child.therapistId)?.name ?? "Dr. Nasrin";
    const reply = replies.find((f) => f.activityId === id);
    return { activity, child, inPlan: today.some((t) => t.activity.id === id), reply: reply ? { text: reply.therapistReply!, from: nameIn(therapist, lang) } : null };
  }, [id, lang]);

  return (
    <div className="pb-24">
      <ParentTopBar back="/p/today" />
      <div className="px-4">
        {error ? <ErrorState message={error} onRetry={reload} /> : loading || !data ? (
          <div className="space-y-3"><Skeleton className="h-44" /><Skeleton className="h-10 w-2/3" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        ) : (
          <ActivityDetailView activity={data.activity} lang={lang} childName={nameIn(data.child.nickname, lang)} reply={data.reply} />
        )}
      </div>
      {data && (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-[480px] px-4 pb-2">
          <Button href={`/p/activity/${id}/steps`} size="lg" block icon={<Play className="size-5" fill="currentColor" />}>{L("শুরু করুন", "Start")}</Button>
        </div>
      )}
    </div>
  );
}
