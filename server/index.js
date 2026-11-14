// BridgeAI prototype server: one small Node program, no packages to install.
import './env.js';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { seed, dayKey, daysAgo } from './seed.js';
import { ask, aiStatus, drawImage, ping } from './ai.js';
import { planPrompt, storySheetPrompt, notePrompt, transcribePrompt, summaryPrompt, ICONS } from './prompts.js';
import { CARE_PATHS, careAction, ensureCare, QUICK_TAGS, MOOD_WORDS, quickText, quickFields, union } from '../public/care-logic.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DATA = process.env.DATA_DIR || path.join(ROOT, 'data');
const MEDIA = path.join(DATA, 'media');
const DB_FILE = path.join(DATA, 'db.json');
const PORT = Number(process.env.PORT || 4900);
const HOST = process.env.HOST || '127.0.0.1';

fs.mkdirSync(MEDIA, { recursive: true });

// ---------- data ----------
let db;
try {
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
} catch {
  db = seed();
}
ensureCare(db, seed); // a db.json saved before Help, Alerts and the centre view existed gets what it lacks
let saveTimer = null;
function touch() {
  db.rev = (db.rev || 0) + 1;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => fs.writeFile(DB_FILE, JSON.stringify(db, null, 1), () => {}), 150);
}
touch();

const id = (p) => `${p}-${crypto.randomBytes(4).toString('hex')}`;
const child = (cid) => db.children.find((c) => c.id === cid);
const weekStart = () => dayKey(daysAgo(6));
const weekLogs = (cid) => db.logs.filter((l) => l.childId === cid && l.date >= weekStart()).sort((a, b) => a.at.localeCompare(b.at));
const livePlan = (cid) => db.plans.filter((p) => p.childId === cid && p.status === 'approved').sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))[0];
function weekGoals(cid) {
  const recent = daysAgo(10).toISOString(); // an older week's goals are not this week's
  const plans = db.plans.filter((p) => p.childId === cid && p.status === 'approved' && p.approvedAt >= recent).sort((a, b) => a.approvedAt.localeCompare(b.approvedAt)).slice(-2);
  return [...new Set(plans.flatMap((p) => p.goals.map((g) => g.text)))].slice(0, 5);
}
const text = (v, max = 400) => String(v ?? '').trim().slice(0, max);
const pair = (v, max) => ({ en: text(v?.en, max), bn: text(v?.bn, max) });
const list = (v, n, max = 120) => (Array.isArray(v) ? v : []).map((x) => text(x, max)).filter(Boolean).slice(0, n);

function logAi(entry) {
  db.aiLog.unshift({ id: id('ai'), at: new Date().toISOString(), ...entry });
  db.aiLog = db.aiLog.slice(0, 60);
}

function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

// ---------- actions ----------
async function generatePlan({ childId, goals }) {
  const c = child(childId);
  if (!c) throw fail(404, 'Child not found.');
  const goalTexts = list(goals, 3, 160);
  if (!goalTexts.length) throw fail(400, 'Add at least one goal.');

  const { data, model, cached } = await ask('plan', { ...planPrompt(c, goalTexts), cacheInput: { childId, goalTexts } });
  const goalObjs = goalTexts.map((t, i) => ({ id: `g${i + 1}`, text: t }));
  const planId = id('plan');
  const activities = (Array.isArray(data.activities) ? data.activities : []).slice(0, 4).map((a, i) => ({
    id: `${planId}-a${i + 1}`,
    goal: goalObjs[Math.min(goalObjs.length, Math.max(1, Number(a.goal) || 1)) - 1].id,
    icon: ICONS.includes(a.icon) ? a.icon : 'play',
    minutes: Math.min(15, Math.max(2, Number(a.minutes) || 5)),
    title: pair(a.title, 80),
    when: pair(a.when, 40),
    steps: { en: list(a.steps?.en, 4, 220), bn: list(a.steps?.bn, 4, 220) },
  }));
  const pages = (Array.isArray(data.story?.pages) ? data.story.pages : []).slice(0, 6).map((p) => ({ step: ['situation', 'feeling', 'do', 'ending'].includes(p.step) ? p.step : undefined, en: text(p.en, 300), bn: text(p.bn, 300), scene: text(p.scene, 300) }));
  if (!activities.length || pages.length < 3) throw fail(502, 'The AI answer was incomplete. Please try again.');

  // Only one draft per child at a time.
  db.plans = db.plans.filter((p) => !(p.childId === childId && p.status === 'draft'));
  const plan = {
    id: planId,
    childId,
    createdAt: new Date().toISOString(),
    status: 'draft',
    source: cached ? 'cache' : 'ai',
    model,
    goals: goalObjs,
    activities,
    story: { title: pair(data.story.title, 80), setting: text(data.story.setting, 300), pages, sheet: null, sheetStatus: 'making', cols: 3, rows: 2 },
  };
  db.plans.push(plan);
  logAi({ step: 'Home plan and story', child: c.name, model: cached ? `${model} (saved answer)` : model, check: 'Waiting for the therapist to review', status: 'waiting', planId: plan.id });
  touch();
  drawStory(plan.id);
  return plan;
}

function drawStory(planId) {
  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) return;
  const c = child(plan.childId);
  const pages = [...plan.story.pages];
  while (pages.length < 6) pages.push({ scene: `${c.name} smiling calmly.` });
  const file = `story-${plan.id}.png`;
  plan.story.sheetStatus = 'making';
  touch();
  drawImage(storySheetPrompt(c, { ...plan.story, pages }), path.join(MEDIA, file)).then(
    () => {
      const p = db.plans.find((x) => x.id === planId);
      if (!p) return;
      p.story.sheet = `/media/${file}`;
      p.story.sheetStatus = 'ready';
      logAi({ step: 'Story pictures', child: c.name, model: 'gpt-image-2', check: p.status === 'approved' ? 'Arrived after approval; shown to the therapist first' : 'Waiting for the therapist to review', status: 'waiting', planId });
      touch();
    },
    () => {
      const p = db.plans.find((x) => x.id === planId);
      if (!p) return;
      p.story.sheetStatus = 'failed';
      touch();
    },
  );
}

function updatePlan({ planId, activities, pages, title, removeActivity }) {
  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) throw fail(404, 'Plan not found.');
  if (plan.status !== 'draft') throw fail(400, 'Only a draft can be edited.');
  if (removeActivity) plan.activities = plan.activities.filter((a) => a.id !== removeActivity);
  for (const patch of Array.isArray(activities) ? activities : []) {
    const a = plan.activities.find((x) => x.id === patch.id);
    if (!a) continue;
    if (patch.title) a.title = pair(patch.title, 80);
    if (patch.steps) a.steps = { en: list(patch.steps.en, 4, 220), bn: list(patch.steps.bn, 4, 220) };
  }
  if (title) plan.story.title = pair(title, 80);
  (Array.isArray(pages) ? pages : []).forEach((patch, i) => {
    const p = plan.story.pages[i];
    if (p && patch) Object.assign(p, { en: text(patch.en ?? p.en, 300), bn: text(patch.bn ?? p.bn, 300) });
  });
  plan.edited = true;
  touch();
  return plan;
}

function approvePlan({ planId }) {
  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) throw fail(404, 'Plan not found.');
  plan.status = 'approved';
  plan.approvedAt = new Date().toISOString();
  for (const e of db.aiLog) {
    if (e.planId === planId) {
      e.status = 'approved';
      e.check = `Approved by ${db.therapist.short}${plan.edited ? ' after editing' : ''} before the parent saw it`;
    }
  }
  touch();
  return plan;
}

function discardPlan({ planId }) {
  const plan = db.plans.find((p) => p.id === planId);
  if (plan?.status !== 'draft') throw fail(400, 'Only a draft can be discarded.');
  db.plans = db.plans.filter((p) => p.id !== planId);
  db.aiLog = db.aiLog.map((e) => (e.planId === planId ? { ...e, status: 'rejected', check: `Rejected by ${db.therapist.short}; never shown to the parent` } : e));
  touch();
  return { ok: true };
}

function setDone({ childId, activityId, done }) {
  const date = dayKey();
  db.done = db.done.filter((d) => !(d.childId === childId && d.activityId === activityId && d.date === date));
  if (done) db.done.push({ childId, activityId, date });
  touch();
  return { ok: true };
}

async function transcribe({ audio, mime }) {
  if (!audio) throw fail(400, 'No audio received.');
  const { data, model } = await ask('transcribe', { ...transcribePrompt(), audio: { mime: text(mime, 40) || 'audio/webm', data: audio } });
  return { text: text(data.text, 1200), lang: data.lang === 'bn' ? 'bn' : 'en', model };
}

async function addNote({ childId, text: raw, lang, audio, mime, heardBy, mood, tags }) {
  const c = child(childId);
  if (!c) throw fail(404, 'Child not found.');
  // The one-tap log: a face and a few tags are enough. What the parent chose is theirs, so it is kept as chosen.
  const chosen = ['good', 'mixed', 'hard'].includes(mood) ? mood : null;
  const picked = (Array.isArray(tags) ? tags : []).filter((x) => QUICK_TAGS.some((t) => t.id === x));
  const L = lang === 'en' ? 'en' : 'bn';
  const typed = text(raw, 1200);
  const said = typed || quickText(picked, L) || (chosen ? MOOD_WORDS[L][chosen] : '');
  if (!said) throw fail(400, 'The note is empty.');
  const quick = quickFields(picked);
  const note = { id: id('log'), childId, date: dayKey(), at: new Date().toISOString(), lang: L, text: said, en: '', ...quick, mood: chosen || 'unknown', audio: null, analysed: false, source: 'parent' };
  if (!typed) {
    // Nothing to read or translate, so there is nothing for the AI to do.
    Object.assign(note, { en: quickText(picked, 'en') || MOOD_WORDS.en[chosen], analysed: true, quick: true });
    db.logs.push(note);
    touch();
    return note;
  }
  if (audio) {
    const ext = /mp4|m4a|aac/.test(mime || '') ? 'm4a' : /ogg/.test(mime || '') ? 'ogg' : 'webm';
    fs.writeFileSync(path.join(MEDIA, `${note.id}.${ext}`), Buffer.from(audio, 'base64'));
    note.audio = `/media/${note.id}.${ext}`;
  }
  db.logs.push(note);
  touch();

  try {
    const { data, model, cached } = await ask('note', { ...notePrompt(c, weekGoals(childId), said), cacheInput: { childId, said } });
    Object.assign(note, {
      text: text(data.clean, 1200) || said,
      lang: data.lang === 'en' ? 'en' : data.lang === 'bn' ? 'bn' : note.lang,
      en: text(data.en, 1200),
      wins: union(quick.wins, list(data.wins, 3)),
      struggles: union(quick.struggles, list(data.struggles, 3)),
      triggers: union(quick.triggers, list(data.triggers, 3)),
      mood: chosen || (['good', 'mixed', 'hard'].includes(data.mood) ? data.mood : 'unknown'),
      sleep: quick.sleep === 'poor' ? 'poor' : ['good', 'poor'].includes(data.sleep) ? data.sleep : 'unknown',
      analysed: true,
    });
    logAi({ step: 'Voice note organised', child: c.name, model: `${heardBy ? heardBy + ' + ' : ''}${model}${cached ? ' (saved answer)' : ''}`, check: 'Parent confirmed the words; the therapist sees the original note beside it', status: 'info' });
  } catch (e) {
    note.aiError = e.message; // the note is still saved and shown to the therapist as spoken
  }
  touch();
  return note;
}

async function makeSummary({ childId }) {
  const c = child(childId);
  if (!c) throw fail(404, 'Child not found.');
  const plan = livePlan(childId);
  const logs = weekLogs(childId);
  if (!plan) throw fail(400, 'Approve a plan first.');
  if (!logs.length) throw fail(400, 'There are no parent notes this week yet.');
  const doneCount = db.done.filter((d) => d.childId === childId && d.date >= weekStart()).length;
  const { data, model, cached } = await ask('summary', {
    ...summaryPrompt(c, weekGoals(childId), logs, `${doneCount}`),
    cacheInput: { childId, logs: logs.map((l) => l.text) },
  });
  const summary = {
    childId,
    generatedAt: new Date().toISOString(),
    notesCount: logs.length,
    source: cached ? 'cache' : 'ai',
    model,
    headline: text(data.headline, 400),
    goals: (Array.isArray(data.goals) ? data.goals : []).slice(0, 5).map((g) => ({ goal: text(g.goal, 200), status: ['improving', 'steady', 'needs_support'].includes(g.status) ? g.status : 'steady', evidence: text(g.evidence, 400) })),
    patterns: (Array.isArray(data.patterns) ? data.patterns : []).slice(0, 4).map((p) => ({ title: text(p.title, 80), days: Math.max(1, Number(p.days) || 1), detail: text(p.detail, 300) })),
    suggestions: list(data.suggestions, 3, 240),
    askParent: list(data.askParent, 3, 240),
    parentMessage: pair(data.parentMessage, 300),
    parentMessageSent: false,
  };
  db.summaries[childId] = summary;
  logAi({ step: 'Weekly summary', child: c.name, model: cached ? `${model} (saved answer)` : model, check: 'Read by the therapist against the original notes; not shown to the parent', status: 'info' });
  touch();
  return summary;
}

function sendMessage({ childId }) {
  const s = db.summaries[childId];
  if (!s) throw fail(404, 'No summary yet.');
  s.parentMessageSent = true;
  touch();
  return { ok: true };
}

function reset() {
  for (const f of fs.readdirSync(MEDIA)) if (/^log-/.test(f)) fs.rmSync(path.join(MEDIA, f), { force: true });
  db = { ...seed(), rev: db.rev };
  touch();
  return { ok: true };
}

const actions = {
  '/api/plan/generate': generatePlan,
  '/api/plan/update': updatePlan,
  '/api/plan/approve': approvePlan,
  '/api/plan/discard': discardPlan,
  '/api/plan/redraw': ({ planId }) => (drawStory(planId), { ok: true }),
  '/api/done': setDone,
  '/api/transcribe': transcribe,
  '/api/note': addNote,
  '/api/summary': makeSummary,
  '/api/summary/send': sendMessage,
  '/api/reset': reset,
};
// Help, reminders and reports share their code with the browser-only preview.
for (const p of CARE_PATHS) actions[p] = (body) => { const out = careAction(db, p, body, { id, fail: (m) => { throw fail(400, m); } }); touch(); return out; };

// ---------- http ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.webm': 'audio/webm', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(data);
}

function serveFile(res, base, rel) {
  const file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base + path.sep)) return send(res, 403, { error: 'Not allowed.' });
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, { error: 'Not found.' });
    const big = /\.(png|jpg|woff2)$/.test(file);
    send(res, 200, buf, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': big ? 'max-age=3600' : 'no-store' });
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 25 << 20) return reject(fail(413, 'That recording is too large.'));
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(fail(400, 'Bad request.'));
      }
    });
    req.on('error', reject);
  });
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    try {
      if (req.method === 'GET' && url.pathname === '/api/state') {
        if (Number(url.searchParams.get('rev')) === db.rev) return send(res, 200, { same: true, ai: aiStatus() });
        return send(res, 200, { ...db, today: dayKey(), weekStart: weekStart(), ai: aiStatus() });
      }
      if (req.method === 'POST' && actions[url.pathname]) {
        return send(res, 200, await actions[url.pathname](await readBody(req)));
      }
      if (req.method !== 'GET') return send(res, 405, { error: 'Not allowed.' });
      if (url.pathname.startsWith('/media/')) return serveFile(res, MEDIA, decodeURIComponent(url.pathname.slice(7)));
      const rel = url.pathname === '/' ? 'index.html' : url.pathname === '/demo' ? 'demo.html' : decodeURIComponent(url.pathname.slice(1));
      return serveFile(res, PUBLIC, rel);
    } catch (e) {
      if (!e.status && !e.aiDown) console.error(e);
      send(res, e.status || (e.aiDown ? 503 : 500), { error: e.message || 'Something went wrong.', aiDown: Boolean(e.aiDown) });
    }
  })
  .listen(PORT, HOST, () => {
    console.log(`BridgeAI is running:  http://localhost:${PORT}   (pitch view: http://localhost:${PORT}/demo)`);
    ping().then(() => {
      const s = aiStatus().chat;
      console.log(s.ok ? `AI connected: ${s.label} (${s.model})` : `AI NOT connected: ${s.error}. Add a key to bridgeai/.env (see .env.example).`);
    });
  });
