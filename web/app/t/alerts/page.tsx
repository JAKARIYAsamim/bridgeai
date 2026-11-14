"use client";
// T-10 Safety alerts across all children.
import { CheckCircle2, Phone, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, Card, Chip, EmptyState, ErrorState, Field, inputCls, Modal, PageTitle, SectionTitle, SkeletonList, cx, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { ago, fmtDate, fmtTime } from "@/lib/labels";
import { alertService, childService } from "@/lib/services";
import type { Alert, Child } from "@/lib/types";

const SOURCE: Record<Alert["source"], string> = { feedback: "Activity feedback", checkin: "Daily check-in", voice_note: "Voice note" };

function Highlight({ text, word }: { text: string; word: string }) {
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="rounded bg-alert-soft px-0.5 font-bold text-alert">{text.slice(i, i + word.length)}</mark>{text.slice(i + word.length)}</>;
}

export default function AlertsPage() {
  const alerts = useLoad(() => alertService.listAlerts(), []);
  const children = useLoad(() => childService.listChildren(), []);
  const [resolving, setResolving] = useState<Alert | null>(null);

  if (alerts.loading || children.loading) return <SkeletonList rows={3} h="h-32" />;
  if (alerts.error) return <ErrorState message={alerts.error} onRetry={alerts.reload} />;

  const kids = new Map((children.data ?? []).map((c) => [c.id, c]));
  const open = (alerts.data ?? []).filter((a) => !a.resolvedAt);
  const done = (alerts.data ?? []).filter((a) => a.resolvedAt);

  return (
    <div>
      <PageTitle title="Safety alerts" sub="Raised by a keyword check in code whenever a family mentions injury, seizures, self-harm or distress. No AI involved." />
      {!open.length && <EmptyState emoji="🌤️" title="No alerts. All quiet." />}
      <div className="space-y-3">
        {open.map((a) => <AlertCard key={a.id} a={a} child={kids.get(a.childId)} onResolve={() => setResolving(a)} />)}
      </div>

      {done.length > 0 && (
        <>
          <SectionTitle>Resolved</SectionTitle>
          <div className="space-y-3">
            {done.map((a) => (
              <Card key={a.id} className="opacity-90">
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="size-5 text-success" />
                  <span className="font-semibold">{kids.get(a.childId)?.nickname ?? a.childId}</span>
                  <span className="text-sm text-muted">{SOURCE[a.source]} · {fmtDate(a.createdAt)} {fmtTime(a.createdAt)}</span>
                </div>
                <p className="mt-2 text-[15px] text-text-2">“{a.matchedText}”</p>
                <p className="mt-2 rounded-xl bg-success-soft p-3 text-sm"><span className="font-semibold">Resolved {ago(a.resolvedAt!)}:</span> {a.resolutionNote}</p>
              </Card>
            ))}
          </div>
        </>
      )}
      {resolving && <ResolveModal alert={resolving} onClose={() => setResolving(null)} />}
    </div>
  );
}

function AlertCard({ a, child, onResolve }: { a: Alert; child?: Child; onResolve: () => void }) {
  const cgs = useLoad(() => (child ? childService.getCaregivers(child.id) : Promise.resolve([])), [child?.id]);
  const phone = cgs.data?.find((c) => c.user.phone)?.user.phone ?? child?.caregiverPhone;
  return (
    <div role="alert" className={cx("rounded-[12px] border-2 border-alert/40 bg-alert-soft p-4 rise")}>
      <div className="flex flex-wrap items-center gap-2">
        <ShieldAlert className="size-6 text-alert" />
        <Link href={child ? `/t/children/${child.id}` : "#"} className="text-lg font-bold hover:underline">{child?.nickname ?? a.childId}</Link>
        <Chip tone="alert">{SOURCE[a.source]}</Chip>
        <span className="ml-auto text-sm text-text-2">{ago(a.createdAt)} · {fmtTime(a.createdAt)}</span>
      </div>
      <p className="mt-3 text-[17px] leading-relaxed">“<Highlight text={a.matchedText} word={a.keyword} />”</p>
      <p className="mt-1 text-xs text-text-2">Matched keyword: <b>{a.keyword}</b> · The parent was shown the emergency guidance.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="danger" href={phone ? `tel:${phone}` : undefined} disabled={!phone} icon={<Phone className="size-5" />}>Call parent</Button>
        <Button variant="soft" onClick={onResolve} icon={<CheckCircle2 className="size-5" />}>Mark resolved</Button>
      </div>
    </div>
  );
}

function ResolveModal({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal open onClose={onClose} title="Mark resolved">
      <p className="mb-3 text-sm text-text-2">“{alert.matchedText}”</p>
      <Field label="What happened and what you did" error={null}>
        <textarea autoFocus className={cx(inputCls(), "min-h-28 py-3")} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called Ayesha. No injury. Agreed to watch at bedtime." />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={!note.trim()} loading={busy} onClick={async () => { setBusy(true); await alertService.resolveAlert(alert.id, note.trim()); toast("Alert resolved"); onClose(); }}>Resolve</Button>
      </div>
    </Modal>
  );
}
