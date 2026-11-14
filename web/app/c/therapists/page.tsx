"use client";
// C-02 Therapists: list and invite with the centre code (matches prototype centreTeam)
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Button, Card, EmptyState, ErrorState, Modal, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { nameIn, num, PROFESSIONS_DATA } from "@/lib/labels";
import { useLang } from "@/lib/i18n";
import { authService, childService } from "@/lib/services";

export default function Therapists() {
  const { lang, L } = useLang();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { data, loading, error, reload } = useLoad(async () => {
    const [therapists, children, centre] = await Promise.all([
      authService.listUsers("therapist"),
      childService.listChildren(),
      authService.getCentre(),
    ]);
    return { therapists, children, centre };
  }, []);

  const shareText = data
    ? (lang === "bn"
        ? `BridgeAI-এ ${data.centre.name}-এ যোগ দিন। থেরাপিস্ট হিসেবে সাইন আপ করুন এবং সেন্টার কোড ${data.centre.code} লিখুন।`
        : `Join ${data.centre.name} on BridgeAI. Sign up as a therapist and enter the centre code ${data.centre.code}.`)
    : "";

  return (
    <div className="pad" style={{ paddingBottom: 88 }}>
      <div className="bar" style={{ padding: "4px 8px 10px" }}>
        <Link href="/c" className="hbtn" aria-label={L("ফিরে যান", "Back")}>
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            {L("থেরাপিস্ট দল", "Team")}
          </h1>
          <p className="small">
            {data
              ? (lang === "bn"
                  ? `${data.centre.name}-এ ${num(data.therapists.length, "bn")} জন থেরাপিস্ট`
                  : `${data.therapists.length} therapists at ${data.centre.name}`)
              : L("থেরাপিস্টবৃন্দ", "Therapists")}
          </p>
        </div>
        <Button size="sm" variant="soft" icon={<Icon name="users" />} onClick={() => setOpen(true)} disabled={!data}>
          {L("আমন্ত্রণ", "Invite")}
        </Button>
      </div>

      <div className="in">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading || !data ? (
          <SkeletonList rows={4} h="h-20" />
        ) : data.therapists.length === 0 ? (
          <EmptyState
            title={L("এখনও কোনো থেরাপিস্ট নেই। প্রথমজনকে আমন্ত্রণ জানান।", "No therapists yet. Invite your first one.")}
            action={<Button onClick={() => setOpen(true)}>{L("থেরাপিস্টকে আমন্ত্রণ জানান", "Invite therapist")}</Button>}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.therapists.map((t) => {
              const myKids = data.children.filter((c) => c.therapistId === t.id);
              const profession = (t.profession ? PROFESSIONS_DATA[t.profession]?.[lang] : undefined) ?? t.profession ?? L("থেরাপিস্ট", "Therapist");
              return (
                <Card key={t.id} style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      className="av t-blue"
                      style={{ width: 44, height: 44, fontSize: 18 }}
                    >
                      {t.name.replace(/^Dr\.?\s+/, "")[0]}
                    </span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <p className="h3" style={{ fontSize: 15, margin: 0 }}>
                        {nameIn(t.name, lang)}
                      </p>
                      <p className="small" style={{ margin: "2px 0 0" }}>
                        {profession} · {lang === "bn" ? `${num(myKids.length, "bn")}টি শিশু` : `${myKids.length} children`}
                      </p>
                    </div>
                    <span className="pill line">{L("সক্রিয়", "Active")}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                    <a
                      href={`mailto:${t.email}`}
                      className="btn soft sm"
                      style={{ textDecoration: "none" }}
                    >
                      <Icon name="talk" style={{ marginRight: 6 }} />
                      {t.email}
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={L("থেরাপিস্টকে আমন্ত্রণ জানান", "Invite a therapist")}>
        {data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
            <p className="small">
              {L(
                "থেরাপিস্টরা সাইন আপ করার সময় \"আমি একজন থেরাপিস্ট\" নির্বাচন করে এই সেন্টার কোডটি লিখবেন:",
                "Therapists sign up, choose “I'm a therapist”, and enter this centre code:"
              )}
            </p>
            <div
              className="code"
              style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: 8,
                padding: "16px 0",
                background: "rgba(131, 119, 238, 0.1)",
                borderRadius: 16,
                color: "var(--p)",
              }}
            >
              {data.centre.code}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button
                block
                variant="primary"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareText);
                  toast(lang === "bn" ? "আমন্ত্রণ নির্দেশনাবলী কপি করা হয়েছে" : "Invite instructions copied");
                  setOpen(false);
                }}
              >
                {L("নির্দেশনাবলী কপি করুন", "Copy instructions")}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {L("সম্পন্ন", "Done")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
