// Parts of BridgeAI that must behave the same on the server and in the browser-only preview:
// asking for help (with a safety check), the one-tap daily log, reminders and reports.
// Nothing here calls an AI. Advice only ever comes from strategies the therapist has already approved.

// ---------- one-tap daily log ----------
export const QUICK_TAGS = [
  { id: 'waited', en: 'Waited for a turn', bn: 'অপেক্ষা করেছে', win: 'Waited for a turn' },
  { id: 'praise', en: 'Happy with praise', bn: 'প্রশংসায় খুশি', win: 'Happy with praise' },
  { id: 'cried', en: 'Cried', bn: 'কান্না করেছে', struggle: 'Cried' },
  { id: 'noise', en: 'Uneasy at a noise', bn: 'শব্দে অস্বস্তি', struggle: 'Uneasy at a noise', trigger: 'Noise' },
  { id: 'sleep', en: 'Slept less', bn: 'ঘুম কম ছিল', struggle: 'Slept less', sleep: 'poor' },
];
export const MOOD_WORDS = {
  en: { good: 'A good day.', mixed: 'A mixed day.', hard: 'A hard day.' },
  bn: { good: 'আজ ভালো গেছে।', mixed: 'আজ মাঝামাঝি গেছে।', hard: 'আজ কঠিন ছিল।' },
};
const pick = (ids) => QUICK_TAGS.filter((t) => (ids || []).includes(t.id));
export const quickText = (ids, lang) => pick(ids).map((t) => t[lang === 'en' ? 'en' : 'bn']).join(lang === 'en' ? ', ' : '، ');
export const quickFields = (ids) => {
  const tags = pick(ids);
  return {
    wins: tags.map((t) => t.win).filter(Boolean),
    struggles: tags.map((t) => t.struggle).filter(Boolean),
    triggers: tags.map((t) => t.trigger).filter(Boolean),
    sleep: tags.some((t) => t.sleep) ? 'poor' : 'unknown',
  };
};
export const union = (a, b, n = 3) => [...new Set([...(a || []), ...(b || [])])].slice(0, n);

// ---------- asking for help ----------
// A parent in a hard moment should never get an invented answer. Serious words stop everything and send the parent to a person.
const SAFETY_EN = [
  /\b(hurt|hurting|hurts|harm|harming|harms)\b.{0,12}\b(himself|herself|themselves|themself)\b/i,
  /\bself[- ]?harm/i,
  /\b(bang|banging|bangs|bash|bashing|hit|hitting|hits)\b.{0,14}\bhead\b/i,
  /\b(bit|bite|biting|bites)\b.{0,10}\b(himself|herself|themselves)\b/i,
  /\bbleed/i,
  /\b(not breathing|stopped breathing|can'?t breathe|cannot breathe)\b/i,
  /\b(unconscious|passed out|seizure|choking)\b/i,
  /\bswallow/i,
  /\b(ran away|run away|runs away|went missing|is missing|got lost|is lost)\b/i,
];
const SAFETY_BN = ['আঘাত', 'মাথা ঠু', 'মাথা ঠোক', 'রক্ত', 'শ্বাস নিতে পারছে না', 'শ্বাস বন্ধ', 'দম বন্ধ', 'অজ্ঞান', 'খিঁচুনি', 'খিচুনি', 'হারিয়ে গেছে', 'পালিয়ে গেছে', 'গিলে ফেলেছে', 'নিজেকে কামড়'];
export const isSafety = (text) => SAFETY_EN.some((r) => r.test(text)) || SAFETY_BN.some((w) => text.includes(w));

/** Picks the therapist's approved strategy that best matches what the parent wrote, or says there is none. */
export function triage(text, strategies = []) {
  const said = String(text || '');
  if (isSafety(said)) return { kind: 'safety' };
  const low = said.toLowerCase();
  let best = null, top = 0;
  for (const s of strategies) {
    const hits = (s.keys?.en || []).filter((k) => new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(low)).length
      + (s.keys?.bn || []).filter((k) => said.includes(k)).length;
    if (hits > top) { top = hits; best = s; }
  }
  return best ? { kind: 'advice', strategy: best } : { kind: 'none' };
}

// ---------- the shared actions ----------
export const CARE_PATHS = ['/api/help', '/api/help/feedback', '/api/help/seen', '/api/reminder', '/api/report/send'];
const clean = (v, n = 400) => String(v ?? '').trim().slice(0, n);

export function careAction(db, path, body, { id, fail }) {
  const kid = (cid) => db.children.find((c) => c.id === cid) || fail('Child not found.');
  const help = (hid) => (db.helps || []).find((h) => h.id === hid) || fail('Request not found.');
  if (path === '/api/help') {
    const c = kid(body.childId), said = clean(body.text);
    if (!said) fail('Tell us what is happening first.');
    const r = triage(said, c.strategies);
    const req = { id: id('help'), childId: c.id, parent: c.parent, at: new Date().toISOString(), text: said, lang: body.lang === 'en' ? 'en' : 'bn', kind: r.kind, strategyId: r.strategy?.id || null, helped: null, seen: false };
    db.helps = [req, ...(db.helps || [])].slice(0, 100);
    return req;
  }
  if (path === '/api/help/feedback') {
    const h = help(body.id);
    h.helped = Boolean(body.helped);
    h.seen = h.helped; // "did not help" goes back to the therapist as something to look at
    return h;
  }
  if (path === '/api/help/seen') { help(body.id).seen = true; return { ok: true }; }
  if (path === '/api/reminder') {
    const c = kid(body.childId);
    db.reminders = [{ id: id('rem'), childId: c.id, at: new Date().toISOString() }, ...(db.reminders || [])].slice(0, 50);
    return { ok: true };
  }
  if (path === '/api/report/send') {
    const c = kid(body.childId);
    if (!db.summaries?.[c.id]) fail('Write the summary first; the report is built from it.');
    db.reports = [{ id: id('rep'), childId: c.id, at: new Date().toISOString() }, ...(db.reports || [])].slice(0, 50);
    return { ok: true };
  }
  return fail('Not available.');
}

/** An older saved copy of the sample data may lack what was added later. Fill the gaps without touching anything a person made. */
export function ensureCare(db, makeFresh) {
  const missing = !db.plans.some((p) => p.id === 'plan-rafi-0') || !db.helps || !db.centre?.team || !db.therapist?.phone || db.children.some((c) => !c.strategies || !c.phone || !c.invite);
  db.reminders ||= [];
  db.reports ||= [];
  if (!missing) return db;
  const fresh = makeFresh();
  db.helps ||= fresh.helps;
  for (const p of fresh.plans) if (p.id === 'plan-rafi-0' && !db.plans.some((x) => x.id === p.id)) db.plans.push(p);
  db.centre = { ...fresh.centre, ...db.centre, team: db.centre?.team || fresh.centre.team };
  db.therapist = { ...fresh.therapist, ...db.therapist };
  for (const c of db.children) {
    const f = fresh.children.find((x) => x.id === c.id);
    if (f) { c.phone ||= f.phone; c.invite ||= f.invite; c.strategies ||= f.strategies; }
  }
  return db;
}
