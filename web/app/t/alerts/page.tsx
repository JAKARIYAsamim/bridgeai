"use client";
// T-10 Safety alerts across all children — matches prototype doctorAlerts()
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Button, Card, EmptyState, ErrorState, Field, Modal, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { ago, fmtDate, fmtTime } from "@/lib/labels";
import { alertService, childService } from "@/lib/services";
import type { Alert, Child } from "@/lib/types";

const SOURCE: Record<Alert["source"], string> = {
  feedback: "Activity feedback",
  checkin: "Daily check-in",
  voice_note: "Voice note",
};

function Highlight({ text, word }: { text: string; word: string }) {
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: "rgba(255, 69, 58, 0.2)", color: "var(--pink)", padding: "0 4px", borderRadius: 4, fontWeight: 700 }}>
        {text.slice(i, i + word.length)}
      </mark>
      {text.slice(i + word.length)}
    </>
  );
}

export default function AlertsPage() {
  const alerts = useLoad(() => alertService.listAlerts(), []);
  const children = useLoad(() => childService.listChildren(), []);
  const [resolving, setResolving] = useState<Alert | null>(null);

  if (alerts.loading || children.loading) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <SkeletonList rows={3} h="h-32" />
      </div>
    );
  }
  if (alerts.error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={alerts.error} onRetry={alerts.reload} />
      </div>
    );
  }

  const kids = new Map((children.data ?? []).map((c) => [c.id, c]));
  const open = (alerts.data ?? []).filter((a) => !a.resolvedAt);
  const done = (alerts.data ?? []).filter((a) => a.resolvedAt);

  return (
    <div className="pad" style={{ paddingBottom: 88 }}>
      <div className="bar" style={{ padding: "4px 8px 12px" }}>
        <h1 className="h2 grow">Alerts</h1>
        {open.length > 0 && <span className="pill bad">{open.length} urgent</span>}
      </div>

      <div className="in">
        {!open.length && <EmptyState title="No alerts. All quiet." />}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {open.map((a) => (
            <AlertItem
              key={a.id}
              a={a}
              child={kids.get(a.childId)}
              onResolve={() => setResolving(a)}
            />
          ))}
        </div>

        {done.length > 0 && (
          <>
            <div className="sec" style={{ marginTop: 24 }}>
              <h2 className="h2">Resolved alerts</h2>
              <span className="small">{done.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {done.map((a) => (
                <Card key={a.id} style={{ opacity: 0.9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className="pill good">Resolved</span>
                    <span className="h3" style={{ fontWeight: 600 }}>
                      {kids.get(a.childId)?.nickname ?? a.childId}
                    </span>
                    <span className="small">
                      {SOURCE[a.source]} · {fmtDate(a.createdAt)}
                    </span>
                  </div>
                  <p className="sub" style={{ fontSize: 14, color: "var(--ink)", marginBottom: 8 }}>
                    &ldquo;{a.matchedText}&rdquo;
                  </p>
                  <div className="note2" style={{ padding: "8px 12px", background: "rgba(52, 199, 89, 0.08)" }}>
                    <p className="small">
                      <b>Resolved {ago(a.resolvedAt!)}:</b> {a.resolutionNote}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {resolving && <ResolveModal alert={resolving} onClose={() => setResolving(null)} />}
      </div>
    </div>
  );
}

function AlertItem({
  a,
  child,
  onResolve,
}: {
  a: Alert;
  child?: Child;
  onResolve: () => void;
}) {
  const cgs = useLoad(
    () => (child ? childService.getCaregivers(child.id) : Promise.resolve([])),
    [child?.id]
  );
  const phone = cgs.data?.find((c) => c.user.phone)?.user.phone ?? child?.caregiverPhone;

  return (
    <div className="alertcard" role="alert">
      <div className="cardtop">
        <span className="pill bad">Urgent Safety Alert</span>
        <span className="small">
          {ago(a.createdAt)} · {fmtTime(a.createdAt)}
        </span>
      </div>

      <p className="h3" style={{ fontSize: 18, marginTop: 4 }}>
        {child ? (
          <Link href={`/t/children/${child.id}`} style={{ color: "inherit", textDecoration: "none" }}>
            {child.nickname}
          </Link>
        ) : (
          a.childId
        )}
        : &ldquo;
        <Highlight text={a.matchedText} word={a.keyword} />
        &rdquo;
      </p>

      <p className="sub" style={{ fontSize: 13, marginTop: 6, color: "var(--ink)" }}>
        Matched trigger: <b>{a.keyword}</b> · Parent was immediately shown 999 &amp; clinic emergency options.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        <Button
          variant="danger"
          size="lg"
          href={phone ? `tel:${phone}` : undefined}
          disabled={!phone}
          icon={<Icon name="phone" />}
        >
          Call caregiver {phone ? `(${phone})` : ""}
        </Button>
        <Button variant="soft" onClick={onResolve} icon={<Icon name="check" />}>
          Mark resolved
        </Button>
      </div>
    </div>
  );
}

function ResolveModal({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Modal open onClose={onClose} title="Mark alert resolved">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="small">&ldquo;{alert.matchedText}&rdquo;</p>
        <Field label="What happened and what you did">
          <textarea
            autoFocus
            className="field"
            style={{ minHeight: 110, width: "100%", padding: 12, fontSize: 15 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Called Ayesha. No injury. Agreed to watch at bedtime."
          />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!note.trim()}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await alertService.resolveAlert(alert.id, note.trim());
              toast("Alert resolved");
              onClose();
            }}
          >
            Resolve
          </Button>
        </div>
      </div>
    </Modal>
  );
}
