/* Browser-only mode. When the app is opened without its server (for example on GitHub Pages),
   this stands in for it: the sample week is kept in this browser's storage and no AI is called.
   Anything that would need AI uses a clearly labelled prepared sample, or says that AI is not connected. */
(() => {
  const KEY = 'bridgeai:preview-db';
  const NO_AI = 'This online preview has no AI connected.';
  let lib = null, db = null;
  const load = async () => {
    lib ||= await import('./seed-data.js');
    const first = !db;
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
    if (first && db) for (const l of db.logs || []) if (l.media) l.media = l.media.filter((m) => !m.url.startsWith('blob:')); // those were only in memory
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

  const saveProgress = (kind, input) => {
    child(input.childId);
    const e = lib.progressEntry(kind, input, lib.dayKey());
    db.progress ||= {};
    const p = (db.progress[input.childId] ||= { weeks: [], goals: [], atec: [], was: {} });
    if (kind === 'rate') {
      let g = p.goals.find((x) => x.text === e.goal);
      if (!g) p.goals.push((g = { text: e.goal, ratings: [] }));
      g.ratings = g.ratings.filter((r) => r.date !== e.rating.date).concat(e.rating);
    } else p.atec = p.atec.filter((r) => r.date !== e.row.date).concat(e.row);
  };

  const livePlanOf = (cid) => db.plans.filter((p) => p.childId === cid && p.status === 'approved').sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))[0];
  const actions = {
    '/api/child/share'({ id: cid }) { const c = child(cid); if (!Object.keys(c.profile || {}).length) fail('Fill in the profile before you share it.'); c.shared = lib.sharedProfile(c); },
    '/api/progress/suggest'({ childId }) {
      const c = child(childId), plan = livePlanOf(childId) || fail('Approve a plan first.');
      db.progress ||= {};
      const p = (db.progress[childId] ||= { weeks: [], goals: [], atec: [], was: {} });
      p.draft = { ...lib.suggestProgress(c, plan, p, db.summaries[childId], weekLogs(childId)), source: 'sample', model: 'Prepared sample', at: new Date().toISOString(), id: id('pg') };
      logAi({ step: 'Progress update suggested', child: c.name, model: 'Prepared sample', check: 'Waiting for the therapist to review', status: 'waiting', progressId: p.draft.id });
    },
    '/api/progress/approve'(input) {
      const p = db.progress?.[input.childId];
      if (!p?.draft) fail('There is no suggestion to approve.');
      const out = lib.approvedProgress(p.draft, input, lib.dayKey());
      for (const g of out.goals) {
        let row = p.goals.find((x) => x.text === g.text);
        if (!row) p.goals.push((row = { text: g.text, ratings: [] }));
        row.ratings = row.ratings.filter((r) => r.date !== out.date).concat({ date: out.date, level: g.level });
      }
      p.shared = { ...out, at: new Date().toISOString() };
      for (const e of db.aiLog) if (e.progressId === p.draft.id) Object.assign(e, { status: 'approved', check: `Approved by ${db.therapist.short} before the parent saw it` });
      delete p.draft;
    },
    '/api/progress/discard'({ childId }) {
      const p = db.progress?.[childId];
      if (p?.draft) { for (const e of db.aiLog) if (e.progressId === p.draft.id) Object.assign(e, { status: 'rejected', check: `Rejected by ${db.therapist.short}; never shown to the parent` }); delete p.draft; }
    },
    '/api/progress/rate'(input) { saveProgress('rate', input); },
    '/api/progress/atec'(input) { saveProgress('atec', input); },
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
    '/api/plan/manual'({ childId, goals, keys }) {
      child(childId);
      const texts = (goals || []).map((g) => clean(g, 160)).filter(Boolean).slice(0, 3);
      if (!texts.length) fail('Add at least one goal.');
      const planId = id('plan');
      db.plans = db.plans.filter((p) => !(p.childId === childId && p.status === 'draft'));
      db.plans.push({ id: planId, childId, createdAt: new Date().toISOString(), status: 'draft', source: 'manual', model: db.therapist.short, goals: texts.map((t, i) => ({ id: `g${i + 1}`, text: t })),
        activities: (keys || []).slice(0, 6).map((k, i) => lib.fromLibrary(k, `${planId}-a${i + 1}`, `g${Math.min(i, texts.length - 1) + 1}`)), story: lib.noStory() });
    },
    '/api/plan/update'({ planId, activities, pages, removeActivity, addCommon }) {
      const plan = draft(planId);
      if (plan.status !== 'draft') fail('Only a draft can be edited.');
      if (removeActivity) plan.activities = plan.activities.filter((a) => a.id !== removeActivity);
      if (addCommon) { if (plan.activities.length >= 6) fail('A plan can have up to 6 activities.'); plan.activities.push(lib.fromLibrary(addCommon, id(`${plan.id}-a`), plan.goals[0]?.id)); }
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
      if (!plan.activities.length) fail('Add at least one activity before you approve the plan.');
      plan.status = 'approved';
      plan.approvedAt = new Date().toISOString();
      for (const e of db.aiLog) if (e.planId === planId) Object.assign(e, { status: 'approved', check: `Approved by ${db.therapist.short}${plan.edited ? ' after editing' : ''} before the parent saw it` });
    },
    '/api/child/add'(input) {
      const child = lib.newChild(input, db.children);
      db.children.push(child);
      if (input.scan) logAi({ step: input.scan.kind === 'voice' ? 'Profile filled from a voice note' : 'Profile read from a report photo', child: child.name, model: 'Prepared sample', check: `Every answer checked by ${db.therapist.short} before the child was added`, status: 'approved' });
      return { ok: true, id: child.id };
    },
    '/api/child/scan'({ sample }) {
      return { ...lib.scanFields(lib.SAMPLE_SCAN), source: 'sample', model: 'Prepared sample' };
    },
    '/api/child/update'(input) { const child = db.children.find((c) => c.id === input.id); if (!child) fail('That child is not on your list.'); lib.editChild(child, input); return { ok: true, id: child.id }; },
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
    '/api/note'({ childId, text, lang, media }) {
      const c = child(childId), said = clean(text, 1200), files = (Array.isArray(media) ? media : []).slice(0, 4);
      if (!said && !files.length) fail('The note is empty.');
      const note = { id: id('log'), childId, date: lib.dayKey(), at: new Date().toISOString(), lang: lang === 'en' ? 'en' : 'bn', text: said, en: '', wins: [], struggles: [], triggers: [], mood: 'unknown', sleep: 'unknown', audio: null, analysed: false, source: 'parent' };
      if (Object.values(lib.EXAMPLE_NOTES).includes(said)) {
        Object.assign(note, lib.preparedNote(), { analysed: true });
        logAi({ step: 'Voice note organised', child: c.name, model: 'Prepared sample', check: 'Parent confirmed the words; the therapist sees the original note beside it', status: 'info' });
      }
      // in the preview, photos and videos live only in this browser tab's memory
      note.media = files.map((m) => ({ kind: m.mime.startsWith('video/') ? 'video' : 'photo', url: URL.createObjectURL(new Blob([Uint8Array.from(atob(m.data), (ch) => ch.charCodeAt(0))], { type: m.mime })) }));
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
