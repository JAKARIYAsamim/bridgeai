"use client";
// C-02 Therapists: list and invite with the centre code.
import { Copy, Mail, MessageCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button, Card, EmptyState, ErrorState, Modal, PageTitle, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { authService, childService } from "@/lib/services";

export default function Therapists() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { data, loading, error, reload } = useLoad(async () => {
    const [therapists, children, centre] = await Promise.all([authService.listUsers("therapist"), childService.listChildren(), authService.getCentre()]);
    return { therapists, children, centre };
  }, []);

  const shareText = data
    ? `Join ${data.centre.name} on BridgeAI. Sign up as a therapist and enter the centre code ${data.centre.code}.`
    : "";

  return (
    <div>
      <PageTitle title="Therapists" sub={data ? `${data.therapists.length} at ${data.centre.name}` : undefined}
        actions={<Button icon={<UserPlus className="size-5" />} onClick={() => setOpen(true)} disabled={!data}>Invite therapist</Button>} />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <SkeletonList rows={4} h="h-16" />
      ) : data.therapists.length === 0 ? (
        <EmptyState emoji="🩺" title="No therapists yet. Invite your first one." action={<Button onClick={() => setOpen(true)}>Invite therapist</Button>} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Profession</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Children</th></tr>
            </thead>
            <tbody>
              {data.therapists.map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 place-items-center rounded-full bg-primary-soft font-bold text-primary">{t.name.replace(/^Dr\.?\s+/, "")[0]}</span>
                      <span className="font-semibold">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-2">{t.profession ?? "—"}</td>
                  <td className="px-4 py-3"><a href={`mailto:${t.email}`} className="inline-flex min-h-10 items-center gap-1.5 text-primary"><Mail className="size-4" />{t.email}</a></td>
                  <td className="px-4 py-3">{data.children.filter((c) => c.therapistId === t.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Invite a therapist">
        {data && (
          <div className="space-y-4">
            <p className="text-sm text-text-2">Therapists sign up, choose &ldquo;I&apos;m a therapist&rdquo;, and enter this centre code.</p>
            <div className="rounded-2xl bg-primary-soft py-4 text-center text-4xl font-bold tracking-[0.3em] text-primary">{data.centre.code}</div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="soft" icon={<Copy className="size-5" />} onClick={() => { navigator.clipboard?.writeText(shareText).catch(() => {}); toast("Invite copied"); }}>Copy</Button>
              <Button href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} icon={<MessageCircle className="size-5" />}>WhatsApp</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
