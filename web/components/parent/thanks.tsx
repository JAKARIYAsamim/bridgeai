"use client";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { useLoad } from "@/lib/hooks";
import { authService, childService } from "@/lib/services";
import { nameIn } from "@/lib/labels";

/** "Thank you! Dr. Nasrin will see this." with an amber tick. */
export function ThanksCard({ onDone, doneLabel }: { onDone: () => void; doneLabel: string }) {
  const { L, lang } = useLang();
  const { data: therapist } = useLoad(async () => {
    const child = await childService.getMyChild();
    const list = await authService.listUsers("therapist");
    return list.find((u) => u.id === child.therapistId)?.name ?? "Dr. Nasrin";
  }, []);
  const name = nameIn(therapist ?? "Dr. Nasrin", lang);
  return (
    <div className="space-y-5 py-4 text-center">
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-celebrate text-white shadow-[0_14px_34px_-12px_var(--celebrate)] pop">
        <Check className="size-12" strokeWidth={3} />
      </div>
      <p className="text-[22px] font-bold">{L(`ধন্যবাদ! ${name} এটি দেখবেন।`, `Thank you! ${name} will see this.`)}</p>
      <Button block size="lg" onClick={onDone}>{doneLabel}</Button>
    </div>
  );
}
