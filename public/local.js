/* Browser-only mode. When the app is opened without its server (for example on GitHub Pages),
   this stands in for it: the sample week is kept in this browser's storage and no AI is called.
   Anything that would need AI uses a clearly labelled prepared sample, or says that AI is not connected. */
(() => {
  const KEY = 'bridgeai:preview-db';
  const NO_AI = 'This online preview has no AI connected.';
  let lib = null, db = null;
  const load = async () => {
    lib ||= await import('./seed-data.js');
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
    const today = lib.dayKey();
    if (!db || db.seededOn !== today) { db = { ...lib.seed(), seededOn: today, rev: (db?.rev || 0) + 1 }; save(); } // a fresh week each day
    return db;
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
  const touch = () => { db.rev = (db.rev || 0) + 1; save(); };
  const id = (p) => `${p}-${Math.random().toString(16).slice(2, 10)}`;
  const fail = (m) => { throw new Error(m); };
  const ai = () => ({ chat: { configured: false, ok: false, model: null, label: null, error: 'online preview' }, stt: false, image: false, preview: true });
  const child = (cid) => db.children.find((c) => c.id === cid) || fail('Child not found.');
  const weekStart = () => lib.dayKey(lib.daysAgo(6));
  const weekLogs = (cid) => db.logs.filter((l) => l.childId === cid && l.date >= weekStart()).sort((a, b) => a.at.localeCompare(b.at));
  const logAi = (e) => { db.aiLog.unshift({ id: id('ai'), at: new Date().toISOString(), ...e }); db.aiLog = db.aiLog.slice(0, 60); };
  const draft = (planId) => db.plans.find((p) => p.id === planId) || fail('Plan not found.');
  const clean = (v, n = 400) => String(v ?? '').trim().slice(0, n);

  const actions = {
    '/api/plan/generate'({ childId, goals }) {
      const c = child(childId), texts = (goals || []).map((g) => clean(g, 160)).filter(Boolean);
      if (!texts.length) fail('Add at least one goal.');
      if (childId !== 'rafi' || !texts.some((g) => g.toLowerCase() === lib.EXAMPLE_GOAL.toLowerCase()))
        fail(`${NO_AI} To see a prepared sample draft, open Rafi and choose the goal “${lib.EXAMPLE_GOAL}”.`);
      const made = lib.preparedPlan(), planId = id('plan');
      db.plans = db.plans.filter((p) => !(p.childId === childId && p.status === 'draft'));
      db.plans.push({
        id: planId, childId, createdAt: new Date().toISOString(), status: 'draft', source: 'sample', model: 'Prepared sample',
        goals: [{ id: 'g1', text: lib.EXAMPLE_GOAL }],
        activities: made.activities.map((a, i) => ({ ...a, id: `${planId}-a${i + 1}`, goal: 'g1' })),
        story: { ...made.story, sheet: null, sheetStatus: 'none', cols: 3, rows: 2 },
      });
      logAi({ step: 'Home plan and story', child: c.name, model: 'Prepared sample', check: 'Waiting for the therapist to review', status: 'waiting', planId });
    },
    '/api/plan/update'({ planId, activities, pages, removeActivity }) {
      const plan = draft(planId);
      if (plan.status !== 'draft') fail('Only a draft can be edited.');
      if (removeActivity) plan.activities = plan.activities.filter((a) => a.id !== removeActivity);
      for (const patch of activities || []) {
        const a = plan.activities.find((x) => x.id === patch.id);
        if (!a) continue;
        if (patch.title) a.title = { en: clean(patch.title.en, 80), bn: clean(patch.title.bn, 80) };
        if (patch.steps) a.steps = { en: (patch.steps.en || []).slice(0, 4), bn: (patch.steps.bn || []).slice(0, 4) };
      }
      (pages || []).forEach((patch, i) => { const p = plan.story.pages[i]; if (p && patch) Object.assign(p, { en: clean(patch.en ?? p.en, 300), bn: clean(patch.bn ?? p.bn, 300) }); });
      plan.edited = true;
    },
    '/api/plan/approve'({ planId }) {
      const plan = draft(planId);
      plan.status = 'approved';
      plan.approvedAt = new Date().toISOString();
      for (const e of db.aiLog) if (e.planId === planId) Object.assign(e, { status: 'approved', check: `Approved by ${db.therapist.short}${plan.edited ? ' after editing' : ''} before the parent saw it` });
    },
    '/api/plan/discard'({ planId }) {
      db.plans = db.plans.filter((p) => p.id !== planId);
      db.aiLog = db.aiLog.map((e) => (e.planId === planId ? { ...e, status: 'rejected', check: `Rejected by ${db.therapist.short}; never shown to the parent` } : e));
    },
    '/api/plan/redraw'() { fail(`${NO_AI} Pictures are drawn when the app runs with its server.`); },
    '/api/done'({ childId, activityId, done }) {
      const date = lib.dayKey();
      db.done = db.done.filter((d) => !(d.childId === childId && d.activityId === activityId && d.date === date));
      if (done) db.done.push({ childId, activityId, date });
    },
    '/api/transcribe'() { fail(NO_AI); },
    '/api/note'({ childId, text, lang }) {
      const c = child(childId), said = clean(text, 1200);
      if (!said) fail('The note is empty.');
      const note = { id: id('log'), childId, date: lib.dayKey(), at: new Date().toISOString(), lang: lang === 'en' ? 'en' : 'bn', text: said, en: '', wins: [], struggles: [], triggers: [], mood: 'unknown', sleep: 'unknown', audio: null, analysed: false, source: 'parent' };
      if (Object.values(lib.EXAMPLE_NOTES).includes(said)) {
        Object.assign(note, lib.preparedNote(), { analysed: true });
        logAi({ step: 'Voice note organised', child: c.name, model: 'Prepared sample', check: 'Parent confirmed the words; the therapist sees the original note beside it', status: 'info' });
      }
      db.logs.push(note);
      return note;
    },
    '/api/summary'({ childId }) {
      const c = child(childId), logs = weekLogs(childId);
      if (childId !== 'rafi') fail(`${NO_AI} The prepared sample summary is for Rafi.`);
      if (!logs.length) fail('There are no parent notes this week yet.');
      db.summaries[childId] = lib.preparedSummary(lib.seed().summaries.rafi, logs);
      logAi({ step: 'Weekly summary', child: c.name, model: 'Prepared sample', check: 'Read by the therapist against the original notes; not shown to the parent', status: 'info' });
    },
    '/api/summary/send'({ childId }) { (db.summaries[childId] || fail('No summary yet.')).parentMessageSent = true; },
    '/api/reset'() { db = { ...lib.seed(), seededOn: lib.dayKey(), rev: db.rev }; },
  };

  window.LocalBackend = {
    async state(rev) {
      await load();
      return Number(rev) === db.rev ? { same: true, ai: ai() } : { ...db, today: lib.dayKey(), weekStart: weekStart(), ai: ai() };
    },
    async post(path, body) {
      await load();
      const run = actions[path] || (() => fail('Not available in the online preview.'));
      const out = run(body || {});
      touch();
      return out || { ok: true };
    },
  };
})();
