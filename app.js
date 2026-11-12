/* BridgeAI app. One small script, no framework.
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
    waiting: (d) => `${d} is preparing this week’s plan. It will appear here as soon as it is approved.`,
    hello: (c) => `Hello, how was ${c}’s day?`, helloSub: (d) => `Say it or type it. ${d} reads it before your next session.`,
    listening: 'Listening…', tapStop: 'Tap the pink button to finish', ph: 'Say or type anything…', example: 'Use an example', speakBn: 'Speak in বাংলা', speakEn: 'Speak in English',
    hearing: 'Writing down what you said…', saving: 'Saving your note…', savedT: (d) => `Saved for ${d}`, savedS: 'This is what we noted from your words.',
    went: 'Went well', hard: 'Was hard', trig: 'Possible trigger', close: 'Done', micNo: 'The microphone is not available here, so please type your note.',
    offline: (d) => `Your note is saved exactly as you said it. ${d} will see it before the next session.`,
    newPlan: (d) => `New plan from ${d}`, drawing: 'Drawing…',
    settings: 'Settings', viewAs: 'View the app as', language: 'Language', parentOf: (c) => `Parent of ${c}`, aiHow: 'How AI is used', reset: 'Reset sample data', about: 'BridgeAI prototype · sample data only',
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
    waiting: (d) => `${d} এই সপ্তাহের পরিকল্পনা তৈরি করছেন। অনুমোদনের পর এখানে দেখা যাবে।`,
    hello: (c) => `${c}-এর দিনটি কেমন গেল?`, helloSub: (d) => `বলুন অথবা লিখুন। পরের সেশনের আগে ${d} এটি পড়বেন।`,
    listening: 'শুনছি…', tapStop: 'শেষ করতে গোলাপি বোতাম চাপুন', ph: 'যা খুশি বলুন বা লিখুন…', example: 'একটি উদাহরণ', speakBn: 'বাংলায় বলুন', speakEn: 'ইংরেজিতে বলুন',
    hearing: 'আপনার কথা লিখে নিচ্ছি…', saving: 'নোট জমা হচ্ছে…', savedT: (d) => `${d}-এর জন্য জমা হয়েছে`, savedS: 'আপনার কথা থেকে আমরা যা টুকে রেখেছি।',
    went: 'ভালো হয়েছে', hard: 'কঠিন ছিল', trig: 'সম্ভাব্য কারণ', close: 'ঠিক আছে', micNo: 'এখানে মাইক্রোফোন পাওয়া যাচ্ছে না, তাই নোটটি লিখে দিন।',
    offline: (d) => `আপনার নোট হুবহু জমা হয়েছে। পরের সেশনের আগে ${d} এটি দেখবেন।`,
    newPlan: (d) => `${d}-এর নতুন পরিকল্পনা এসেছে`, drawing: 'আঁকা হচ্ছে…',
    settings: 'সেটিংস', viewAs: 'কে ব্যবহার করছেন', language: 'ভাষা', parentOf: (c) => `${c}-এর অভিভাবক`, aiHow: 'এআই কীভাবে ব্যবহার হয়', reset: 'নমুনা তথ্য নতুন করুন', about: 'ব্রিজএআই প্রোটোটাইপ · শুধু নমুনা তথ্য',
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
const freshNotes = (c) => (livePlan(c.id) ? Math.max(0, weekLogs(c.id).length - (S.db.summaries[c.id]?.notesCount || 0)) : 0);
function streak(cid) {
  const have = new Set(weekLogs(cid).map((l) => l.date));
  const ds = days7().map(dkey).reverse();
  let n = 0;
  for (const [i, d] of ds.entries()) { if (have.has(d)) n++; else if (i > 0) break; } // today may still be open
  return n;
}
const avatar = (c, size = 46) => {
  const tint = { lime: 't-green', teal: 't-blue', sun: 't-orange' }[c.tint] || 't-purple';
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
    <div class="logo">${I.logo} BridgeAI</div><h1 class="big">Therapy that<br><em>continues at home.</em></h1><p class="tagline">One small step a day, shared between doctor and parent.</p>
    <div class="duo2"><div style="left:42px;width:160px">${M.ele({ extra: 'doctor' })}</div><div style="right:40px;width:118px;animation-delay:-2s;bottom:14px">${M.tiger()}</div></div>
    <div class="sheet0"><h1 class="h1">Welcome</h1><p class="sub" style="margin-top:4px">Who is using BridgeAI today? You can switch any time in Settings.</p>
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
  const tab = S.tab.parent;
  const body = tab === 'tracker' ? parentTracker(c, plan) : tab === 'story' ? parentStory(c, plan) : tab === 'settings' ? settings() : parentHome(c, plan);
  return body + nav([['home', 'home', t('nHome')], ['tracker', 'chart', t('nTracker')], ['story', 'book', t('nStory')], ['settings', 'gear', t('nSettings')]]);
}
function parentHome(c, plan) {
  const name = S.lang === 'bn' ? c.name_bn : c.name, dr = S.db.therapist.short;
  const sum = S.db.summaries[c.id], hasMsg = sum?.parentMessageSent && L(sum.parentMessage);
  const acts = plan?.activities || [];
  const done = acts.filter((a) => doneOn(c.id, a.id, S.db.today)).length, left = acts.length - done;
  const next = acts.find((a) => !doneOn(c.id, a.id, S.db.today));
  const daysLogged = new Set(weekLogs(c.id).map((l) => l.date)).size;
  const todayNote = S.db.logs.some((l) => l.childId === c.id && l.date === S.db.today);
  const all = acts.length && !left;
  return `<div class="scroll homebg pad">
    ${homeTop(hasMsg, langBtn())}
    <div class="greet"><h1>${t('hey', esc(c.parent))}</h1><p>${t('ready', esc(name))}</p><span class="bubble">${all ? t('great') : t('small')}</span><div class="masc">${M.ele({ mood: all ? 'proud' : 'hi' })}</div></div>
    <div class="tiles">
      <button class="tile" data-act="tab" data-tab="tracker"><span class="ic" style="color:var(--blue)">${I.turn}</span><span class="lab">${t('tPractice')}</span><b>${num(done)}/${num(acts.length)}</b><span class="unit">${t('tDone')}</span></button>
      <button class="tile" data-act="tab" data-tab="tracker"><span class="ic" style="color:var(--orange)">${I.mic}</span><span class="lab">${t('tNotes')}</span><b>${num(daysLogged)}</b><span class="unit">${t('tDays')}</span></button>
      <button class="tile" data-act="tab" data-tab="story"><span class="ic" style="color:var(--green)">${I.book}</span><span class="lab">${t('tStory')}</span><b>${num(plan?.story.pages.length || 0)}</b><span class="unit">${t('tPages')}</span></button>
    </div>
    ${plan ? `<div class="banner"><div class="cl">${M.cloud()}</div><div class="m">${M.ele({ mood: all ? 'proud' : 'calm' })}</div><div class="cl b">${M.cloud()}</div>
      <p class="h3">${t('progress')}</p><div class="segbar">${acts.map((a) => `<i class="${doneOn(c.id, a.id, S.db.today) ? 'on' : ''}"></i>`).join('')}<span>${num(done)}/${num(acts.length)}</span></div>
      <div class="bchips">${all ? `<span>${t('allDone')}</span>` : `<span>${t('left', num(left))}</span><span>${t('next', esc(L(next.title)))}</span>`}</div></div>` : ''}
    <div class="in">
      ${plan ? `<div class="sec"><h2 class="h2">${t('practice')}</h2></div>
      ${acts.map((a, i) => {
        const isDone = doneOn(c.id, a.id, S.db.today), open = S.open === a.id, g = plan.goals.find((x) => x.id === a.goal);
        return `<div class="rowbox ${isDone ? 'done' : ''}"><div class="row">
          <button class="grow" style="display:flex;gap:12px;align-items:center" data-act="open" data-id="${a.id}"><span class="ic ${TINTS[i % 6]}">${icon(a.icon)}</span><span class="grow"><span class="h3" style="display:block">${esc(L(a.title))}</span><span class="small">${num(a.minutes)} ${t('min')} · ${esc(L(a.when))}</span></span></button>
          <button class="tick ${isDone ? 'on' : ''}" data-act="done" data-id="${a.id}" data-on="${isDone ? '' : '1'}" aria-label="${t('markDone')}">${I.check}</button></div>
          ${open ? `<ol class="steps">${(a.steps[S.lang]?.length ? a.steps[S.lang] : a.steps.en).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
            <div class="stepfoot">${g ? `<p class="small" style="margin-bottom:10px">${t('goal')}: ${esc(g.text)}</p>` : ''}<button class="btn ${isDone ? 'soft' : 'p'} sm" data-act="done" data-id="${a.id}" data-on="${isDone ? '' : '1'}">${isDone ? t('undo') : I.check + ' ' + t('markDone')}</button></div>` : ''}
        </div>`;
      }).join('')}` : `<div class="card empty" style="margin-top:16px"><div class="m">${M.ele({ mood: 'calm' })}</div>${t('waiting', esc(dr))}</div>`}
      <button class="cta" data-act="note"><span class="m">${M.tiger({ mood: todayNote ? 'proud' : 'hi' })}</span><span class="grow"><span class="h3" style="display:block">${todayNote ? t('saved') : t('how')}</span><span class="small" style="color:#a8603a">${todayNote ? t('another') : t('tell', esc(dr))}</span></span><span class="go">${I.mic}</span></button>
      ${hasMsg ? `<div class="msg"><span class="m">${M.ele({ mood: 'calm', extra: 'doctor' })}</span><div><p class="small">${t('from', esc(dr))}</p><p class="sub" style="color:var(--ink)">${esc(L(sum.parentMessage))}</p></div></div>` : ''}
      ${plan ? `<div class="sec"><h2 class="h2">${t('story')}</h2></div>
      <button class="storycard" data-act="tab" data-tab="story">${pic(plan.story, 0)}<span class="grow"><span class="h3" style="display:block">${esc(L(plan.story.title))}</span><span class="small">${t('pagesN', num(plan.story.pages.length))}</span></span><span class="pill dark" style="margin-right:6px">${t('read')}</span></button>` : ''}
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
function parentTracker(c, plan) {
  const name = S.lang === 'bn' ? c.name_bn : c.name, logs = weekLogs(c.id), acts = plan?.activities || [];
  const done = acts.filter((a) => doneOn(c.id, a.id, S.db.today)), n = streak(c.id), ds = days7();
  const h = { good: 100, mixed: 62, hard: 34 };
  return `<div class="scroll softbg pad">
    <div class="bar"><h1 class="h2 grow" style="padding-left:4px">${t('week', esc(name))}</h1>${langSeg()}</div>
    <div class="in">
      <div class="card streak"><div class="m">${M.ele({ mood: n ? 'proud' : 'calm', flame: n > 1 })}</div><p class="h2" style="margin-top:6px">${t('streak', num(n))}</p><p class="small">${t('streakSub')}</p>
        ${wk(c.id, false)}<p class="small" style="margin-top:14px">${t('todayDone', num(done.length), num(acts.length))}</p></div>
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
  S.page = Math.min(S.page, n - 1);
  const p = st.pages[S.page];
  return `<div class="softbg pad" style="flex:1;display:flex;flex-direction:column;min-height:0">
    <div class="bar"><h1 class="h2 grow" style="padding-left:4px;font-size:21px">${esc(L(st.title))}</h1>${langSeg()}</div>
    <div class="reader">${pic(st, S.page)}<p class="words" lang="${S.lang}">${esc(p[S.lang] || p.en)}</p>
      <div class="pager"><button class="hbtn" data-act="page" data-d="-1" ${S.page === 0 ? 'disabled' : ''} aria-label="Back">${I.back}</button>
        <span class="pdots">${st.pages.map((_, i) => `<i class="${i === S.page ? 'on' : ''}"></i>`).join('')}</span>
        <button class="hbtn" data-act="page" data-d="1" ${S.page === n - 1 ? 'disabled' : ''} aria-label="Next">${I.next}</button></div></div></div>`;
}

// ----- the daily note (parent) -----
let V = null, recStream = null, recorder = null, recog = null, recTimer = null;
const EXAMPLE = { en: 'He waited his turn twice today, but cried at the blender noise.', bn: 'আজ দুইবার নিজের পালার জন্য অপেক্ষা করেছে, কিন্তু ব্লেন্ডারের শব্দে কেঁদেছে।' }; // same words as EXAMPLE_NOTES in seed-data.js
function noteScreen(c) {
  if (!V) V = { step: 'compose', lang: S.lang, text: '', left: 30, audio: null, mime: null, heardBy: null, note: null, msg: '' };
  const name = S.lang === 'bn' ? c.name_bn : c.name, dr = S.db.therapist.short;
  const bar = `<div class="bar"><button class="hbtn" data-act="back" aria-label="Back">${I.back}</button><span class="grow"></span>${langSeg()}</div>`;
  const tiger = (mood, cls = '') => `<div class="m ${cls}"><span class="fl a">${I.mic}</span><span class="fl b">${I.book}</span><span class="fl c">${I.heart}</span>${M.tiger({ mood })}</div>`;
  if (V.step === 'done') {
    const n = V.note;
    const group = (label, items, cls) => (items?.length ? `<p class="small" style="margin:12px 0 0">${label}</p><div class="tags" style="margin-top:6px">${items.map((x) => `<span class="pill ${cls}">${esc(x)}</span>`).join('')}</div>` : '');
    return `<div class="notescr peachbg pad">${bar}<div class="hello" style="flex:none;padding-top:0"><div class="m" style="margin-bottom:10px">${M.tiger({ mood: 'proud' })}</div><h1>${t('savedT', esc(dr))}</h1></div>
      <div class="scroll" style="padding:16px 0 20px"><div class="result"><p class="orig" lang="${n.lang}">${esc(n.text)}</p>
        ${n.analysed ? `<p class="small" style="margin-top:10px">${t('savedS')}</p>${group(t('went'), n.wins, 'good')}${group(t('hard'), n.struggles, 'warn')}${group(t('trig'), n.triggers, 'bad')}` : `<p class="small" style="margin-top:10px">${t('offline', esc(dr))}</p>`}</div></div>
      <div style="padding:0 18px 20px"><button class="btn p wide" data-act="back">${t('close')}</button></div></div>`;
  }
  if (V.step === 'hearing' || V.step === 'saving') return `<div class="notescr peachbg pad">${bar}<div class="hello">${tiger('proud', 'listen')}<h1>${t(V.step)}</h1></div></div>`;
  const rec = V.step === 'rec';
  return `<div class="notescr peachbg pad">${bar}
    <div class="hello">${tiger('hi', rec ? 'listen' : '')}<h1>${rec ? t('listening') : t('hello', esc(name))}</h1>${rec ? `<p class="timer" id="timer">0:${String(V.left).padStart(2, '0')}</p><p>${t('tapStop')}</p>` : `<p>${t('helloSub', esc(dr))}</p>`}</div>
    ${V.msg ? `<div class="in"><div class="err">${esc(V.msg)}</div></div>` : ''}
    ${rec ? '' : `<div class="chips"><button class="chipb" data-act="vexample"><span class="ic t-yellow">${I.spark}</span>${t('example')}</button><button class="chipb ${V.lang === 'bn' ? 'on' : ''}" data-act="vlang" data-lang="bn"><span class="ic t-pink">${I.mic}</span>${t('speakBn')}</button><button class="chipb ${V.lang === 'en' ? 'on' : ''}" data-act="vlang" data-lang="en"><span class="ic t-blue">${I.mic}</span>${t('speakEn')}</button></div>`}
    <div class="ask">${rec ? `<div class="live" id="live" lang="${V.lang}">${esc(V.text) || '…'}</div>` : `<textarea id="vtext" lang="${V.lang}" placeholder="${t('ph')}">${esc(V.text)}</textarea>`}
      <div class="tools"><button class="rb ${rec ? 'rec' : ''}" data-act="${rec ? 'recstop' : 'recstart'}" aria-label="${rec ? 'Stop' : 'Record'}">${rec ? I.stop : I.mic}</button><span class="grow small">${rec ? '' : V.lang === 'bn' ? 'বাংলা' : 'English'}</span>${rec ? '' : `<button class="rb send" data-act="vsave" aria-label="Save note">${I.arrow}</button>`}</div></div></div>`;
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
  if (!V.text) return $('#vtext')?.focus();
  V.step = 'saving'; V.msg = ''; render(true);
  try {
    V.note = await api('/api/note', { childId: PARENT_CHILD, text: V.text, lang: V.lang, audio: V.audio, mime: V.mime, heardBy: V.heardBy });
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
    ${line('refresh', 't-orange', t('reset'), 'reset')}
    <p class="small" style="text-align:center;margin-top:18px">${t('about')}</p>
  </div></div>`;
}

// ----- doctor -----
function doctor() {
  if (S.push === 'child' && kid(S.childId)) return childView(kid(S.childId));
  const tab = S.tab.doctor, waiting = kids().filter((c) => draftPlan(c.id)).length;
  const body = tab === 'children' ? childList() : tab === 'ai' ? aiUse(false) : tab === 'settings' ? settings() : doctorHome();
  return body + nav([['home', 'home', 'Home'], ['children', 'users', 'Children', waiting], ['ai', 'shield', 'AI use'], ['settings', 'gear', 'Settings']]);
}
const kidStatus = (c) => (draftPlan(c.id) ? `<span class="pill warn">Draft to review</span>` : livePlan(c.id) ? `<span class="pill good">Plan live</span>` : `<span class="pill line">No plan yet</span>`);
function doctorHome() {
  const all = kids(), drafts = all.filter((c) => draftPlan(c.id)), fresh = all.reduce((n, c) => n + freshNotes(c), 0);
  const notes = all.reduce((n, c) => n + weekLogs(c.id).length, 0), live = all.filter((c) => livePlan(c.id)).length;
  const have = new Set(all.flatMap((c) => weekLogs(c.id).map((l) => l.date))), ds = days7();
  const todo = [];
  for (const c of all) {
    if (draftPlan(c.id)) todo.push([c, 'plan', 'edit', 't-orange', `Review ${c.name}’s draft plan`, `${c.parent} cannot see it until you approve`]);
    if (freshNotes(c)) todo.push([c, 'summary', 'mic', 't-green', `${freshNotes(c)} new note${freshNotes(c) > 1 ? 's' : ''} about ${c.name}`, 'Update the summary before the session']);
    if (!livePlan(c.id) && !draftPlan(c.id)) todo.push([c, 'plan', 'plus', 't-blue', `Plan ${c.name}’s week`, 'Set goals and let AI draft the home practice']);
  }
  return `<div class="scroll homebg pad">
    ${homeTop(drafts.length || fresh)}
    <div class="greet"><h1>Hey, ${esc(S.db.therapist.short)}</h1><p>${esc(S.db.centre.name)}</p><span class="bubble">${drafts.length ? `${drafts.length} to review` : fresh ? `${fresh} new note${fresh > 1 ? 's' : ''}!` : 'All caught up!'}</span><div class="masc">${M.ele({ mood: 'hi', extra: 'doctor' })}</div></div>
    <div class="tiles">
      <button class="tile" data-act="tab" data-tab="children"><span class="ic" style="color:var(--p)">${I.users}</span><span class="lab">Children</span><b>${all.length}</b><span class="unit">in your care</span></button>
      <button class="tile" data-act="tab" data-tab="children"><span class="ic" style="color:var(--orange)">${I.edit}</span><span class="lab">To review</span><b>${drafts.length}</b><span class="unit">${drafts.length === 1 ? 'draft' : 'drafts'}</span></button>
      <button class="tile" data-act="tab" data-tab="children"><span class="ic" style="color:var(--green)">${I.mic}</span><span class="lab">New notes</span><b>${fresh}</b><span class="unit">since summary</span></button>
    </div>
    <div class="banner"><div class="cl">${M.cloud()}</div><div class="m">${M.ele({ mood: 'calm' })}</div><div class="cl b">${M.cloud()}</div>
      <p class="h3">Notes from home this week</p><div class="segbar">${ds.map((d) => `<i class="${have.has(dkey(d)) ? 'on' : ''}"></i>`).join('')}<span>${have.size}/7</span></div>
      <div class="bchips"><span>${live} plan${live === 1 ? '' : 's'} live</span><span>${notes} parent notes</span></div></div>
    <div class="in">
      <div class="sec"><h2 class="h2">Needs your attention</h2></div>
      ${todo.length ? todo.map(([c, tab, ic, tint, title, sub]) => `<button class="row" data-act="kid" data-id="${c.id}" data-tab="${tab}"><span class="ic ${tint}">${I[ic]}</span><span class="grow"><span class="h3" style="display:block">${esc(title)}</span><span class="small">${esc(sub)}</span></span><span style="color:var(--mute);font-size:17px">${I.next}</span></button>`).join('') : `<div class="card empty"><div class="m">${M.ele({ mood: 'proud' })}</div>Nothing is waiting for you.</div>`}
      <div class="sec"><h2 class="h2">My children</h2><button class="link" data-act="tab" data-tab="children">See all</button></div>
      ${all.map((c) => `<button class="row" data-act="kid" data-id="${c.id}">${avatar(c)}<span class="grow"><span class="h3" style="display:block">${esc(c.name)}, ${c.age}</span><span class="small">${weekLogs(c.id).length} of 7 days noted</span></span>${kidStatus(c)}</button>`).join('')}
    </div></div>`;
}
function childList() {
  return `<div class="scroll softbg pad"><div class="bar"><h1 class="h2 grow" style="padding-left:4px">My children</h1><span class="pill line">${kids().length} children</span></div><div class="in">
    ${kids().map((c) => `<button class="card" style="display:block;width:100%" data-act="kid" data-id="${c.id}"><span style="display:flex;gap:12px;align-items:center">${avatar(c)}<span class="grow"><span class="h3" style="display:block">${esc(c.name)}, ${c.age}</span><span class="small">Parent: ${esc(c.parent)} · ${esc(c.sessions)}</span></span>${kidStatus(c)}</span>
      ${wk(c.id, true)}${freshNotes(c) ? `<span class="tags"><span class="pill dark">${freshNotes(c)} new note${freshNotes(c) > 1 ? 's' : ''}</span></span>` : ''}</button>`).join('')}
    <div class="legend"><span><i style="background:var(--green)"></i>Good day</span><span><i style="background:var(--yellow)"></i>Mixed</span><span><i style="background:var(--pink)"></i>Hard day</span></div>
  </div></div>`;
}
function childView(c) {
  const d = draftPlan(c.id), showApprove = S.ctab === 'plan' && d && !S.edit;
  const inner = S.ctab === 'plan' ? planTab(c) : S.ctab === 'notes' ? notesTab(c) : summaryTab(c);
  return `<div class="softbg" style="flex:1;display:flex;flex-direction:column;min-height:0;position:relative">
    <div class="hdr pad"><div class="bar"><button class="hbtn" data-act="back" aria-label="Back">${I.back}</button><div class="grow"><p class="h2">${esc(c.name)}, ${c.age}</p><p class="small">Parent: ${esc(c.parent)} · ${esc(c.sessions)}</p></div>${avatar(c, 40)}</div>
    <div class="in" style="padding-bottom:10px"><div class="seg">${[['summary', 'Summary'], ['plan', 'Plan'], ['notes', 'Notes']].map(([k, lab]) => `<button class="${S.ctab === k ? 'on' : ''}" data-act="ctab" data-tab="${k}">${lab}${k === 'plan' && d ? ' •' : ''}</button>`).join('')}</div></div></div>
    <div class="scroll under" style="padding-bottom:${showApprove ? 96 : 28}px"><div class="in">${inner}</div></div>
    ${showApprove ? `<div class="fade"></div><div class="approve"><button class="btn soft" data-act="discard" data-id="${d.id}" aria-label="Discard draft">${I.trash}</button><button class="btn p" data-act="approve" data-id="${d.id}" ${S.busy.approve ? 'disabled' : ''}>${I.send} Approve and send to ${esc(c.parent)}</button></div>` : ''}</div>`;
}
const sourceTag = (x) => (x.source === 'sample' ? 'Prepared sample' : x.source === 'cache' ? `${esc(x.model)} · saved answer` : `Written by ${esc(x.model)}`);
function summaryTab(c) {
  const plan = livePlan(c.id), logs = weekLogs(c.id), s = S.db.summaries[c.id];
  if (!plan) return `<div class="card empty"><div class="m">${M.ele({ mood: 'calm' })}</div>No plan yet for ${esc(c.name)}.<br>Set this week’s goals in the Plan tab to begin.</div>`;
  const fresh = logs.length - (s?.notesCount || 0), busy = S.busy.summary;
  const make = (label) => `<button class="btn p sm" data-act="summary" ${busy ? 'disabled' : ''}>${I.spark} ${busy ? 'Reading the notes…' : label}</button>`;
  const errBox = S.busy.summaryErr ? `<div class="err">${esc(S.busy.summaryErr)}</div>` : '';
  const weekCard = `<div class="card">${wk(c.id, true)}<div class="legend"><span><i style="background:var(--green)"></i>Good day</span><span><i style="background:var(--yellow)"></i>Mixed</span><span><i style="background:var(--pink)"></i>Hard day</span></div></div>`;
  if (!s) return `${errBox}<div class="card empty"><div class="m">${M.ele({ mood: 'calm' })}</div>${logs.length ? `${logs.length} parent note${logs.length > 1 ? 's' : ''} this week.<br>Turn them into a one-page summary before the session.<div style="margin-top:14px">${make('Write summary')}</div>` : `No parent notes yet this week.<br>The summary appears once ${esc(c.parent)} starts noting.`}</div>${weekCard}`;
  const status = { improving: ['good', 'Improving'], steady: ['', 'Steady'], needs_support: ['bad', 'Needs support'] };
  const doneCount = S.db.done.filter((d) => d.childId === c.id && d.date >= S.db.weekStart).length;
  return `${errBox}
    ${fresh > 0 ? `<div class="note2"><span class="grow">${fresh} new note${fresh > 1 ? 's' : ''} since this summary</span>${make('Update')}</div>` : ''}
    <div class="headcard"><p class="small">Before your next session</p><p class="hl">${esc(s.headline)}</p>
      <div class="tags" style="margin:0"><span class="pill">${s.notesCount} parent notes</span><span class="pill">${doneCount} ${doneCount === 1 ? 'activity' : 'activities'} done</span><span class="pill">${sourceTag(s)}</span></div></div>
    <div class="sec"><h2 class="h2">This week</h2><span class="small">${new Set(logs.map((l) => l.date)).size} of 7 days noted</span></div>${weekCard}
    <div class="sec"><h2 class="h2">Goals</h2></div>
    ${s.goals.map((g) => `<div class="card"><div style="display:flex;gap:10px;align-items:flex-start;justify-content:space-between"><p class="h3">${esc(g.goal)}</p><span class="pill ${status[g.status][0]}">${status[g.status][1]}</span></div><p class="sub" style="margin-top:8px">${esc(g.evidence)}</p></div>`).join('')}
    <div class="sec"><h2 class="h2">Patterns spotted</h2></div>
    <div class="card">${s.patterns.map((p) => `<div class="rowline"><span class="count">${p.days}<small>${p.days > 1 ? 'days' : 'day'}</small></span><div><p class="h3">${esc(p.title)}</p><p class="sub">${esc(p.detail)}</p></div></div>`).join('')}</div>
    <div class="sec"><h2 class="h2">For the session</h2></div>
    <div class="card"><p class="small" style="margin-bottom:8px">Options to consider</p>${s.suggestions.map((x) => `<div class="rowline">${I.spark}<span>${esc(x)}</span></div>`).join('')}</div>
    <div class="card"><p class="small" style="margin-bottom:8px">Ask ${esc(c.parent)}</p>${s.askParent.map((x) => `<div class="rowline">${I.talk}<span>${esc(x)}</span></div>`).join('')}</div>
    <div class="sec"><h2 class="h2">Message to ${esc(c.parent)}</h2></div>
    <div class="card"><div class="two"><p class="sub">${esc(s.parentMessage.en)}</p><p class="bn" lang="bn">${esc(s.parentMessage.bn)}</p></div>
      <div class="rowbtns">${s.parentMessageSent ? `<span class="pill good">${I.check} Sent to ${esc(c.parent)}</span>` : `<button class="btn p sm" data-act="sendmsg">${I.send} Send to ${esc(c.parent)}</button>`}</div></div>
    ${fresh <= 0 ? `<div style="text-align:center;margin-top:6px">${make('Write again')}</div>` : ''}`;
}
function planBody(c, plan, editable) {
  const acts = plan.activities.map((a, i) => {
    const g = plan.goals.find((x) => x.id === a.goal), ed = editable && S.edit === a.id;
    return `<div class="card"><div style="display:flex;gap:12px;align-items:flex-start"><span class="ic ${TINTS[i % 6]}">${icon(a.icon)}</span><div class="grow">
        <p class="h3">${esc(a.title.en)}</p><p class="bn sub" lang="bn">${esc(a.title.bn)}</p><p class="small" style="margin-top:3px">${a.minutes} min · ${esc(a.when.en)}${g ? ` · Goal ${plan.goals.indexOf(g) + 1}` : ''}</p></div></div>
      ${ed ? `<div class="editbox" data-edit="${a.id}"><label>Title (English)</label><input class="field" name="ten" value="${esc(a.title.en)}"><label>Title (Bangla)</label><input class="field bn" name="tbn" value="${esc(a.title.bn)}">
          <label>Steps in English, one per line</label><textarea name="sen" rows="5">${esc(a.steps.en.join('\n'))}</textarea><label>Steps in Bangla, one per line</label><textarea class="bn" name="sbn" rows="5">${esc(a.steps.bn.join('\n'))}</textarea></div>
          <div class="rowbtns"><button class="btn p sm" data-act="saveact" data-id="${a.id}">Save changes</button><button class="btn soft sm" data-act="edit" data-id="">Cancel</button></div>`
        : `<ol class="steps plain">${a.steps.en.map((s, i) => `<li>${esc(s)}${a.steps.bn[i] ? `<br><span class="bn" lang="bn">${esc(a.steps.bn[i])}</span>` : ''}</li>`).join('')}</ol>
          ${editable ? `<div class="rowbtns" style="margin-top:0"><button class="btn soft sm" data-act="edit" data-id="${a.id}">${I.edit} Edit</button><button class="btn soft sm" data-act="rmact" data-id="${a.id}">${I.trash} Remove</button></div>` : ''}`}
    </div>`;
  }).join('');
  const st = plan.story;
  const pages = st.pages.map((p, i) => {
    const ed = editable && S.edit === 'page' + i;
    return `<div class="pg">${pic(st, i)}<div class="num"><span>Page ${i + 1}</span>${editable && !ed ? `<button data-act="edit" data-id="page${i}" aria-label="Edit page ${i + 1}">${I.edit}</button>` : ''}</div>
      ${ed ? `<div class="editbox" data-edit="page${i}"><textarea name="en" rows="4">${esc(p.en)}</textarea><textarea class="bn" name="bn" rows="4">${esc(p.bn)}</textarea><button class="btn p sm" data-act="savepage" data-i="${i}">Save</button></div>` : `<p>${esc(p.en)}</p><p class="bn" lang="bn">${esc(p.bn)}</p>`}</div>`;
  }).join('');
  return `<div class="card"><p class="small" style="margin-bottom:8px">This week’s goals</p>${plan.goals.map((g, i) => `<div class="rowline"><span class="count" style="min-width:28px">${i + 1}</span><span class="h3" style="font-weight:500;align-self:center">${esc(g.text)}</span></div>`).join('')}</div>
    <div class="sec"><h2 class="h2">Home activities</h2><span class="small">${plan.activities.length} · ${plan.activities.reduce((n, a) => n + a.minutes, 0)} min a day</span></div>${acts}
    <div class="sec"><h2 class="h2">Social story</h2>${st.sheetStatus === 'making' ? `<span class="pill warn">Pictures being drawn</span>` : st.sheetStatus === 'failed' && editable ? `<button class="pill line" data-act="redraw" data-id="${plan.id}">${I.refresh} Draw pictures</button>` : ''}</div>
    <div class="card"><p class="h3">${esc(st.title.en)}</p><p class="bn sub" lang="bn">${esc(st.title.bn)}</p></div>
    <div class="pages">${pages}</div>`;
}
function planTab(c) {
  const d = draftPlan(c.id), p = livePlan(c.id);
  if (d) return `<div class="note2"><span class="grow">Draft from AI. ${esc(c.parent)} cannot see it until you approve.</span><span class="pill dark">${sourceTag(d)}</span></div>${planBody(c, d, true)}`;
  if (!p) return `<div class="card empty"><div class="m">${M.ele({ mood: 'hi' })}</div>No plan yet for ${esc(c.name)}.<br>Set the goals and BridgeAI drafts the home activities and a story for you to review.<div style="margin-top:14px"><button class="btn p sm" data-act="newplan">${I.plus} Plan this week</button></div></div>`;
  return `<div class="note2 live"><span class="grow">Live for ${esc(c.parent)} since ${esc(niceDate(p.approvedAt))}</span><button class="btn dark sm" data-act="newplan">${I.plus} New week</button></div>${planBody(c, p, false)}`;
}
function notesTab(c) {
  const logs = weekLogs(c.id).slice().reverse();
  if (!logs.length) return `<div class="card empty"><div class="m">${M.tiger()}</div>No notes from ${esc(c.parent)} yet this week.</div>`;
  return logs.map((l) => `<div class="card note"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="mood ${l.mood}"></i><span class="small grow">${esc(niceDate(l.at))} · ${esc(niceTime(l.at))}</span>${l.analysed ? '' : `<span class="pill line">As spoken</span>`}</div>
    <p class="orig" lang="${l.lang}">${esc(l.text)}</p>${l.en && l.lang !== 'en' ? `<p class="tr">${esc(l.en)}</p>` : ''}
    ${l.audio ? `<audio controls preload="none" src="${esc(l.audio.replace(/^\//, ''))}"></audio>` : ''}
    <div class="tags">${(l.wins || []).map((w) => `<span class="pill good">${esc(w)}</span>`).join('')}${(l.struggles || []).map((w) => `<span class="pill warn">${esc(w)}</span>`).join('')}${(l.triggers || []).map((w) => `<span class="pill bad">Trigger: ${esc(w)}</span>`).join('')}${l.sleep === 'poor' ? `<span class="pill line">Poor sleep</span>` : ''}</div></div>`).join('');
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
      <div class="rowline">${I.heart}<span><b>No diagnosis, ever.</b> The AI only turns the therapist’s goals into home practice. No child photos or videos are collected.</span></div></div>
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
  openSheet(`${shead('BridgeAI', 'One app, two sides of the same child’s week.')}${FORCED ? '' : personaBtns()}
    <button class="row" style="margin-top:10px" data-act="ai"><span class="ic t-green" style="width:38px;height:38px;font-size:18px">${I.shield}</span><span class="grow h3" style="font-weight:500">How AI is used</span>${I.next}</button>`);
}
function bellSheet() {
  const items = [];
  if (S.role === 'parent') {
    const c = kid(PARENT_CHILD), s = S.db.summaries[c.id], p = livePlan(c.id);
    if (s?.parentMessageSent) items.push(['heart', 't-pink', t('from', S.db.therapist.short), L(s.parentMessage)]);
    if (p) items.push(['book', 't-green', L(p.story.title), niceDate(p.approvedAt, S.lang)]);
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
function planSheet(err) {
  const c = kid(S.childId);
  if (!G) G = { goals: ['', ''] };
  if (G.busy) return openSheet(`<div class="thinking"><div class="m">${M.ele({ mood: 'proud' })}</div><div><p class="h2">Drafting ${esc(c.name)}’s week</p><p class="small" id="think" style="margin-top:6px">Reading the goals…</p></div><p class="small">Nothing is sent to ${esc(c.parent)} until you approve it.</p></div>`);
  openSheet(`${shead(`Goals for ${esc(c.name)}’s week`, `Likes ${esc(c.likes)}. Sensitive to ${esc(c.sensitivities)}.`)}
    ${err ? `<div class="err">${esc(err)}</div>` : ''}
    <div class="editbox" style="margin-top:0">${G.goals.map((g, i) => `<input class="field" data-goal="${i}" placeholder="Goal ${i + 1}${i ? ' (optional)' : ''}" value="${esc(g)}" maxlength="160">`).join('')}</div>
    <div class="sugg">${GOAL_IDEAS.map((g) => `<button data-act="idea" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div>
    <button class="btn p wide" data-act="generate">${I.spark} Draft activities and story</button>
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
  close: closeSheet,
  menu: menuSheet,
  bell: bellSheet,
  role(el) { if (FORCED) return; S.role = el.dataset.role; S.push = null; S.tab[S.role] = 'home'; closeSheet(); render(true); },
  tab(el) { S.tab[S.role] = el.dataset.tab; S.push = null; S.open = null; render(true); },
  back() { if (S.push === 'note') { stopRecording(true); V = null; } S.push = null; S.edit = null; render(true); },
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
  async reset() { if (!confirm('Put the sample week back and remove notes and plans made since?')) return; await api('/api/reset'); S.push = null; await pull(); render(true); toast('Sample data is fresh again'); },
  vlang(el) { grabText(); V.lang = el.dataset.lang; render(true); },
  vexample() { V.text = EXAMPLE[V.lang]; render(true); },
  vsave: saveNote,
  recstart: startRecording,
  recstop() { stopRecording(); },
  kid(el) { S.childId = el.dataset.id; S.push = 'child'; S.ctab = el.dataset.tab || (draftPlan(S.childId) ? 'plan' : 'summary'); S.edit = null; S.busy = {}; render(true); },
  ctab(el) { S.ctab = el.dataset.tab; S.edit = null; render(true); },
  newplan() { G = null; planSheet(); },
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
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled) { Promise.resolve(act[el.dataset.act]?.(el)).catch((err) => toast(err.message)); return; }
  if (e.target === sheetEl() && !G?.busy) closeSheet();
});

pull();
setInterval(pull, 2000);
