/* MIMO app. One small script, no framework.
   The screen is redrawn from `S` (what this phone is showing) and `S.db` (shared data from the server). */
const I = window.I, M = window.M;
const Q = new URLSearchParams(location.search);
const FORCED = Q.get('role') === 'therapist' ? 'doctor' : Q.get('role'); // the two-phone pitch view fixes each phone to one persona
const STORE = 'bridgeai2:' + (FORCED || 'main');
const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } })();

const S = {
  db: null,
  role: FORCED || saved.role || null,   // 'parent' | 'doctor' | null (persona picker)
  lang: saved.lang || 'en',             // parent side: en | bn
  tab: { parent: 'home', doctor: 'home', ...(saved.tab || {}) },
  push: null,                           // a screen opened on top of the tabs: note | child | ai
  page: 0, open: null,
  childId: saved.childId || 'rafi', ctab: 'summary',
  edit: null, busy: {},
  filter: {},                           // doctor's children list: chosen answers per category
  pday: 0,                              // doctor's plan: the day being looked at (0 = today)
  allacts: false, gtab: 'daily',        // parent: whole day's list open on Home; Guide tab on today or this week
  pdraft: null,                         // doctor's changes to an AI progress suggestion before approving it
  pflow: null,                          // parent's chat: the situation being narrowed down, and the answers so far
  pchat: [], pchatBusy: false,          // parent's AI chat (kept only while the app is open)
  chat: [], chatBusy: false,            // doctor's assistant: the conversation so far (kept only while the app is open)
};
const PARENT_CHILD = 'rafi';
const keep = () => { try { localStorage.setItem(STORE, JSON.stringify({ role: S.role, lang: S.lang, tab: S.tab, childId: S.childId })); } catch {} };

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bnNum = (s) => String(s).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const num = (n) => (S.role === 'parent' && S.lang === 'bn' ? bnNum(n) : String(n));
const TINTS = ['t-blue', 't-orange', 't-green', 't-pink', 't-purple', 't-yellow'];

// ---------- words on the parent side ----------
const T = {
  en: {
    hey: (n) => `Hey, ${n}`, ready: (c) => `Ready for ${c}’s practice?`, small: 'Let’s start small!', great: 'Great job today!',
    tPractice: 'Practice', tDone: 'done today', tNotes: 'Notes', tDays: 'days this week', tStory: 'Story', tPages: 'pages',
    progress: 'Today’s progress', left: (n) => `${n} left`, next: (x) => `Next: ${x}`, allDone: 'All done today',
    practice: 'Today’s practice', min: 'min', markDone: 'Mark as done', undo: 'Not done yet', goal: 'Goal',
    how: 'How was today?', tell: (d) => `Tell ${d} in 30 seconds`, saved: 'Today’s note is saved', another: 'Add another note',
    from: (d) => `From ${d}`, story: 'This week’s story', pagesN: (n) => `${n} pages · read together`, read: 'Read',
    nHome: 'Home', nTracker: 'Tracker', nStory: 'Story', nSettings: 'Settings',
    week: (c) => `${c}’s week`, streak: (n) => `${n} ${n === 1 ? 'day' : 'days'} streak`, streakSub: 'Notes in a row', todayDone: (a, b) => `${a} / ${b} practice done today`,
    goodDays: 'Good days', practiceToday: 'Practice today', minDone: (m) => `${m} min done`, thisWeek: 'This week', myNotes: 'My notes', noNotes: 'No notes yet this week.',
    noStory: 'There is no story this week.', waiting: (d) => `${d} is preparing this week’s plan. It will appear here as soon as it is approved.`,
    hello: (c) => `Hello, how was ${c}’s day?`, helloSub: (d) => `Say it or type it. ${d} reads it before your next session.`,
    listening: 'Listening…', tapStop: 'Tap the pink button to finish', ph: 'Say or type anything…', nChat: 'AI chat', chatSub: 'What is happening now? · demo', chatHi: (n) => `Hello ${n}, what is happening?`, chatHint: (d) => `Tell me what is happening. I match it with advice ${d} has verified.`, chatPh: 'Say or type what is happening…', chatVoice: 'Demo: type here, or tap a suggestion. Speaking to the chat is not built yet.', chatMedia: 'Demo: the chat does not read photos or videos yet.', tTips: 'tips today', aboutT: (c) => `About ${c}`, verified: (d) => `Verified by ${d}`, nextT: 'Next step', doneOf: (a, b) => `${a} of ${b} done`, allToday: 'All of today’s practice', hideAll: 'Show less',
    allDoneT: 'All done for today', allDoneS: 'Wonderful. See you tomorrow.', nGuide: 'Guide', gToday: 'Today', gWeek: 'This week', gFor: (c, d) => `Chosen for ${c}’s profile, approved by ${d}`,
    gNone: (d) => `${d} has not shared the profile yet. The guide appears after that.`, todayGuide: 'Today’s guide', seeAll: 'See all', kvideo: 'Video', kaudio: 'Listen', ktext: 'Steps',
    calms: (c) => `What calms ${c}`, likesT: 'Likes', aboutFoot: (d, when) => `Approved by ${d} on ${when}. If something looks wrong, tell ${d} at the next session.`, progNone: (d) => `${d} will share a progress update after the next session.`,
    progT: (d) => `Progress from ${d}`, progNew: (d) => `New progress update from ${d}`, updated: (d) => `Updated ${d}`, watch: 'Watch how to do it', dayN: (n) => `Day ${n} of 7`, photoL: 'Photo', videoL: 'Video', tooBig: 'That video is too large. Keep it under about 30 seconds.', notPhoto: 'That file could not be opened.', maxMedia: 'You can add up to 4 photos or videos.', withMedia: (n) => `${n} photo or video attached`, example: 'Use an example', speakBn: 'Speak in বাংলা', speakEn: 'Speak in English',
    hearing: 'Writing down what you said…', saving: 'Saving your note…', savedT: (d) => `Saved for ${d}`, savedS: 'This is what we noted from your words.',
    went: 'Went well', hard: 'Was hard', trig: 'Possible trigger', close: 'Done', micNo: 'The microphone is not available here, so please type your note.',
    offline: (d) => `Your note is saved exactly as you said it. ${d} will see it before the next session.`,
    newPlan: (d) => `New plan from ${d}`, drawing: 'Drawing…',
    settings: 'Settings', viewAs: 'View the app as', language: 'Language', parentOf: (c) => `Parent of ${c}`, aiHow: 'How AI is used', lite: 'Lite mode', liteSub: 'Faster on low-cost phones', on: 'On', offw: 'Off', reset: 'Reset sample data', about: 'MIMO prototype · sample data only',
  },
  bn: {
    hey: (n) => `হ্যালো, ${n}`, ready: (c) => `${c}-এর অনুশীলনের জন্য তৈরি?`, small: 'অল্প অল্প করে শুরু!', great: 'আজ দারুণ হয়েছে!',
    tPractice: 'অনুশীলন', tDone: 'আজ হয়েছে', tNotes: 'নোট', tDays: 'দিন এই সপ্তাহে', tStory: 'গল্প', tPages: 'পাতা',
    progress: 'আজকের অগ্রগতি', left: (n) => `${n}টি বাকি`, next: (x) => `এরপর: ${x}`, allDone: 'আজকের সব শেষ',
    practice: 'আজকের অনুশীলন', min: 'মিনিট', markDone: 'হয়ে গেছে', undo: 'এখনো হয়নি', goal: 'লক্ষ্য',
    how: 'আজ কেমন গেল?', tell: (d) => `৩০ সেকেন্ডে ${d}-কে জানান`, saved: 'আজকের নোট জমা হয়েছে', another: 'আরেকটি নোট দিন',
    from: (d) => `${d}-এর বার্তা`, story: 'এই সপ্তাহের গল্প', pagesN: (n) => `${n} পাতা · একসাথে পড়ুন`, read: 'পড়ুন',
    nHome: 'হোম', nTracker: 'ট্র্যাকার', nStory: 'গল্প', nSettings: 'সেটিংস',
    week: (c) => `${c}-এর সপ্তাহ`, streak: (n) => `টানা ${n} দিন`, streakSub: 'পরপর নোট দিয়েছেন', todayDone: (a, b) => `আজ ${b}টির মধ্যে ${a}টি অনুশীলন হয়েছে`,
    goodDays: 'ভালো দিন', practiceToday: 'আজকের অনুশীলন', minDone: (m) => `${m} মিনিট হয়েছে`, thisWeek: 'এই সপ্তাহ', myNotes: 'আমার নোট', noNotes: 'এই সপ্তাহে এখনো কোনো নোট নেই।',
    noStory: 'এই সপ্তাহে কোনো গল্প নেই।', waiting: (d) => `${d} এই সপ্তাহের পরিকল্পনা তৈরি করছেন। অনুমোদনের পর এখানে দেখা যাবে।`,
    hello: (c) => `${c}-এর দিনটি কেমন গেল?`, helloSub: (d) => `বলুন অথবা লিখুন। পরের সেশনের আগে ${d} এটি পড়বেন।`,
    listening: 'শুনছি…', tapStop: 'শেষ করতে গোলাপি বোতাম চাপুন', ph: 'যা খুশি বলুন বা লিখুন…', nChat: 'এআই চ্যাট', chatSub: 'এখন কী হচ্ছে? · ডেমো', chatHi: (n) => `হ্যালো ${n}, কী হচ্ছে?`, chatHint: (d) => `কী হচ্ছে আমাকে বলুন। ${d} যাচাই করেছেন এমন পরামর্শের সাথে আমি মিলিয়ে দেখব।`, chatPh: 'কী হচ্ছে বলুন বা লিখুন…', chatVoice: 'ডেমো: এখানে লিখুন, অথবা একটি পরামর্শ বেছে নিন। চ্যাটে কথা বলা এখনো তৈরি হয়নি।', chatMedia: 'ডেমো: চ্যাট এখনো ছবি বা ভিডিও পড়তে পারে না।', tTips: 'আজকের পরামর্শ', aboutT: (c) => `${c} সম্পর্কে`, verified: (d) => `${d} যাচাই করেছেন`, nextT: 'পরবর্তী ধাপ', doneOf: (a, b) => `${b}টির মধ্যে ${a}টি হয়েছে`, allToday: 'আজকের সব অনুশীলন', hideAll: 'কম দেখুন',
    allDoneT: 'আজকের সব অনুশীলন শেষ', allDoneS: 'দারুণ। কাল আবার দেখা হবে।', nGuide: 'গাইড', gToday: 'আজ', gWeek: 'এই সপ্তাহ', gFor: (c, d) => `${c}-এর প্রোফাইল অনুযায়ী বাছাই করা, ${d} অনুমোদিত`,
    gNone: (d) => `${d} এখনো প্রোফাইল শেয়ার করেননি। এরপর গাইড দেখা যাবে।`, todayGuide: 'আজকের গাইড', seeAll: 'সব দেখুন', kvideo: 'ভিডিও', kaudio: 'শুনুন', ktext: 'ধাপ',
    calms: (c) => `${c}-কে যা শান্ত করে`, likesT: 'পছন্দ', aboutFoot: (d, when) => `${d} ${when} তারিখে অনুমোদন করেছেন। কিছু ভুল মনে হলে পরের সেশনে ${d}-কে জানান।`, progNone: (d) => `পরের সেশনের পর ${d} অগ্রগতি প্রতিবেদন পাঠাবেন।`,
    progT: (d) => `${d}-এর অগ্রগতি প্রতিবেদন`, progNew: (d) => `${d} নতুন অগ্রগতি প্রতিবেদন পাঠিয়েছেন`, updated: (d) => `হালনাগাদ: ${d}`, watch: 'কীভাবে করবেন দেখুন', dayN: (n) => `৭ দিনের ${n} নম্বর দিন`, photoL: 'ছবি', videoL: 'ভিডিও', tooBig: 'ভিডিওটি অনেক বড়। প্রায় ৩০ সেকেন্ডের মধ্যে রাখুন।', notPhoto: 'ফাইলটি খোলা যায়নি।', maxMedia: 'সর্বোচ্চ ৪টি ছবি বা ভিডিও যোগ করা যাবে।', withMedia: (n) => `${n}টি ছবি বা ভিডিও যুক্ত হয়েছে`, example: 'একটি উদাহরণ', speakBn: 'বাংলায় বলুন', speakEn: 'ইংরেজিতে বলুন',
    hearing: 'আপনার কথা লিখে নিচ্ছি…', saving: 'নোট জমা হচ্ছে…', savedT: (d) => `${d}-এর জন্য জমা হয়েছে`, savedS: 'আপনার কথা থেকে আমরা যা টুকে রেখেছি।',
    went: 'ভালো হয়েছে', hard: 'কঠিন ছিল', trig: 'সম্ভাব্য কারণ', close: 'ঠিক আছে', micNo: 'এখানে মাইক্রোফোন পাওয়া যাচ্ছে না, তাই নোটটি লিখে দিন।',
    offline: (d) => `আপনার নোট হুবহু জমা হয়েছে। পরের সেশনের আগে ${d} এটি দেখবেন।`,
    newPlan: (d) => `${d}-এর নতুন পরিকল্পনা এসেছে`, drawing: 'আঁকা হচ্ছে…',
    settings: 'সেটিংস', viewAs: 'কে ব্যবহার করছেন', language: 'ভাষা', parentOf: (c) => `${c}-এর অভিভাবক`, aiHow: 'এআই কীভাবে ব্যবহার হয়', lite: 'হালকা মোড', liteSub: 'কম দামি ফোনে দ্রুত চলে', on: 'চালু', offw: 'বন্ধ', reset: 'নমুনা তথ্য নতুন করুন', about: 'মিমো প্রোটোটাইপ · শুধু নমুনা তথ্য',
  },
};
const t = (k, ...a) => { const v = T[S.role === 'parent' ? S.lang : 'en'][k]; return typeof v === 'function' ? v(...a) : v; };
const L = (pair) => (pair ? pair[S.lang] || pair.en || '' : '');

// ---------- data helpers ----------
const kids = () => S.db.children;
const kid = (id) => kids().find((c) => c.id === id);
const livePlan = (cid) => S.db.plans.filter((p) => p.childId === cid && p.status === 'approved').sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))[0];
const draftPlan = (cid) => S.db.plans.find((p) => p.childId === cid && p.status === 'draft');
const weekLogs = (cid) => S.db.logs.filter((l) => l.childId === cid && l.date >= S.db.weekStart).sort((a, b) => a.at.localeCompare(b.at));
const doneOn = (cid, aid, date) => S.db.done.some((d) => d.childId === cid && d.activityId === aid && d.date === date);
const days7 = () => Array.from({ length: 7 }, (_, i) => { const d = new Date(S.db.today + 'T12:00:00'); d.setDate(d.getDate() - 6 + i); return d; });
const dkey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayName = (d, lang = 'en') => d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { weekday: 'short' });
const niceDate = (iso, lang = 'en') => new Date(iso).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const niceTime = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
const icon = (k) => I[k === 'play' ? 'playk' : k] || I.playk;
// ----- the plan, day by day -----
/** Which day of the plan today is: 1 on the day it was approved, up to 7. A draft is always on day 1. */
const planDay = (plan) => (plan.status !== 'approved' ? 1 : Math.min(7, Math.max(1, Math.round((new Date(S.db.today + 'T12:00:00') - new Date(dkey(new Date(plan.approvedAt)) + 'T12:00:00')) / 864e5) + 1)));
/** The target for an activity on a given day: days 1-2 start small, 3-5 build, 6-7 stretch. */
const targetOn = (a, day) => (a.daily || []).find((p) => day <= p.to) || (a.daily || []).slice(-1)[0] || null;
const videoOf = (a) => { const v = a.video || HOW?.[a.icon]; return v ? v.replace(/^\//, '') : null; };
const freshNotes = (c) => (livePlan(c.id) ? Math.max(0, weekLogs(c.id).length - (S.db.summaries[c.id]?.notesCount || 0)) : 0);
function streak(cid) {
  const have = new Set(weekLogs(cid).map((l) => l.date));
  const ds = days7().map(dkey).reverse();
  let n = 0;
  for (const [i, d] of ds.entries()) { if (have.has(d)) n++; else if (i > 0) break; } // today may still be open
  return n;
}
const avatar = (c, size = 46) => {
  const tint = { lime: 't-green', teal: 't-blue', sun: 't-orange', rose: 't-pink', violet: 't-purple' }[c.tint] || 't-purple';
  return `<span class="av ${tint}" style="width:${size}px;height:${size}px;font-size:${size * 0.4}px">${esc(c.name[0])}</span>`;
};

/** One picture of a story. All six are drawn on one sheet, so each page shows its own part of it. */
function pic(story, i, extra = '') {
  const fallback = ['mirror', 'wait', 'chair', 'sound', 'scissors', 'star'][i % 6];
  if (story.sheet && story.sheetStatus === 'ready') {
    const { cols, rows } = story, z = 1.07, c = i % cols, r = Math.floor(i / cols);
    const pos = (n, k) => ((50 - (k + 0.5) * z * 100) / (100 - n * z * 100)) * 100;
    return `<div class="pic ${extra}" style="background-image:url('${esc(story.sheet.replace(/^\//, ''))}');background-size:${cols * z * 100}% ${rows * z * 100}%;background-position:${pos(cols, c)}% ${pos(rows, r)}%"></div>`;
  }
  const making = story.sheetStatus === 'making';
  return `<div class="pic ph ${making ? 'making' : ''} ${extra}">${I[fallback]}${making ? `<span class="cap">${t('drawing')}</span>` : ''}</div>`;
}

// ---------- server ----------
// Opened without its server (for example on GitHub Pages), the app runs on sample data kept in this browser.
const LOCAL = location.protocol === 'file:' || /github\.io$/.test(location.hostname) || Q.has('preview');
async function api(path, body) {
  if (LOCAL) return LocalBackend.post(path, body);
  const res = await fetch(path.slice(1), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || 'Something went wrong.');
  return j;
}
async function pull() {
  try {
    const j = LOCAL ? await LocalBackend.state(S.db?.rev || 0) : await (await fetch('api/state?rev=' + (S.db?.rev || 0))).json();
    if (j.same) {
      if (S.db && JSON.stringify(j.ai) !== JSON.stringify(S.db.ai)) { S.db.ai = j.ai; render(); }
      return;
    }
    const before = S.db;
    S.db = j;
    if (before) notice(before, j);
    render();
  } catch {}
}
function notice(a, b) {
  if (S.role === 'parent') {
    const count = (db) => db.plans.filter((p) => p.childId === PARENT_CHILD && p.status === 'approved').length;
    if (count(b) > count(a)) { toast(t('newPlan', b.therapist.short)); S.page = 0; }
    const shared = (db) => db.progress?.[PARENT_CHILD]?.shared?.at;
    if (shared(b) && shared(b) !== shared(a)) toast(t('progNew', b.therapist.short));
  }
  if (S.role === 'doctor' && b.logs.length > a.logs.length) {
    const n = b.logs[b.logs.length - 1], c = b.children.find((x) => x.id === n.childId);
    if (c && n.source === 'parent') toast(`New note from ${c.parent} about ${c.name}`);
  }
}
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 3200);
}

// ---------- drawing the screen ----------
let pending = false, shown = null;
const FX = { tick: null, open: null, page: 0 }; // one-off animations to play after the next redraw
function render(force) {
  if (!S.db) return;
  const app = $('#app');
  const a = document.activeElement;
  if (!force && a && app.contains(a) && /TEXTAREA|INPUT/.test(a.tagName)) { pending = true; return; } // never redraw under someone typing
  pending = false;
  const key = [S.role, S.tab[S.role], S.push, S.childId, S.ctab].join('|');
  const sc = $('.scroll', app);
  const top = sc && app.dataset.key === key ? sc.scrollTop : 0;
  document.documentElement.lang = S.role === 'parent' ? S.lang : 'en';
  const html = !S.role ? picker() : S.role === 'parent' ? parent() : doctor();
  const snap = app.dataset.key === key ? Motion.before() : null; // same screen: remember where things are, so they can glide
  const now = { role: S.role, tab: S.tab[S.role], push: S.push };
  const kind = !shown ? null : shown.role !== now.role ? 'role' : !shown.push && now.push ? 'push' : shown.push && !now.push ? 'pop' : shown.tab !== now.tab ? 'tab' : null;
  shown = now;
  app.innerHTML = html;
  app.dataset.key = key;
  const sc2 = $('.scroll', app);
  if (sc2) sc2.scrollTop = top; // put the scroll back first, so the motion below measures real positions
  const hdr = $('.hdr', app);
  if (hdr) hdr.nextElementSibling.style.paddingTop = hdr.offsetHeight + 'px'; // content starts below the floating header and scrolls under it
  const log = $('.chatlog', app);
  if (log && (S.role === 'parent' ? S.pchat : S.chat).length) { const lastMsg = log.querySelector('.msgai:last-of-type, .msgme:last-of-type'), tall = lastMsg && lastMsg.offsetHeight > log.clientHeight - 20; log.scrollTop = tall ? lastMsg.offsetTop - log.offsetTop - 6 : log.scrollHeight; } // a chat always shows its latest message
  Motion.lozenges([S.role, now.tab, S.push, S.childId].join('|'));
  if (kind) Motion.arrive(kind);
  else { Motion.after(snap); Motion.release(); }
  if (FX.tick && Motion.tick(FX.tick)) FX.tick = null;
  if (FX.open) { Motion.unfold(FX.open); FX.open = null; }
  if (FX.page) { Motion.turnPage(FX.page); FX.page = 0; }
  keep();
}
document.addEventListener('focusout', () => setTimeout(() => pending && render(), 60));

const nav = (items) => `<div class="fade"></div><nav class="nav">${items.map(([k, ic, lab, n]) => `<button class="navb ${S.tab[S.role] === k ? 'on' : ''}" data-act="tab" data-tab="${k}">${I[ic]}${esc(lab)}${n ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</nav>`;
const langSeg = (cls = '') => `<div class="seg mini ${cls}"><button class="${S.lang === 'en' ? 'on' : ''}" data-act="lang" data-lang="en">EN</button><button class="bn ${S.lang === 'bn' ? 'on' : ''}" data-act="lang" data-lang="bn">বাংলা</button></div>`;
const homeTop = (dot, extra = '') => `<div class="top"><button class="hbtn" data-act="menu" aria-label="Menu">${I.menu}</button><button class="hbtn" data-act="bell" aria-label="Notifications">${I.bell}${dot ? '<i class="dot"></i>' : ''}</button>${extra}</div>`;
// On the purple home screen the language switch is one round button, so it never sits under the mascot.
const langBtn = () => `<button class="hbtn ${S.lang === 'en' ? 'bn' : ''}" style="font:600 12.500px var(--${S.lang === 'en' ? 'bn' : 'font'})" data-act="lang" data-lang="${S.lang === 'en' ? 'bn' : 'en'}" aria-label="Change language">${S.lang === 'en' ? 'বাং' : 'EN'}</button>`;

// ----- persona picker -----
function picker() {
  return `<section class="pick pad">
    <div class="cl" style="left:-40px;top:120px">${M.cloud()}</div><div class="cl" style="right:-50px;top:200px;width:120px">${M.cloud()}</div>
    <div class="logo">${I.logo} MIMO</div><h1 class="big">Therapy that<br><em>continues at home.</em></h1><p class="tagline">One small step a day, shared between doctor and parent.</p>
    <div class="duo2"><div style="left:42px;width:160px">${M.ele({ extra: 'doctor' })}</div><div style="right:40px;width:118px;animation-delay:-2s;bottom:14px">${M.tiger()}</div></div>
    <div class="sheet0"><h1 class="h1">Welcome</h1><p class="sub" style="margin-top:4px">Who is using MIMO today? You can switch any time in Settings.</p>
      ${personaBtns()}</div>
  </section>`;
}
function personaBtns() {
  const b = (role, m, tint, title, sub) => `<button class="persona ${S.role === role ? 'on' : ''}" data-act="role" data-role="${role}"><span class="m ${tint}">${m}</span><span class="grow"><span class="h3" style="display:block">${title}</span><span class="small">${sub}</span></span><span class="go">${S.role === role ? I.check : I.next}</span></button>`;
  return b('parent', M.tiger(), 't-orange', 'View as a parent', 'Nusrat, at home with Rafi') + b('doctor', M.ele({ mood: 'calm', extra: 'doctor' }), 't-purple', 'View as a doctor', 'Dr. Farhana, at the therapy centre');
}

// ----- parent -----
function parent() {
  const c = kid(PARENT_CHILD), plan = livePlan(c.id);
  if (S.push === 'note') return noteScreen(c);
  if (S.push === 'ai') return aiUse(true);
  if (S.push === 'about') return aboutScreen(c);
  if (S.push === 'story') return parentStory(c, plan);
  if (S.tab.parent === 'story') S.tab.parent = 'home';
  const tab = S.tab.parent;
  const body = tab === 'guide' ? parentGuide(c) : tab === 'tracker' ? parentTracker(c, plan) : tab === 'chat' ? parentChat() : tab === 'settings' ? settings() : parentHome(c, plan);
  return body + nav([['home', 'home', t('nHome')], ['guide', 'heart', t('nGuide')], ['tracker', 'chart', t('nTracker')], ['chat', 'spark', t('nChat')], ['settings', 'gear', t('nSettings')]]);
}
/** Words for a profile answer in the parent's language. */
const pword = (key, v, rated) => (S.lang === 'bn' ? (rated ? GD.BN[key].rated[v] : GD.BN[key].opts[v]) : ((rated ? PF[key].rated : PF[key].opts).find((o) => o[0] === v) || [])[1]) || v;
const phead = (key) => (S.lang === 'bn' ? GD.BN[key].label : PF[key].label);
/** The child's categories as the doctor approved them: a short card for Home, and the full screen. */
function aboutCard(c) {
  const sh = c.shared, p = sh?.profile || {};
  if (!sh || !GD || !PF) return '';
  const name = S.lang === 'bn' ? c.name_bn : c.name;
  const chips = [p.level && p.level !== 'na' ? pword('level', p.level) : '', p.speech ? pword('speech', p.speech) : '', ...(p.sensitive || []).slice(0, 2).map((v) => `${phead('sensitive')}: ${pword('sensitive', v)}`)].filter(Boolean);
  return `<button class="card about" data-act="about"><span class="grow"><span class="h3" style="display:block">${t('aboutT', esc(name))}</span><span class="small vline">${I.shield} ${t('verified', esc(S.db.therapist.short))}</span><span class="tags">${chips.map((x) => `<span class="pill">${esc(x)}</span>`).join('')}</span></span><span style="color:var(--mute);font-size:17px">${I.next}</span></button>`;
}
function aboutScreen(c) {
  const sh = c.shared, p = sh?.profile || {}, name = S.lang === 'bn' ? c.name_bn : c.name, dr = S.db.therapist.short;
  const card = (title, ic, tint, inner) => (inner.trim() ? `<div class="card pf"><p class="pfhead"><span class="ic ${tint}">${I[ic]}</span>${title}</p>${inner}</div>` : '');
  const line = (label, value) => (value ? `<div class="pfrow"><span>${label}</span><b>${value}</b></div>` : '');
  const chips = (key, cls = '') => (p[key] || []).filter((v) => v !== 'none').map((v) => `<span class="pill ${cls}">${esc(pword(key, v))}</span>`).join('');
  const group = (label, html) => (html ? `<p class="small pflab">${label}</p><div class="tags" style="margin-top:6px">${html}</div>` : '');
  const sev = { mild: 'line', moderate: 'warn', severe: 'bad' }, day = { ind: 'good', help: 'warn', dep: 'bad' };
  const help = p.level ? (S.lang === 'bn' ? GD.BN.level.help[p.level] : PF.level.help[p.level]) : '';
  return `<div class="scroll softbg pad" style="padding-bottom:28px"><div class="bar"><button class="hbtn" data-act="back" aria-label="Back">${I.back}</button><div class="grow"><h1 class="h2">${t('aboutT', esc(name))}</h1><p class="small vline">${I.shield} ${t('verified', esc(dr))}</p></div>${langSeg()}</div><div class="in">
    ${card(phead('level'), 'doc', 't-purple', line(phead('level'), p.level ? `${esc(pword('level', p.level))}${p.level !== 'na' ? `<small>${esc(help)}</small>` : ''}` : '') + line(phead('dxType'), p.dxType ? esc(pword('dxType', p.dxType)) : '') + group(phead('co'), chips('co', 'line')))}
    ${card(phead('speech'), 'talk', 't-blue', line(phead('speech'), p.speech ? esc(pword('speech', p.speech)) : '') + line(phead('understands'), p.understands ? esc(pword('understands', p.understands)) : '') + line(phead('aac'), p.aac ? esc(pword('aac', p.aac)) : ''))}
    ${card(phead('sensitive'), 'ear', 't-orange', group(phead('sensitive'), chips('sensitive', 'warn')) + group(phead('seeking'), chips('seeking')) + (p.calming ? `<p class="small pflab">${t('calms', esc(name))}</p><p class="sub" style="color:var(--ink);margin-top:4px">${esc(p.calming)}</p>` : ''))}
    ${card(phead('behaviours'), 'heart', 't-pink', Object.entries(p.behaviours || {}).map(([k, v]) => `<div class="pfrow"><span>${esc(pword('behaviours', k))}</span><span class="pill ${sev[v]}">${esc(pword('behaviours', v, true))}</span></div>`).join(''))}
    ${card(phead('daily'), 'list', 't-green', Object.entries(p.daily || {}).map(([k, v]) => `<div class="pfrow"><span>${esc(pword('daily', k))}</span><span class="pill ${day[v]}">${esc(pword('daily', v, true))}</span></div>`).join(''))}
    ${card(phead('therapies'), 'clock', 't-blue', group(phead('therapies'), chips('therapies')) + (sh.likes && sh.likes !== 'not noted yet' ? `<p class="small pflab">${t('likesT')}</p><p class="sub" style="color:var(--ink);margin-top:4px">${esc(sh.likes)}</p>` : ''))}
    <p class="small" style="text-align:center;margin-top:12px">${t('aboutFoot', esc(dr), esc(niceDate(sh.at, S.lang)))}</p></div></div>`;
}
/** One piece of guidance: a video, a voice clip, or a few steps. */
function guideItem(g) {
  const tint = { video: 't-purple', audio: 't-pink', text: 't-green' }[g.kind], ic = { video: 'video', audio: 'sound', text: 'list' }[g.kind], src = g.media ? esc(g.media.replace(/^\//, '')) : '';
  return `<div class="card gitem"><div class="aihead"><span class="ic ${tint}">${I[ic]}</span><p class="h3 grow">${esc(L(g.title))}</p><span class="pill">${t('k' + g.kind)}</span></div>
    ${g.kind === 'video' ? `<video class="how" controls playsinline preload="metadata" src="${src}#t=0.1"></video>` : ''}${g.kind === 'audio' ? `<div class="fvoice"><span class="ic t-pink">${I.sound}</span><audio controls preload="metadata" src="${src}"></audio></div>` : ''}
    ${g.body ? `<p class="sub" style="color:var(--ink);margin-top:10px">${esc(L(g.body))}</p>` : ''}${g.steps ? `<ol class="steps plain">${L(g.steps).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}</div>`;
}
const dayNumber = () => Math.floor(new Date(S.db.today + 'T12:00:00') / 864e5);
/** Everyday and weekly guidance, chosen from the child's approved categories. */
function parentGuide(c) {
  const name = S.lang === 'bn' ? c.name_bn : c.name, dr = S.db.therapist.short;
  if (!c.shared || !GD) return `<div class="scroll softbg pad"><div class="bar"><h1 class="h2 grow" style="padding-left:4px">${t('nGuide')}</h1>${langSeg()}</div><div class="in"><div class="card empty"><div class="m">${M.ele({ mood: 'calm' })}</div>${t('gNone', esc(dr))}</div></div></div>`;
  const g = GD.guideFor(c.shared.profile, dayNumber()), items = S.gtab === 'weekly' ? g.weekly : g.daily;
  return `<div class="scroll softbg pad"><div class="bar"><h1 class="h2 grow" style="padding-left:4px">${t('nGuide')}</h1>${langSeg()}</div><div class="in">
    <div class="seg" style="margin-bottom:10px"><button class="${S.gtab === 'daily' ? 'on' : ''}" data-act="gtab" data-d="daily">${t('gToday')}</button><button class="${S.gtab === 'weekly' ? 'on' : ''}" data-act="gtab" data-d="weekly">${t('gWeek')}</button></div>
    <p class="small vline" style="margin:0 4px 10px">${I.shield} ${t('gFor', esc(name), esc(dr))}</p>
    ${items.map(guideItem).join('')}</div></div>`;
}
/** One home activity as the parent sees it: tap to open the video and steps, tick when done. */
function actRow(c, plan, a, pd) {
  const i = plan.activities.indexOf(a), isDone = doneOn(c.id, a.id, S.db.today), open = S.open === a.id, g = plan.goals.find((x) => x.id === a.goal);
  return `<div class="rowbox ${isDone ? 'done' : ''}" data-k="act-${a.id}"><div class="row">
    <button class="grow" style="display:flex;gap:12px;align-items:center" data-act="open" data-id="${a.id}"><span class="ic ${TINTS[i % 6]}">${icon(a.icon)}</span><span class="grow"><span class="h3" style="display:block">${esc(L(a.title))}</span><span class="small" style="display:block">${num(a.minutes)} ${t('min')} · ${esc(L(a.when))}</span>${targetOn(a, pd) ? `<span class="target">${I.star} ${esc(L(targetOn(a, pd)))}</span>` : ''}</span></button>
    <button class="tick ${isDone ? 'on' : ''}" data-act="done" data-id="${a.id}" data-on="${isDone ? '' : '1'}" aria-label="${t('markDone')}">${I.check}</button></div>
    ${open ? `${videoOf(a) ? `<div class="howwrap"><video class="how" controls playsinline preload="metadata" src="${esc(videoOf(a))}#t=0.1"></video><p class="small">${t('watch')}</p></div>` : ''}<ol class="steps">${(a.steps[S.lang]?.length ? a.steps[S.lang] : a.steps.en).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <div class="stepfoot">${g ? `<p class="small" style="margin-bottom:10px">${t('goal')}: ${esc(g.text)}</p>` : ''}<div class="rowbtns" style="margin-top:0">${a.icon === 'book' && plan.story.pages.length ? `<button class="btn soft sm" data-act="story">${I.book} ${t('read')}</button>` : ''}<button class="btn ${isDone ? 'soft' : 'p'} sm" data-act="done" data-id="${a.id}" data-on="${isDone ? '' : '1'}">${isDone ? t('undo') : I.check + ' ' + t('markDone')}</button></div></div>` : ''}</div>`;
}
/** One Home: the day at a glance (tiles and banner), the approved profile, the next step, verified progress, today's guide, the note button and the story. */
function parentHome(c, plan) {
  const name = S.lang === 'bn' ? c.name_bn : c.name, dr = S.db.therapist.short;
  const sum = S.db.summaries[c.id], hasMsg = sum?.parentMessageSent && L(sum.parentMessage);
  const acts = plan?.activities || [], pd = plan ? planDay(plan) : 1;
  const done = acts.filter((a) => doneOn(c.id, a.id, S.db.today)).length, next = acts.find((a) => !doneOn(c.id, a.id, S.db.today));
  const todayNote = S.db.logs.some((l) => l.childId === c.id && l.date === S.db.today), all = acts.length && !next;
  const rest = acts.filter((a) => a !== next), guide = c.shared && GD ? GD.guideFor(c.shared.profile, dayNumber()).daily[0] : null;
  const left = acts.length - done, daysLogged = new Set(weekLogs(c.id).map((l) => l.date)).size;
  return `<div class="scroll homebg pad">
    ${homeTop(hasMsg, langBtn())}
    <div class="greet"><h1>${t('hey', esc(c.parent))}</h1><p>${t('ready', esc(name))}</p><span class="bubble">${all ? t('great') : t('small')}</span><div class="masc">${M.ele({ mood: all ? 'proud' : 'hi' })}</div></div>
    <div class="tiles">
      <button class="tile" data-act="tab" data-tab="tracker"><span class="ic" style="color:var(--blue)">${I.turn}</span><span class="lab">${t('tPractice')}</span><b>${num(done)}/${num(acts.length)}</b><span class="unit">${t('tDone')}</span></button>
      <button class="tile" data-act="tab" data-tab="tracker"><span class="ic" style="color:var(--orange)">${I.mic}</span><span class="lab">${t('tNotes')}</span><b>${num(daysLogged)}</b><span class="unit">${t('tDays')}</span></button>
      <button class="tile" data-act="tab" data-tab="guide"><span class="ic" style="color:var(--green)">${I.heart}</span><span class="lab">${t('nGuide')}</span><b>${num(c.shared && GD ? GD.guideFor(c.shared.profile, dayNumber()).daily.length : 0)}</b><span class="unit">${t('tTips')}</span></button>
    </div>
    ${plan ? `<div class="banner"><div class="cl">${M.cloud()}</div><div class="m">${M.ele({ mood: all ? 'proud' : 'calm' })}</div><div class="cl b">${M.cloud()}</div>
      <p class="h3">${t('progress')}</p><div class="segbar">${acts.map((a) => `<i class="${doneOn(c.id, a.id, S.db.today) ? 'on' : ''}"></i>`).join('')}<span>${num(done)}/${num(acts.length)}</span></div>
      <div class="bchips">${all ? `<span>${t('allDone')}</span>` : `<span>${t('left', num(left))}</span><span>${t('next', esc(L(next.title)))}</span>`}</div></div>` : ''}
    <div class="in" style="padding-top:14px">
      ${aboutCard(c)}
      ${plan ? `<div class="sec"><h2 class="h2">${t('nextT')}</h2><span class="small">${t('doneOf', num(done), num(acts.length))}</span></div>
        ${next ? actRow(c, plan, next, pd) : `<div class="card alldone"><div class="m">${M.ele({ mood: 'proud' })}</div><div><p class="h3">${t('allDoneT')}</p><p class="small">${t('allDoneS')}</p></div></div>`}
        ${rest.length ? `<button class="link morelink" data-act="allacts">${S.allacts ? t('hideAll') : `${t('allToday')} (${num(acts.length)})`}</button>${S.allacts ? rest.map((a) => actRow(c, plan, a, pd)).join('') : ''}` : ''}`
        : `<div class="card empty" style="margin-top:16px"><div class="m">${M.ele({ mood: 'calm' })}</div>${t('waiting', esc(dr))}</div>`}
      ${parentProgress(c) || (plan ? `<div class="card empty" style="margin-top:14px">${t('progNone', esc(dr))}</div>` : '')}
      ${guide ? `<div class="sec"><h2 class="h2">${t('todayGuide')}</h2><button class="link" data-act="tab" data-tab="guide">${t('seeAll')}</button></div>${guideItem(guide)}` : ''}
      <button class="cta" data-act="note"><span class="m">${M.tiger({ mood: todayNote ? 'proud' : 'hi' })}</span><span class="grow"><span class="h3" style="display:block">${todayNote ? t('saved') : t('how')}</span><span class="small" style="color:#a8603a">${todayNote ? t('another') : t('tell', esc(dr))}</span></span><span class="go">${I.mic}</span></button>
      ${hasMsg ? `<div class="msg"><span class="m">${M.ele({ mood: 'calm', extra: 'doctor' })}</span><div><p class="small">${t('from', esc(dr))}</p><p class="sub" style="color:var(--ink)">${esc(L(sum.parentMessage))}</p></div></div>` : ''}
    </div></div>`;
}
/** The row of seven days. With `mood` the dots are coloured by how the day went (doctor); without, noted days join into a streak (parent). */
function wk(cid, mood) {
  const logs = weekLogs(cid), have = new Set(logs.map((l) => l.date)), lang = S.role === 'parent' ? S.lang : 'en';
  const ds = days7();
  return `<div class="wk">${ds.map((d, i) => {
    const k = dkey(d), l = logs.filter((x) => x.date === k).pop();
    const join = !mood && l && i > 0 && have.has(dkey(ds[i - 1]));
    return `<div class="d ${l ? 'has' : ''} ${l && mood ? l.mood : ''} ${join ? 'join' : ''} ${k === S.db.today ? 'today' : ''}">${esc(dayName(d, lang))}<i>${l ? I.check : num(d.getDate())}</i></div>`;
  }).join('')}</div>`;
}
/** The progress update the doctor approved, in the parent's own language and without numbers. */
function parentProgress(c, compact) {
  const sh = S.db.progress?.[c.id]?.shared;
  if (!sh || !PG) return '';
  const dr = S.db.therapist.short, lab = (v) => L(PG.PARENT[String(v)]), tone = (v) => (v > 0 ? 'good' : v < 0 ? 'warn' : '');
  if (compact) return `<button class="row" data-act="tab" data-tab="tracker"><span class="ic t-green">${I.chart}</span><span class="grow"><span class="h3" style="display:block">${t('progT', esc(dr))}</span><span class="small">${t('updated', esc(niceDate(sh.at, S.lang)))}</span></span><span style="color:var(--mute);font-size:17px">${I.next}</span></button>`;
  return `<div class="card pprog"><div class="aihead"><span class="m">${M.ele({ mood: 'proud', extra: 'doctor' })}</span><div class="grow"><p class="h3">${t('progT', esc(dr))}</p><p class="small vline">${I.shield} ${t('verified', esc(dr))} · ${esc(niceDate(sh.at, S.lang))}</p></div></div>
    <p class="sub" style="color:var(--ink);margin:10px 0 4px" lang="${S.lang}">${esc(L(sh.message))}</p>
    ${sh.goals.map((g) => `<div class="pgrow"><p>${esc(g.text)}</p><div class="meter">${[-2, -1, 0, 1, 2].map((v) => `<i class="${v <= g.level ? 'on ' + tone(g.level) : ''}"></i>`).join('')}<span class="pill ${tone(g.level)}">${esc(lab(g.level))}</span></div></div>`).join('')}</div>`;
}
function parentTracker(c, plan) {
  const name = S.lang === 'bn' ? c.name_bn : c.name, logs = weekLogs(c.id), acts = plan?.activities || [];
  const done = acts.filter((a) => doneOn(c.id, a.id, S.db.today)), n = streak(c.id), ds = days7();
  const h = { good: 100, mixed: 62, hard: 34 };
  return `<div class="scroll softbg pad">
    <div class="bar"><h1 class="h2 grow" style="padding-left:4px">${t('week', esc(name))}</h1>${langSeg()}</div>
    <div class="in">
      <div class="card streak"><div class="m">${M.ele({ mood: n ? 'proud' : 'calm', flame: n > 1 })}</div><p class="h2" style="margin-top:6px">${t('streak', num(n))}</p><p class="small">${t('streakSub')}</p>
        ${wk(c.id, false)}<p class="small" style="margin-top:14px">${t('todayDone', num(done.length), num(acts.length))}</p></div>
      ${parentProgress(c)}
      <div class="duo">
        <div class="card"><p class="h3">${t('goodDays')}</p><div class="bars">${ds.map((d) => { const l = logs.filter((x) => x.date === dkey(d)).pop(); return `<div><i class="${l ? '' : 'none'}" style="height:${l ? h[l.mood] || 50 : 8}%"></i>${esc(dayName(d, S.lang).slice(0, S.lang === 'bn' ? 3 : 1))}</div>`; }).join('')}</div></div>
        <div class="card"><div class="ringp" style="--p:${acts.length ? (done.length / acts.length) * 100 : 0}">${I.turn}</div><p class="h3" style="margin-top:12px">${t('practiceToday')}</p><p class="small">${t('minDone', num(done.reduce((m, a) => m + a.minutes, 0)))}</p></div>
      </div>
      ${acts.length ? `<div class="sec"><h2 class="h2">${t('thisWeek')}</h2></div>` : ''}
      ${acts.map((a, i) => { const k = ds.filter((d) => doneOn(c.id, a.id, dkey(d))).length; return `<div class="prog"><span class="ic ${TINTS[i % 6]}">${icon(a.icon)}</span><div class="grow"><p class="h3">${esc(L(a.title))}</p><div class="segbar light">${ds.map((d) => `<i class="${doneOn(c.id, a.id, dkey(d)) ? 'on' : ''}"></i>`).join('')}</div></div><span class="badge ${k >= 4 ? 'g' : ''}">${num(k)}/${num(7)}</span></div>`; }).join('')}
      <div class="sec"><h2 class="h2">${t('myNotes')}</h2><button class="link" data-act="note">+ ${t('another')}</button></div>
      ${logs.length ? logs.slice().reverse().map((l) => `<div class="card note"><p class="small" style="margin-bottom:6px">${esc(niceDate(l.at, S.lang))}</p><p class="orig" lang="${l.lang}">${esc(l.text)}</p>${l.wins?.length ? `<div class="tags">${l.wins.map((w) => `<span class="pill good">${I.check}${esc(w)}</span>`).join('')}</div>` : ''}</div>`).join('') : `<div class="card empty">${t('noNotes')}</div>`}
    </div></div>`;
}
function parentStory(c, plan) {
  if (!plan) return `<div class="scroll softbg pad"><div class="in"><div class="card empty" style="margin-top:20px"><div class="m">${M.ele({ mood: 'calm' })}</div>${t('waiting', esc(S.db.therapist.short))}</div></div></div>`;
  const st = plan.story, n = st.pages.length;
  if (!n) return `<div class="scroll softbg pad"><div class="in"><div class="card empty" style="margin-top:20px"><div class="m">${M.ele({ mood: 'calm' })}</div>${t('noStory')}</div></div></div>`;
  S.page = Math.min(S.page, n - 1);
  const p = st.pages[S.page];
  return `<div class="softbg pad" style="flex:1;display:flex;flex-direction:column;min-height:0">
    <div class="bar"><button class="hbtn" data-act="back" aria-label="Back">${I.back}</button><h1 class="h2 grow" style="padding-left:4px;font-size:21px">${esc(L(st.title))}</h1>${langSeg()}</div>
    <div class="reader">${pic(st, S.page)}<p class="words" lang="${S.lang}">${esc(p[S.lang] || p.en)}</p>
      <div class="pager"><button class="hbtn" data-act="page" data-d="-1" ${S.page === 0 ? 'disabled' : ''} aria-label="Back">${I.back}</button>
        <span class="pdots">${st.pages.map((_, i) => `<i class="${i === S.page ? 'on' : ''}"></i>`).join('')}</span>
        <button class="hbtn" data-act="page" data-d="1" ${S.page === n - 1 ? 'disabled' : ''} aria-label="Next">${I.next}</button></div></div></div>`;
}

// ----- the daily note (parent) -----
let V = null, recStream = null, recorder = null, recog = null, recTimer = null;
const EXAMPLE = { en: 'He waited his turn twice today, but cried at the blender noise.', bn: 'আজ দুইবার নিজের পালার জন্য অপেক্ষা করেছে, কিন্তু ব্লেন্ডারের শব্দে কেঁদেছে।' }; // same words as EXAMPLE_NOTES in seed-data.js
/** The photos and videos on a note. Videos play in place; a photo opens larger on a tap. */
const mediaStrip = (n) => (n.media?.length ? `<div class="media">${n.media.map((m) => (m.kind === 'video' ? `<video controls playsinline preload="metadata" src="${esc(m.url.replace(/^\//, ''))}"></video>` : `<button data-act="zoom" data-d="${esc(m.url.replace(/^\//, ''))}"><img loading="lazy" src="${esc(m.url.replace(/^\//, ''))}" alt="Photo from the parent"></button>`)).join('')}</div>` : '');
function noteScreen(c) {
  if (!V) V = { step: 'compose', lang: S.lang, text: '', left: 30, audio: null, mime: null, heardBy: null, note: null, msg: '', media: [] };
  const name = S.lang === 'bn' ? c.name_bn : c.name, dr = S.db.therapist.short;
  const bar = `<div class="bar"><button class="hbtn" data-act="back" aria-label="Back">${I.back}</button><span class="grow"></span>${langSeg()}</div>`;
  const tiger = (mood, cls = '') => `<div class="m ${cls}"><span class="fl a">${I.mic}</span><span class="fl b">${I.book}</span><span class="fl c">${I.heart}</span>${M.tiger({ mood })}</div>`;
  if (V.step === 'done') {
    const n = V.note;
    const group = (label, items, cls) => (items?.length ? `<p class="small" style="margin:12px 0 0">${label}</p><div class="tags" style="margin-top:6px">${items.map((x) => `<span class="pill ${cls}">${esc(x)}</span>`).join('')}</div>` : '');
    return `<div class="notescr peachbg pad">${bar}<div class="hello" style="flex:none;padding-top:0"><div class="m" style="margin-bottom:10px">${M.tiger({ mood: 'proud' })}</div><h1>${t('savedT', esc(dr))}</h1></div>
      <div class="scroll" style="padding:16px 0 20px"><div class="result">${n.text ? `<p class="orig" lang="${n.lang}">${esc(n.text)}</p>` : ''}${mediaStrip(n)}
        ${n.analysed ? `<p class="small" style="margin-top:10px">${t('savedS')}</p>${group(t('went'), n.wins, 'good')}${group(t('hard'), n.struggles, 'warn')}${group(t('trig'), n.triggers, 'bad')}` : `<p class="small" style="margin-top:10px">${t('offline', esc(dr))}</p>`}</div></div>
      <div style="padding:0 18px 20px"><button class="btn p wide" data-act="back">${t('close')}</button></div></div>`;
  }
  if (V.step === 'hearing' || V.step === 'saving') return `<div class="notescr peachbg pad">${bar}<div class="hello">${tiger('proud', 'listen')}<h1>${t(V.step)}</h1></div></div>`;
  const rec = V.step === 'rec';
  return `<div class="notescr peachbg pad">${bar}
    <div class="hello">${tiger('hi', rec ? 'listen' : '')}<h1>${rec ? t('listening') : t('hello', esc(name))}</h1>${rec ? `<p class="timer" id="timer">0:${String(V.left).padStart(2, '0')}</p><p>${t('tapStop')}</p>` : `<p>${t('helloSub', esc(dr))}</p>`}</div>
    ${V.msg ? `<div class="in"><div class="err">${esc(V.msg)}</div></div>` : ''}
    ${rec ? '' : `<div class="chips"><button class="chipb" data-act="vexample"><span class="ic t-yellow">${I.spark}</span>${t('example')}</button><button class="chipb ${V.lang === 'bn' ? 'on' : ''}" data-act="vlang" data-lang="bn"><span class="ic t-pink">${I.mic}</span>${t('speakBn')}</button><button class="chipb ${V.lang === 'en' ? 'on' : ''}" data-act="vlang" data-lang="en"><span class="ic t-blue">${I.mic}</span>${t('speakEn')}</button></div>`}
    <div class="ask">${V.media.length ? `<div class="attach">${V.media.map((m, i) => `<span class="att">${m.kind === 'video' ? `<video src="${esc(m.url)}" muted playsinline preload="metadata"></video><b>${I.play}</b>` : `<img src="${esc(m.url)}" alt="">`}${rec ? '' : `<button data-act="vmediax" data-d="${i}" aria-label="Remove">${I.x}</button>`}</span>`).join('')}</div>` : ''}
      ${rec ? `<div class="live" id="live" lang="${V.lang}">${esc(V.text) || '…'}</div>` : `<textarea id="vtext" lang="${V.lang}" placeholder="${t('ph')}">${esc(V.text)}</textarea>`}
      <div class="tools"><button class="rb ${rec ? 'rec' : ''}" data-act="${rec ? 'recstop' : 'recstart'}" aria-label="${rec ? 'Stop' : 'Record'}">${rec ? I.stop : I.mic}</button>${rec ? '' : `<label class="rb" aria-label="${t('photoL')}"><input type="file" data-media="photo" accept="image/*" capture="environment" hidden>${I.camera}</label><label class="rb" aria-label="${t('videoL')}"><input type="file" data-media="video" accept="video/*" capture="environment" hidden>${I.video}</label>`}<span class="grow small">${rec ? '' : V.lang === 'bn' ? 'বাংলা' : 'English'}</span>${rec ? '' : `<button class="rb send" data-act="vsave" aria-label="Save note">${I.arrow}</button>`}</div></div></div>`;
}
const grabText = () => { const el = $('#vtext'); if (el && V) V.text = el.value; };
async function startRecording() {
  grabText();
  V.msg = '';
  try {
    recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    V.msg = t('micNo');
    return render(true);
  }
  const chunks = [];
  try {
    recorder = new MediaRecorder(recStream);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => finishRecording(new Blob(chunks, { type: recorder?.mimeType || chunks[0]?.type || 'audio/webm' }));
    recorder.start();
  } catch { recorder = null; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    try {
      recog = new SR();
      recog.lang = V.lang === 'bn' ? 'bn-BD' : 'en-US';
      recog.continuous = true;
      recog.interimResults = true;
      recog.onresult = (e) => {
        V.text = Array.from(e.results).map((r) => r[0].transcript).join(' ').replace(/\s+/g, ' ').trim();
        V.heardBy = 'Browser speech recognition';
        const el = $('#live'); if (el) el.textContent = V.text || '…';
      };
      recog.onerror = () => {};
      recog.start();
    } catch { recog = null; }
  }
  V.step = 'rec'; V.left = 30; V.text = '';
  render(true);
  recTimer = setInterval(() => {
    V.left--;
    const el = $('#timer'); if (el) el.textContent = `0:${String(Math.max(0, V.left)).padStart(2, '0')}`;
    if (V.left <= 0) stopRecording();
  }, 1000);
}
function stopRecording(silent) {
  clearInterval(recTimer); recTimer = null;
  try { recog?.stop(); } catch {}
  recog = null;
  const r = recorder;
  if (r && r.state !== 'inactive') { if (silent) r.onstop = null; try { r.stop(); } catch {} }
  else if (!silent && V?.step === 'rec') finishRecording(null);
  recStream?.getTracks().forEach((x) => x.stop());
  recStream = null;
}
async function finishRecording(blob) {
  recorder = null;
  if (!V) return;
  if (blob && blob.size > 800) {
    V.mime = blob.type;
    V.audio = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
    if (S.db.ai.stt) {
      V.step = 'hearing'; render(true);
      try {
        const r = await api('/api/transcribe', { audio: V.audio, mime: V.mime });
        if (r.text) { V.text = r.text; V.lang = r.lang; V.heardBy = 'Google Gemini speech-to-text'; }
      } catch {}
    }
  }
  if (!V) return;
  V.step = 'compose';
  render(true);
}
async function saveNote() {
  grabText();
  V.text = V.text.trim();
  if (!V.text && !V.media.length) return $('#vtext')?.focus();
  V.step = 'saving'; V.msg = ''; render(true);
  try {
    V.note = await api('/api/note', { childId: PARENT_CHILD, text: V.text, lang: V.lang, audio: V.audio, mime: V.mime, heardBy: V.heardBy, media: V.media.map((m) => ({ mime: m.mime, data: m.data })) });
    V.media.forEach((m) => m.kind === 'video' && URL.revokeObjectURL(m.url));
    V.step = 'done';
    await pull();
  } catch (e) {
    V.step = 'compose'; V.msg = e.message;
  }
  render(true);
}

// ----- settings (both personas) -----
function settings() {
  const p = S.role === 'parent', c = kid(PARENT_CHILD);
  const line = (ic, tint, label, act, right = I.next) => `<button class="row" data-act="${act}"><span class="ic ${tint}" style="width:38px;height:38px;font-size:18px">${I[ic]}</span><span class="grow h3" style="font-weight:500">${label}</span><span style="color:var(--mute);font-size:17px">${right}</span></button>`;
  return `<div class="scroll softbg pad"><div class="bar"><h1 class="h2" style="padding-left:4px">${t('settings')}</h1></div><div class="in">
    <div class="card" style="display:flex;gap:14px;align-items:center"><span class="persona" style="width:auto;padding:0;margin:0;background:none"><span class="m ${p ? 't-orange' : 't-purple'}">${p ? M.tiger() : M.ele({ mood: 'calm', extra: 'doctor' })}</span></span>
      <div><p class="h2">${esc(p ? c.parent : S.db.therapist.name)}</p><p class="small">${esc(p ? t('parentOf', S.lang === 'bn' ? c.name_bn : c.name) : S.db.centre.name)}</p></div></div>
    ${FORCED ? '' : `<div class="sec"><h2 class="h2">${t('viewAs')}</h2></div>${personaBtns()}`}
    <div class="sec"><h2 class="h2">${p && S.lang === 'bn' ? 'আরও' : 'More'}</h2></div>
    ${p ? `<div class="row"><span class="ic t-blue" style="width:38px;height:38px;font-size:18px">${I.globe}</span><span class="grow h3" style="font-weight:500">${t('language')}</span>${langSeg()}</div>` : ''}
    ${p ? line('shield', 't-green', t('aiHow'), 'ai') : ''}
    <div class="row"><span class="ic t-purple" style="width:38px;height:38px;font-size:18px">${I.spark}</span><span class="grow"><span class="h3" style="font-weight:500;display:block">${t('lite')}</span><span class="small">${t('liteSub')}</span></span><div class="seg mini"><button class="${Perf.lite ? 'on' : ''}" data-act="lite" data-d="1">${t('on')}</button><button class="${Perf.lite ? '' : 'on'}" data-act="lite" data-d="0">${t('offw')}</button></div></div>
    ${line('refresh', 't-orange', t('reset'), 'reset')}
    <p class="small" style="text-align:center;margin-top:18px">${t('about')}</p>
  </div></div>`;
}

// ----- doctor -----
// ----- the doctor's assistant: a demo of running the app by chatting -----
// It is a showcase, not a live AI. Each suggested question has a prepared answer built from the app's real data,
// and the buttons under an answer do the real thing (open a child, filter the list, add an activity).
const CHAT_ASK = [
  ['users', 't-pink', 'Who needs my attention today?'], ['chart', 't-green', 'How is my caseload this week?'], ['book', 't-blue', 'How was Rafi’s week?'],
  ['spark', 't-purple', 'Suggest a progress update for Rafi'], ['list', 't-orange', 'Draft a plan for Ayaan'], ['plus', 't-blue', 'Add the wait card to Ishrat’s plan'],
  ['check', 't-green', 'Approve Ishrat’s plan'], ['clock', 't-yellow', 'Which families have gone quiet?'], ['send', 't-pink', 'Remind Farid to send a note'],
  ['users', 't-purple', 'Show children at support level 2'], ['mic', 't-orange', 'Add a new child by voice'],
];
const btn = (label, act, attrs = '') => `<button class="chatbtn" data-act="${act}" ${attrs}>${label}</button>`;
async function chatAnswer(q) {
  const x = q.toLowerCase(), named = kids().find((c) => x.includes(c.name.toLowerCase()));
  if (/caseload|overview|this week\?|how are (my|the) children/.test(x) && !named) {
    const all = kids(), logs = all.flatMap((c) => weekLogs(c.id)), hard = logs.filter((l) => l.mood === 'hard').length, flagged = all.filter((c) => needs(c).length).length;
    return { text: `Here is your week across ${all.length} children:`, list: [`<b>${all.filter((c) => livePlan(c.id)).length}</b> plans live · <b>${all.filter((c) => draftPlan(c.id)).length}</b> waiting for your approval`, `<b>${logs.length}</b> notes from parents · <b>${hard}</b> on hard days`, `<b>${flagged}</b> need you · <b>${all.length - flagged}</b> on track`],
      btns: btn('See who needs me', 'tab', 'data-tab="home"') + btn('All children', 'tab', 'data-tab="children"') };
  }
  if (/quiet|silent|not sent|no note|inactive/.test(x)) {
    const quiet = kids().map((c) => ({ c, w: needs(c).find((n) => /^No note/.test(n.text)) })).filter((f) => f.w);
    return quiet.length ? { text: `${quiet.length} ${quiet.length === 1 ? 'family has' : 'families have'} gone quiet:`, list: quiet.map((f) => `<b>${esc(f.c.name)}</b> · ${esc(f.w.text)}`), btns: btn(`Remind ${esc(quiet[0].c.parent)}`, 'chatq', `data-d="Remind ${esc(quiet[0].c.parent)} to send a note"`) + btn(`Open ${esc(quiet[0].c.name)}`, 'kid', `data-id="${quiet[0].c.id}" data-tab="notes"`) }
      : { text: 'No family has gone quiet. Every parent with a live plan has sent a note in the last three days.' };
  }
  if (/progress/.test(x)) {
    const c = named || kid('rafi');
    if (!livePlan(c.id)) return { text: `${esc(c.name)} has no live plan yet, so there is no progress to rate.`, btns: btn(`Open ${esc(c.name)}’s plan`, 'kid', `data-id="${c.id}" data-tab="plan"`) };
    if (!S.db.progress?.[c.id]?.draft) await api('/api/progress/suggest', { childId: c.id });
    await pull();
    const d = S.db.progress[c.id].draft;
    return { text: `I drafted a progress update for ${esc(c.name)}. ${esc(c.parent)} will not see it until you approve.`, list: d.goals.map((g) => `${esc(g.text)} · <b>${esc(PG.GAS.find((v) => v[0] === g.level)[1])}</b>`), quote: esc(d.message.en), btns: btn('Review and approve', 'kid', `data-id="${c.id}" data-tab="progress"`) };
  }
  if (/approve/.test(x)) {
    const c = named || kids().find((k) => draftPlan(k.id)), d = c && draftPlan(c.id);
    if (!d) return { text: c ? `${esc(c.name)} has no draft plan waiting.` : 'No draft plan is waiting for approval.' };
    return { text: `${esc(c.name)}’s draft has ${d.activities.length} ${d.activities.length === 1 ? 'activity' : 'activities'}: ${d.activities.map((a) => esc(a.title.en)).join(', ')}. Send it to ${esc(c.parent)}?`, btns: btn('Approve and send', 'chatapprove', `data-id="${d.id}" data-d="${c.id}"`) + btn('Review first', 'kid', `data-id="${c.id}" data-tab="plan"`) };
  }
  if (/draft a plan|make a plan|plan for|new plan|plan .*week/.test(x)) {
    const c = named || kid('ayaan');
    if (draftPlan(c.id)) return { text: `${esc(c.name)} already has a draft waiting for you.`, btns: btn('Review the draft', 'kid', `data-id="${c.id}" data-tab="plan"`) };
    const speech = c.profile?.speech, keys = speech === 'nonverbal' || speech === 'minimal' ? ['bubbles', 'choice', 'steps'] : ['turn', 'wait', 'breath'], goal = speech === 'nonverbal' || speech === 'minimal' ? 'Ask for what he wants with a look, a point or a word' : 'Wait calmly for a turn';
    await api('/api/plan/manual', { childId: c.id, goals: [goal], keys });
    await pull();
    const d = draftPlan(c.id);
    return { text: `I drafted a week for ${esc(c.name)} from the common activities, fitted to the profile you recorded. ${esc(c.parent)} will not see it until you approve.`, list: d.activities.map((a) => `<b>${esc(a.title.en)}</b> · starts at “${esc(a.daily[0].en)}”`), btns: btn('Review the draft', 'kid', `data-id="${c.id}" data-tab="plan"`) };
  }
  if (/attention|need|today|urgent|who/.test(x) && !/level|week/.test(x)) {
    const flagged = kids().map((c) => ({ c, why: needs(c) })).filter((f) => f.why.length);
    if (!flagged.length) return { text: 'Every child is on track today. Nothing is waiting for you.' };
    return { text: `${flagged.length} ${flagged.length === 1 ? 'child needs' : 'children need'} you today:`, list: flagged.slice(0, 4).map((f) => `<b>${esc(f.c.name)}</b> · ${esc(f.why[0].text)}`),
      btns: btn(`Open ${esc(flagged[0].c.name)}`, 'kid', `data-id="${flagged[0].c.id}" data-tab="${flagged[0].why[0].tab}"`) + btn('See all on Home', 'tab', 'data-tab="home"') };
  }
  if (/level|non-?verbal|filter|show children|which children/.test(x)) {
    const nv = /non-?verbal/.test(x), lvl = (x.match(/level\s*([123])/) || [])[1] || '2';
    const match = kids().filter((c) => (nv ? c.profile?.speech === 'nonverbal' : c.profile?.level === lvl));
    return { text: match.length ? `${match.length} ${match.length === 1 ? 'child is' : 'children are'} ${nv ? 'non-verbal' : `at support level ${lvl}`}:` : `No child is ${nv ? 'non-verbal' : `at support level ${lvl}`}.`, list: match.map((c) => `<b>${esc(c.name)}</b>, ${c.age} · parent ${esc(c.parent)}`),
      btns: match.length ? btn('Show this list', 'chatfilter', nv ? 'data-k="speech" data-d="nonverbal"' : `data-k="level" data-d="${lvl}"`) : '' };
  }
  if (/remind|message|nudge|text\b/.test(x)) {
    const c = named || kids().find((k) => x.includes(k.parent.toLowerCase())) || kid('zayan') || kids()[0];
    return { text: `Here is a short reminder for ${esc(c.parent)}, ${esc(c.name)}’s parent:`, quote: `Hello ${esc(c.parent)}, how is ${esc(c.name)} doing this week? A short note or a photo after practice helps me prepare for our next session.`,
      btns: btn(`Send to ${esc(c.parent)}`, 'chatdemo', 'data-d="Demo only: nothing was sent."') + btn('Edit', 'chatdemo', 'data-d="Demo only: editing is not built yet."') };
  }
  if (/add .*(card|activity|breath|bubbles|story)|to .*plan/.test(x)) {
    const c = named || kid('ishrat'), d = c && draftPlan(c.id), key = /breath/.test(x) ? 'breath' : /bubble/.test(x) ? 'bubbles' : /turn/.test(x) ? 'turn' : 'wait', item = LIB.find((l) => l.key === key);
    if (!d || !item) return { text: `${esc(c?.name || 'That child')} has no draft plan to add to. Start one from the Plan tab first.`, btns: c ? btn(`Open ${esc(c.name)}’s plan`, 'kid', `data-id="${c.id}" data-tab="plan"`) : '' };
    const had = d.activities.some((a) => a.lib === key);
    if (!had) await api('/api/plan/update', { planId: d.id, addCommon: key });
    await pull();
    return { text: had ? `“${esc(item.title.en)}” is already in ${esc(c.name)}’s draft.` : `Done. I added “${esc(item.title.en)}” to ${esc(c.name)}’s draft, starting at “${esc(item.daily[0].en)}”. ${esc(c.parent)} will not see it until you approve.`,
      btns: btn('Review the draft', 'kid', `data-id="${c.id}" data-tab="plan"`) };
  }
  if (/new child|add a child|add child|by voice|register/.test(x)) return { text: 'I can fill in a new child’s profile from your voice or from a photo of an earlier report. You check every answer before it is saved.', btns: btn('Start by voice', 'ncvoice') + btn('Scan a report', 'addchild') };
  if (named || /week|summary|how was|how is/.test(x)) {
    const c = named || kid('rafi'), sum = S.db.summaries[c.id], logs = weekLogs(c.id), hard = logs.filter((l) => l.mood === 'hard').length;
    return { text: sum ? esc(sum.headline) : `${esc(c.name)} has no summary yet.`, list: [`${logs.length} ${logs.length === 1 ? 'note' : 'notes'} from ${esc(c.parent)} this week${hard ? `, ${hard} on hard days` : ''}`, livePlan(c.id) ? `Plan is on day ${planDay(livePlan(c.id))} of 7` : 'No plan is live'],
      btns: btn('Open summary', 'kid', `data-id="${c.id}" data-tab="summary"`) + btn('Open notes', 'kid', `data-id="${c.id}" data-tab="notes"`) };
  }
  return { text: 'This assistant is a demo, so it only knows a few requests. Try one of the suggestions below.' };
}
async function chatSend(q) {
  const par = S.role === 'parent', log = par ? S.pchat : S.chat, busy = par ? 'pchatBusy' : 'chatBusy';
  q = String(q || '').trim();
  if (!q || S[busy]) return;
  log.push({ me: true, text: esc(q) });
  S[busy] = true;
  render(true);
  let a;
  try { [a] = await Promise.all([par ? parentAnswer(q) : chatAnswer(q), new Promise((r) => setTimeout(r, 900))]); } catch (e) { a = { text: esc(e.message) }; }
  log.push(a);
  S[busy] = false;
  render(true);
}
// ----- the parent's AI chat: a demo with prepared answers in English and Bangla -----
// It answers from what the doctor has approved (the profile, the plan, the progress update) and never gives medical advice.
const PASK = [
  ['ear', 't-pink', { en: 'He is crying and covering his ears. What do I do now?', bn: 'ও কান চেপে কাঁদছে। এখন কী করব?' }], ['heart', 't-orange', { en: 'He threw himself on the floor. What do I do now?', bn: 'ও মেঝেতে শুয়ে পড়েছে। এখন কী করব?' }],
  ['food', 't-green', { en: 'He will not eat. What do I do now?', bn: 'ও খেতে চাইছে না। এখন কী করব?' }], ['sleep', 't-purple', { en: 'He cannot sleep. What do I do now?', bn: 'ও ঘুমাতে পারছে না। এখন কী করব?' }],
];
// Situations a doctor has written advice for. The chat never invents advice: it asks two quick questions, finds the closest
// of these, shows how close the match is, and gives that verified advice. A weak match is sent to the doctor instead.
const SIT = {
  noise: { t: { en: 'Upset after a sudden loud sound', bn: 'হঠাৎ জোরে শব্দের পর অস্থির' }, media: 'art/how-breath.mp4',
    steps: { en: ['Move away from the sound, or switch it off.', 'Let him cover his ears. Say softly: “Noise finished.”', 'Give him his favourite toy to hold.', 'Breathe together: smell the flower, blow the candle.'], bn: ['শব্দ থেকে দূরে সরে যান, অথবা শব্দটি বন্ধ করুন।', 'ওকে কান ঢাকতে দিন। আস্তে বলুন: “শব্দ শেষ।”', 'ওর প্রিয় খেলনাটি হাতে দিন।', 'একসাথে শ্বাস নিন: ফুলের গন্ধ নাও, মোমবাতি নেভাও।'] } },
  denied: { t: { en: 'Upset after being told “no” or having to stop', bn: '“না” শোনার পর বা থামতে হওয়ায় অস্থির' }, media: 'art/how-choice.mp4',
    steps: { en: ['Stay calm and keep the “no”. Do not argue.', 'Say what he CAN do: “First shoes, then train.”', 'Offer two choices he is allowed to have.', 'Praise the moment his body is calm.'], bn: ['শান্ত থাকুন এবং “না” বজায় রাখুন। তর্ক করবেন না।', 'ও কী করতে পারবে তা বলুন: “আগে জুতা, তারপর ট্রেন।”', 'অনুমতি আছে এমন দুটি জিনিস থেকে বেছে নিতে দিন।', 'শরীর শান্ত হওয়া মাত্র প্রশংসা করুন।'] } },
  change: { t: { en: 'Upset by a change of plan or routine', bn: 'পরিকল্পনা বা রুটিন বদলে যাওয়ায় অস্থির' },
    steps: { en: ['Say in a few words what is happening now and what comes next.', 'Keep one familiar thing the same (his toy, his seat).', 'Next time give a two-minute warning before the change.'], bn: ['অল্প কথায় বলুন এখন কী হচ্ছে এবং এরপর কী হবে।', 'একটি পরিচিত জিনিস আগের মতো রাখুন (ওর খেলনা, ওর বসার জায়গা)।', 'পরের বার বদলের দুই মিনিট আগে জানিয়ে দিন।'] } },
  food: { t: { en: 'Refusing a new food', bn: 'নতুন খাবার খেতে না চাওয়া' },
    steps: { en: ['Do not force or beg. Stay relaxed.', 'Put one tiny piece beside a food he likes.', 'Touching, smelling or licking all count as a win.', 'Try the same food again in two days.'], bn: ['জোর করবেন না, অনুরোধও করবেন না। স্বাভাবিক থাকুন।', 'ওর পছন্দের খাবারের পাশে একটি ছোট টুকরা রাখুন।', 'ছোঁয়া, গন্ধ নেওয়া বা চেটে দেখা, সবই সাফল্য।', 'দুই দিন পর একই খাবার আবার চেষ্টা করুন।'] } },
  sleep: { t: { en: 'Cannot settle at bedtime', bn: 'ঘুমানোর সময় শান্ত হতে না পারা' }, audio: 'art/guide-bedtime.m4a',
    steps: { en: ['Screens off now. Lights low.', 'Do the same three steps as every night: wash, story, lights.', 'Sit beside him quietly. Few words.', 'Tomorrow, switch screens off one hour earlier.'], bn: ['এখনই স্ক্রিন বন্ধ করুন। আলো কমান।', 'প্রতি রাতের মতো একই তিনটি ধাপ করুন: হাত-মুখ ধোয়া, গল্প, আলো।', 'চুপচাপ ওর পাশে বসুন। কম কথা বলুন।', 'কাল থেকে এক ঘণ্টা আগে স্ক্রিন বন্ধ করুন।'] } },
};
const SAFE = { en: ['Stay close. Move hard or sharp things away.', 'Put a cushion or your hand between him and the hard surface. Do not hold him tightly.', 'If he is injured, or it lasts more than 10 minutes, call the centre now.'], bn: ['কাছে থাকুন। শক্ত বা ধারালো জিনিস সরিয়ে নিন।', 'ওর এবং শক্ত জায়গার মাঝে বালিশ বা আপনার হাত রাখুন। ওকে শক্ত করে ধরবেন না।', 'ও আঘাত পেলে, বা ১০ মিনিটের বেশি চললে, এখনই সেন্টারে ফোন করুন।'] };
const yn = (a, b, c, d) => [[a, b], [c, d]];
const FLOWS = {
  upset: { ask: [
    { q: { en: 'What happened just before?', bn: 'ঠিক আগে কী হয়েছিল?' }, opts: [['noise', { en: 'A loud sound', bn: 'জোরে শব্দ' }], ['denied', { en: 'He was told “no”', bn: 'ওকে “না” বলা হয়েছিল' }], ['change', { en: 'Plans changed', bn: 'পরিকল্পনা বদলেছে' }], ['unknown', { en: 'I do not know', bn: 'জানি না' }]] },
    { q: { en: 'Is he hurting himself or anyone else?', bn: 'ও কি নিজেকে বা অন্য কাউকে আঘাত করছে?' }, opts: yn('no', { en: 'No', bn: 'না' }, 'yes', { en: 'Yes', bn: 'হ্যাঁ' }) }],
    result: (a, ears) => ({ sit: a[0] === 'unknown' ? (ears ? 'noise' : null) : a[0], pct: { noise: ears ? 96 : 90, denied: ears ? 84 : 92, change: 88, unknown: ears ? 71 : 38 }[a[0]], harm: a[1] === 'yes' }) },
  food: { ask: [
    { q: { en: 'Is it a new food or a food he usually eats?', bn: 'এটি কি নতুন খাবার, নাকি ও সাধারণত যা খায়?' }, opts: yn('new', { en: 'A new food', bn: 'নতুন খাবার' }, 'usual', { en: 'A usual food', bn: 'সাধারণ খাবার' }) },
    { q: { en: 'Has he eaten anything else today?', bn: 'আজ ও কি অন্য কিছু খেয়েছে?' }, opts: yn('yes', { en: 'Yes', bn: 'হ্যাঁ' }, 'little', { en: 'Very little', bn: 'খুব কম' }) }],
    result: (a) => (a[0] === 'new' ? { sit: 'food', pct: a[1] === 'yes' ? 93 : 81 } : { sit: null, pct: 34 }) },
  sleep: { ask: [
    { q: { en: 'Was he on a screen in the last hour?', bn: 'গত এক ঘণ্টায় ও কি স্ক্রিন দেখেছে?' }, opts: yn('yes', { en: 'Yes', bn: 'হ্যাঁ' }, 'no', { en: 'No', bn: 'না' }) },
    { q: { en: 'Was tonight’s bedtime routine the same as usual?', bn: 'আজ রাতের ঘুমের রুটিন কি অন্য দিনের মতো ছিল?' }, opts: yn('same', { en: 'The same', bn: 'একই ছিল' }, 'different', { en: 'Different', bn: 'অন্যরকম ছিল' }) }],
    result: (a) => ({ sit: 'sleep', pct: 76 + (a[0] === 'yes' ? 11 : 0) + (a[1] === 'different' ? 8 : 0) }) },
};
/** Asks the next question of a situation, or gives the verified advice with how well it matched. */
function flowStep() {
  const f = S.pflow, flow = FLOWS[f.flow], bn = S.lang === 'bn', dr = S.db.therapist.short, say = (en, b) => esc(bn ? b : en), c = kid(PARENT_CHILD);
  if (f.a.length < flow.ask.length) { const k = flow.ask[f.a.length]; return { text: esc(L(k.q)), opts: k.opts.map(([v, lab]) => [v, esc(L(lab))]) }; }
  const r = flow.result(f.a, f.ears), sit = r.sit && SIT[r.sit];
  S.pflow = null;
  const told = `${f.said} ${flow.ask.map((k, i) => `${k.q.en} ${k.opts.find((o) => o[0] === f.a[i])[1].en}.`).join(' ')}`;
  const harm = r.harm ? { safe: SAFE[S.lang] || SAFE.en } : {};
  if (!sit || r.pct < 60) return { ...harm, match: { pct: r.pct, low: true, title: say('No close match', 'কাছাকাছি কোনো মিল নেই') }, text: say(`This does not closely match any situation ${dr} has verified, so I will not guess. Please send it to ${dr}.`, `${dr} যাচাই করেছেন এমন কোনো পরিস্থিতির সাথে এটি ভালোভাবে মেলে না, তাই আমি অনুমান করব না। অনুগ্রহ করে ${dr}-কে জানান।`), btns: btn(say(`Send to ${dr}`, `${dr}-কে পাঠান`), 'pnote', `data-d="${esc(told)}"`) };
  return { ...harm, match: { pct: r.pct, title: esc(L(sit.t)), by: esc(t('verified', dr)), weak: r.pct < 80 }, text: say('Do this now:', 'এখন এটি করুন:'), list: (sit.steps[S.lang] || sit.steps.en).map((x) => esc(x)), video: sit.media, audio: sit.audio,
    quote: c.shared?.profile?.calming && f.flow === 'upset' ? `${say(`${dr} noted what calms ${c.name}:`, `${dr} লিখেছেন ${c.name_bn}-কে যা শান্ত করে:`)} ${esc(c.shared.profile.calming)}` : '',
    btns: btn(say('It helped', 'কাজ হয়েছে'), 'pnote', `data-d="${esc(told + ' I followed the advice for “' + sit.t.en + '” and it helped.')}"`) + btn(say('It did not help', 'কাজ হয়নি'), 'pnote', `data-d="${esc(told + ' I followed the advice for “' + sit.t.en + '” and it did not help.')}"`) };
}
function parentAnswer(q) {
  const x = q.toLowerCase(), bn = S.lang === 'bn', c = kid(PARENT_CHILD), name = bn ? c.name_bn : c.name, dr = S.db.therapist.short, plan = livePlan(c.id), p = c.shared?.profile || {};
  const say = (en, b) => esc(bn ? b : en);
  const flow = /sleep|awake|bedtime|ঘুম/.test(x) ? 'sleep' : /eat|food|meal|hungry|খেতে|খায়|খাচ্ছে|খাবার/.test(x) ? 'food' : /cry|scream|floor|ears|hit|bang|threw|kick|bit|shout|tantrum|কাঁদ|কান্না|চিৎকার|মেঝে|কান চেপে|মারছে|লাথি/.test(x) ? 'upset' : null;
  if (flow && !/medicine|medication|dose|tablet|ওষুধ|ঔষধ|seizure|খিঁচুনি/.test(x)) {
    S.pflow = { flow, a: [], said: q, ears: /ear|কান/.test(x) };
    const first = flowStep();
    return { ...first, text: `${say(`I will ask two quick questions, then match this with a situation ${dr} has verified.`, `আমি দুটি ছোট প্রশ্ন করব, তারপর ${dr} যাচাই করেছেন এমন পরিস্থিতির সাথে মিলিয়ে দেখব।`)}<br><br><b>${first.text}</b>` };
  }
  if (/medicine|medication|dose|tablet|ওষুধ|ঔষধ|seizure|খিঁচুনি|emergency|জরুরি/.test(x)) return { text: say(`I cannot help with medicine or emergencies. Please call ${dr} or the centre straight away.`, `ওষুধ বা জরুরি বিষয়ে আমি সাহায্য করতে পারি না। এখনই ${dr} বা সেন্টারে ফোন করুন।`) };
  if (/loud|sound|noise|শব্দ|আওয়াজ/.test(x)) return { text: say(`Many autistic children hear everyday sounds as much louder than we do. ${dr} recorded that ${name} is sensitive to sound, so a blender or a drill can feel frightening.`, `অনেক অটিস্টিক শিশু সাধারণ শব্দকে আমাদের চেয়ে অনেক জোরে শোনে। ${dr} লিখেছেন যে ${name} শব্দে সংবেদনশীল, তাই ব্লেন্ডার বা ড্রিলের শব্দ ওর কাছে ভয়ের মনে হতে পারে।`),
    list: [say('Warn first: “noise coming”.', 'আগে জানান: “শব্দ আসছে”।'), say('Count to three together, then start.', 'একসাথে তিন পর্যন্ত গুনুন, তারপর চালু করুন।')], quote: say(`This is general information, not medical advice. Ask ${dr} about anything that worries you.`, `এটি সাধারণ তথ্য, চিকিৎসা পরামর্শ নয়। কোনো দুশ্চিন্তা থাকলে ${dr}-কে জিজ্ঞেস করুন।`), btns: btn(say(`About ${name}`, `${name} সম্পর্কে`), 'about') + btn(say('Open the guide', 'গাইড খুলুন'), 'tab', 'data-tab="guide"') };
  if (/upset|cry|meltdown|angry|calm|অস্থির|কান্না|কাঁদ|রাগ|শান্ত/.test(x)) return { text: say(`When ${name} is upset: go quiet, come down to eye level, and breathe together slowly.`, `${name} অস্থির হলে: চুপ থাকুন, ওর চোখের সমান উচ্চতায় নামুন এবং একসাথে ধীরে শ্বাস নিন।`), list: [say('Fewer words, softer voice.', 'কম কথা, নরম গলা।'), say('Smell the flower, blow the candle, three times.', 'ফুলের গন্ধ নাও, মোমবাতি নেভাও, তিনবার।'), say('Praise as soon as the body is calm.', 'শরীর শান্ত হলেই প্রশংসা করুন।')],
    quote: p.calming ? `${say(`${dr} noted what calms ${name}:`, `${dr} লিখেছেন ${name}-কে যা শান্ত করে:`)} ${esc(p.calming)}` : '', btns: btn(say('Open the guide', 'গাইড খুলুন'), 'tab', 'data-tab="guide"') + btn(say('Tell the doctor', 'ডাক্তারকে জানান'), 'note') };
  if (/wait|snack|অপেক্ষা|নাস্তা/.test(x)) { const a = plan?.activities.find((k) => k.icon === 'wait');
    return { text: say('If waiting is still hard, make it easier first, then build it up again.', 'অপেক্ষা করা এখনো কঠিন হলে আগে সহজ করুন, তারপর আবার ধীরে বাড়ান।'), list: [say('Go back to a count of 3.', '৩ গোনায় ফিরে যান।'), say('Keep the snack where he can see it.', 'নাস্তা ওর চোখের সামনে রাখুন।'), say('Give it the moment the count ends, and praise.', 'গোনা শেষ হওয়া মাত্র দিন এবং প্রশংসা করুন।'), say('Add one count every two days.', 'প্রতি দুই দিনে এক গোনা বাড়ান।')],
      btns: (a ? btn(say('Watch how', 'কীভাবে করবেন দেখুন'), 'popen', `data-id="${a.id}"`) : '') + btn(say('Tell the doctor', 'ডাক্তারকে জানান'), 'note') }; }
  if (/doing|progress|better|improv|অগ্রগতি|কেমন করছে|উন্নতি/.test(x)) { const sh = S.db.progress?.[c.id]?.shared;
    return sh ? { text: esc(L(sh.message)), list: sh.goals.map((g) => `${esc(g.text)} · <b>${esc(L(PG.PARENT[String(g.level)]))}</b>`), quote: say(`Verified by ${dr} on ${niceDate(sh.at, 'en')}.`, `${dr} যাচাই করেছেন, ${niceDate(sh.at, 'bn')}।`), btns: btn(say('See the tracker', 'ট্র্যাকার দেখুন'), 'tab', 'data-tab="tracker"') } : { text: esc(t('progNone', dr)) }; }
  if (/doctor|tell|note|ডাক্তার|জানাব|নোট/.test(x)) return { text: say(`Three things help ${dr} most:`, `${dr}-এর সবচেয়ে কাজে লাগে তিনটি বিষয়:`), list: [say('One thing that went well.', 'একটি বিষয় যা ভালো হয়েছে।'), say('One thing that was hard, and what happened just before.', 'একটি বিষয় যা কঠিন ছিল, এবং ঠিক তার আগে কী হয়েছিল।'), say('How he slept.', 'ও কেমন ঘুমিয়েছে।')], btns: btn(say('Write or record a note', 'নোট লিখুন বা বলুন'), 'note') };
  if (/guide|week|tip|গাইড|সপ্তাহ|পরামর্শ/.test(x)) { const g = c.shared && GD ? GD.guideFor(c.shared.profile, dayNumber()).weekly : [];
    return g.length ? { text: say(`This week’s guide for ${name}:`, `${name}-এর জন্য এই সপ্তাহের গাইড:`), list: g.map((it) => `<b>${esc(L(it.title))}</b> · ${esc(t('k' + it.kind))}`), btns: btn(say('Open the guide', 'গাইড খুলুন'), 'pguide') } : { text: esc(t('gNone', dr)) }; }
  if (/today|next|step|practice|activity|আজ|পরের|ধাপ|অনুশীলন/.test(x)) { const pd = plan ? planDay(plan) : 1, a = plan?.activities.find((k) => !doneOn(c.id, k.id, S.db.today));
    if (!plan) return { text: esc(t('waiting', dr)) };
    if (!a) return { text: say('Everything for today is done. Wonderful!', 'আজকের সব অনুশীলন শেষ। দারুণ!') };
    return { text: `${esc(L(a.title))} · ${num(a.minutes)} ${esc(t('min'))} · ${esc(L(a.when))}`, quote: targetOn(a, pd) ? esc(L(targetOn(a, pd))) : '', list: (a.steps[S.lang]?.length ? a.steps[S.lang] : a.steps.en).map((st) => esc(st)), btns: btn(say('Open with the video', 'ভিডিওসহ খুলুন'), 'popen', `data-id="${a.id}"`) }; }
  return { text: say('I am a demo assistant, so I only know a few questions. Try one of the suggestions below.', 'আমি একটি ডেমো সহকারী, তাই অল্প কয়েকটি প্রশ্নের উত্তর জানি। নিচের যেকোনো একটি বেছে নিন।') };
}
function parentChat() {
  const dr = S.db.therapist.short, bn = S.lang === 'bn', fresh = !S.pchat.length, face = M.ele({ mood: 'calm' });
  const lastOne = S.pchat[S.pchat.length - 1];
  const bubble = (m) => (m.me ? `<div class="msgme">${m.text}</div>` : `<div class="msgai"><span class="m">${face}</span><div class="say">${m.safe ? `<div class="safebox"><b>${I.shield} ${bn ? 'আগে ওকে নিরাপদ রাখুন' : 'First, keep him safe'}</b><ul>${m.safe.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    ${m.match ? `<div class="match ${m.match.low ? 'low' : m.match.weak ? 'weak' : ''}"><div class="ringm" style="--p:${m.match.pct}"><b>${num(m.match.pct)}%</b></div><div class="grow"><p class="small">${bn ? 'যাচাই করা পরিস্থিতির সাথে মিল' : 'Match with a verified situation'}</p><p class="h3">${m.match.title}</p>${m.match.by ? `<p class="small vline">${I.shield} ${m.match.by}</p>` : ''}</div></div>${m.match.weak ? `<p class="small" style="margin-bottom:8px">${bn ? 'মিলটি খুব জোরালো নয়। কাজ না হলে ডাক্তারকে জানান।' : 'This is not a strong match. If it does not help, tell the doctor.'}</p>` : ''}` : ''}
    <p>${m.text}</p>${m.opts && m === lastOne && S.pflow ? `<div class="chatbtns opts2">${m.opts.map(([v, lab]) => `<button class="chatbtn" data-act="pans" data-d="${v}">${lab}</button>`).join('')}</div>` : ''}${m.list?.length ? `<ul>${m.list.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}${m.video ? `<video class="how" style="margin-top:10px" controls playsinline preload="metadata" src="${esc(m.video)}#t=0.1"></video>` : ''}${m.audio ? `<div class="fvoice"><span class="ic t-pink">${I.sound}</span><audio controls preload="metadata" src="${esc(m.audio)}"></audio></div>` : ''}${m.quote ? `<blockquote>${m.quote}</blockquote>` : ''}${m.btns ? `<div class="chatbtns">${m.btns}</div>` : ''}</div></div>`);
  // Same look as the "How was the day?" screen: the tiger with floating icons, a big greeting, chips, and one big box to say or type in.
  const tiger = `<div class="m"><span class="fl a">${I.mic}</span><span class="fl b">${I.shield}</span><span class="fl c">${I.heart}</span>${M.tiger({ mood: 'hi' })}</div>`;
  return `<div class="chatscr notescr peachbg pad"><div class="bar"><span class="grow"></span>${fresh ? '' : `<button class="hbtn" data-act="chatclear" aria-label="New chat">${I.refresh}</button>`}${langSeg()}</div>
    ${fresh ? `<div class="hello">${tiger}<h1>${t('chatHi', esc(kid(PARENT_CHILD).parent))}</h1><p>${t('chatHint', esc(dr))}</p></div>` : `<div class="chatlog">${S.pchat.map(bubble).join('')}${S.pchatBusy ? `<div class="msgai"><span class="m">${face}</span><div class="say typing"><i></i><i></i><i></i></div></div>` : ''}</div>`}
    <div class="chips">${PASK.map(([ic, tint, q]) => `<button class="chipb" data-act="chatq" data-d="${esc(L(q))}"><span class="ic ${tint}">${I[ic]}</span>${esc(L(q))}</button>`).join('')}</div>
    <div class="ask"><textarea id="chatin" lang="${S.lang}" placeholder="${t('chatPh')}" maxlength="200"></textarea>
      <div class="tools"><button class="rb" data-act="chatdemo" data-d="${t('chatVoice')}" aria-label="Speak">${I.mic}</button><button class="rb" data-act="chatdemo" data-d="${t('chatMedia')}" aria-label="${t('photoL')}">${I.camera}</button><button class="rb" data-act="chatdemo" data-d="${t('chatMedia')}" aria-label="${t('videoL')}">${I.video}</button><span class="grow small">${S.lang === 'bn' ? 'বাংলা' : 'English'}</span><button class="rb send" data-act="chatgo" aria-label="Send">${I.arrow}</button></div></div></div>`;
}
function assistant() {
  const bubble = (m) => (m.me ? `<div class="msgme">${m.text}</div>` : `<div class="msgai"><span class="m">${M.ele({ mood: 'calm', extra: 'doctor' })}</span><div class="say"><p>${m.text}</p>${m.list?.length ? `<ul>${m.list.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}${m.quote ? `<blockquote>${m.quote}</blockquote>` : ''}${m.btns ? `<div class="chatbtns">${m.btns}</div>` : ''}</div></div>`);
  const fresh = !S.chat.length;
  return `<div class="chatscr softbg pad"><div class="bar"><div class="grow" style="padding-left:4px"><h1 class="h2">AI assistant</h1><p class="small">Run the app by asking · demo</p></div>${fresh ? '' : `<button class="hbtn" data-act="chatclear" aria-label="New chat">${I.refresh}</button>`}<button class="hbtn" data-act="aiinfo" aria-label="How AI is used">${I.shield}</button></div>
    <div class="chatlog">${fresh ? `<div class="chathello"><div class="m">${M.ele({ mood: 'hi', extra: 'doctor' })}</div><p class="h2">How can I help, ${esc(S.db.therapist.short)}?</p><p class="small">Tap a request or type your own.</p></div>
      <div class="asklist">${CHAT_ASK.map(([ic, tint, q]) => `<button data-act="chatq" data-d="${esc(q)}"><span class="ic ${tint}">${I[ic]}</span><span class="grow">${esc(q)}</span>${I.arrow}</button>`).join('')}</div>` : S.chat.map(bubble).join('')}
      ${S.chatBusy ? `<div class="msgai"><span class="m">${M.ele({ mood: 'calm', extra: 'doctor' })}</span><div class="say typing"><i></i><i></i><i></i></div></div>` : ''}</div>
    ${fresh ? '' : `<div class="chatask">${CHAT_ASK.map(([, , q]) => `<button class="chipb" data-act="chatq" data-d="${esc(q)}">${esc(q)}</button>`).join('')}</div>`}
    <div class="chatbox"><input id="chatin" placeholder="Ask the assistant…" autocomplete="off" maxlength="200"><button class="rb send" data-act="chatgo" aria-label="Send">${I.arrow}</button></div></div>`;
}
function doctor() {
  if (S.push === 'child' && kid(S.childId)) return childView(kid(S.childId));
  if (S.push === 'aiinfo') return aiUse(true);
  if (S.tab.doctor === 'chat') S.tab.doctor = 'ai';
  const tab = S.tab.doctor, waiting = kids().filter((c) => draftPlan(c.id)).length;
  const body = tab === 'children' ? childList() : tab === 'ai' ? assistant() : tab === 'settings' ? settings() : doctorHome();
  return body + nav([['home', 'home', 'Home'], ['children', 'users', 'Children', waiting], ['ai', 'spark', 'AI use'], ['settings', 'gear', 'Settings']]);
}
const kidStatus = (c) => (draftPlan(c.id) ? `<span class="pill warn">Draft to review</span>` : livePlan(c.id) ? `<span class="pill good">Plan live</span>` : `<span class="pill line">No plan yet</span>`);
/** Why a child needs the doctor right now, most urgent first. An empty list means the child is on track. */
function needs(c) {
  const out = [], live = livePlan(c.id), draft = draftPlan(c.id), sum = S.db.summaries[c.id];
  const ago = (date) => Math.round((new Date(S.db.today + 'T12:00:00') - new Date(date.slice(0, 10) + 'T12:00:00')) / 864e5);
  const logs = S.db.logs.filter((l) => l.childId === c.id).sort((a, b) => a.at.localeCompare(b.at)), last = logs[logs.length - 1];
  const hard = weekLogs(c.id).filter((l) => l.mood === 'hard').length, fresh = freshNotes(c);
  const add = (tab, ic, tint, text) => out.push({ tab, ic, tint, text });
  // 1. the child is struggling at home
  if (hard >= 2) add('notes', 'heart', 't-pink', `${hard} hard days at home this week`);
  else if (last && last.mood === 'hard' && ago(last.date) <= 6) add('notes', 'heart', 't-pink', `${c.parent}’s last note was a hard day`);
  // 2. something is waiting for the doctor's decision
  if (draft) add('plan', 'edit', 't-orange', `Draft plan waiting for your approval`);
  if (S.db.progress?.[c.id]?.draft) add('progress', 'spark', 't-orange', `AI progress suggestion waiting for your approval`);
  if (fresh) add('summary', 'mic', 't-green', `${fresh} new note${fresh > 1 ? 's' : ''} since your last summary`);
  if (sum && !sum.parentMessageSent && live) add('summary', 'send', 't-blue', `Your message to ${c.parent} is not sent yet`);
  // 3. the family has gone quiet (only once the plan has had three days to get going)
  if (live && !draft && ago(live.approvedAt) >= 3) {
    if (!last || ago(last.date) >= 3) add('notes', 'clock', 't-yellow', last ? `No note from ${c.parent} for ${ago(last.date)} days` : `No notes from ${c.parent} yet`);
    const lastDone = S.db.done.filter((d) => d.childId === c.id).map((d) => d.date).sort().pop();
    if (!lastDone || ago(lastDone) >= 3) add('plan', 'list', 't-yellow', lastDone ? `No practice ticked for ${ago(lastDone)} days` : `No practice ticked yet`);
  }
  // 4. nothing has been set up
  if (!live && !draft) add('plan', 'plus', 't-blue', `No plan yet — set this week’s goals`);
  return out;
}
function doctorHome() {
  const all = kids(), drafts = all.filter((c) => draftPlan(c.id)), fresh = all.reduce((n, c) => n + freshNotes(c), 0);
  const rank = { 't-pink': 0, 't-orange': 1, 't-green': 2, 't-blue': 3, 't-yellow': 4 };
  const flagged = all.map((c) => ({ c, why: needs(c) })).filter((x) => x.why.length).sort((a, b) => rank[a.why[0].tint] - rank[b.why[0].tint] || b.why.length - a.why.length);
  const fine = all.length - flagged.length;
  return `<div class="scroll homebg pad">
    ${homeTop(flagged.length)}
    <div class="greet"><h1>Hey, ${esc(S.db.therapist.short)}</h1><p>${esc(S.db.centre.name)}</p><span class="bubble">${flagged.length ? `${flagged.length} need${flagged.length === 1 ? 's' : ''} you` : 'All caught up!'}</span><div class="masc">${M.ele({ mood: 'hi', extra: 'doctor' })}</div></div>
    <div class="tiles">
      <button class="tile" data-act="tab" data-tab="children"><span class="ic" style="color:var(--p)">${I.users}</span><span class="lab">Children</span><b>${all.length}</b><span class="unit">in your care</span></button>
      <button class="tile" data-act="tab" data-tab="children"><span class="ic" style="color:var(--orange)">${I.edit}</span><span class="lab">To review</span><b>${drafts.length}</b><span class="unit">${drafts.length === 1 ? 'draft' : 'drafts'}</span></button>
      <button class="tile" data-act="tab" data-tab="children"><span class="ic" style="color:var(--green)">${I.mic}</span><span class="lab">New notes</span><b>${fresh}</b><span class="unit">since summary</span></button>
    </div>
    <div class="in">
      <div class="sec"><h2 class="h2">Needs your attention</h2>${flagged.length ? `<span class="pill dark">${flagged.length}</span>` : ''}</div>
      ${flagged.length ? flagged.map(({ c, why }) => `<div class="card need" data-k="need-${c.id}">
        <button class="needtop" data-act="kid" data-id="${c.id}" data-tab="${why[0].tab}">${avatar(c)}<span class="grow"><span class="h3" style="display:block">${esc(c.name)}, ${c.age}</span><span class="small">Parent: ${esc(c.parent)}</span></span><span style="color:var(--mute);font-size:17px">${I.next}</span></button>
        ${why.map((w) => `<button class="why" data-act="kid" data-id="${c.id}" data-tab="${w.tab}"><span class="ic ${w.tint}">${I[w.ic]}</span><span class="grow">${esc(w.text)}</span></button>`).join('')}</div>`).join('')
        : `<div class="card empty"><div class="m">${M.ele({ mood: 'proud' })}</div>Every child is on track.<br>Nothing is waiting for you.</div>`}
      ${fine ? `<button class="ontrack" data-act="tab" data-tab="children"><span class="pill good">${I.check} ${fine} on track</span><span class="grow small">${fine === 1 ? 'One child needs' : 'These children need'} nothing from you today</span><span class="link">See all</span></button>` : ''}
    </div></div>`;
}
// ----- filter the children list by the profile categories -----
// Inside one category any chosen answer matches (Level 1 or Level 2); across categories all must match (Level 2 and non-verbal).
const FILTERS = ['status', 'level', 'dxType', 'speech', 'co', 'sensitive', 'behaviours', 'therapies'];
const STATUS = { label: 'Plan', opts: [['live', 'Plan live'], ['draft', 'Draft to review'], ['none', 'No plan yet']] };
const fspec = (k) => (k === 'status' ? STATUS : PF[k]);
const statusOf = (c) => (draftPlan(c.id) ? 'draft' : livePlan(c.id) ? 'live' : 'none');
const fvalues = (c, k) => { const p = c.profile || {}; return k === 'status' ? [statusOf(c)] : k === 'behaviours' ? Object.keys(p.behaviours || {}) : Array.isArray(p[k]) ? p[k] : p[k] ? [p[k]] : []; };
const fmatch = (c) => FILTERS.every((k) => !(S.filter[k] || []).length || S.filter[k].some((v) => fvalues(c, k).includes(v)));
const fcount = () => FILTERS.reduce((n, k) => n + (S.filter[k] || []).length, 0);
function filterSheet() {
  if (!PF) return toast('Still loading. Try again in a moment.');
  const n = kids().filter(fmatch).length;
  openSheet(`${shead('Filter children', 'Choose what you are looking for. You can pick several.')}
    <div class="editbox" style="margin-top:0">${FILTERS.map((k) => `<label>${fspec(k).label}</label><div class="opts">${fspec(k).opts.filter((o) => o[0] !== 'none' || k === 'status').map(([v, lab]) => `<button class="opt ${(S.filter[k] || []).includes(v) ? 'on' : ''}" data-act="ftog" data-k="${k}" data-d="${v}">${lab}</button>`).join('')}</div>`).join('')}</div>
    <div class="stepnav stick"><button class="btn soft" data-act="fclear">Clear</button><button class="btn p grow" data-act="close" id="fshow">Show ${n} ${n === 1 ? 'child' : 'children'}</button></div>`);
}
function childList() {
  // children with the same plan status sit together: live plans first, then drafts, then no plan (the sort keeps their order inside each group)
  const order = (c) => (draftPlan(c.id) ? 1 : livePlan(c.id) ? 0 : 2), on = PF ? fcount() : 0;
  const byStatus = [...kids()].filter((c) => !on || fmatch(c)).sort((x, y) => order(x) - order(y));
  const chips = on ? FILTERS.flatMap((k) => (S.filter[k] || []).map((v) => `<button class="pill dark" data-act="ftog" data-k="${k}" data-d="${v}">${esc((fspec(k).opts.find((o) => o[0] === v) || [])[1])} ${I.x}</button>`)).join('') : '';
  return `<div class="scroll softbg pad"><div class="bar"><div class="grow" style="padding-left:4px"><h1 class="h2">My children</h1><p class="small">${on ? `${byStatus.length} of ${kids().length} match` : `${kids().length} in your care`}</p></div><button class="btn p sm" data-act="addchild">${I.plus} Add child</button></div><div class="in">
    <div class="fbar"><button class="btn soft sm ${on ? 'has' : ''}" data-act="filter">${I.list} Filter${on ? ` · ${on}` : ''}</button>${chips}${on ? `<button class="link" data-act="fclear">Clear</button>` : ''}</div>
    ${byStatus.map((c) => `<button class="row" data-act="kid" data-id="${c.id}">${avatar(c)}<span class="grow"><span class="h3" style="display:block">${esc(c.name)}, ${c.age}</span><span class="small" style="display:block">Parent: ${esc(c.parent)}</span><span class="small" style="display:block">${weekLogs(c.id).length} of 7 days noted</span></span>${kidStatus(c)}</button>`).join('')}
    ${on && !byStatus.length ? `<div class="card empty"><div class="m">${M.ele({ mood: 'calm' })}</div>No child matches these filters.<div style="margin-top:14px"><button class="btn p sm" data-act="fclear">Clear filters</button></div></div>` : ''}
  </div></div>`;
}
// ----- progress -----
/** This week's figures, worked out from what the parent ticked and noted. */
function weekNow(c) {
  const plan = livePlan(c.id), logs = weekLogs(c.id), count = (m) => logs.filter((l) => l.mood === m).length;
  const ticks = S.db.done.filter((d) => d.childId === c.id && d.date >= S.db.weekStart).length, planned = plan ? plan.activities.length * 7 : 0;
  return { start: S.db.weekStart, now: true, practice: planned ? Math.min(100, Math.round((ticks / planned) * 100)) : 0, good: count('good'), mixed: count('mixed'), hard: count('hard'), upsets: logs.reduce((n, l) => n + (l.triggers || []).length, 0) };
}
/** How the child is doing over time: goal ratings by the therapist, the weeks at home, skills then and now, and the parent checklist. */
function progressTab(c) {
  if (!PG) return '';
  const pr = S.db.progress?.[c.id] || { weeks: [], goals: [], atec: [], was: {} }, plan = livePlan(c.id), days = (iso) => Math.round((new Date(S.db.today + 'T12:00:00') - new Date(iso + 'T12:00:00')) / 864e5);
  const ago = (iso) => { const n = days(iso); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : n < 14 ? `${n} days ago` : `${Math.round(n / 7)} weeks ago`; };
  const weeks = plan ? [...pr.weeks, weekNow(c)] : pr.weeks, now = weeks[weeks.length - 1], prev = weeks[weeks.length - 2];
  // goals come from the live plan; a goal that has never been rated simply has no history yet
  const goals = (plan?.goals || []).map((g) => pr.goals.find((x) => x.text === g.text) || { text: g.text, ratings: [] });
  const latest = (g) => g.ratings[g.ratings.length - 1], met = goals.filter((g) => latest(g) && latest(g).level >= 0).length;
  const delta = (a, b, goodUp) => (b == null || a === b ? '' : `<i class="${(a > b) === goodUp ? 'up' : 'down'}">${a > b ? '▲' : '▼'} ${Math.abs(a - b)}</i>`);
  const tile = (big, label, extra = '') => `<div class="ptile"><b>${big}</b>${extra}<span>${label}</span></div>`;
  const glance = plan ? `<div class="ptiles">${tile(`${met}/${goals.length}`, 'goals at or above expected')}${tile(`${now.practice}%`, 'practice done this week', delta(now.practice, prev?.practice, true))}${tile(now.hard, now.hard === 1 ? 'hard day this week' : 'hard days this week', delta(now.hard, prev?.hard, false))}</div>` : '';
  const goalCards = goals.map((g, gi) => {
    const l = latest(g), pts = g.ratings.slice(-6), line = pts.length > 1 ? `<svg class="trend" viewBox="0 0 100 34" preserveAspectRatio="none"><polyline points="${pts.map((r, i) => `${(i / (pts.length - 1)) * 96 + 2},${17 - r.level * 7}`).join(' ')}"/></svg>` : '';
    return `<div class="card pgoal" data-k="pg-${gi}"><p class="h3">${esc(g.text)}</p>
      <div class="gas">${PG.GAS.map(([v]) => `<button class="${l?.level === v ? 'on' : ''} ${v < 0 ? 'neg' : v > 0 ? 'pos' : ''}" data-act="rate" data-d="${v}" data-id="${gi}" aria-label="${v}">${v > 0 ? '+' + v : v}</button>`).join('')}</div>
      <div class="gasfoot"><span class="grow small">${l ? `<b>${esc(PG.GAS.find((x) => x[0] === l.level)[1])}</b> · rated ${ago(l.date)}` : 'Not rated yet. Tap a level after the session.'}</span>${line}</div></div>`;
  }).join('');
  const bars = (key, max, cls, unit = '') => `<div class="wk7">${weeks.slice(-7).map((w) => `<i class="${w.now ? 'now' : ''}" title="${w[key]}${unit}"><b class="${cls}" style="height:${Math.max(4, Math.round((w[key] / max) * 100))}%"></b></i>`).join('')}</div>`;
  const row = (label, key, max, cls, unit = '') => `<div class="wrow"><div class="grow"><p class="h3" style="font-weight:500">${label}</p><p class="small">${prev ? `${prev[key]}${unit} last week` : 'first week'}</p></div>${bars(key, max, cls, unit)}<b class="wnow">${now[key]}${unit}</b></div>`;
  const home = weeks.length ? `<div class="card"><p class="small" style="margin-bottom:2px">At home, week by week</p>${row('Practice done', 'practice', 100, 'p', '%')}${row('Hard days', 'hard', 7, 'h')}${row('Upsets noted', 'upsets', Math.max(8, ...weeks.map((w) => w.upsets)), 'u')}<p class="small" style="margin-top:8px">The last bar is this week so far.</p></div>` : '';
  const lab = (v) => (PF?.daily.rated.find((r) => r[0] === v) || [])[1], rank = { dep: 0, help: 1, ind: 2 }, tint = { dep: 'bad', help: 'warn', ind: 'good' };
  const skills = PF ? PF.daily.opts.filter(([k]) => pr.was?.[k] && c.profile?.daily?.[k]).map(([k, name]) => { const a = pr.was[k], b = c.profile.daily[k]; return `<div class="pfrow"><span>${name}</span><span class="then"><span class="pill ${tint[a]}">${lab(a)}</span>${a === b ? '' : `${I.arrow}<span class="pill ${tint[b]}">${lab(b)}</span>`}${rank[b] > rank[a] ? '<i class="up">▲</i>' : rank[b] < rank[a] ? '<i class="down">▼</i>' : ''}</span></div>`; }).join('') : '';
  const at = pr.atec, a1 = at[0], a2 = at[at.length - 1], sum = (r) => PG.ATEC.reduce((n, [k]) => n + r[k], 0);
  const atec = `<div class="card"><div style="display:flex;align-items:flex-start;gap:10px"><div class="grow"><p class="small">Parent checklist (ATEC)</p>${a2 ? `<p class="atot">${sum(a2)}<small>of 179 · lower is better</small></p><p class="small">${at.length > 1 ? `${sum(a1) - sum(a2) > 0 ? `<i class="up">▼ ${sum(a1) - sum(a2)}</i> since the first check` : sum(a1) - sum(a2) < 0 ? `<i class="down">▲ ${sum(a2) - sum(a1)}</i> since the first check` : 'No change since the first check'} · ` : ''}checked ${ago(a2.date)}</p>` : `<p class="sub" style="margin-top:6px">No check yet. The parent fills in the checklist and you enter the four scores.</p>`}</div><button class="btn soft sm" data-act="atec">${I.plus} Add</button></div>
    ${a2 ? PG.ATEC.map(([k, name, max]) => `<div class="abar"><span>${name}</span><div><i style="width:${(a2[k] / max) * 100}%"></i>${at.length > 1 ? `<u style="left:${(a1[k] / max) * 100}%"></u>` : ''}</div><b>${a2[k]}</b></div>`).join('') + (at.length > 1 ? `<p class="small" style="margin-top:8px">The thin mark shows the first check.</p>` : '') : ''}</div>`;
  const d = pr.draft, sh = pr.shared;
  if (d && S.pdraft?.id !== d.id) S.pdraft = { id: d.id, levels: d.goals.map((g) => g.level) };
  const words = (v) => PG.GAS.find((x) => x[0] === v)[1];
  const ai = !plan ? '' : d ? `<div class="card aidraft" data-k="aidraft"><div class="aihead"><span class="ic t-purple">${I.spark}</span><div class="grow"><p class="h3">AI suggestion</p><p class="small">${sourceTag(d)} · ${esc(c.parent)} sees nothing until you approve</p></div></div>
      ${d.goals.map((g, gi) => `<div class="sgoal"><p class="h3" style="font-weight:500">${esc(g.text)}</p>
        <div class="gas">${PG.GAS.map(([v]) => `<button class="${S.pdraft.levels[gi] === v ? 'on' : ''} ${v < 0 ? 'neg' : v > 0 ? 'pos' : ''}" data-act="sglevel" data-id="${gi}" data-d="${v}">${v > 0 ? '+' + v : v}</button>`).join('')}</div>
        <p class="small" style="margin-top:6px"><b style="color:var(--ink)">${esc(words(S.pdraft.levels[gi]))}</b>${S.pdraft.levels[gi] === g.level ? ` · suggested${g.level !== g.was ? ` (was ${g.was > 0 ? '+' + g.was : g.was})` : ', no change'}` : ` · changed by you (AI suggested ${g.level > 0 ? '+' + g.level : g.level})`}</p>
        <p class="sub" style="margin-top:4px">${esc(g.why)}</p></div>`).join('')}
      <div class="editbox"><label>Message for ${esc(c.parent)} (English)</label><textarea id="sgen" rows="3" maxlength="400">${esc(d.message.en)}</textarea><label>Message in Bangla</label><textarea id="sgbn" class="bn" lang="bn" rows="3" maxlength="400">${esc(d.message.bn)}</textarea></div>
      <div class="stepnav"><button class="btn soft" data-act="sgdiscard">Discard</button><button class="btn p grow" data-act="sgapprove" ${S.busy.sg ? 'disabled' : ''}>${I.check} Approve and share</button></div></div>`
    : `<div class="card aisug"><span class="ic t-purple">${I.spark}</span><div class="grow"><p class="h3">AI progress update</p><p class="small">${sh ? `Shared with ${esc(c.parent)} ${ago(sh.date)}` : `Nothing shared with ${esc(c.parent)} yet`}</p></div><button class="btn p sm" data-act="sgmake" ${S.busy.sg ? 'disabled' : ''}>${S.busy.sg ? 'Reading…' : 'Suggest'}</button></div>`;
  return `${glance}${ai}
    ${d ? '' : goals.length ? `<p class="small plab">Goals · rate each one after a session</p>${goalCards}` : `<div class="card empty"><div class="m">${M.ele({ mood: 'calm', extra: 'doctor' })}</div>No live plan yet for ${esc(c.name)}.<br>Goal ratings and the weeks at home appear once a plan is approved.</div>`}
    ${home}
    ${skills ? `<div class="card pf"><p class="small" style="margin-bottom:6px">Daily living skills · at the start and now</p>${skills}</div>` : ''}
    ${atec}
    <p class="small" style="text-align:center;margin-top:12px">Goal ratings are yours. The weeks at home come from what ${esc(c.parent)} ticks and notes.</p>`;
}
function atecSheet(err) {
  const c = kid(S.childId);
  openSheet(`${shead('Add a checklist score', `${esc(c.parent)} fills in the ATEC checklist. Enter the four scores.`)}
    ${err ? `<div class="err">${esc(err)}</div>` : ''}
    <div class="editbox" style="margin-top:0">${PG.ATEC.map(([k, name, max]) => `<label>${name} (0 to ${max})</label><input class="field" data-at="${k}" type="number" inputmode="numeric" min="0" max="${max}" placeholder="0–${max}">`).join('')}</div>
    <button class="btn p wide" style="margin-top:14px" data-act="atecsave">${I.check} Save score</button>
    <p class="small" style="text-align:center;margin-top:10px">A lower score means fewer difficulties. Repeat every two to three months.</p>`);
}
/** What the doctor recorded about the child: diagnosis, communication, senses, behaviour, daily skills, interests, therapy. */
function profileTab(c) {
  if (!PF) return '';
  const p = c.profile || {}, lab = (k, v, list = PF[k].opts) => (list.find((o) => o[0] === v) || [])[1];
  const line = (label, value) => (value ? `<div class="pfrow"><span>${label}</span><b>${value}</b></div>` : '');
  const chips = (k, cls = '') => (p[k] || []).map((v) => `<span class="pill ${cls}">${esc(lab(k, v))}</span>`).join('');
  const card = (title, ic, tint, inner) => (inner.trim() ? `<div class="card pf"><p class="pfhead"><span class="ic ${tint}">${I[ic]}</span>${title}</p>${inner}</div>` : '');
  const group = (label, html) => (html ? `<p class="small pflab">${label}</p><div class="tags" style="margin-top:6px">${html}</div>` : '');
  const sevTint = { mild: 'line', moderate: 'warn', severe: 'bad' }, dayTint = { ind: 'good', help: 'warn', dep: 'bad' };
  const when = p.dxDate ? new Date(p.dxDate.slice(0, 7) + '-15').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '';
  const cards = [
    card('Diagnosis', 'doc', 't-purple', line(PF.level.label, p.level ? `${esc(lab('level', p.level))}${p.level !== 'na' ? `<small>${PF.level.help[p.level]}</small>` : ''}` : '') + line('Diagnosis', p.dxType ? esc(lab('dxType', p.dxType)) : '') + line('Diagnosed', when) + group(PF.co.label, chips('co', 'line'))),
    card('Communication', 'talk', 't-blue', line(PF.speech.label, p.speech ? esc(lab('speech', p.speech)) : '') + line(PF.understands.label, p.understands ? esc(lab('understands', p.understands)) : '') + line(PF.aac.label, p.aac ? esc(lab('aac', p.aac)) : '')),
    card('Sensory profile', 'ear', 't-orange', group(PF.sensitive.label, chips('sensitive', 'warn')) + group(PF.seeking.label, chips('seeking')) + (p.calming ? `<p class="small pflab">What calms ${esc(c.name)}</p><p class="sub" style="color:var(--ink);margin-top:4px">${esc(p.calming)}</p>` : '')),
    card(PF.behaviours.label, 'heart', 't-pink', Object.entries(p.behaviours || {}).map(([k, v]) => `<div class="pfrow"><span>${esc(lab('behaviours', k))}</span><span class="pill ${sevTint[v]}">${esc(lab('behaviours', v, PF.behaviours.rated))}</span></div>`).join('')),
    card(PF.daily.label, 'list', 't-green', Object.entries(p.daily || {}).map(([k, v]) => `<div class="pfrow"><span>${esc(lab('daily', k))}</span><span class="pill ${dayTint[v]}">${esc(lab('daily', v, PF.daily.rated))}</span></div>`).join('')),
    card('Strengths and interests', 'star', 't-yellow', c.likes && c.likes !== 'not noted yet' ? `<p class="sub" style="color:var(--ink)">${esc(c.likes)}</p>` : ''),
    card('Current therapy', 'clock', 't-blue', group(PF.therapies.label, chips('therapies')) + line('Sessions', esc(c.sessions)) + line('School or centre', p.hours != null ? `${p.hours} hour${p.hours === 1 ? '' : 's'} a day` : '')),
  ].join('');
  const empty = !Object.keys(p).length;
  const same = c.shared && JSON.stringify(c.shared.profile) === JSON.stringify(p) && c.shared.likes === c.likes;
  const share = empty ? '' : same ? `<div class="note2 live"><span class="grow">${I.shield} ${esc(c.parent)} sees this profile · approved ${esc(niceDate(c.shared.at))}</span></div>`
    : `<div class="note2"><span class="grow">${c.shared ? `Changed since you shared it. ${esc(c.parent)} still sees the old version.` : `${esc(c.parent)} cannot see this profile yet.`}</span><button class="btn dark sm" data-act="shareprofile">${I.check} Approve and share</button></div>`;
  return `${share}${empty ? `<div class="card empty"><div class="m">${M.ele({ mood: 'calm', extra: 'doctor' })}</div>No profile yet for ${esc(c.name)}.<br>Add the diagnosis, communication level and sensory profile so home activities fit this child.<div style="margin-top:14px"><button class="btn p sm" data-act="editprofile">${I.plus} Fill in the profile</button></div></div>` : cards}
    ${empty ? '' : `<button class="btn soft wide" style="margin-top:14px" data-act="editprofile">${I.edit} Edit profile</button>`}
    <p class="small" style="text-align:center;margin-top:12px">Recorded by ${esc(S.db.therapist.short)}. ${esc(c.parent)} sees only the version you approve.</p>`;
}
function childView(c) {
  const d = draftPlan(c.id), showApprove = S.ctab === 'plan' && d && !S.edit;
  const inner = S.ctab === 'plan' ? planTab(c) : S.ctab === 'notes' ? notesTab(c) : S.ctab === 'profile' ? profileTab(c) : S.ctab === 'progress' ? progressTab(c) : summaryTab(c);
  return `<div class="softbg" style="flex:1;display:flex;flex-direction:column;min-height:0;position:relative">
    <div class="hdr pad"><div class="bar"><button class="hbtn" data-act="back" aria-label="Back">${I.back}</button><div class="grow"><p class="h2">${esc(c.name)}, ${c.age}</p><p class="small">Parent: ${esc(c.parent)} · ${esc(c.sessions)}</p></div>${avatar(c, 40)}</div>
    <div class="in" style="padding-bottom:10px"><div class="seg five">${[['summary', 'Summary'], ['plan', 'Plan'], ['notes', 'Notes'], ['progress', 'Progress'], ['profile', 'Profile']].map(([k, lab]) => `<button class="${S.ctab === k ? 'on' : ''}" data-act="ctab" data-tab="${k}">${lab}${k === 'plan' && d ? ' •' : ''}</button>`).join('')}</div></div></div>
    <div class="scroll under" style="padding-bottom:${showApprove ? 96 : 28}px"><div class="in">${inner}</div></div>
    ${showApprove ? `<div class="fade"></div><div class="approve"><button class="btn soft" data-act="discard" data-id="${d.id}" aria-label="Discard draft">${I.trash}</button><button class="btn p" data-act="approve" data-id="${d.id}" ${S.busy.approve ? 'disabled' : ''}>${I.send} Approve and send to ${esc(c.parent)}</button></div>` : ''}</div>`;
}
const sourceTag = (x) => (x.source === 'manual' ? 'Built by you' : x.source === 'sample' ? 'Prepared sample' : x.source === 'cache' ? `${esc(x.model)} · saved answer` : `Written by ${esc(x.model)}`);
function summaryTab(c) {
  const plan = livePlan(c.id), logs = weekLogs(c.id), s = S.db.summaries[c.id];
  if (!plan) return `<div class="card empty"><div class="m">${M.ele({ mood: 'calm' })}</div>No plan yet for ${esc(c.name)}.<br>Set this week’s goals in the Plan tab to begin.</div>`;
  const fresh = logs.length - (s?.notesCount || 0), busy = S.busy.summary;
  const make = (label) => `<button class="btn p sm" data-act="summary" ${busy ? 'disabled' : ''}>${I.spark} ${busy ? 'Reading the notes…' : label}</button>`;
  const errBox = S.busy.summaryErr ? `<div class="err">${esc(S.busy.summaryErr)}</div>` : '';
  const weekCard = `<div class="card">${wk(c.id, true)}<div class="legend"><span><i style="background:var(--green)"></i>Good day</span><span><i style="background:var(--yellow)"></i>Mixed</span><span><i style="background:var(--pink)"></i>Hard day</span></div></div>`;
  if (!s) return `${errBox}<div class="card empty"><div class="m">${M.ele({ mood: 'calm' })}</div>${logs.length ? `${logs.length} parent note${logs.length > 1 ? 's' : ''} this week.<br>Turn them into a one-page summary before the session.<div style="margin-top:14px">${make('Write summary')}</div>` : `No parent notes yet this week.<br>The summary appears once ${esc(c.parent)} starts noting.`}</div>${weekCard}`;
  const status = { improving: ['good', 'Improving'], steady: ['', 'Steady'], needs_support: ['bad', 'Needs support'] };
  // Short by default: the headline, the week, and one line per goal. Evidence and the longer lists open on a tap.
  const fold = (title, n, inner, open = false) => `<details class="card fold" ${open ? 'open' : ''}><summary><span class="grow h3">${title}</span>${n ? `<span class="small">${n}</span>` : ''}<span class="chev">${I.next}</span></summary><div class="foldin">${inner}</div></details>`;
  return `${errBox}
    ${fresh > 0 ? `<div class="note2"><span class="grow">${fresh} new note${fresh > 1 ? 's' : ''} since this summary</span>${make('Update')}</div>` : ''}
    <div class="headcard"><p class="hl" style="margin-bottom:0">${esc(s.headline)}</p></div>
    <div class="card">${wk(c.id, true)}</div>
    <div class="card goals"><p class="small" style="margin-bottom:4px">Goals</p>${s.goals.map((g) => `<details class="goal"><summary><span class="grow">${esc(g.goal)}</span><span class="pill ${status[g.status][0]}">${status[g.status][1]}</span></summary><p class="sub">${esc(g.evidence)}</p></details>`).join('')}</div>
    ${s.patterns.length ? fold('Patterns', s.patterns.length, s.patterns.map((p) => `<div class="rowline"><span class="count">${p.days}<small>${p.days > 1 ? 'days' : 'day'}</small></span><div><p class="h3">${esc(p.title)}</p><p class="sub">${esc(p.detail)}</p></div></div>`).join('')) : ''}
    ${fold('For the session', s.suggestions.length + s.askParent.length, `<p class="small" style="margin-bottom:8px">Options to consider</p>${s.suggestions.map((x) => `<div class="rowline">${I.spark}<span>${esc(x)}</span></div>`).join('')}
      <p class="small" style="margin:14px 0 8px">Ask ${esc(c.parent)}</p>${s.askParent.map((x) => `<div class="rowline">${I.talk}<span>${esc(x)}</span></div>`).join('')}`)}
    <div class="card"><p class="small" style="margin-bottom:6px">Message to ${esc(c.parent)}</p><p class="sub" style="color:var(--ink)">${esc(s.parentMessage.en)}</p>
      <details class="goal" style="border:0;margin-top:2px"><summary><span class="grow small">Show in Bangla</span></summary><p class="bn sub" lang="bn" style="color:var(--ink)">${esc(s.parentMessage.bn)}</p></details>
      <div class="rowbtns">${s.parentMessageSent ? `<span class="pill good">${I.check} Sent</span>` : `<button class="btn p sm" data-act="sendmsg">${I.send} Send to ${esc(c.parent)}</button>`}${fresh <= 0 ? `<button class="link" style="margin-left:auto;font-size:13.500px" data-act="summary" ${busy ? 'disabled' : ''}>${busy ? 'Reading the notes…' : 'Write again'}</button>` : ''}</div></div>
    <p class="small" style="text-align:center;margin-top:12px">${sourceTag(s)}</p>`;
}
function planTab(c) {
  const d = draftPlan(c.id), p = livePlan(c.id);
  if (d) return `<div class="note2"><span class="grow">${d.source === 'manual' ? 'Your draft.' : 'Draft from AI.'} ${esc(c.parent)} cannot see it until you approve.</span><span class="pill dark">${sourceTag(d)}</span></div>${planBody(c, d, true)}`;
  if (!p) return `<div class="card empty"><div class="m">${M.ele({ mood: 'hi' })}</div>No plan yet for ${esc(c.name)}.<div style="margin-top:14px"><button class="btn p sm" data-act="newplan">${I.plus} Plan this week</button></div></div>`;
  return `<div class="note2 live"><span class="grow">Live since ${esc(niceDate(p.approvedAt))}</span><button class="btn dark sm" data-act="newplan">${I.plus} New week</button></div>${planBody(c, p, false)}`;
}

/** The plan as a week: pick a day, see exactly what is done that day and how far each activity should go. */
function planBody(c, plan, editable) {
  const today = planDay(plan), day = Math.min(7, Math.max(1, S.pday || today)), live = plan.status === 'approved';
  const first = new Date(live ? plan.approvedAt : S.db.today + 'T12:00:00');
  const dateOf = (n) => { const d = new Date(first); d.setDate(d.getDate() + n - 1); return d; };
  const strip = `<div class="days">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<button class="${n === day ? 'on' : ''} ${live && n === today ? 'today' : ''}" data-act="pday" data-d="${n}"><small>${esc(dayName(dateOf(n)))}</small><b>${dateOf(n).getDate()}</b></button>`).join('')}</div>`;
  const acts = plan.activities.map((a, i) => {
    const g = plan.goals.find((x) => x.id === a.goal), ed = editable && S.edit === a.id, tg = targetOn(a, day), vid = videoOf(a);
    const phase = tg ? a.daily.indexOf(tg) : -1;
    return `<details class="card act" data-k="act-${a.id}" ${ed ? 'open' : ''}><summary><span class="ic ${TINTS[i % 6]}">${icon(a.icon)}</span><span class="grow">
        <span class="h3" style="display:block">${esc(a.title.en)}</span><span class="small" style="display:block">${a.minutes} min · ${esc(a.when.en)}</span>
        ${tg ? `<span class="target">${I.star} ${esc(tg.en)}</span>` : ''}</span><span class="chev">${I.next}</span></summary>
      <div class="foldin">${ed ? `<div class="editbox" data-edit="${a.id}" style="margin-top:0"><label>Title (English)</label><input class="field" name="ten" value="${esc(a.title.en)}"><label>Title (Bangla)</label><input class="field bn" name="tbn" value="${esc(a.title.bn)}">
          <label>Steps in English, one per line</label><textarea name="sen" rows="5">${esc(a.steps.en.join('\n'))}</textarea><label>Steps in Bangla, one per line</label><textarea class="bn" name="sbn" rows="5">${esc(a.steps.bn.join('\n'))}</textarea></div>
          <div class="rowbtns"><button class="btn p sm" data-act="saveact" data-id="${a.id}">Save changes</button><button class="btn soft sm" data-act="edit" data-id="">Cancel</button></div>`
        : `${vid ? `<video class="how" controls playsinline preload="metadata" src="${esc(vid)}#t=0.1"></video><p class="small" style="margin:6px 2px 12px">How to do it · the parent sees this video too</p>` : ''}
          <ol class="steps plain" style="padding-top:0">${a.steps.en.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
          ${a.daily ? `<div class="ladder">${a.daily.map((p, k) => `<div class="${k === phase ? 'on' : ''}"><small>Days ${k ? a.daily[k - 1].to + 1 : 1}–${p.to}</small><span>${esc(p.en)}</span></div>`).join('')}</div>` : ''}
          <details class="goal" style="border:0;padding-bottom:0"><summary><span class="grow small">Show in Bangla</span></summary><p class="bn h3" lang="bn" style="margin-bottom:6px">${esc(a.title.bn)}</p><ol class="steps plain bn" lang="bn" style="padding-top:0">${a.steps.bn.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></details>
          ${g ? `<p class="small" style="margin-top:8px">For goal ${plan.goals.indexOf(g) + 1}: ${esc(g.text)}</p>` : ''}
          ${editable ? `<div class="rowbtns"><button class="btn soft sm" data-act="edit" data-id="${a.id}">${I.edit} Edit</button><button class="btn soft sm" data-act="rmact" data-id="${a.id}">${I.trash} Remove</button></div>` : ''}`}</div></details>`;
  }).join('');
  const st = plan.story, editingPage = editable && String(S.edit || '').startsWith('page');
  const pages = st.pages.map((p, i) => {
    const ed = editable && S.edit === 'page' + i;
    return `<div class="pg">${pic(st, i)}<div class="num"><span>Page ${i + 1}</span>${editable && !ed ? `<button data-act="edit" data-id="page${i}" aria-label="Edit page ${i + 1}">${I.edit}</button>` : ''}</div>
      ${ed ? `<div class="editbox" data-edit="page${i}"><textarea name="en" rows="4">${esc(p.en)}</textarea><textarea class="bn" name="bn" rows="4">${esc(p.bn)}</textarea><button class="btn p sm" data-act="savepage" data-i="${i}">Save</button></div>` : `<p>${esc(p.en)}</p><p class="bn" lang="bn">${esc(p.bn)}</p>`}</div>`;
  }).join('');
  const mins = plan.activities.reduce((n, a) => n + a.minutes, 0);
  return `<div class="card goals"><p class="small" style="margin-bottom:6px">Goals</p>${plan.goals.map((g, i) => `<div class="goalrow"><b>${i + 1}</b><span>${esc(g.text)}</span></div>`).join('')}</div>
    ${strip}
    <p class="small dayline">Day ${day} of 7${live && day === today ? ' · today' : ''} · ${plan.activities.length} ${plan.activities.length === 1 ? 'activity' : 'activities'} · ${mins} min</p>
    ${acts || `<div class="card empty">No activities yet. Add one from the common activities below.</div>`}
    ${editable && plan.activities.length < 6 ? `<button class="btn soft wide" style="margin-top:4px" data-act="addcommon">${I.plus} Add a common activity</button>` : ''}
    ${st.pages.length ? `<details class="card fold" style="margin-top:10px" ${editingPage ? 'open' : ''}><summary><span class="ic t-green" style="width:36px;height:36px;font-size:17px">${I.book}</span><span class="grow"><span class="h3" style="display:block">${esc(st.title.en)}</span><span class="small">Social story · ${st.pages.length} pages</span></span>${st.sheetStatus === 'making' ? `<span class="pill warn">Drawing</span>` : ''}<span class="chev">${I.next}</span></summary>
      <div class="foldin">${st.sheetStatus === 'failed' && editable ? `<button class="pill line" style="margin-bottom:10px" data-act="redraw" data-id="${plan.id}">${I.refresh} Draw pictures</button>` : ''}<p class="bn sub" lang="bn" style="margin-bottom:10px">${esc(st.title.bn)}</p><div class="pages">${pages}</div></div></details>` : ''}`;
}
/** The common activities the therapist can add to a draft with one tap. */
function libSheet(err) {
  const plan = draftPlan(S.childId), have = new Set(plan.activities.map((a) => a.lib));
  openSheet(`${shead('Common activities', 'Each has steps, a how-to video and a target for every day.')}
    ${err ? `<div class="err">${esc(err)}</div>` : ''}
    ${LIB.map((x, i) => `<div class="libr"><span class="ic ${TINTS[i % 6]}">${icon(x.icon)}</span><span class="grow"><span class="h3" style="display:block">${esc(x.title.en)}</span><span class="small">${x.minutes} min · ${esc(x.when.en)}</span></span>${have.has(x.key) ? `<span class="pill good">${I.check} Added</span>` : `<button class="btn p sm" data-act="libadd" data-d="${x.key}">${I.plus} Add</button>`}</div>`).join('')}
    <button class="btn soft wide" style="margin-top:14px" data-act="close">Done</button>`);
}
function notesTab(c) {
  const logs = weekLogs(c.id).slice().reverse();
  if (!logs.length) return `<div class="card empty"><div class="m">${M.tiger()}</div>No notes from ${esc(c.parent)} yet this week.</div>`;
  // Each note leads with what the parent sent: a video shows the video, a photo the photo, a voice note its player.
  // Only a typed note leads with words. The parent's words and the tags for any note open on a tap.
  const src = (u) => esc(u.replace(/^\//, ''));
  return logs.map((l) => {
    const media = l.media || [], photos = media.filter((m) => m.kind === 'photo'), videos = media.filter((m) => m.kind === 'video'), rich = media.length || l.audio;
    const brief = l.en && l.lang !== 'en' ? l.en : l.text;
    const tags = `${(l.wins || []).map((w) => `<span class="pill good">${esc(w)}</span>`).join('')}${(l.struggles || []).map((w) => `<span class="pill warn">${esc(w)}</span>`).join('')}${(l.triggers || []).map((w) => `<span class="pill bad">Trigger: ${esc(w)}</span>`).join('')}${l.sleep === 'poor' ? `<span class="pill line">Poor sleep</span>` : ''}`;
    const front = `${videos.map((m) => `<video class="front" controls playsinline preload="metadata" src="${src(m.url)}#t=0.1"></video>`).join('')}
      ${photos.length ? `<div class="fphotos n${Math.min(photos.length, 3)}">${photos.map((m) => `<button data-act="zoom" data-d="${src(m.url)}"><img loading="lazy" src="${src(m.url)}" alt="Photo from the parent"></button>`).join('')}</div>` : ''}
      ${l.audio ? `<div class="fvoice"><span class="ic t-pink">${I.mic}</span><audio controls preload="metadata" src="${src(l.audio)}"></audio></div>` : ''}`;
    const body = `${l.text ? `<p class="orig" lang="${l.lang}">${esc(l.text)}</p>` : ''}${l.en && l.lang !== 'en' ? `<p class="tr">${esc(l.en)}</p>` : ''}${tags ? `<div class="tags">${tags}</div>` : ''}${l.analysed || !l.text ? '' : `<p class="small" style="margin-top:8px">Shown as spoken; the AI has not organised this note.</p>`}`;
    return `<div class="card note" data-k="note-${l.id}">
      <div class="nhead"><i class="mood ${l.mood}"></i><span class="small grow">${esc(niceDate(l.at))} · ${esc(niceTime(l.at))}</span>${videos.length ? `<span class="pill">${I.video} Video</span>` : ''}${photos.length ? `<span class="pill">${I.camera} Photo</span>` : ''}${l.audio ? `<span class="pill">${I.mic} Voice</span>` : ''}${rich ? '' : `<span class="pill line">${I.type} Text</span>`}</div>
      ${rich ? front : ''}
      ${body.trim() ? `<details class="nmore"><summary>${rich ? `<span class="grow small">${l.text ? 'What the parent said' : 'Details'}</span>` : `<p class="brief grow" lang="${l.en && l.lang !== 'en' ? 'en' : l.lang}">${esc(brief)}</p>`}<span class="chev">${I.next}</span></summary><div class="nbody">${body}</div></details>` : ''}</div>`;
  }).join('');
}
function aiUse(pushed) {
  const ai = S.db.ai, chatOk = ai.chat.ok === true;
  const st = { approved: 'good', waiting: 'warn', rejected: 'bad', info: '' };
  const tool = (ic, tint, title, sub, on) => `<div class="rowline" style="align-items:center"><span class="ic ${tint}" style="width:40px;height:40px;font-size:19px">${I[ic]}</span><div class="grow"><p class="h3">${title}</p><p class="small">${sub}</p></div><i class="dotok ${on ? 'on' : ''}"></i></div>`;
  return `<div class="scroll softbg pad" ${pushed ? 'style="padding-bottom:28px"' : ''}><div class="bar">${pushed ? `<button class="hbtn" data-act="back" aria-label="Back">${I.back}</button>` : ''}<h1 class="h2" style="padding-left:4px">How AI is used</h1></div><div class="in">
    <div class="card"><p class="small" style="margin-bottom:10px">AI tools in this product</p>
      ${tool('edit', 't-purple', 'Writing the plan, story and summary', ai.preview ? 'Online preview: prepared samples only, no AI is called' : ai.chat.configured ? esc(`${ai.chat.label} · ${ai.chat.model}`) + (ai.chat.ok === false ? ` · ${esc(ai.chat.error || 'not reachable')}` : '') : 'No AI key set yet', chatOk)}
      ${tool('book', 't-green', 'Drawing the story pictures', 'gpt-image-2', ai.image)}
      ${tool('mic', 't-orange', 'Turning the voice note into text', ai.stt ? 'Google Gemini (Bangla and English)' : 'The phone’s built-in speech recognition', true)}</div>
    <div class="sec"><h2 class="h2">How every output is checked</h2></div>
    <div class="card">
      <div class="rowline">${I.shield}<span><b>The doctor approves first.</b> No activity or story reaches a parent until the therapist has read, edited or rejected it.</span></div>
      <div class="rowline">${I.ear}<span><b>The parent confirms their words.</b> The text is shown before saving, and the original note stays beside the AI’s version.</span></div>
      <div class="rowline">${I.chart}<span><b>Summaries name their evidence.</b> Every statement points back to the parent’s notes, which the doctor can open.</span></div>
      <div class="rowline">${I.heart}<span><b>No diagnosis, ever.</b> The AI only turns the therapist’s goals into home practice. Photos and videos a parent adds are shown only to the therapist; the AI never looks at them.</span></div></div>
    <div class="sec"><h2 class="h2">AI activity log</h2><span class="small">${S.db.aiLog.length} entries</span></div>
    <div class="card">${S.db.aiLog.map((e) => `<div class="rowline"><div class="grow"><p class="h3">${esc(e.step)} · ${esc(e.child)}</p><p class="small">${esc(e.model)} · ${esc(niceDate(e.at))}, ${esc(niceTime(e.at))}</p><p class="sub" style="font-size:12.500px;margin-top:3px">${esc(e.check)}</p></div><span class="pill ${st[e.status] || ''}">${{ approved: 'Approved', waiting: 'Waiting', rejected: 'Rejected', info: 'Logged' }[e.status] || 'Logged'}</span></div>`).join('') || '<p class="small">Nothing yet.</p>'}</div>
  </div></div>`;
}

// ---------- sheets (panels that slide up) ----------
const sheetEl = () => $('#sheet');
let closing = null;
function openSheet(html) {
  const el = sheetEl(), already = !el.hidden && !closing;
  clearTimeout(closing); closing = null;
  el.classList.remove('closing');
  el.innerHTML = `<div class="sheet ${already ? 'still' : ''}">${html}</div>`; // a sheet that is already up does not spring up again
  el.hidden = false;
}
function closeSheet() {
  const el = sheetEl();
  if (el.hidden || closing) return;
  const done = () => { closing = null; el.hidden = true; el.innerHTML = ''; el.classList.remove('closing'); };
  if (Motion.off()) return done();
  el.classList.add('closing'); // it drops away, then is removed
  closing = setTimeout(done, 300);
}
const shead = (title, sub) => `<div class="shead"><div class="grow"><p class="h2">${title}</p>${sub ? `<p class="small">${sub}</p>` : ''}</div><button class="xb" data-act="close" aria-label="Close">${I.x}</button></div>`;

function menuSheet() {
  openSheet(`${shead('MIMO', 'One app, two sides of the same child’s week.')}${FORCED ? '' : personaBtns()}
    <button class="row" style="margin-top:10px" data-act="ai"><span class="ic t-green" style="width:38px;height:38px;font-size:18px">${I.shield}</span><span class="grow h3" style="font-weight:500">How AI is used</span>${I.next}</button>`);
}
function bellSheet() {
  const items = [];
  if (S.role === 'parent') {
    const c = kid(PARENT_CHILD), s = S.db.summaries[c.id], p = livePlan(c.id);
    if (S.db.progress?.[c.id]?.shared) items.push(['chart', 't-green', t('progT', S.db.therapist.short), L(S.db.progress[c.id].shared.message)]);
    if (s?.parentMessageSent) items.push(['heart', 't-pink', t('from', S.db.therapist.short), L(s.parentMessage)]);
  } else {
    for (const c of kids()) {
      if (draftPlan(c.id)) items.push(['edit', 't-orange', `${c.name}’s draft plan is waiting`, 'Review and approve it to send it home']);
      const l = weekLogs(c.id).pop();
      if (l) items.push(['mic', 't-green', `${c.parent} left a note about ${c.name}`, `${niceDate(l.at)} · ${niceTime(l.at)}`]);
    }
  }
  openSheet(`${shead(S.role === 'parent' && S.lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications')}${items.map(([ic, tint, a, b]) => `<div class="row"><span class="ic ${tint}">${I[ic]}</span><span class="grow"><span class="h3" style="display:block">${esc(a)}</span><span class="small">${esc(b)}</span></span></div>`).join('') || '<p class="empty">Nothing new.</p>'}`);
}

// new plan (doctor)
const GOAL_IDEAS = ['Wait for his turn during play', 'Stay calm when the blender is on', 'Brush teeth with less resistance', 'Ask for help with words or a picture card', 'Try one new food this week', 'Get dressed with fewer prompts'];
let G = null;

// ----- add a child, or edit a child's profile -----
// The form is five short steps. Its answers live in N until it is saved, so moving between steps loses nothing.
let N = null, PF = null, LIB = [], HOW = null, PG = null, GD = null;
import('./seed-data.js').then((m) => { PF = m.PROFILE; LIB = m.LIBRARY; HOW = m.HOW_VIDEO; PG = { GAS: m.GAS, ATEC: m.ATEC, PARENT: m.PARENT_LEVEL }; GD = { BN: m.PROFILE_BN, guideFor: m.guideFor }; if (S.db) render(); }).catch(() => {});
const STEPS = ['About the child', 'Diagnosis', 'Communication and daily skills', 'Sensory profile and behaviour', 'Interests and therapy'];
const readChildForm = () => { if (N) document.querySelectorAll('#sheet [data-nc]').forEach((el) => (N[el.dataset.nc] = el.value)); };
const blankChild = () => ({ step: 0, name: '', name_bn: '', age: '', gender: 'boy', parent: '', sessions: '2', likes: '', dxDate: '', calming: '', hours: '', co: [], sensitive: [], seeking: [], therapies: [], behaviours: {}, daily: {} });
/** First choice when adding a child: photograph an earlier doctor's report, or type everything. */
function startSheet(err) {
  if (!PF) return toast('Still loading. Try again in a moment.');
  const opt = (ic, tint, title, sub) => `<span class="ic ${tint}">${I[ic]}</span><span class="grow"><span class="h3" style="display:block">${title}</span><span class="small">${sub}</span></span><span style="color:var(--mute);font-size:17px">${I.next}</span>`;
  openSheet(`${shead('Add a child')}
    ${err ? `<div class="err">${esc(err)}</div>` : ''}
    <label class="startopt"><input type="file" id="scanfile" accept="image/*" capture="environment" hidden>${opt('camera', 't-purple', 'Scan a report', 'Photo of an earlier report')}</label>
    <button class="startopt" data-act="ncvoice">${opt('mic', 't-orange', 'Describe by voice', 'Say it, AI fills it in')}</button>
    <button class="startopt" data-act="nchand">${opt('edit', 't-blue', 'Fill in by hand', 'Type it yourself')}</button>
    <p class="small" style="text-align:center;margin-top:14px">You check every answer before it is saved.</p>
    <button class="link skip" style="margin-top:6px" data-act="ncsample">Use sample report</button>`);
}
/** Shrinks a phone photo so it uploads quickly, and returns it as a data URL. */
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not a photo.')); };
    img.src = url;
  });
}
/** Reads the report (or the sample), fills the form with what was found, and opens it for checking. */
async function scanReport(photo, sample, said) {
  const voice = !photo;
  N = { ...blankChild(), busy: true };
  openSheet(`<div class="thinking">${voice ? `<div class="recmic still">${I.mic}</div>` : `<div class="scanpic"><img src="${esc(photo)}" alt=""><i></i></div>`}<div><p class="h2">${voice ? 'Filling in the profile' : 'Reading the report'}</p><p class="small" id="think" style="margin-top:6px">Finding the child’s details…</p></div><p class="small">Nothing is saved until you have checked every answer.</p></div>`);
  const lines = ['Finding the child’s details…', 'Reading the diagnosis and support level…', 'Reading communication and daily skills…', 'Reading the sensory profile and behaviour…', 'Almost done…'];
  let n = 0;
  const tick = setInterval(() => { const el = $('#think'); if (el) el.textContent = lines[Math.min(++n, lines.length - 1)]; }, 900);
  try {
    const [out] = await Promise.all([api('/api/child/scan', sample ? { sample: true } : { image: photo.split(',')[1], mime: 'image/jpeg' }), new Promise((r) => setTimeout(r, 3800))]);
    const f = out.fields, p = f.profile;
    N = { ...blankChild(), name: f.name, name_bn: f.name_bn, age: f.age, gender: f.gender || 'boy', parent: f.parent, likes: f.likes, sessions: f.sessions || '2', ...p,
      co: p.co || [], sensitive: p.sensitive || [], seeking: p.seeking || [], therapies: p.therapies || [], behaviours: p.behaviours || {}, daily: p.daily || {}, dxDate: p.dxDate || '', calming: p.calming || '', hours: p.hours ?? '',
      scan: { kind: voice ? 'voice' : 'photo', photo, said, filled: out.filled, unsure: voice ? ['You did not mention light or smell, so those are left empty.'] : out.unsure, model: out.model, source: out.source }, verified: false };
    childSheet();
  } catch (e) { N = null; startSheet(e.message); } finally { clearInterval(tick); }
}
// Demo of dictating a child's details. The words below stand in for what the doctor says; no sound is recorded or sent.
const VOICE_DEMO = 'New child, Tahsin Ahmed, a six year old boy. His mother is Rumana Ahmed. He was diagnosed with autism spectrum disorder in March 2025, support level two, with ADHD and speech delay. He speaks in short phrases, follows simple instructions only, and uses picture cards. He is sensitive to loud sound and crowds, and he likes jumping. Holding his kite in a quiet room calms him. Meltdowns are moderate, sleep problems are mild. He eats by himself, needs help with dressing and routines, and is fully dependent for toileting. He loves kites, rice pudding and water play. He has speech and occupational therapy, three sessions a week, and goes to school four hours a day.';
let recTick = null;
const stopRec = () => { clearInterval(recTick); recTick = null; };
function voiceSheet() {
  N = { ...blankChild(), busy: true };
  const words = VOICE_DEMO.split(' ');
  let shown = 0, t0 = Date.now();
  openSheet(`${shead('Describe the child', 'Speak naturally. Say the diagnosis, how the child communicates, and what helps.')}
    <div class="recbox"><div class="recmic">${I.mic}</div><p class="rectime" id="rectime">0:00</p><div class="recbars">${Array.from({ length: 24 }, (_, i) => `<i style="animation-delay:${-(i * 137) % 900}ms"></i>`).join('')}</div></div>
    <p class="small" style="margin:10px 4px 6px">What I hear (demo)</p><div class="recsaid"><p id="recsaid"></p></div>
    <div class="stepnav"><button class="btn p grow" data-act="ncvoicestop">${I.stop} Stop and fill in the profile</button></div>`);
  stopRec();
  recTick = setInterval(() => {
    const time = $('#rectime'), said = $('#recsaid');
    if (!time || !said) return stopRec();
    const s = Math.floor((Date.now() - t0) / 1000);
    time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    if (shown < words.length) { shown = Math.min(words.length, shown + 2); said.textContent = words.slice(0, shown).join(' '); said.parentElement.scrollTop = 1e6; }
  }, 260);
}
function childSheet(err) {
  if (!PF) return toast('Still loading. Try again in a moment.');
  if (!N) N = blankChild();
  const voice = N.scan?.kind === 'voice';
  const from = (k) => (k !== 'age' && N.scan?.filled.includes(k) ? ` <span class="fromrep">${voice ? 'From voice' : 'From report'}</span>` : '');
  const inp = (k, label, ph, extra = '') => `<label>${label}${from(k)}</label><input class="field ${k === 'name_bn' ? 'bn' : ''}" data-nc="${k}" placeholder="${ph}" value="${esc(N[k])}" ${extra}>`;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, lab]) => `<button class="${N[k] === v ? 'on' : ''}" data-act="ncpick" data-k="${k}" data-d="${v}">${lab}</button>`).join('')}</div>`;
  const one = (k) => `<label>${PF[k].label}${from(k)}</label><div class="opts">${PF[k].opts.map(([v, lab]) => `<button class="opt ${N[k] === v ? 'on' : ''}" data-act="ncpick" data-k="${k}" data-d="${v}">${lab}</button>`).join('')}</div>`;
  const many = (k, label = PF[k].label) => `<label>${label}${from(k)}</label><div class="opts">${PF[k].opts.map(([v, lab]) => `<button class="opt ${N[k].includes(v) ? 'on' : ''}" data-act="nctog" data-k="${k}" data-d="${v}">${lab}</button>`).join('')}</div>`;
  const sevBtn = (v, lab) => `<button class="opt sev ${N.behaviours[v] || ''}" data-act="ncsev" data-d="${v}">${lab}${N.behaviours[v] ? `<small>${PF.behaviours.rated.find((r) => r[0] === N.behaviours[v])[1]}</small>` : ''}</button>`;
  const body = [
    () => `${inp('name', 'Child’s name', 'e.g. Rafi', 'maxlength="40" autocomplete="off"')}
      ${inp('name_bn', 'Name in Bangla (optional)', 'যেমন: রাফি', 'maxlength="40" autocomplete="off" lang="bn"')}
      <div style="display:grid;grid-template-columns:96px 1fr;gap:10px"><div class="editbox" style="margin:0">${inp('age', 'Age', '5', 'type="number" inputmode="numeric" min="1" max="18"')}</div><div class="editbox" style="margin:0"><label>Boy or girl${from('gender')}</label>${seg('gender', [['boy', 'Boy'], ['girl', 'Girl']])}</div></div>
      ${inp('parent', 'Parent’s name', 'e.g. Nusrat', 'maxlength="40" autocomplete="off"')}`,
    () => `${one('level')}<p class="small hint">Level 1 requires support · Level 2 substantial support · Level 3 very substantial support</p>
      ${one('dxType')}${inp('dxDate', 'Date of diagnosis', '', 'type="month"')}${many('co')}`,
    () => `${one('speech')}<label>${PF.understands.label}${from('understands')}</label>${seg('understands', PF.understands.opts)}<label>${PF.aac.label}${from('aac')}</label>${seg('aac', PF.aac.opts)}
      <p class="steph">${PF.daily.label}${from('daily')}</p>${PF.daily.opts.map(([v, lab]) => `<label>${lab}</label><div class="seg">${PF.daily.rated.map(([r, rl]) => `<button class="${N.daily[v] === r ? 'on' : ''}" data-act="ncrate" data-k="${v}" data-d="${r}">${rl}</button>`).join('')}</div>`).join('')}`,
    () => `${many('sensitive')}${many('seeking')}${inp('calming', 'Calming things that work', 'e.g. his toy train, slow breathing', 'maxlength="200"')}
      <p class="steph">${PF.behaviours.label}${from('behaviours')}</p><p class="small hint" style="margin-top:-4px">Tap once for mild, again for moderate, again for severe.</p><div class="opts">${PF.behaviours.opts.map(([v, lab]) => sevBtn(v, lab)).join('')}</div>`,
    () => `<label>Strengths and interests${from('likes')}</label><textarea data-nc="likes" rows="3" maxlength="200" placeholder="Favourite activities, objects, songs, foods">${esc(N.likes)}</textarea>
      ${many('therapies')}<label>Sessions a week${from('sessions')}</label>${seg('sessions', ['1', '2', '3', '4', '5'].map((n) => [n, n]))}
      ${inp('hours', 'School or centre hours a day', 'e.g. 4', 'type="number" inputmode="decimal" min="0" max="12" step="0.5"')}`,
  ][N.step]();
  const last = N.step === STEPS.length - 1;
  openSheet(`${shead(N.editId ? `Edit ${esc(N.name)}’s profile` : 'Add a child', `Step ${N.step + 1} of ${STEPS.length} · ${STEPS[N.step]}`)}
    <div class="stepbar">${STEPS.map((_, i) => `<i class="${i <= N.step ? 'on' : ''}"></i>`).join('')}</div>
    ${N.scan ? `<div class="scanbar">${voice ? `<button class="scanthumb mic" data-act="ncphoto" aria-label="Show what was said">${I.mic}</button>` : `<button class="scanthumb" data-act="ncphoto" aria-label="Show the report"><img src="${esc(N.scan.photo)}" alt=""></button>`}<div class="grow"><p class="h3">Filled from ${voice ? 'your voice note' : 'the report'}${N.scan.source === 'sample' ? ' (demo answers)' : ''}</p><p class="small">${N.scan.filled.length} answers found. Check each one. Tap the ${voice ? 'microphone to read what you said' : 'photo to enlarge it'}.</p></div>${voice ? `<p class="saidtext">${esc(N.scan.said)}</p>` : ''}</div>
      ${N.step === 0 && N.scan.unsure.length ? `<div class="note2">${N.scan.unsure.map((x) => `<span>${I.ear} ${esc(x)}</span>`).join('')}</div>` : ''}` : ''}
    ${err ? `<div class="err">${esc(err)}</div>` : ''}
    <div class="editbox" style="margin-top:0">${body}</div>
    ${N.scan && last ? `<button class="verify ${N.verified ? 'on' : ''}" data-act="ncverify"><i>${I.check}</i><span>I have checked every answer against ${voice ? 'what I said' : 'the report'} and corrected what was wrong.</span></button>` : ''}
    <div class="stepnav">${N.step ? `<button class="btn soft" data-act="ncstep" data-d="-1">${I.back} Back</button>` : ''}
      ${last ? `<button class="btn p grow" data-act="savechild" id="savebtn" ${N.scan && !N.verified ? 'disabled' : ''}>${I.check} ${N.editId ? 'Save profile' : 'Add to my children'}</button>` : `<button class="btn p grow" data-act="ncstep" data-d="1">Next ${I.next}</button>`}</div>
    ${last || N.scan ? '' : `<button class="link skip" data-act="savechild">${N.editId ? 'Save now' : 'Save now and fill in the rest later'}</button>`}
    ${N.step ? '' : `<p class="small" style="text-align:center;margin-top:10px">You record the diagnosis and profile. The AI only uses it to fit home activities to this child.</p>`}`);
  const sh = document.querySelector('#sheet .sheet');
  if (sh) sh.scrollTop = 0;
}
function basicsMissing() {
  const age = Math.round(Number(N.age));
  return !N.name.trim() ? 'Add the child’s name.' : !(age >= 1 && age <= 18) ? 'Age must be between 1 and 18.' : !N.parent.trim() ? 'Add the parent’s name.' : '';
}
async function saveChild() {
  readChildForm();
  if (N.busy) return;
  const miss = basicsMissing();
  if (miss) { N.step = 0; return childSheet(miss); }
  if (N.scan && !N.verified) return childSheet('Tick the box to confirm you have checked every answer.');
  N.busy = true;
  const { level, dxType, dxDate, co, speech, understands, aac, sensitive, seeking, calming, behaviours, daily, therapies, hours } = N;
  try {
    const out = await api(N.editId ? '/api/child/update' : '/api/child/add', { id: N.editId, scan: N.scan ? { model: N.scan.model, source: N.scan.source, kind: N.scan.kind } : undefined, name: N.name, name_bn: N.name_bn, age: N.age, gender: N.gender, parent: N.parent, sessions: N.sessions, likes: N.likes,
      profile: { level, dxType, dxDate, co, speech, understands, aac, sensitive, seeking, calming, behaviours, daily, therapies, hours } });
    const name = N.name.trim(), edited = !!N.editId;
    N = null;
    closeSheet();
    await pull();
    if (kid(out.id)) { S.childId = out.id; S.push = 'child'; S.ctab = edited ? 'profile' : 'plan'; S.edit = null; S.busy = {}; }
    render(true);
    toast(edited ? `${name}’s profile is saved.` : `${name} is added. Plan the first week when you are ready.`);
    return;
  } catch (e) { if (N) { N.busy = false; childSheet(e.message); } else toast(e.message); }
}
/** Opens the same form filled with a child who is already on the list. */
function editChildSheet(c) {
  const p = c.profile || {};
  N = { ...blankChild(), editId: c.id, name: c.name, name_bn: c.name_bn === c.name ? '' : c.name_bn, age: String(c.age), gender: c.gender === 'girl' ? 'girl' : 'boy', parent: c.parent, sessions: String(parseInt(c.sessions, 10) || 1),
    likes: c.likes === 'not noted yet' ? '' : c.likes, ...p, co: [...(p.co || [])], sensitive: [...(p.sensitive || [])], seeking: [...(p.seeking || [])], therapies: [...(p.therapies || [])], behaviours: { ...(p.behaviours || {}) }, daily: { ...(p.daily || {}) },
    dxDate: (p.dxDate || '').slice(0, 7), calming: p.calming || '', hours: p.hours ?? '' };
  childSheet();
}
function planSheet(err) {
  const c = kid(S.childId);
  if (!G) G = { goals: ['', ''] };
  if (G.busy) return openSheet(`<div class="thinking"><div class="m">${M.ele({ mood: 'proud' })}</div><div><p class="h2">Drafting ${esc(c.name)}’s week</p><p class="small" id="think" style="margin-top:6px">Reading the goals…</p></div><p class="small">Nothing is sent to ${esc(c.parent)} until you approve it.</p></div>`);
  openSheet(`${shead(`Goals for ${esc(c.name)}’s week`, `Likes ${esc(c.likes)}. Sensitive to ${esc(c.sensitivities)}.`)}
    ${err ? `<div class="err">${esc(err)}</div>` : ''}
    <div class="editbox" style="margin-top:0">${G.goals.map((g, i) => `<input class="field" data-goal="${i}" placeholder="Goal ${i + 1}${i ? ' (optional)' : ''}" value="${esc(g)}" maxlength="160">`).join('')}</div>
    <div class="sugg">${GOAL_IDEAS.map((g) => `<button data-act="idea" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div>
    <button class="btn p wide" data-act="generate">${I.spark} Draft activities and story</button>
    <button class="btn soft wide" style="margin-top:8px" data-act="manual">${I.list} Build it myself from common activities</button>
    <p class="small" style="text-align:center;margin-top:10px">${S.db.ai.preview ? 'Online preview: choose “Stay calm when the blender is on” to see a prepared sample draft.' : 'AI writes a draft in English and Bangla. You review every word.'}</p>`);
}
async function generate() {
  document.querySelectorAll('[data-goal]').forEach((el) => (G.goals[+el.dataset.goal] = el.value.trim()));
  const goals = G.goals.filter(Boolean);
  if (!goals.length) return planSheet('Add at least one goal.');
  G.busy = true;
  planSheet();
  const lines = ['Reading the goals…', 'Choosing activities that fit a home in Dhaka…', 'Writing the story in English and Bangla…', 'Checking the wording is calm and literal…'];
  let n = 0;
  const tick = setInterval(() => { const el = $('#think'); if (el) el.textContent = lines[++n % lines.length]; }, 2600);
  try {
    await api('/api/plan/generate', { childId: S.childId, goals });
    G = null;
    closeSheet();
    S.ctab = 'plan';
    await pull();
    render(true);
    toast('Draft ready for your review');
  } catch (e) {
    G.busy = false;
    planSheet(e.message);
  } finally {
    clearInterval(tick);
  }
}

// ---------- what each tap does ----------
const act = {
  close() { stopRec(); if (N?.busy) N = null; closeSheet(); },
  menu: menuSheet,
  bell: bellSheet,
  role(el) { if (FORCED) return; S.role = el.dataset.role; S.push = null; S.tab[S.role] = 'home'; closeSheet(); render(true); },
  tab(el) { S.tab[S.role] = el.dataset.tab; S.push = null; S.open = null; render(true); },
  back() { if (S.push === 'note') { stopRecording(true); V = null; } S.push = null; S.edit = null; render(true); },
  lite(el) { Perf.set(el.dataset.d === '1'); render(true); },
  lang(el) { grabText(); S.lang = el.dataset.lang; if (V && V.step === 'compose') V.lang = S.lang; render(true); },
  open(el) { S.open = S.open === el.dataset.id ? null : el.dataset.id; FX.open = S.open; render(); },
  page(el) { S.page += +el.dataset.d; FX.page = +el.dataset.d; render(); },
  async done(el) {
    const id = el.dataset.id, on = Boolean(el.dataset.on);
    // The tick answers the finger at once; the server catches up behind it.
    S.db.done = S.db.done.filter((d) => !(d.childId === PARENT_CHILD && d.activityId === id && d.date === S.db.today));
    if (on) { S.db.done.push({ childId: PARENT_CHILD, activityId: id, date: S.db.today }); FX.tick = id; }
    render();
    try { await api('/api/done', { childId: PARENT_CHILD, activityId: id, done: on }); } finally { await pull(); }
  },
  note() { V = null; S.push = 'note'; render(true); },
  ai() { closeSheet(); if (S.role === 'doctor') { S.tab.doctor = 'ai'; S.push = null; } else S.push = 'ai'; render(true); },
  aiinfo() { S.push = 'aiinfo'; render(true); },
  async reset() { if (!confirm('Put the sample week back and remove notes and plans made since?')) return; await api('/api/reset'); S.push = null; await pull(); render(true); toast('Sample data is fresh again'); },
  vlang(el) { grabText(); V.lang = el.dataset.lang; render(true); },
  vexample() { V.text = EXAMPLE[V.lang]; render(true); },
  vsave: saveNote,
  vmediax(el) { grabText(); const [m] = V.media.splice(+el.dataset.d, 1); if (m?.kind === 'video') URL.revokeObjectURL(m.url); render(true); },
  zoom(el) { openSheet(`<img class="zoomed" src="${esc(el.dataset.d)}" alt=""><button class="btn soft wide" style="margin-top:12px" data-act="close">Close</button>`); },
  recstart: startRecording,
  recstop() { stopRecording(); },
  kid(el) { S.pday = 0; S.childId = el.dataset.id; S.push = 'child'; S.ctab = el.dataset.tab || (draftPlan(S.childId) ? 'plan' : 'summary'); S.edit = null; S.busy = {}; render(true); },
  ctab(el) { S.ctab = el.dataset.tab; S.edit = null; render(true); },
  newplan() { G = null; planSheet(); },
  pday(el) { S.pday = +el.dataset.d; render(true); },
  async manual() {
    document.querySelectorAll('[data-goal]').forEach((el) => (G.goals[+el.dataset.goal] = el.value.trim()));
    const goals = G.goals.filter(Boolean);
    if (!goals.length) return planSheet('Add at least one goal.');
    try { await api('/api/plan/manual', { childId: S.childId, goals, keys: [] }); } catch (e) { return planSheet(e.message); }
    G = null; S.ctab = 'plan'; S.pday = 0;
    await pull(); render(true); libSheet();
  },
  addcommon() { libSheet(); },
  async libadd(el) { try { await api('/api/plan/update', { planId: draftPlan(S.childId).id, addCommon: el.dataset.d }); await pull(); render(true); libSheet(); } catch (e) { libSheet(e.message); } },
  addchild() { N = null; startSheet(); },
  about() { S.push = 'about'; render(true); },
  allacts() { S.allacts = !S.allacts; render(true); },
  gtab(el) { S.gtab = el.dataset.d; render(true); },
  async shareprofile() { const c = kid(S.childId); try { await api('/api/child/share', { id: c.id }); toast(`Profile shared with ${c.parent}`); } catch (e) { toast(e.message); } await pull(); render(true); },
  chatq(el) { chatSend(el.dataset.d); },
  chatgo() { const el = $('#chatin'), q = el?.value; if (el) el.value = ''; chatSend(q); },
  chatdemo(el) { toast(el.dataset.d); },
  chatclear() { if (S.role === 'parent') { S.pchat = []; S.pflow = null; } else S.chat = []; render(true); },
  async pans(el) {
    const f = S.pflow;
    if (!f || S.pchatBusy) return;
    f.a.push(el.dataset.d);
    S.pchat.push({ me: true, text: el.textContent });
    S.pchatBusy = true; render(true);
    await new Promise((r) => setTimeout(r, f.a.length < FLOWS[f.flow].ask.length ? 700 : 1500));
    S.pchat.push(flowStep());
    S.pchatBusy = false; render(true);
  },
  pnote(el) { V = { step: 'compose', lang: 'en', text: el.dataset.d, left: 30, audio: null, mime: null, heardBy: null, note: null, msg: '', media: [] }; S.push = 'note'; render(true); },
  popen(el) { S.tab.parent = 'home'; S.push = null; S.allacts = true; S.open = el.dataset.id; render(true); },
  pguide() { S.tab.parent = 'guide'; S.gtab = 'weekly'; render(true); },
  story() { S.push = 'story'; S.page = 0; render(true); },
  async chatapprove(el) {
    const c = kid(el.dataset.d);
    try { await api('/api/plan/approve', { planId: el.dataset.id }); await pull(); S.chat.push({ text: `Done. ${esc(c.name)}’s plan is live, and ${esc(c.parent)} can see it now.`, btns: btn('Open the plan', 'kid', `data-id="${c.id}" data-tab="plan"`) }); }
    catch (e) { S.chat.push({ text: esc(e.message) }); }
    render(true);
  },
  chatfilter(el) { S.filter = { [el.dataset.k]: [el.dataset.d] }; S.tab.doctor = 'children'; S.push = null; render(true); },
  nchand() { N = null; childSheet(); },
  ncsample() { scanReport('art/sample-report.jpg', true); },
  ncvoice: voiceSheet,
  ncvoicestop() { stopRec(); scanReport(null, true, VOICE_DEMO); },
  ncphoto(el) { el.closest('.scanbar').classList.toggle('big'); },
  ncverify(el) { N.verified = !N.verified; el.classList.toggle('on', N.verified); const b = $('#savebtn'); if (b) b.disabled = !N.verified; },
  async rate(el) {
    const c = kid(S.childId), g = livePlan(c.id)?.goals[+el.dataset.id];
    if (!g) return;
    await api('/api/progress/rate', { childId: c.id, goal: g.text, level: +el.dataset.d });
    await pull(); render(true);
    toast('Rating saved for today’s session');
  },
  atec() { atecSheet(); },
  async sgmake() {
    S.busy.sg = true; render(true);
    try { await Promise.all([api('/api/progress/suggest', { childId: S.childId }), new Promise((r) => setTimeout(r, 1400))]); } catch (e) { toast(e.message); }
    S.busy.sg = false; await pull(); render(true);
  },
  sglevel(el) { S.pdraft.levels[+el.dataset.id] = +el.dataset.d; const keep = [$('#sgen')?.value, $('#sgbn')?.value]; render(true); if ($('#sgen')) { $('#sgen').value = keep[0]; $('#sgbn').value = keep[1]; } },
  async sgapprove() {
    const c = kid(S.childId), body = { childId: c.id, levels: S.pdraft.levels, message: { en: $('#sgen')?.value, bn: $('#sgbn')?.value } };
    S.busy.sg = true;
    try { await api('/api/progress/approve', body); toast(`Progress shared with ${c.parent}`); } catch (e) { toast(e.message); }
    S.busy.sg = false; S.pdraft = null; await pull(); render(true);
  },
  async sgdiscard() { await api('/api/progress/discard', { childId: S.childId }); S.pdraft = null; toast('Suggestion discarded'); await pull(); render(true); },
  async atecsave() {
    const body = { childId: S.childId };
    document.querySelectorAll('#sheet [data-at]').forEach((el) => (body[el.dataset.at] = el.value === '' ? '' : Number(el.value)));
    try { await api('/api/progress/atec', body); } catch (e) { return atecSheet(e.message); }
    closeSheet(); await pull(); render(true); toast('Checklist score saved');
  },
  filter: filterSheet,
  ftog(el) {
    const k = el.dataset.k, v = el.dataset.d, list = S.filter[k] || [];
    S.filter[k] = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    if (!el.closest('#sheet')) return render(true); // a chip above the list was removed
    el.classList.toggle('on');
    const n = kids().filter(fmatch).length, b = $('#fshow');
    if (b) b.textContent = `Show ${n} ${n === 1 ? 'child' : 'children'}`;
    render(true);
  },
  fclear(el) { S.filter = {}; if (el.closest('#sheet')) filterSheet(); render(true); },
  // These update the tapped control in place, so the sheet does not jump back to the top.
  ncpick(el) { const k = el.dataset.k, must = k === 'gender' || k === 'sessions'; N[k] = N[k] === el.dataset.d && !must ? undefined : el.dataset.d; for (const b of el.parentElement.children) b.classList.toggle('on', b.dataset.d === N[k]); },
  nctog(el) { const k = el.dataset.k, v = el.dataset.d; N[k] = N[k].includes(v) ? N[k].filter((x) => x !== v) : v === 'none' ? ['none'] : [...N[k].filter((x) => x !== 'none'), v]; for (const b of el.parentElement.children) b.classList.toggle('on', N[k].includes(b.dataset.d)); },
  ncrate(el) { const k = el.dataset.k; if (N.daily[k] === el.dataset.d) delete N.daily[k]; else N.daily[k] = el.dataset.d; for (const b of el.parentElement.children) b.classList.toggle('on', b.dataset.d === N.daily[k]); },
  ncsev(el) { const v = el.dataset.d, order = ['', ...PF.behaviours.rated.map((r) => r[0])], next = order[(order.indexOf(N.behaviours[v] || '') + 1) % order.length];
    if (next) N.behaviours[v] = next; else delete N.behaviours[v];
    el.className = `opt sev ${next}`; el.querySelector('small')?.remove(); if (next) el.insertAdjacentHTML('beforeend', `<small>${PF.behaviours.rated.find((r) => r[0] === next)[1]}</small>`); },
  ncstep(el) { readChildForm(); const d = +el.dataset.d, miss = d > 0 && N.step === 0 ? basicsMissing() : ''; if (miss) return childSheet(miss); N.step = Math.max(0, Math.min(STEPS.length - 1, N.step + d)); childSheet(); },
  editprofile() { editChildSheet(kid(S.childId)); },
  savechild: saveChild,
  idea(el) { document.querySelectorAll('[data-goal]').forEach((x) => (G.goals[+x.dataset.goal] = x.value.trim())); const i = G.goals.findIndex((g) => !g); if (i >= 0) G.goals[i] = el.dataset.g; else if (G.goals.length < 3) G.goals.push(el.dataset.g); planSheet(); },
  generate,
  edit(el) { S.edit = el.dataset.id || null; render(true); },
  async saveact(el) {
    const box = $(`[data-edit="${el.dataset.id}"]`), v = (n) => $(`[name=${n}]`, box).value, lines = (n) => v(n).split('\n').map((x) => x.trim()).filter(Boolean);
    await api('/api/plan/update', { planId: draftPlan(S.childId).id, activities: [{ id: el.dataset.id, title: { en: v('ten'), bn: v('tbn') }, steps: { en: lines('sen'), bn: lines('sbn') } }] });
    S.edit = null; await pull(); render(true);
  },
  async savepage(el) {
    const i = +el.dataset.i, box = $(`[data-edit="page${i}"]`), pages = [];
    pages[i] = { en: $('[name=en]', box).value, bn: $('[name=bn]', box).value };
    await api('/api/plan/update', { planId: draftPlan(S.childId).id, pages });
    S.edit = null; await pull(); render(true);
  },
  async rmact(el) { await api('/api/plan/update', { planId: draftPlan(S.childId).id, removeActivity: el.dataset.id }); await pull(); },
  async redraw(el) { await api('/api/plan/redraw', { planId: el.dataset.id }); await pull(); },
  async approve(el) {
    S.busy.approve = true; render(true);
    try { await api('/api/plan/approve', { planId: el.dataset.id }); toast(`Sent to ${kid(S.childId).parent}`); } catch (e) { toast(e.message); }
    S.busy.approve = false; await pull(); render(true);
  },
  async discard(el) { await api('/api/plan/discard', { planId: el.dataset.id }); toast('Draft discarded'); await pull(); render(true); },
  async summary() {
    S.busy = { summary: true }; render(true);
    try { await api('/api/summary', { childId: S.childId }); S.busy = {}; toast('Summary updated'); } catch (e) { S.busy = { summaryErr: e.message }; }
    await pull(); render(true);
  },
  async sendmsg() { await api('/api/summary/send', { childId: S.childId }); await pull(); },
};
// the parent took or chose a photo or a video for their note
document.addEventListener('change', async (e) => {
  const kind = e.target.dataset?.media, file = e.target.files?.[0];
  if (!kind || !file || !V) return;
  grabText();
  V.msg = '';
  try {
    if (V.media.length >= 4) throw new Error(t('maxMedia'));
    if (kind === 'photo') {
      const url = await shrinkPhoto(file).catch(() => { throw new Error(t('notPhoto')); });
      V.media.push({ kind, url, mime: 'image/jpeg', data: url.split(',')[1] });
    } else {
      if (file.size > 40 << 20) throw new Error(t('tooBig'));
      const mime = /quicktime/.test(file.type) ? 'video/quicktime' : /webm/.test(file.type) ? 'video/webm' : 'video/mp4';
      const data = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = () => no(new Error(t('notPhoto'))); r.readAsDataURL(file); });
      V.media.push({ kind, url: URL.createObjectURL(file), mime, data });
    }
  } catch (err) { V.msg = err.message; }
  render(true);
});
// a report photo was taken or chosen
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'scanfile' || !e.target.files[0]) return;
  try { scanReport(await shrinkPhoto(e.target.files[0]), false); } catch (err) { startSheet(err.message); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'chatin') { e.preventDefault(); act.chatgo(); } });
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled) { Promise.resolve(act[el.dataset.act]?.(el)).catch((err) => toast(err.message)); return; }
  if (e.target === sheetEl() && !G?.busy && !N?.busy) closeSheet();
});

pull();
setInterval(() => document.hidden || pull(), 2000); // no checking for news while the app is in the background
document.addEventListener('visibilitychange', () => document.hidden || pull());
