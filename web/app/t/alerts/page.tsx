"use client";
// T-10 Safety alerts across all children — matches prototype doctorAlerts()
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Button, Card, EmptyState, ErrorState, Field, Modal, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { ago, fmtDate, fmtTime, nameIn, num } from "@/lib/labels";
import { alertService, childService } from "@/lib/services";
import type { Alert, Child } from "@/lib/types";

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
  const { lang, L } = useLang();
  const alerts = useLoad(() => alertService.listAlerts(), []);
  const children = useLoad(() => childService.listChildren(), []);
  const [resolving, setResolving] = useState<Alert | null>(null);

  const sourceName = (src: Alert["source"]) => {
    if (src === "feedback") return L("অ্যাক্টিভিটি ফিডব্যাক", "Activity feedback");
    if (src === "checkin") return L("দৈনিক চেক-ইন", "Daily check-in");
    return L("ভয়েস নোট", "Voice note");
  };

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
    <div className="pad" style={{ paddingBottom: 88 }} lang={lang}>
      <div className="bar" style={{ padding: "4px 8px 12px" }}>
        <h1 className="h2 grow">{L("সতর্কতা", "Alerts")}</h1>
        {open.length > 0 && (
          <span className="pill bad">
            {L(`${num(open.length, lang)}টি জরুরি`, `${open.length} urgent`)}
          </span>
        )}
      </div>

      <div className="in">
        {!open.length && <EmptyState title={L("কোনো সতর্কতা নেই। সবকিছু শান্ত।", "No alerts. All quiet.")} />}

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
              <h2 className="h2">{L("সমাধান হওয়া সতর্কতা", "Resolved alerts")}</h2>
              <span className="small">{num(done.length, lang)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {done.map((a) => {
                const child = kids.get(a.childId);
                const cName = child ? nameIn(child.nickname, lang) : a.childId;
                return (
                  <Card key={a.id} style={{ opacity: 0.9 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className="pill good">{L("সমাধান হয়েছে", "Resolved")}</span>
                      <span className="h3" style={{ fontWeight: 600 }}>
                        {cName}
                      </span>
                      <span className="small">
                        {sourceName(a.source)} · {fmtDate(a.createdAt, lang)}
                      </span>
                    </div>
                    <p className="sub" style={{ fontSize: 14, color: "var(--ink)", marginBottom: 8 }}>
                      &ldquo;{a.matchedText}&rdquo;
                    </p>
                    <div className="note2" style={{ padding: "8px 12px", background: "rgba(52, 199, 89, 0.08)" }}>
                      <p className="small">
                        <b>{L(`সমাধান (${ago(a.resolvedAt!, lang)}): `, `Resolved ${ago(a.resolvedAt!, lang)}: `)}</b>
                        {a.resolutionNote}
                      </p>
                    </div>
                  </Card>
                );
              })}
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
  const { lang, L } = useLang();
  const cgs = useLoad(
    () => (child ? childService.getCaregivers(child.id) : Promise.resolve([])),
    [child?.id]
  );
  const phone = cgs.data?.find((c) => c.user.phone)?.user.phone ?? child?.caregiverPhone;
  const cName = child ? nameIn(child.nickname, lang) : a.childId;

  return (
    <div className="alertcard" role="alert">
      <div className="cardtop">
        <span className="pill bad">{L("জরুরি নিরাপত্তা সতর্কতা", "Urgent Safety Alert")}</span>
        <span className="small">
          {ago(a.createdAt, lang)} · {fmtTime(a.createdAt, lang)}
        </span>
      </div>

      <p className="h3" style={{ fontSize: 18, marginTop: 4 }}>
        {child ? (
          <Link href={`/t/children/${child.id}`} style={{ color: "inherit", textDecoration: "none" }}>
            {cName}
          </Link>
        ) : (
          a.childId
        )}
        : &ldquo;
        <Highlight text={a.matchedText} word={a.keyword} />
        &rdquo;
      </p>

      <p className="sub" style={{ fontSize: 13, marginTop: 6, color: "var(--ink)" }}>
        {L(
          `চিহ্নিত কারণ: ${a.keyword} · অভিভাবককে তাৎক্ষণিকভাবে ৯৯৯ ও ক্লিনিক নম্বর দেখানো হয়েছে।`,
          `Matched trigger: ${a.keyword} · Parent was immediately shown 999 & clinic emergency options.`
        )}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        <Button
          variant="danger"
          size="lg"
          href={phone ? `tel:${phone}` : undefined}
          disabled={!phone}
          icon={<Icon name="phone" />}
        >
          {L(`অভিভাবককে কল করুন ${phone ? `(${phone})` : ""}`, `Call caregiver ${phone ? `(${phone})` : ""}`)}
        </Button>
        <Button variant="soft" onClick={onResolve} icon={<Icon name="check" />}>
          {L("সমাধান চিহ্নিত করুন", "Mark resolved")}
        </Button>
      </div>
    </div>
  );
}

function ResolveModal({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const toast = useToast();
  const { L } = useLang();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Modal open onClose={onClose} title={L("সতর্কতা সমাধান চিহ্নিত করুন", "Mark alert resolved")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="small">&ldquo;{alert.matchedText}&rdquo;</p>
        <Field label={L("কী হয়েছিল এবং কী পদক্ষেপ নিয়েছেন", "What happened and what you did")}>
          <textarea
            autoFocus
            className="field"
            style={{ minHeight: 110, width: "100%", padding: 12, fontSize: 15 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={L("যেমন: আয়েশাকে কল করেছি। কোনো আঘাত নেই। ঘুমানোর সময় নজর রাখতে বলা হয়েছে।", "e.g. Called Ayesha. No injury. Agreed to watch at bedtime.")}
          />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>
            {L("বাতিল", "Cancel")}
          </Button>
          <Button
            variant="primary"
            disabled={!note.trim()}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              await alertService.resolveAlert(alert.id, note.trim());
              toast(L("সতর্কতা সমাধান হয়েছে", "Alert resolved"));
              onClose();
            }}
          >
            {L("সমাধান করুন", "Resolve")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
