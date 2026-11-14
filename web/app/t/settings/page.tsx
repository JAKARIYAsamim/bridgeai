"use client";
// T-12 Therapist settings
import { LogOut, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ErrorState, Field, inputCls, Modal, PageTitle, SectionTitle, Segmented, SkeletonList, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { useLang } from "@/lib/i18n";
import { PROFESSIONS } from "@/lib/labels";
import { authService, resetDemoData } from "@/lib/services";
import type { Lang } from "@/lib/types";

export default function Settings() {
  const router = useRouter();
  const toast = useToast();
  const { lang, setLang } = useLang();
  const { data: user, loading, error, reload } = useLoad(() => authService.currentUser(), []);
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (user && loadedFor !== user.id) {
    setLoadedFor(user.id);
    setName(user.name);
    setProfession(user.profession ?? PROFESSIONS[0]);
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !user) return <SkeletonList rows={3} />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Settings" />
      <SectionTitle>Profile</SectionTitle>
      <Card className="space-y-4">
        <Field label="Name"><input className={inputCls(!name.trim())} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Profession">
          <select className={inputCls()} value={profession} onChange={(e) => setProfession(e.target.value)}>
            {PROFESSIONS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Email"><input className={inputCls()} value={user.email} disabled /></Field>
        <div className="flex justify-end">
          <Button loading={saving} disabled={!name.trim()} onClick={async () => {
            setSaving(true);
            await authService.updateUser({ name: name.trim(), profession });
            setSaving(false);
            toast("Profile saved");
          }}>Save profile</Button>
        </div>
      </Card>

      <SectionTitle>Language</SectionTitle>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-text-2">Therapist screens are in English, with a Bangla option.</span>
        <Segmented<Lang> value={lang} onChange={setLang} options={[{ value: "en", label: "English" }, { value: "bn", label: <span className="bn">বাংলা</span> }]} />
      </Card>

      <SectionTitle>Demo</SectionTitle>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-text-2">Bring back the sample data before each rehearsal.</span>
        <Button variant="soft" icon={<RotateCcw className="size-5" />} onClick={() => setConfirm(true)}>Reset demo data</Button>
      </Card>

      <div className="mt-8">
        <Button variant="outline" icon={<LogOut className="size-5" />} onClick={async () => { await authService.logOut(); router.replace("/"); }}>Log out</Button>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset demo data?">
        <p className="text-text-2">This removes every change made in this browser and brings back the sample children, logs and reports.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button onClick={() => { resetDemoData(); setConfirm(false); toast("Demo data reset"); }}>Reset</Button>
        </div>
      </Modal>
    </div>
  );
}
