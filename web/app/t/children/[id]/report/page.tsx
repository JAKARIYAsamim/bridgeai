"use client";
// T-09 Pre-visit report: generate an AI draft, edit any part inline, approve, export, share a parent summary.
import { ArrowLeft, Check, FileDown, Pencil, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AudioPlayer } from "@/components/media";
import { AIDraftBanner, Button, Card, Chip, cx, EmptyState, ErrorState, Field, inputCls, PageTitle, SectionTitle, SkeletonList, StepLoader, useToast } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { bnNum, fmtDate, MOODS, nameIn } from "@/lib/labels";
import { aiService, childService, feedbackService, libraryService } from "@/lib/services";
const dkey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
import type { Activity, Child, Feedback, Mood, Report, ReportDraft } from "@/lib/types";

const today = () => dkey(new Date());
const minus = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return dkey(d); };

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const child = useLoad(() => childService.getChild(id), [id]);
  const reports = useLoad(() => feedbackService.listReports(id), [id]);
  const lib = useLoad(() => libraryService.listActivities({ includeDrafts: true }), []);
  const fb = useLoad(() => feedbackService.listFeedback(id), [id]);

  if (child.loading || reports.loading || lib.loading) return <SkeletonList rows={4} h="h-32" />;
  if (child.error || reports.error) return <ErrorState message={child.error || reports.error || ""} onRetry={reports.reload} />;
  const lastEnd = reports.data?.find((r) => r.approvedAt)?.periodEnd;
  return (
    <ReportWorkspace child={child.data!} reports={reports.data ?? []} activities={lib.data ?? []} feedback={fb.data ?? []} defaultFrom={lastEnd ?? minus(14)} />
  );
}

function ReportWorkspace({ child, reports, activities, feedback, defaultFrom }: { child: Child; reports: Report[]; activities: Activity[]; feedback: Feedback[]; defaultFrom: string }) {
  const toast = useToast();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<Report | null>(null);
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const approved = !!current?.approvedAt;

  const generate = async () => {
    setBusy(true);
    setError(null);
    setCurrent(null);
    try {
      const d = await aiService.draftReport(child.id, { from, to });
      setDraft(d);
      setCurrent({ id: `r_${Date.now().toString(36)}`, childId: child.id, periodStart: from, periodEnd: to, draft: d, createdAt: new Date().toISOString() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The AI could not write the report. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!current || !draft) return;
    const saved = await feedbackService.saveReport({ ...current, final: draft, approvedAt: new Date().toISOString() });
    setCurrent(saved);
    toast("Report approved and saved");
  };

  const view = (r: Report) => {
    setCurrent(r);
    setDraft(r.final ?? r.draft);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const title = (aid: string) => activities.find((a) => a.id === aid)?.title_en ?? aid;
  const past = reports.filter((r) => r.approvedAt && r.id !== current?.id);

  return (
    <div>
      <Link href={`/t/children/${child.id}`} className="no-print mb-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="size-4" />{child.nickname}</Link>
      <PageTitle title={`Pre-visit report · ${child.nickname}`} sub="AI drafts it from logs, check-ins and feedback. You edit and approve. The family never sees the draft." />

      <Card className="no-print mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="From"><input type="date" className={inputCls()} value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To"><input type="date" className={inputCls()} value={to} min={from} max={today()} onChange={(e) => setTo(e.target.value)} /></Field>
          <Button onClick={generate} loading={busy} icon={<Sparkles className="size-5" />}>{draft && !approved ? "Generate again" : "Generate report"}</Button>
        </div>
        <p className="mt-2 text-xs text-muted">Defaults to “since the last session”.</p>
      </Card>

      {busy && <div className="py-6"><StepLoader steps={["Reading logs", "Listening to voice notes", "Writing the summary"]} /></div>}
      {error && <ErrorState message={error} onRetry={generate} />}

      {!busy && current && draft && (
        <div className="space-y-4">
          <div className="no-print">
            {approved ? (
              <AIDraftBanner approved />
            ) : (
              <AIDraftBanner onApprove={approve}><span className="text-xs">Only you can see this draft.</span></AIDraftBanner>
            )}
          </div>
          <div className="text-sm text-muted">Period: {fmtDate(current.periodStart)} – {fmtDate(current.periodEnd)}{approved && current.approvedAt ? ` · approved ${fmtDate(current.approvedAt)}` : ""}</div>

          <Part title="Summary" readOnly={approved} renderEdit={(done) => <TextEdit value={draft.summary} onSave={(v) => { setDraft({ ...draft, summary: v }); done(); }} onCancel={done} />}>
            <p className="text-[16px] leading-relaxed">{draft.summary}</p>
          </Part>

          <Part title="Completion by activity" readOnly={approved} renderEdit={(done) => (
            <CompletionEdit rows={draft.completion} title={title} onSave={(c) => { setDraft({ ...draft, completion: c }); done(); }} onCancel={done} />
          )}>
            <div className="space-y-2.5">
              {draft.completion.map((c) => (
                <div key={c.activity_id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[220px_1fr_80px_40px]">
                  <span className="font-semibold">{title(c.activity_id)}</span>
                  <div className="col-span-2 h-2.5 overflow-hidden rounded-full bg-line sm:col-span-1"><div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(100, (c.done / Math.max(1, c.planned)) * 100)}%` }} /></div>
                  <span className="text-sm tabular-nums text-text-2">{c.done} of {c.planned}</span>
                  <span className="text-xl" title={MOODS[c.top_mood].en}>{MOODS[c.top_mood].emoji}</span>
                </div>
              ))}
            </div>
          </Part>

          <ListPart title="Patterns" items={draft.patterns} readOnly={approved} onChange={(v) => setDraft({ ...draft, patterns: v })} />

          <Part title="Parent quotes" readOnly={approved} renderEdit={(done) => (
            <ListEdit items={draft.parent_quotes.map((q) => q.text)} onCancel={done}
              onSave={(v) => { setDraft({ ...draft, parent_quotes: v.map((t, i) => ({ text: t, feedback_id: draft.parent_quotes[i]?.feedback_id ?? "" })) }); done(); }} />
          )}>
            <ul className="space-y-3">
              {draft.parent_quotes.map((q, i) => {
                const f = feedback.find((x) => x.id === q.feedback_id);
                return (
                  <li key={i} className="space-y-1.5">
                    <blockquote className="border-l-4 border-primary/40 pl-3 text-[16px]">“{q.text}”</blockquote>
                    {f?.type === "voice" ? <div className="max-w-sm"><AudioPlayer src={f.mediaUrl} label="Original audio" /></div>
                      : f ? <p className="pl-4 text-xs text-muted">From a {f.type} note · {fmtDate(f.createdAt)}</p> : null}
                  </li>
                );
              })}
            </ul>
          </Part>

          <ListPart title="Concerns" items={draft.concerns} readOnly={approved} onChange={(v) => setDraft({ ...draft, concerns: v })} />
          <ListPart title="Questions for the visit" items={draft.questions_for_visit} readOnly={approved} onChange={(v) => setDraft({ ...draft, questions_for_visit: v })} />

          <div className="no-print flex flex-wrap gap-2">
            {!approved && <Button onClick={approve} icon={<Check className="size-5" />}>Approve</Button>}
            {approved && <Button variant="soft" onClick={() => window.print()} icon={<FileDown className="size-5" />}>Export PDF</Button>}
          </div>

          {approved && <ShareSummary key={current.id} report={current} child={child} draft={draft} activities={activities} onSaved={setCurrent} />}
        </div>
      )}

      {!busy && !current && !error && (
        <EmptyState emoji="📝" title={`Choose the dates and generate ${child.nickname}'s report before the next session.`} />
      )}

      <div className="no-print">
        <SectionTitle>Approved reports</SectionTitle>
        {past.length ? (
          <div className="space-y-2">
            {past.map((r) => (
              <Card key={r.id} onClick={() => view(r)} className="flex flex-wrap items-center gap-3">
                <span className="font-semibold">{fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}</span>
                <span className="flex-1 truncate text-sm text-text-2">{(r.final ?? r.draft).summary}</span>
                {r.parentSummaryShared && <Chip tone="success">Shared with family</Chip>}
                <span className="text-sm font-semibold text-primary">View</span>
              </Card>
            ))}
          </div>
        ) : <p className="px-1 text-sm text-muted">No approved reports yet.</p>}
      </div>
    </div>
  );
}

// ---------- editable parts ----------
function Part({ title, children, readOnly, renderEdit }: { title: string; children: ReactNode; readOnly?: boolean; renderEdit: (done: () => void) => ReactNode }) {
  const [editing, setEditing] = useState(false);
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {!readOnly && !editing && <Button size="sm" variant="ghost" className="no-print" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>Edit</Button>}
      </div>
      {editing ? renderEdit(() => setEditing(false)) : children}
    </Card>
  );
}

function ListPart({ title, items, readOnly, onChange }: { title: string; items: string[]; readOnly?: boolean; onChange: (v: string[]) => void }) {
  return (
    <Part title={title} readOnly={readOnly} renderEdit={(done) => <ListEdit items={items} onSave={(v) => { onChange(v); done(); }} onCancel={done} />}>
      {items.length ? <ul className="list-disc space-y-1 pl-5 text-[16px]">{items.map((t, i) => <li key={i}>{t}</li>)}</ul> : <p className="text-sm text-muted">None.</p>}
    </Part>
  );
}

function SaveBar({ onSave, onCancel, disabled }: { onSave: () => void; onCancel: () => void; disabled?: boolean }) {
  return (
    <div className="mt-3 flex gap-2">
      <Button size="sm" onClick={onSave} disabled={disabled} icon={<Check className="size-4" />}>Save</Button>
      <Button size="sm" variant="ghost" onClick={onCancel} icon={<X className="size-4" />}>Cancel</Button>
    </div>
  );
}

function TextEdit({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(value);
  return (
    <div>
      <textarea autoFocus className={cx(inputCls(), "min-h-28 py-3")} value={v} onChange={(e) => setV(e.target.value)} />
      <SaveBar onSave={() => onSave(v.trim())} onCancel={onCancel} disabled={!v.trim()} />
    </div>
  );
}

function ListEdit({ items, onSave, onCancel }: { items: string[]; onSave: (v: string[]) => void; onCancel: () => void }) {
  const [list, setList] = useState(items.length ? items : [""]);
  return (
    <div className="space-y-2">
      {list.map((t, i) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls()} value={t} autoFocus={i === 0} onChange={(e) => setList(list.map((x, j) => (j === i ? e.target.value : x)))} />
          <button aria-label="Remove line" onClick={() => setList(list.filter((_, j) => j !== i))} className="grid size-12 shrink-0 place-items-center rounded-full text-muted hover:bg-primary-soft"><Trash2 className="size-4" /></button>
        </div>
      ))}
      <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => setList([...list, ""])}>Add line</Button>
      <SaveBar onSave={() => onSave(list.map((x) => x.trim()).filter(Boolean))} onCancel={onCancel} />
    </div>
  );
}

function CompletionEdit({ rows, title, onSave, onCancel }: { rows: ReportDraft["completion"]; title: (id: string) => string; onSave: (r: ReportDraft["completion"]) => void; onCancel: () => void }) {
  const [list, setList] = useState(rows);
  const set = (i: number, patch: Partial<ReportDraft["completion"][number]>) => setList(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {list.map((r, i) => (
        <div key={r.activity_id} className="flex flex-wrap items-center gap-2">
          <span className="w-48 font-semibold">{title(r.activity_id)}</span>
          <input aria-label="Done" type="number" min={0} className={cx(inputCls(), "w-20")} value={r.done} onChange={(e) => set(i, { done: Number(e.target.value) })} />
          <span className="text-sm text-muted">of</span>
          <input aria-label="Planned" type="number" min={0} className={cx(inputCls(), "w-20")} value={r.planned} onChange={(e) => set(i, { planned: Number(e.target.value) })} />
          <select aria-label="Most common face" className={cx(inputCls(), "w-auto")} value={r.top_mood} onChange={(e) => set(i, { top_mood: e.target.value as Mood })}>
            {(Object.keys(MOODS) as Mood[]).map((m) => <option key={m} value={m}>{MOODS[m].emoji} {MOODS[m].en}</option>)}
          </select>
        </div>
      ))}
      <SaveBar onSave={() => onSave(list)} onCancel={onCancel} />
    </div>
  );
}

// ---------- parent summary ----------
function ShareSummary({ report, child, draft, activities, onSaved }: { report: Report; child: Child; draft: ReportDraft; activities: Activity[]; onSaved: (r: Report) => void }) {
  const toast = useToast();
  const logs = useLoad(() => feedbackService.listLogs(child.id, 60), [child.id]);
  const [text, setText] = useState<string | null>(report.parentSummary ?? null);
  const [busy, setBusy] = useState(false);

  const build = () => {
    const inRange = (logs.data ?? []).filter((l) => l.date >= report.periodStart && l.date <= report.periodEnd);
    const days = new Set(inRange.map((l) => l.date)).size;
    const span = Math.max(1, Math.round((new Date(report.periodEnd).getTime() - new Date(report.periodStart).getTime()) / 86400000));
    const best = [...draft.completion].sort((a, b) => b.done / Math.max(1, b.planned) - a.done / Math.max(1, a.planned))[0];
    const bestBn = activities.find((a) => a.id === best?.activity_id)?.title_bn;
    const name = nameIn(child.nickname, "bn");
    return `${name}-এর পরিবার ${bnNum(span)} দিনের মধ্যে ${bnNum(days)} দিন অনুশীলন করেছে।${bestBn ? ` "${bestBn}" সবচেয়ে ভালো হয়েছে।` : ""} চমৎকার কাজ! পরের সেশনে দেখা হবে।`;
  };

  const send = async () => {
    if (!text) return;
    setBusy(true);
    const saved = await feedbackService.saveReport({ ...report, parentSummary: text.trim(), parentSummaryShared: true });
    onSaved(saved);
    setBusy(false);
    toast("Summary sent to the family");
  };

  return (
    <Card className="no-print">
      <h2 className="mb-1 text-lg font-bold">Share a summary with the family</h2>
      <p className="mb-3 text-sm text-text-2">A short, positive Bangla message. The family sees only this — never the report above.</p>
      {report.parentSummaryShared ? (
        <div className="space-y-2">
          <p className="bn rounded-xl bg-success-soft p-3 text-[17px]">{report.parentSummary}</p>
          <Chip tone="success" icon={<Check className="size-3" />}>Shared with the family</Chip>
        </div>
      ) : text === null ? (
        <Button variant="soft" loading={logs.loading} onClick={() => setText(build())} icon={<Sparkles className="size-5" />}>Write parent summary</Button>
      ) : (
        <div className="space-y-3">
          <textarea lang="bn" className={cx(inputCls(), "bn min-h-28 py-3 text-[17px]")} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={send} loading={busy} disabled={!text.trim()} icon={<Send className="size-5" />}>Send to family</Button>
            <Button variant="ghost" onClick={() => setText(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
