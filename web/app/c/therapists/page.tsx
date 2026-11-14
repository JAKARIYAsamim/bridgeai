"use client";
// C-02 Therapists: list and invite with the centre code (matches prototype centreTeam)
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Button, Card, EmptyState, ErrorState, Modal, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { authService, childService } from "@/lib/services";

export default function Therapists() {
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
    ? `Join ${data.centre.name} on BridgeAI. Sign up as a therapist and enter the centre code ${data.centre.code}.`
    : "";

  return (
    <div className="pad" style={{ paddingBottom: 88 }}>
      <div className="bar" style={{ padding: "4px 8px 10px" }}>
        <Link href="/c" className="hbtn" aria-label="Back">
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            Team
          </h1>
          <p className="small">
            {data ? `${data.therapists.length} therapists at ${data.centre.name}` : "Therapists"}
          </p>
        </div>
        <Button size="sm" variant="soft" icon={<Icon name="users" />} onClick={() => setOpen(true)} disabled={!data}>
          Invite
        </Button>
      </div>

      <div className="in">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading || !data ? (
          <SkeletonList rows={4} h="h-20" />
        ) : data.therapists.length === 0 ? (
          <EmptyState
            title="No therapists yet. Invite your first one."
            action={<Button onClick={() => setOpen(true)}>Invite therapist</Button>}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.therapists.map((t) => {
              const myKids = data.children.filter((c) => c.therapistId === t.id);
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
                        {t.name}
                      </p>
                      <p className="small" style={{ margin: "2px 0 0" }}>
                        {t.profession ?? "Therapist"} · {myKids.length} children
                      </p>
                    </div>
                    <span className="pill line">Active</span>
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

      <Modal open={open} onClose={() => setOpen(false)} title="Invite a therapist">
        {data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
            <p className="small">
              Therapists sign up, choose &ldquo;I&apos;m a therapist&rdquo;, and enter this centre code:
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
                  toast("Invite instructions copied");
                  setOpen(false);
                }}
              >
                Copy instructions
              </Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
