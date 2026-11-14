/* BridgeAI: the screens added from the Bangla mockup.
   Parent: Help ("what do I do right now?") with a safety stop, and a one-tap daily log.
   Doctor: Alerts. Centre manager: dashboard, team and parent report. Everyone: the privacy promises.
   Loaded after app.js, so it shares its globals (S, t, I, M, act, render …). */

let QUICK_TAGS = [];
import('./care-logic.js').then((m) => { QUICK_TAGS = m.QUICK_TAGS; if (S.db) render(); }); // the same five tags the server understands

Object.assign(T.en, {
  nHelp: 'Help',
  helpT: 'Need help?', helpHello: (c) => `What is happening with ${c}?`, helpSub: (d) => `Say it or type it. You get steps from ${d}’s plan, nothing else.`,
  helpPh: 'For example: screaming at a loud noise…', helpCommon: 'Common moments', helpMic: 'Say it',
  helpOnly: (d) => `Advice comes only from strategies ${d} has approved.`,
  ansFrom: (d) => `From ${d}’s plan`, ansSay: 'You can say', ansLater: 'For later', ansStory: 'Read this week’s story together', worked: 'Did it help?', yes: 'Yes', no: 'No',
  toldDr: (d) => `${d} has been told it did not help.`, ansHome: 'Back to home',
  noneT: 'No approved tip for this yet', noneB: (d) => `${d} has been asked to look at this. If it cannot wait, call ${d}.`,
  safeT: 'This may be serious', safeB: 'The AI will not give advice here. Please talk to a person now.', callDr: (d) => `Call ${d}`, call999: 'National emergency 999',
  safeNow: 'Right now', safeNowB: 'Move hard or sharp things out of reach. Stay calm and stay close.', safeTold: (d) => `${d} was told automatically`,
  remind: (d) => `A gentle reminder from ${d}`, remindB: 'A 30-second note helps before the next session.',
  report: 'Progress report', reportFrom: (c) => `From ${c}`,
  fGood: 'Good', fMixed: 'Mixed', fHard: 'Hard',
  privacy: 'Privacy promises', privT: 'Your information is safe', privSub: 'Four promises we keep',
  p1: 'No photos or videos of your child are ever taken.', p2: 'Only your notes and the therapist’s plan are kept.',
  p3: 'The AI never diagnoses. Every tip is approved by the therapist first.', p4: 'In an emergency the app sends you to a person, not to the AI.',
});
Object.assign(T.bn, {
  nHelp: 'সাহায্য',
  helpT: 'সাহায্য চাই', helpHello: (c) => `${c}-এর কী হচ্ছে?`, helpSub: (d) => `বলুন অথবা লিখুন। শুধু ${d}-এর পরিকল্পনা থেকে ধাপ পাবেন।`,
  helpPh: 'যেমন: জোরে শব্দে চিৎকার করছে…', helpCommon: 'সাধারণ পরিস্থিতি', helpMic: 'বলুন',
  helpOnly: (d) => `পরামর্শ আসে শুধু ${d}-এর অনুমোদিত কৌশল থেকে।`,
  ansFrom: (d) => `${d}-এর পরিকল্পনা থেকে`, ansSay: 'আপনি বলতে পারেন', ansLater: 'পরে যা করবেন', ansStory: 'এই সপ্তাহের গল্পটি একসাথে পড়ুন', worked: 'কাজে লেগেছে?', yes: 'হ্যাঁ', no: 'না',
  toldDr: (d) => `${d}-কে জানানো হয়েছে যে কাজে লাগেনি।`, ansHome: 'হোমে ফিরি',
  noneT: 'এর জন্য এখনো অনুমোদিত কোনো পরামর্শ নেই', noneB: (d) => `${d}-কে বিষয়টি দেখতে বলা হয়েছে। দেরি করা না গেলে ${d}-কে কল করুন।`,
  safeT: 'এটা গুরুতর হতে পারে', safeB: 'এই অবস্থায় AI কোনো পরামর্শ দেবে না। এখনই একজন মানুষের সাথে কথা বলুন।', callDr: (d) => `${d}-কে কল করুন`, call999: 'জাতীয় জরুরি সেবা ৯৯৯',
  safeNow: 'এই মুহূর্তে', safeNowB: 'শক্ত বা ধারালো জিনিস নাগালের বাইরে সরিয়ে দিন। শান্ত থাকুন, পাশে থাকুন।', safeTold: (d) => `${d}-কে স্বয়ংক্রিয়ভাবে জানানো হয়েছে`,
  remind: (d) => `${d}-এর নরম রিমাইন্ডার`, remindB: 'পরের সেশনের আগে ৩০ সেকেন্ডের একটি নোট অনেক কাজে দেয়।',
  report: 'অগ্রগতির রিপোর্ট', reportFrom: (c) => `${c}-এর পক্ষ থেকে`,
  fGood: 'ভালো', fMixed: 'মাঝামাঝি', fHard: 'কঠিন',
  privacy: 'গোপনীয়তার প্রতিশ্রুতি', privT: 'আপনার তথ্য নিরাপদ', privSub: 'আমাদের ৪টি প্রতিশ্রুতি',
  p1: 'আপনার সন্তানের কোনো ছবি বা ভিডিও কখনো নেওয়া হয় না।', p2: 'শুধু আপনার নোট আর থেরাপিস্টের পরিকল্পনা রাখা হয়।',
  p3: 'AI কখনো রোগ নির্ণয় করে না। প্রতিটি পরামর্শ আগে থেরাপিস্ট অনুমোদন করেন।', p4: 'জরুরি অবস্থায় অ্যাপ আপনাকে AI-এর কাছে নয়, একজন মানুষের কাছে পাঠায়।',
});

// ---------- small helpers ----------
const helps = () => S.db.helps || [];
const needsDoctor = (h) => !h.seen && (h.kind !== 'advice' || h.helped === false); // urgent, no approved tip, or "did not help"
const alertCount = () => helps().filter(needsDoctor).length;
const urgentCount = () => helps().filter((h) => h.kind === 'safety' && !h.seen).length;
const agoText = (iso) => { const m = Math.max(1, Math.round((Date.now() - new Date(iso)) / 60000)); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : m < 2880 ? 'Yesterday' : `${Math.round(m / 1440)} days ago`; };
const telHref = (p) => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
const daysSinceNote = (cid) => { const d = S.db.logs.filter((x) => x.childId === cid).map((x) => x.date).sort().pop(); return d ? Math.round((new Date(S.db.today + 'T12:00:00') - new Date(d + 'T12:00:00')) / 86400000) : 99; };
const quietKids = () => kids().filter((c) => livePlan(c.id) && daysSinceNote(c.id) >= 3);
const sentToday = (list, cid) => (list || []).some((r) => r.childId === cid && dkey(new Date(r.at)) === S.db.today);
const initials = (name) => name.replace(/^Dr\.?\s+/, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('');

// ---------- parent: help ----------
const HELP_CHIPS = [
  { ic: 'sound', tint: 't-orange', en: 'Screaming at a noise', bn: 'শব্দে চিৎকার', say: { en: 'Screaming and covering ears at a loud noise', bn: 'শব্দে কান চেপে চিৎকার করছে' } },
  { ic: 'food', tint: 't-green', en: 'Will not eat', bn: 'খেতে চাইছে না', say: { en: 'Does not want to eat', bn: 'খেতে চাইছে না' } },
  { ic: 'sleep', tint: 't-purple', en: 'Will not sleep', bn: 'ঘুমাতে চাইছে না', say: { en: 'Will not go to sleep at night', bn: 'রাতে ঘুমাতে চাইছে না' } },
  { ic: 'wait', tint: 't-blue', en: 'Cannot wait', bn: 'অপেক্ষা করতে পারছে না', say: { en: 'Cannot wait for a turn', bn: 'পালার জন্য অপেক্ষা করতে পারছে না' } },
  { ic: 'alert', tint: 't-pink', en: 'Hurting themselves', bn: 'নিজেকে আঘাত করছে', say: { en: 'Hurting themselves', bn: 'নিজেকে আঘাত করছে' } },
];
let H = null, hrec = null;
const hs = () => (H ||= { text: '', reqId: null, busy: false, msg: '', rec: false });
const SpeechIn = window.SpeechRecognition || window.webkitSpeechRecognition;

function parentHelp(c) {
  const h = hs(), name = S.lang === 'bn' ? c.name_bn : c.name, dr = S.db.therapist.short;
  return `<div class="scroll softbg pad"><div class="bar"><h1 class="h2 grow" style="padding-left:4px">${t('helpT')}</h1>${langSeg()}</div><div class="in">
    <div class="card helphero"><div class="m">${M.tiger({ mood: 'hi' })}</div><div><p class="h2" style="font-size:18px">${t('helpHello', esc(name))}</p><p class="small" style="margin-top:3px">${t('helpSub', esc(dr))}</p></div></div>
    ${h.msg ? `<div class="err">${esc(h.msg)}</div>` : ''}
    <div class="ask" style="margin:0 0 4px"><textarea id="htext" lang="${S.lang}" placeholder="${t('helpPh')}">${esc(h.text)}</textarea>
      <div class="tools">${SpeechIn ? `<button class="rb ${h.rec ? 'rec' : ''}" data-act="hmic" aria-label="${t('helpMic')}">${h.rec ? I.stop : I.mic}</button>` : ''}<span class="grow small">${h.rec ? t('listening') : ''}</span>
        <button class="rb send" data-act="hsend" aria-label="${t('helpT')}" ${h.busy ? 'disabled' : ''}>${I.arrow}</button></div></div>
    <div class="sec"><h2 class="h2">${t('helpCommon')}</h2></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">${HELP_CHIPS.map((x, i) => `<button class="chipb" data-act="hchip" data-i="${i}"><span class="ic ${x.tint}">${I[x.ic]}</span>${esc(x[S.lang])}</button>`).join('')}</div>
    <p class="small" style="display:flex;gap:8px;margin-top:18px;padding:0 4px">${I.shield}<span>${t('helpOnly', esc(dr))}</span></p>
  </div></div>`;
}
function stopDictation() { try { hrec?.stop(); } catch {} hrec = null; if (H) H.rec = false; }
async function sendHelp(preset) {
  const h = hs();
  grabText();
  const said = (preset ?? h.text).trim();
  if (!said) return $('#htext')?.focus();
  stopDictation();
  h.busy = true; h.msg = '';
  try {
    const req = await api('/api/help', { childId: PARENT_CHILD, text: said, lang: S.lang });
    h.reqId = req.id; h.text = ''; h.busy = false;
    await pull();
    S.push = 'helpans';
  } catch (e) { h.busy = false; h.msg = e.message; }
  render(true);
}
function helpAnswer(c) {
  const req = helps().find((x) => x.id === H?.reqId);
  if (!req) { S.push = null; return parentHelp(c); }
  const dr = S.db.therapist.short, plan = livePlan(c.id);
  const bar = `<div class="bar"><button class="hbtn" data-act="back" aria-label="Back">${I.back}</button><span class="grow"></span>${langSeg()}</div>`;
  const you = `<p class="you" lang="${req.lang}">${esc(req.text)}</p>`;
  const wrap = (inner) => `<div class="scroll softbg pad" style="padding-bottom:28px">${bar}<div class="in">${inner}</div></div>`;
  if (req.kind === 'safety') {
    return wrap(`<div class="alertcard" style="padding:20px"><span class="ic" style="width:56px;height:56px;font-size:28px;background:#e0213f;color:#fff">${I.alert}</span>
        <h1 class="h1" style="font-size:26px;margin-top:12px">${t('safeT')}</h1><p class="sub" style="margin-top:8px;font-size:16px">${t('safeB')}</p></div>
      <a class="btn danger big wide" href="${telHref(S.db.therapist.phone)}">${I.phone} ${t('callDr', esc(dr))}</a>
      <a class="btn line wide" style="margin-top:10px;height:54px" href="tel:999">${t('call999')}</a>
      <div class="card" style="margin-top:14px"><p class="h3">${t('safeNow')}</p><p class="sub" style="margin-top:6px;font-size:15.5px">${t('safeNowB')}</p></div>
      <div class="note2 live"><span class="grow" style="display:flex;gap:8px;align-items:center">${I.check} ${t('safeTold', esc(dr))}</span></div>`);
  }
  if (req.kind === 'none') {
    return wrap(`${you}<div class="card empty"><div class="m">${M.ele({ mood: 'calm' })}</div><p class="h2" style="color:var(--ink)">${t('noneT')}</p><p style="margin-top:6px">${t('noneB', esc(dr))}</p></div>
      <a class="btn soft wide" href="${telHref(S.db.therapist.phone)}">${I.phone} ${t('callDr', esc(dr))}</a>
      <button class="btn p wide" style="margin-top:10px" data-act="tab" data-tab="home">${t('ansHome')}</button>`);
  }
  const s = (c.strategies || []).find((x) => x.id === req.strategyId);
  if (!s) { S.push = null; return parentHelp(c); }
  return wrap(`${you}<span class="pill good">${I.shield} ${t('ansFrom', esc(dr))}</span>
    <div class="card" style="margin-top:12px"><p class="h3">${esc(L(s.title))}</p><ol class="steps plain">${(s.steps[S.lang]?.length ? s.steps[S.lang] : s.steps.en).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <div class="card sayit"><p class="small">${t('ansSay')}</p><q lang="${S.lang}">${esc(L(s.say))}</q></div>
    ${plan ? `<button class="row" data-act="story" data-id="${plan.id}"><span class="ic t-green">${I.book}</span><span class="grow"><span class="small" style="display:block">${t('ansLater')}</span><span class="h3">${t('ansStory')}</span></span>${I.next}</button>` : ''}
    <div class="card"><p class="h3">${t('worked')}</p><div class="fb"><button class="${req.helped === true ? 'on' : ''}" data-act="hfb" data-v="1">${t('yes')}</button><button class="${req.helped === false ? 'on no' : ''}" data-act="hfb" data-v="0">${t('no')}</button></div>
      ${req.helped === false ? `<p class="small" style="margin-top:10px">${t('toldDr', esc(dr))}</p>` : ''}</div>
    <button class="btn p wide" data-act="tab" data-tab="home">${t('ansHome')}</button>`);
}

// ---------- parent: one-tap log (added to the note screen) ----------
function quickRow() {
  const tag = (x) => `<button class="chipb tag ${V.tags.includes(x.id) ? 'on' : ''}" data-act="vtag" data-id="${x.id}" aria-pressed="${V.tags.includes(x.id)}">${esc(x[S.lang === 'bn' ? 'bn' : 'en'])}</button>`;
  const face = ([k, ic, lab]) => `<button class="face ${k} ${V.mood === k ? 'on' : ''}" data-act="vmood" data-k="${k}" aria-pressed="${V.mood === k}">${I[ic]}${lab}</button>`;
  return `<div class="faces">${[['good', 'faceGood', t('fGood')], ['mixed', 'faceMixed', t('fMixed')], ['hard', 'faceHard', t('fHard')]].map(face).join('')}</div>
    <div class="chips">${QUICK_TAGS.map(tag).join('')}</div>`;
}

// ---------- parent: home extras, privacy, report ----------
function parentExtras(c, todayNote) {
  const dr = S.db.therapist.short;
  const remind = sentToday(S.db.reminders, c.id) && !todayNote;
  const rep = (S.db.reports || []).some((r) => r.childId === c.id);
  return `${remind ? `<div class="msg"><span class="m">${M.ele({ mood: 'calm', extra: 'doctor' })}</span><div><p class="small">${t('remind', esc(dr))}</p><p class="sub" style="color:var(--ink)">${t('remindB')}</p></div></div>` : ''}
    ${rep ? `<button class="row" data-act="report" style="margin-top:12px"><span class="ic t-blue">${I.doc}</span><span class="grow"><span class="h3" style="display:block">${t('report')}</span><span class="small">${t('reportFrom', esc(S.db.centre.name))}</span></span>${I.next}</button>` : ''}`;
}
function privacyScreen() {
  return `<div class="scroll softbg pad" style="padding-bottom:28px"><div class="bar"><button class="hbtn" data-act="back" aria-label="Back">${I.back}</button><h1 class="h2" style="padding-left:4px">${t('privacy')}</h1></div><div class="in">
    <div class="card" style="display:flex;gap:14px;align-items:center"><span class="ic t-green" style="width:54px;height:54px;font-size:26px">${I.shield}</span><div><p class="h2">${t('privT')}</p><p class="small">${t('privSub')}</p></div></div>
    <div class="card">${[1, 2, 3, 4].map((n) => `<div class="promise">${I.check}<span>${t('p' + n)}</span></div>`).join('')}</div>
    <button class="btn p wide" data-act="back">${t('close')}</button></div></div>`;
}
/** The report is built from the weekly summary, so it never says more than the therapist has already read. */
function reportBody(c, lang) {
  const bn = lang === 'bn', w = (en, b) => (bn ? b : en), n = (v) => (bn ? bnNum(v) : String(v));
  const s = S.db.summaries[c.id];
  if (!s) return `<div class="card empty">${w(`No summary yet for ${esc(c.name)}. The report is built from the weekly summary.`, 'এখনো কোনো সারাংশ নেই। সাপ্তাহিক সারাংশ থেকে রিপোর্ট তৈরি হয়।')}</div>`;
  const lab = { improving: [w('Good progress', 'ভালো উন্নতি'), 'good', 78], steady: [w('Steady', 'ধীরে চলছে'), '', 52], needs_support: [w('Needs more support', 'আরও সহায়তা দরকার'), 'warn', 30] };
  const practice = new Set(S.db.done.filter((d) => d.childId === c.id && d.date >= S.db.weekStart).map((d) => d.date)).size;
  const msg = s.parentMessage ? (bn ? s.parentMessage.bn : s.parentMessage.en) : '';
  return `<div class="card"><p class="h3">${w('Progress on the goals', 'লক্ষ্য অনুযায়ী অগ্রগতি')}</p>${s.goals.map((g) => {
      const [txt, cls, pct] = lab[g.status] || lab.steady;
      return `<div style="margin-top:14px"><div style="display:flex;justify-content:space-between;gap:10px;font-size:14.5px;line-height:1.35"><span>${esc(g.goal)}</span><b style="white-space:nowrap">${txt}</b></div><div class="pbar"><i class="${cls}" style="width:${pct}%"></i></div></div>`;
    }).join('')}</div>
    <div class="duo"><div class="card stat"><b>${n(practice)}</b><p class="small">${w('days of practice at home', 'দিন ঘরে অনুশীলন')}</p></div><div class="card stat"><b>${n(weekLogs(c.id).length)}</b><p class="small">${w('notes from home', 'ঘর থেকে নোট')}</p></div></div>
    ${msg ? `<div class="card"><p class="small" style="margin-bottom:6px">${w(`Message from ${esc(S.db.therapist.short)}`, `${esc(S.db.therapist.short)}-এর বার্তা`)}</p><p class="sub" style="color:var(--ink)" lang="${lang}">${esc(msg)}</p></div>` : ''}`;
}

// ---------- doctor: alerts ----------
function doctorAlerts() {
  const hs_ = helps(), hot = hs_.filter((h) => h.kind === 'safety' && !h.seen), rest = hs_.filter((h) => !hot.includes(h)), quiet = quietKids();
  const who = (h) => kid(h.childId)?.name || 'a child';
  const detail = (h) => {
    const c = kid(h.childId), s = c?.strategies?.find((x) => x.id === h.strategyId);
    return h.kind === 'none' ? 'There was no approved tip for this, so the app said so and asked you.' : h.kind === 'safety' ? 'The AI gave no advice and sent the parent to you and to 999.' : `Shown: “${esc(s?.title.en || 'an approved tip')}”`;
  };
  const outcome = (h) => (h.kind !== 'advice' ? '' : h.helped === true ? '<span class="pill good">Helped</span>' : h.helped === false ? '<span class="pill warn">Did not help</span>' : '<span class="pill line">Parent has not answered</span>');
  const tagFor = (h) => (h.kind === 'safety' ? '<span class="pill bad">Urgent</span>' : h.kind === 'none' ? '<span class="pill warn">No approved tip</span>' : '<span class="pill">Asked for help</span>');
  return `<div class="scroll softbg pad"><div class="bar"><h1 class="h2 grow" style="padding-left:4px">Alerts</h1>${hot.length ? `<span class="pill bad">${hot.length} urgent</span>` : ''}</div><div class="in">
    ${hot.map((h) => `<div class="alertcard"><div class="cardtop"><span class="pill">Urgent</span><span class="small">${agoText(h.at)}</span></div>
      <p class="h3">${esc(h.parent)}, about ${esc(who(h))}: “${esc(h.text)}”</p><p class="sub" style="margin-top:6px">${detail(h)}</p>
      <a class="btn danger" href="${telHref(kid(h.childId)?.phone)}">${I.phone} Call ${esc(h.parent)} now</a>
      <button class="btn soft" style="margin-top:8px" data-act="hseen" data-id="${h.id}">Mark as seen</button></div>`).join('')}
    <div class="sec"><h2 class="h2">Help requests</h2><span class="small">${rest.length}</span></div>
    ${rest.map((h) => `<div class="card"><div class="cardtop">${tagFor(h)}<span class="small">${agoText(h.at)}</span></div>
      <p class="h3">${esc(who(h))}: “${esc(h.text)}”</p><p class="sub" style="margin-top:6px">${detail(h)}</p>
      <div class="tags">${outcome(h)}${h.seen ? '' : '<span class="pill dark">New</span>'}</div>
      ${needsDoctor(h) ? `<div class="rowbtns"><button class="btn soft sm" data-act="hseen" data-id="${h.id}">Mark as seen</button><a class="btn soft sm" href="${telHref(kid(h.childId)?.phone)}">${I.phone} Call ${esc(h.parent)}</a></div>` : ''}</div>`).join('') || '<div class="card empty">No help requests yet.</div>'}
    <div class="sec"><h2 class="h2">Not noting at home</h2><span class="small">${quiet.length}</span></div>
    ${quiet.map((c) => `<div class="card"><div class="cardtop"><span class="pill line">No notes</span><span class="small">${daysSinceNote(c.id) >= 99 ? 'Never' : daysSinceNote(c.id) + ' days'}</span></div>
      <p class="h3">${esc(c.parent)} has not left a note about ${esc(c.name)}</p>
      <div class="rowbtns">${sentToday(S.db.reminders, c.id) ? `<span class="pill good">${I.check} Reminder sent today</span>` : `<button class="btn soft sm" data-act="remind" data-id="${c.id}">${I.send} Send a gentle reminder</button>`}</div></div>`).join('') || '<div class="card empty">Every family with a live plan has left a note in the last 3 days.</div>'}
  </div></div>`;
}
/** A row on the doctor's Home that leads to Alerts. */
function alertRow() {
  const n = alertCount();
  if (!n) return '';
  return `<button class="row" data-act="tab" data-tab="alerts"><span class="ic t-pink">${I.alert}</span><span class="grow"><span class="h3" style="display:block">${n} alert${n > 1 ? 's' : ''} from parents</span><span class="small">${urgentCount() ? 'Includes an urgent safety request' : 'Help that did not work, or had no approved tip'}</span></span><span style="color:var(--mute);font-size:17px">${I.next}</span></button>`;
}

// ---------- centre manager ----------
function centre() {
  const tab = S.tab.centre;
  const body = tab === 'team' ? centreTeam() : tab === 'report' ? centreReport() : tab === 'settings' ? settings() : centreHome();
  return body + nav([['home', 'building', 'Dashboard'], ['team', 'users', 'Team'], ['report', 'doc', 'Reports'], ['settings', 'gear', 'Settings']]);
}
/** Dr. Farhana's row is live. The other therapists are sample figures kept with the centre. */
function teamRows() {
  const all = kids();
  return [{ name: S.db.therapist.name, children: all.length, active: all.filter((c) => weekLogs(c.id).length).length, summaries: Object.keys(S.db.summaries).length, live: true }, ...S.db.centre.team];
}
const activePill = (r) => `<span class="pill ${r.active / r.children >= 0.8 ? 'good' : r.active / r.children >= 0.6 ? '' : 'warn'}">${r.active}/${r.children} active</span>`;
function centreHome() {
  const rows = teamRows(), sum = (k) => rows.reduce((n, r) => n + r[k], 0), total = sum('children'), act = sum('active'), quiet = total - act;
  return `<div class="scroll homebg pad">
    ${homeTop(quiet > 0)}
    <div class="greet"><h1>Hey, ${esc(S.db.centre.manager.split(' ')[0])}</h1><p>${esc(S.db.centre.name)}</p><span class="bubble">${quiet ? `${quiet} quiet ${quiet === 1 ? 'family' : 'families'}` : 'All families active'}</span><div class="masc">${M.ele({ mood: 'hi', extra: 'doctor' })}</div></div>
    <div class="tiles">
      <button class="tile" data-act="tab" data-tab="team"><span class="ic" style="color:var(--p)">${I.users}</span><span class="lab">Therapists</span><b>${rows.length}</b><span class="unit">at the centre</span></button>
      <button class="tile" data-act="tab" data-tab="team"><span class="ic" style="color:var(--blue)">${I.heart}</span><span class="lab">Children</span><b>${total}</b><span class="unit">in care</span></button>
      <button class="tile" data-act="tab" data-tab="team"><span class="ic" style="color:var(--green)">${I.mic}</span><span class="lab">Noting</span><b>${act}</b><span class="unit">this week</span></button>
    </div>
    <div class="in">
      ${quiet ? `<div class="warnbar">${I.alert}<span>${quiet} ${quiet === 1 ? 'family has' : 'families have'} not left a note this week</span></div>` : ''}
      <div class="sec"><h2 class="h2">Therapists</h2><button class="link" data-act="tab" data-tab="team">See all</button></div>
      <div class="card">${rows.map((r) => `<div class="who"><span class="av t-blue">${esc(initials(r.name))}</span><span class="grow"><span class="h3" style="display:block">${esc(r.name)}</span><span class="small">${r.children} children</span></span>${activePill(r)}</div>`).join('')}</div>
      <p class="small" style="text-align:center;margin-top:6px">${esc(rows[0].name)} is live. The other figures are samples.</p>
      <div class="sec"><h2 class="h2">Reports for parents</h2></div>
      <button class="row" data-act="tab" data-tab="report"><span class="ic t-orange">${I.doc}</span><span class="grow"><span class="h3" style="display:block">Progress report</span><span class="small">Built from the weekly summary, sent to the parent</span></span><span style="color:var(--mute);font-size:17px">${I.next}</span></button>
    </div></div>`;
}
function centreTeam() {
  const rows = teamRows();
  return `<div class="scroll softbg pad"><div class="bar"><h1 class="h2 grow" style="padding-left:4px">Team</h1><span class="pill line">${rows.length} therapists</span></div><div class="in">
    ${rows.map((r) => `<div class="card"><div style="display:flex;gap:12px;align-items:center"><span class="av t-blue">${esc(initials(r.name))}</span><span class="grow"><span class="h3" style="display:block">${esc(r.name)}</span><span class="small">${r.children} children · ${r.summaries} summaries written</span></span>${activePill(r)}</div>
      <div class="pbar"><i class="${r.active / r.children >= 0.8 ? 'good' : r.active / r.children >= 0.6 ? '' : 'warn'}" style="width:${Math.round((r.active / r.children) * 100)}%"></i></div></div>`).join('')}
    <p class="small" style="text-align:center">“Active” means the family left a note this week.</p></div></div>`;
}
function centreReport() {
  const first = kids().find((k) => S.db.summaries[k.id]) || kids()[0];
  const c = kid(S.rid) || first, sent = sentToday(S.db.reports, c.id), ready = Boolean(S.db.summaries[c.id]);
  return `<div class="scroll softbg pad"><div class="bar"><h1 class="h2 grow" style="padding-left:4px">Reports</h1></div><div class="in">
    <div class="seg" style="margin-bottom:12px">${kids().map((k) => `<button class="${k.id === c.id ? 'on' : ''}" data-act="rchild" data-id="${k.id}">${esc(k.name)}</button>`).join('')}</div>
    <p class="small" style="margin:0 6px 10px">Progress report for ${esc(c.parent)} · this week</p>
    ${reportBody(c, 'en')}
    ${ready ? `<div class="rowbtns" style="justify-content:center">${sent ? `<span class="pill good">${I.check} Sent to ${esc(c.parent)} today</span>` : `<button class="btn p" data-act="sendreport" data-id="${c.id}">${I.send} Send to ${esc(c.parent)}</button>`}</div>` : ''}
  </div></div>`;
}

// ---------- notices and the bell ----------
function careNotice(a, b) {
  if (S.role === 'parent') {
    if ((b.reminders || []).length > (a.reminders || []).length) toast(t('remind', b.therapist.short));
    if ((b.reports || []).length > (a.reports || []).length) toast(t('report'));
  }
  if (S.role === 'doctor' && (b.helps || []).length > (a.helps || []).length) {
    const h = b.helps[0], c = b.children.find((x) => x.id === h.childId);
    toast(h.kind === 'safety' ? `Urgent: ${h.parent} needs help with ${c?.name}` : `${h.parent} asked for help with ${c?.name}`);
  }
}
function careBell(items) {
  if (S.role === 'parent') {
    const c = kid(PARENT_CHILD);
    if (sentToday(S.db.reminders, c.id)) items.push(['heart', 't-pink', t('remind', S.db.therapist.short), t('remindB')]);
    if ((S.db.reports || []).some((r) => r.childId === c.id)) items.push(['doc', 't-blue', t('report'), t('reportFrom', S.db.centre.name)]);
  } else if (S.role === 'doctor') {
    for (const h of helps().filter(needsDoctor)) items.unshift(['alert', 't-pink', `${h.parent} asked for help with ${kid(h.childId)?.name}`, `${h.kind === 'safety' ? 'Urgent · ' : ''}${agoText(h.at)}`]);
  } else {
    const q = teamRows().reduce((n, r) => n + r.children - r.active, 0);
    if (q) items.push(['alert', 't-orange', `${q} families have not left a note this week`, 'Open Team to see each therapist']);
  }
}

// ---------- taps ----------
Object.assign(act, {
  hsend: () => sendHelp(),
  hchip(el) { return sendHelp(HELP_CHIPS[+el.dataset.i].say[S.lang]); },
  hmic() {
    const h = hs();
    if (h.rec) { stopDictation(); return render(true); }
    grabText();
    const base = h.text ? h.text + ' ' : '';
    try {
      hrec = new SpeechIn();
      hrec.lang = S.lang === 'bn' ? 'bn-BD' : 'en-US';
      hrec.interimResults = true;
      hrec.onresult = (e) => { h.text = base + Array.from(e.results).map((r) => r[0].transcript).join(' '); const el = $('#htext'); if (el) el.value = h.text; };
      hrec.onend = () => { h.rec = false; hrec = null; render(); };
      hrec.onerror = () => {};
      hrec.start();
      h.rec = true;
    } catch { hrec = null; h.msg = t('micNo'); }
    render(true);
  },
  async hfb(el) { await api('/api/help/feedback', { id: H.reqId, helped: el.dataset.v === '1' }); await pull(); },
  async hseen(el) { await api('/api/help/seen', { id: el.dataset.id }); await pull(); },
  async remind(el) { await api('/api/reminder', { childId: el.dataset.id }); toast(`Reminder sent to ${kid(el.dataset.id).parent}`); await pull(); },
  rchild(el) { S.rid = el.dataset.id; render(true); },
  async sendreport(el) { await api('/api/report/send', { childId: el.dataset.id }); toast(`Report sent to ${kid(el.dataset.id).parent}`); await pull(); },
  report() { const c = kid(PARENT_CHILD); openSheet(`${shead(t('report'), esc(S.lang === 'bn' ? c.name_bn : c.name))}${reportBody(c, S.lang)}`); },
  privacy() { S.push = 'privacy'; render(true); },
  vmood(el) { grabText(); V.mood = V.mood === el.dataset.k ? null : el.dataset.k; render(true); },
  vtag(el) { grabText(); V.tags = V.tags.includes(el.dataset.id) ? V.tags.filter((x) => x !== el.dataset.id) : [...V.tags, el.dataset.id]; render(true); },
});
