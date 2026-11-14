"use client";
// T-11 Invite caregiver: a 6-digit code valid for 7 days, with copy and share.
// Uses prototype bottom sheet and button classes.
import { useEffect, useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { useLang } from "@/lib/i18n";
import { nameIn, num } from "@/lib/labels";
import { childService } from "@/lib/services";
import type { InviteCode } from "@/lib/types";
import { BottomSheet, Button, Skeleton, useToast } from "./ui";

type Props = { open: boolean; onClose: () => void; childId: string; childName: string };

export function InviteModal(props: Props) {
  return props.open ? <InviteBody {...props} /> : null;
}

function InviteBody({ open, onClose, childId, childName }: Props) {
  const toast = useToast();
  const { lang, L } = useLang();
  const [invite, setInvite] = useState<InviteCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    childService.createInviteCode(childId).then(
      (i) => {
        if (live) setInvite(i);
      },
      (e) => {
        if (live) setError(e instanceof Error ? e.message : "Could not create a code");
      },
    );
    return () => {
      live = false;
    };
  }, [childId]);

  const displayName = nameIn(childName, lang);
  const link = typeof window !== "undefined" ? `${window.location.origin}/join` : "/join";
  const msg = invite
    ? `BridgeAI-তে ${nameIn(childName, "bn")}-এর পরিকল্পনায় যোগ দিন। কোড: ${invite.code}\nJoin ${childName}'s plan on BridgeAI. Code: ${invite.code}\n${link}`
    : "";

  return (
    <BottomSheet open={open} onClose={onClose} title={L("আমন্ত্রণ কোড", "Invite caregiver")}>
      <p className="sub" style={{ marginTop: 2, marginBottom: 12 }}>
        {L(
          `${displayName}-এর পরিবারকে এই কোডটি দিন। তারা ‘কোড দিয়ে যোগ দিন’-এ এটি লিখবেন।`,
          `Share this code with ${childName}’s family. They enter it under Join with code.`
        )}
      </p>

      <div className="card" style={{ textAlign: "center", padding: "20px 14px", margin: "14px 0" }}>
        {invite ? (
          <div
            style={{
              font: "700 36px var(--round)",
              letterSpacing: "0.25em",
              color: "var(--p)",
            }}
            aria-label={`Code ${invite.code.split("").join(" ")}`}
          >
            {invite.code}
          </div>
        ) : error ? (
          <p className="err">{error}</p>
        ) : (
          <Skeleton className="h-10 w-48" style={{ margin: "0 auto" }} />
        )}
        <p className="small" style={{ marginTop: 6 }}>
          {L(`${num(7, lang)} দিন পর্যন্ত কার্যকর`, "Valid for 7 days")}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Button
          variant="soft"
          disabled={!invite}
          icon={<Icon name="doc" />}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(invite!.code);
              toast(L("কোড কপি হয়েছে", "Code copied"));
            } catch {
              toast(`Code: ${invite!.code}`);
            }
          }}
        >
          {L("কোড কপি করুন", "Copy code")}
        </Button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Button
            variant="soft"
            disabled={!invite}
            href={invite ? `https://wa.me/?text=${encodeURIComponent(msg)}` : undefined}
            icon={<Icon name="talk" />}
          >
            WhatsApp
          </Button>
          <Button
            variant="soft"
            disabled={!invite}
            href={invite ? `sms:?body=${encodeURIComponent(msg)}` : undefined}
            icon={<Icon name="send" />}
          >
            SMS
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
