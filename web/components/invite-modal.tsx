"use client";
// T-11 Invite caregiver: a 6-digit code valid for 7 days, with copy and share.
import { Copy, MessageCircle, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { childService } from "@/lib/services";
import type { InviteCode } from "@/lib/types";
import { Button, Modal, Skeleton, useToast } from "./ui";

type Props = { open: boolean; onClose: () => void; childId: string; childName: string };

export function InviteModal(props: Props) {
  // mount fresh on every open so each open creates a new code
  return props.open ? <InviteBody {...props} /> : null;
}

function InviteBody({ open, onClose, childId, childName }: Props) {
  const toast = useToast();
  const [invite, setInvite] = useState<InviteCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    childService.createInviteCode(childId).then(
      (i) => { if (live) setInvite(i); },
      (e) => { if (live) setError(e instanceof Error ? e.message : "Could not create a code"); },
    );
    return () => { live = false; };
  }, [childId]);

  const link = typeof window !== "undefined" ? `${window.location.origin}/join` : "/join";
  const msg = invite
    ? `BridgeAI-তে ${childName}-এর পরিকল্পনায় যোগ দিন। কোড: ${invite.code}\nJoin ${childName}'s plan on BridgeAI. Code: ${invite.code}\n${link}`
    : "";

  return (
    <Modal open={open} onClose={onClose} title="Invite caregiver">
      <p className="text-[15px] text-text-2">Share this code with {childName}&apos;s family. They enter it under <b>Join with code</b>.</p>
      <div className="my-5 rounded-2xl bg-primary-soft p-5 text-center">
        {invite ? (
          <div className="font-mono text-4xl font-bold tracking-[0.35em] text-primary" aria-label={`Code ${invite.code.split("").join(" ")}`}>{invite.code}</div>
        ) : error ? (
          <p className="text-sm font-semibold">{error}</p>
        ) : (
          <Skeleton className="mx-auto h-10 w-48" />
        )}
        <div className="mt-2 text-sm text-text-2">Valid for 7 days</div>
      </div>
      <div className="grid gap-2">
        <Button variant="soft" disabled={!invite} icon={<Copy className="size-5" />} onClick={async () => {
          try { await navigator.clipboard.writeText(invite!.code); toast("Code copied"); } catch { toast(`Code: ${invite!.code}`); }
        }}>Copy code</Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" disabled={!invite} href={invite ? `https://wa.me/?text=${encodeURIComponent(msg)}` : undefined} icon={<MessageCircle className="size-5" />}>WhatsApp</Button>
          <Button variant="soft" disabled={!invite} href={invite ? `sms:?body=${encodeURIComponent(msg)}` : undefined} icon={<MessageSquareText className="size-5" />}>SMS</Button>
        </div>
        <Button className="mt-2" onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
