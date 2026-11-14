"use client";
// "Thank you! Dr. Nasrin will see this." with Bagh the tiger cub and legacy buttons.
import { Icon } from "@/components/legacy/icons";
import { Tiger } from "@/components/legacy/mascots";
import { Button } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { nameIn } from "@/lib/labels";
import { authService, childService } from "@/lib/services";

export function ThanksCard({ onDone, doneLabel }: { onDone: () => void; doneLabel: string }) {
  const { L, lang } = useLang();
  const { data: therapist } = useLoad(async () => {
    const child = await childService.getMyChild();
    const list = await authService.listUsers("therapist");
    return list.find((u) => u.id === child.therapistId)?.name ?? "Dr. Nasrin";
  }, []);
  const name = nameIn(therapist ?? "Dr. Nasrin", lang);

  return (
    <div style={{ textAlign: "center", padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ width: 96 }}>
        <Tiger mood="proud" />
      </div>
      <div
        className="tick on"
        style={{ width: 44, height: 44, fontSize: 24, margin: "0 auto" }}
      >
        <Icon name="check" strokeWidth={3} />
      </div>
      <h2 className="h2" style={{ padding: "0 10px" }}>
        {L(`ধন্যবাদ! ${name} এটি দেখবেন।`, `Thank you! ${name} will see this.`)}
      </h2>
      <Button block size="md" onClick={onDone} style={{ marginTop: 8 }}>
        {doneLabel}
      </Button>
    </div>
  );
}
