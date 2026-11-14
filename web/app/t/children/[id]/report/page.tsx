"use client";
// T-09 Pre-visit report: generate an AI draft, edit any part inline, approve, export, share a parent summary.
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "@/components/legacy/icons";
import { AudioPlayer } from "@/components/media";
import {
  AIDraftBanner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  SkeletonList,
  StepLoader,
  useToast,
} from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { bnNum, fmtDate, MOODS, nameIn, num } from "@/lib/labels";
import { useLang } from "@/lib/i18n";
import { aiService, childService, feedbackService, libraryService } from "@/lib/services";
import type { Activity, Child, Feedback, Mood, Report, ReportDraft } from "@/lib/types";

const dkey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const today = () => dkey(new Date());
const minus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return dkey(d);
};

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const child = useLoad(() => childService.getChild(id), [id]);
  const reports = useLoad(() => feedbackService.listReports(id), [id]);
  const lib = useLoad(() => libraryService.listActivities({ includeDrafts: true }), []);
  const fb = useLoad(() => feedbackService.listFeedback(id), [id]);

  if (child.loading || reports.loading || lib.loading) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <SkeletonList rows={4} h="h-32" />
      </div>
    );
  }
  if (child.error || reports.error) {
    return (
      <div className="pad in" style={{ paddingTop: 24 }}>
        <ErrorState message={child.error || reports.error || ""} onRetry={reports.reload} />
      </div>
    );
  }
  const lastEnd = reports.data?.find((r) => r.approvedAt)?.periodEnd;
  return (
    <ReportWorkspace
      child={child.data!}
      reports={reports.data ?? []}
      activities={lib.data ?? []}
      feedback={fb.data ?? []}
      defaultFrom={lastEnd ?? minus(14)}
    />
  );
}

function ReportWorkspace({
  child,
  reports,
  activities,
  feedback,
  defaultFrom,
}: {
  child: Child;
  reports: Report[];
  activities: Activity[];
  feedback: Feedback[];
  defaultFrom: string;
}) {
  const { lang, L } = useLang();
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
      setCurrent({
        id: `r_${Date.now().toString(36)}`,
        childId: child.id,
        periodStart: from,
        periodEnd: to,
        draft: d,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : (lang === "bn" ? "এআই রিপোর্ট তৈরি করতে পারেনি। আবার চেষ্টা করুন।" : "The AI could not write the report. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!current || !draft) return;
    const saved = await feedbackService.saveReport({
      ...current,
      final: draft,
      approvedAt: new Date().toISOString(),
    });
    setCurrent(saved);
    toast(lang === "bn" ? "রিপোর্ট অনুমোদিত ও সংরক্ষিত হয়েছে" : "Report approved and saved");
  };

  const view = (r: Report) => {
    setCurrent(r);
    setDraft(r.final ?? r.draft);
  };

  const title = (aid: string) =>
    (lang === "bn" ? activities.find((a) => a.id === aid)?.title_bn : activities.find((a) => a.id === aid)?.title_en) ?? aid;
  const past = reports.filter((r) => r.approvedAt && r.id !== current?.id);

  return (
    <div className="scroll softbg pad" style={{ paddingBottom: 88 }}>
      <div className="bar" style={{ padding: "4px 8px 10px" }}>
        <Link href={`/t/children/${child.id}`} className="hbtn" aria-label={L("ফিরে যান", "Back")}>
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            {lang === "bn" ? `${child.nickname}-এর রিপোর্ট` : `${child.nickname}’s report`}
          </h1>
          <p className="small">{L("সেশন পূর্ববর্তী অগ্রগতি রিপোর্ট", "Pre-visit progress report")}</p>
        </div>
      </div>

      <div className="in">
        <Card style={{ marginBottom: 14 }}>
          <p className="small" style={{ fontWeight: 600, marginBottom: 8 }}>
            {L("রিপোর্টের সময়সীমা", "Report period")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <Field label={L("শুরু", "From")}>
              <input
                type="date"
                className="field"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Field label={L("শেষ", "To")}>
              <input
                type="date"
                className="field"
                value={to}
                min={from}
                max={today()}
                onChange={(e) => setTo(e.target.value)}
              />
            </Field>
          </div>
          <Button
            block
            variant="primary"
            onClick={generate}
            loading={busy}
            icon={<Icon name="spark" />}
          >
            {draft && !approved ? L("পুনরায় তৈরি করুন", "Generate again") : L("রিপোর্ট তৈরি করুন", "Generate report")}
          </Button>
        </Card>

        {busy && (
          <div style={{ padding: "20px 0" }}>
            <StepLoader
              steps={
                lang === "bn"
                  ? ["লগগুলো পড়া হচ্ছে", "ভয়েস নোট শোনা হচ্ছে", "সারসংক্ষেপ লেখা হচ্ছে"]
                  : ["Reading logs", "Listening to voice notes", "Writing the summary"]
              }
            />
          </div>
        )}

        {error && <ErrorState message={error} onRetry={generate} />}

        {!busy && current && draft && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              {approved ? (
                <AIDraftBanner approved />
              ) : (
                <AIDraftBanner onApprove={approve}>
                  <span className="small">{L("শুধুমাত্র আপনি এই খসড়াটি দেখতে পাচ্ছেন।", "Only you can see this draft.")}</span>
                </AIDraftBanner>
              )}
            </div>

            <p className="small" style={{ color: "var(--mute)" }}>
              {lang === "bn"
                ? `সময়সীমা: ${fmtDate(current.periodStart, "bn")} – ${fmtDate(current.periodEnd, "bn")}${approved && current.approvedAt ? ` · অনুমোদিত: ${fmtDate(current.approvedAt, "bn")}` : ""}`
                : `Period: ${fmtDate(current.periodStart)} – ${fmtDate(current.periodEnd)}${approved && current.approvedAt ? ` · approved ${fmtDate(current.approvedAt)}` : ""}`}
            </p>

            <Part
              title={L("সারসংক্ষেপ", "Summary")}
              readOnly={approved}
              renderEdit={(done) => (
                <TextEdit
                  value={draft.summary}
                  onSave={(v) => {
                    setDraft({ ...draft, summary: v });
                    done();
                  }}
                  onCancel={done}
                />
              )}
            >
              <p className="sub" style={{ fontSize: 15, color: "var(--ink)" }}>{draft.summary}</p>
            </Part>

            <Part
              title={L("কার্যক্রম অনুযায়ী সম্পন্ন", "Completion by activity")}
              readOnly={approved}
              renderEdit={(done) => (
                <CompletionEdit
                  rows={draft.completion}
                  title={title}
                  onSave={(c) => {
                    setDraft({ ...draft, completion: c });
                    done();
                  }}
                  onCancel={done}
                />
              )}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {draft.completion.map((c) => (
                  <div key={c.activity_id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="grow h3" style={{ fontSize: 14 }}>
                      {title(c.activity_id)}
                    </span>
                    <div style={{ width: 80 }}>
                      <div className="pbar" style={{ height: 6 }}>
                        <i style={{ width: `${Math.min(100, (c.done / Math.max(1, c.planned)) * 100)}%` }} />
                      </div>
                      <span className="small">
                        {num(c.done, lang)}/{num(c.planned, lang)}
                      </span>
                    </div>
                    <span style={{ fontSize: 20 }}>{MOODS[c.top_mood]?.emoji}</span>
                  </div>
                ))}
              </div>
            </Part>

            <ListPart
              title={L("পর্যবেক্ষিত আচরণ ও ধরন", "Patterns spotted")}
              items={draft.patterns}
              readOnly={approved}
              onChange={(v) => setDraft({ ...draft, patterns: v })}
            />

            <Part
              title={L("অভিভাবকদের বক্তব্য", "Parent quotes")}
              readOnly={approved}
              renderEdit={(done) => (
                <ListEdit
                  items={draft.parent_quotes.map((q) => q.text)}
                  onCancel={done}
                  onSave={(v) => {
                    setDraft({
                      ...draft,
                      parent_quotes: v.map((t, i) => ({
                        text: t,
                        feedback_id: draft.parent_quotes[i]?.feedback_id ?? "",
                      })),
                    });
                    done();
                  }}
                />
              )}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {draft.parent_quotes.map((q, i) => {
                  const f = feedback.find((x) => x.id === q.feedback_id);
                  return (
                    <div key={i} style={{ borderLeft: "3px solid var(--p)", paddingLeft: 10 }}>
                      <p className="sub" style={{ fontSize: 14, fontStyle: "italic", color: "var(--ink)" }}>
                        &ldquo;{q.text}&rdquo;
                      </p>
                      {f?.type === "voice" ? (
                        <div style={{ marginTop: 6 }}>
                          <AudioPlayer src={f.mediaUrl} label={L("মূল অডিও", "Original audio")} />
                        </div>
                      ) : f ? (
                        <p className="small" style={{ marginTop: 2 }}>
                          {lang === "bn"
                            ? `${f.type === "photo" ? "ছবি" : f.type === "video" ? "ভিডিও" : "টেক্সট"} নোট থেকে · ${fmtDate(f.createdAt, "bn")}`
                            : `From a ${f.type} note · ${fmtDate(f.createdAt)}`}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Part>

            <ListPart
              title={L("উদ্বেগের বিষয়", "Concerns")}
              items={draft.concerns}
              readOnly={approved}
              onChange={(v) => setDraft({ ...draft, concerns: v })}
            />

            <ListPart
              title={L("সেশনের জন্য প্রশ্ন", "Questions for the visit")}
              items={draft.questions_for_visit}
              readOnly={approved}
              onChange={(v) => setDraft({ ...draft, questions_for_visit: v })}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {!approved && (
                <Button block size="lg" variant="primary" onClick={approve} icon={<Icon name="check" />}>
                  {L("রিপোর্ট অনুমোদন করুন", "Approve report")}
                </Button>
              )}
              {approved && (
                <Button block variant="soft" onClick={() => window.print()} icon={<Icon name="doc" />}>
                  {L("পিডিএফ ডাউনলোড", "Export PDF")}
                </Button>
              )}
            </div>

            {approved && (
              <ShareSummary
                key={current.id}
                report={current}
                child={child}
                draft={draft}
                activities={activities}
                onSaved={setCurrent}
              />
            )}
          </div>
        )}

        {!busy && !current && !error && (
          <EmptyState
            title={
              lang === "bn"
                ? `পরবর্তী সেশনের আগে তারিখ বেছে নিয়ে ${child.nickname}-এর রিপোর্ট তৈরি করুন।`
                : `Choose dates and generate ${child.nickname}’s report before the next session.`
            }
          />
        )}

        {past.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="sec">
              <h2 className="h2">{L("অনুমোদিত রিপোর্টসমূহ", "Approved reports")}</h2>
              <span className="small">{num(past.length, lang)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {past.map((r) => (
                <div
                  key={r.id}
                  onClick={() => view(r)}
                  className="row"
                  style={{ cursor: "pointer", alignItems: "center" }}
                  role="button"
                  tabIndex={0}
                >
                  <span className="ic t-blue" style={{ width: 36, height: 36, fontSize: 16 }}>
                    <Icon name="doc" />
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <span className="h3" style={{ fontSize: 14, display: "block" }}>
                      {fmtDate(r.periodStart, lang)} – {fmtDate(r.periodEnd, lang)}
                    </span>
                    <span
                      className="small"
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(r.final ?? r.draft).summary}
                    </span>
                  </div>
                  {r.parentSummaryShared && <span className="pill good">{L("শেয়ার করা হয়েছে", "Shared")}</span>}
                  <Icon name="next" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- editable parts ----------
function Part({
  title,
  children,
  readOnly,
  renderEdit,
}: {
  title: string;
  children: ReactNode;
  readOnly?: boolean;
  renderEdit: (done: () => void) => ReactNode;
}) {
  const { L } = useLang();
  const [editing, setEditing] = useState(false);
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p className="h3" style={{ margin: 0 }}>
          {title}
        </p>
        {!readOnly && !editing && (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            {L("সম্পাদনা", "Edit")}
          </Button>
        )}
      </div>
      {editing ? renderEdit(() => setEditing(false)) : children}
    </Card>
  );
}

function ListPart({
  title,
  items,
  readOnly,
  onChange,
}: {
  title: string;
  items: string[];
  readOnly?: boolean;
  onChange: (v: string[]) => void;
}) {
  const { L } = useLang();
  return (
    <Part
      title={title}
      readOnly={readOnly}
      renderEdit={(done) => (
        <ListEdit
          items={items}
          onSave={(v) => {
            onChange(v);
            done();
          }}
          onCancel={done}
        />
      )}
    >
      {items.length ? (
        <ul className="steps plain" style={{ padding: 0, margin: 0 }}>
          {items.map((t, i) => (
            <li key={i} style={{ fontSize: 14 }}>
              {t}
            </li>
          ))}
        </ul>
      ) : (
        <p className="small" style={{ color: "var(--mute)" }}>{L("নেই।", "None.")}</p>
      )}
    </Part>
  );
}

function SaveBar({
  onSave,
  onCancel,
  disabled,
}: {
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const { L } = useLang();
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <Button size="sm" variant="primary" onClick={onSave} disabled={disabled}>
        {L("সংরক্ষণ", "Save")}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        {L("বাতিল", "Cancel")}
      </Button>
    </div>
  );
}

function TextEdit({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(value);
  return (
    <div>
      <textarea
        autoFocus
        className="field"
        style={{ minHeight: 100, width: "100%", padding: 10, fontSize: 14 }}
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <SaveBar onSave={() => onSave(v.trim())} onCancel={onCancel} disabled={!v.trim()} />
    </div>
  );
}

function ListEdit({
  items,
  onSave,
  onCancel,
}: {
  items: string[];
  onSave: (v: string[]) => void;
  onCancel: () => void;
}) {
  const { L } = useLang();
  const [list, setList] = useState(items.length ? items : [""]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map((t, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            className="field"
            value={t}
            autoFocus={i === 0}
            onChange={(e) => setList(list.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <button
            type="button"
            aria-label={L("লাইন বাদ দিন", "Remove line")}
            onClick={() => setList(list.filter((_, j) => j !== i))}
            className="hbtn"
            style={{ width: 34, height: 34 }}
          >
            <Icon name="x" />
          </button>
        </div>
      ))}
      <Button size="sm" variant="ghost" onClick={() => setList([...list, ""])}>
        {L("+ লাইন যোগ করুন", "+ Add line")}
      </Button>
      <SaveBar
        onSave={() => onSave(list.map((x) => x.trim()).filter(Boolean))}
        onCancel={onCancel}
      />
    </div>
  );
}

function CompletionEdit({
  rows,
  title,
  onSave,
  onCancel,
}: {
  rows: ReportDraft["completion"];
  title: (id: string) => string;
  onSave: (r: ReportDraft["completion"]) => void;
  onCancel: () => void;
}) {
  const { lang, L } = useLang();
  const [list, setList] = useState(rows);
  const set = (i: number, patch: Partial<ReportDraft["completion"][number]>) =>
    setList(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map((r, i) => (
        <div key={r.activity_id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <span className="small grow" style={{ fontWeight: 600, minWidth: 120 }}>
            {title(r.activity_id)}
          </span>
          <input
            aria-label={L("সম্পন্ন", "Done")}
            type="number"
            min={0}
            className="field"
            style={{ width: 60, padding: 4 }}
            value={r.done}
            onChange={(e) => set(i, { done: Number(e.target.value) })}
          />
          <span className="small">{L("/", "of")}</span>
          <input
            aria-label={L("পরিকল্পিত", "Planned")}
            type="number"
            min={0}
            className="field"
            style={{ width: 60, padding: 4 }}
            value={r.planned}
            onChange={(e) => set(i, { planned: Number(e.target.value) })}
          />
          <select
            aria-label={L("সাধারণ অনুভূতি", "Most common face")}
            className="field"
            style={{ width: "auto", padding: 4 }}
            value={r.top_mood}
            onChange={(e) => set(i, { top_mood: e.target.value as Mood })}
          >
            {(Object.keys(MOODS) as Mood[]).map((m) => (
              <option key={m} value={m}>
                {MOODS[m].emoji} {MOODS[m]?.[lang] ?? MOODS[m]?.en}
              </option>
            ))}
          </select>
        </div>
      ))}
      <SaveBar onSave={() => onSave(list)} onCancel={onCancel} />
    </div>
  );
}

// ---------- parent summary ----------
function ShareSummary({
  report,
  child,
  draft,
  activities,
  onSaved,
}: {
  report: Report;
  child: Child;
  draft: ReportDraft;
  activities: Activity[];
  onSaved: (r: Report) => void;
}) {
  const { lang, L } = useLang();
  const toast = useToast();
  const logs = useLoad(() => feedbackService.listLogs(child.id, 60), [child.id]);
  const [text, setText] = useState<string | null>(report.parentSummary ?? null);
  const [busy, setBusy] = useState(false);

  const build = () => {
    const inRange = (logs.data ?? []).filter(
      (l) => l.date >= report.periodStart && l.date <= report.periodEnd
    );
    const days = new Set(inRange.map((l) => l.date)).size;
    const span = Math.max(
      1,
      Math.round((new Date(report.periodEnd).getTime() - new Date(report.periodStart).getTime()) / 86400000)
    );
    const best = [...draft.completion].sort(
      (a, b) => b.done / Math.max(1, b.planned) - a.done / Math.max(1, a.planned)
    )[0];
    const bestBn = activities.find((a) => a.id === best?.activity_id)?.title_bn;
    const name = nameIn(child.nickname, "bn");
    return `${name}-এর পরিবার ${bnNum(span)} দিনের মধ্যে ${bnNum(days)} দিন অনুশীলন করেছে।${
      bestBn ? ` "${bestBn}" সবচেয়ে ভালো হয়েছে।` : ""
    } চমৎকার কাজ! পরের সেশনে দেখা হবে।`;
  };

  const send = async () => {
    if (!text) return;
    setBusy(true);
    const saved = await feedbackService.saveReport({
      ...report,
      parentSummary: text.trim(),
      parentSummaryShared: true,
    });
    onSaved(saved);
    setBusy(false);
    toast(lang === "bn" ? "পরিবারে সারসংক্ষেপ পাঠানো হয়েছে" : "Summary sent to the family");
  };

  return (
    <Card>
      <p className="h3" style={{ marginBottom: 4 }}>
        {L("অভিভাবকদের সাথে সারসংক্ষেপ শেয়ার করুন", "Share a summary with the family")}
      </p>
      <p className="small" style={{ marginBottom: 10 }}>
        {L(
          "একটি সংক্ষিপ্ত ও ইতিবাচক বার্তা। পরিবার কেবল এটিই দেখতে পাবে — ওপরের ক্লিনিক্যাল রিপোর্ট দেখতে পাবে না।",
          "A short, positive Bangla message. The family sees only this — never the report above."
        )}
      </p>
      {report.parentSummaryShared ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p className="sub bn" style={{ background: "rgba(52, 199, 89, 0.08)", padding: 10, borderRadius: 12, fontSize: 15 }}>
            {report.parentSummary}
          </p>
          <span className="pill good">{L("পরিবারের সাথে শেয়ার করা হয়েছে", "Shared with the family")}</span>
        </div>
      ) : text === null ? (
        <Button
          variant="soft"
          loading={logs.loading}
          onClick={() => setText(build())}
          icon={<Icon name="spark" />}
        >
          {L("অভিভাবক সারসংক্ষেপ লিখুন", "Write parent summary")}
        </Button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            lang="bn"
            className="field bn"
            style={{ minHeight: 96, width: "100%", padding: 10, fontSize: 15 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="primary"
              onClick={send}
              loading={busy}
              disabled={!text.trim()}
              icon={<Icon name="send" />}
            >
              {L("পরিবারে পাঠান", "Send to family")}
            </Button>
            <Button variant="ghost" onClick={() => setText(null)}>
              {L("বাতিল", "Cancel")}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
