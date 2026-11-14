/* BridgeAI: the social-story storyboard from the mockup.
   A library of the stories the therapist has approved, and a reader that walks the four steps
   (the situation, how I feel, what I can do, a good ending). Each page can be read aloud with the word
   being read highlighted, or in the parent's own recorded voice, which is kept on this phone only.
   Loaded after app.js, so it shares its globals (S, t, I, act, pic, render …). */

// ---------- the four steps ----------
const STORY_STEPS = ['situation', 'feeling', 'do', 'ending'];
const STEP_NAME = {
  en: { situation: 'The situation', feeling: 'How I feel', do: 'What I can do', ending: 'A good ending' },
  bn: { situation: 'পরিস্থিতি', feeling: 'অনুভূতি', do: 'আমি কী করতে পারি', ending: 'ভালো সমাপ্তি' },
};
/** The step a page belongs to: the one the story names, or, for older stories, one worked out from where the page sits. */
function stepOf(story, i) {
  const given = story.pages[i]?.step;
  if (STORY_STEPS.includes(given)) return given;
  const n = story.pages.length;
  if (i === 0) return 'situation';
  if (i === n - 1 && n > 1) return 'ending';
  const r = (i + 0.5) / n;
  return r < 0.3 ? 'situation' : r < 0.45 ? 'feeling' : 'do';
}
const stepName = (story, i, lang = 'en') => STEP_NAME[lang === 'bn' ? 'bn' : 'en'][stepOf(story, i)];

/** A page drawn in the app (see story-art.js) instead of on the AI's picture sheet. */
function artPic(id, extra = '') {
  const a = window.STORY_ART?.[id];
  return `<div class="pic art ${extra}" role="img" aria-label="${esc(a.alt[S.role === 'parent' ? S.lang : 'en'] || a.alt.en)}"><svg viewBox="0 0 350 330" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${a.svg}</svg></div>`;
}

// ---------- words ----------
const SB = {
  en: {
    title: (c) => `${c}’s stories`, sub: 'Picture stories in their own voice, approved by the therapist.',
    all: 'All', fresh: 'New', fav: 'Favourites', none: 'Nothing here yet.', nFav: 'Tap the heart on a story to keep it here.',
    pages: (n) => `${n} pages`, library: 'Library', page: (i, n) => `Page ${i} / ${n}`,
    read: 'Read aloud', stop: 'Stop', rec: 'Record my voice', recAgain: 'Record again', recording: 'Recording… tap to stop',
    saved: 'Your voice is saved on this phone', playMa: 'Playing your voice', noVoice: 'This phone has no English voice. Record your own voice instead.',
    back: 'Back', next: 'Next page', again: 'Read again', finish: 'Finish', well: 'Well done! The story is finished.',
    favOn: 'Remove from favourites', favOff: 'Add to favourites', steps: 'Story steps',
  },
  bn: {
    title: (c) => `${c}-এর গল্প`, sub: 'ছবির গল্প, ওর নিজের কণ্ঠে। থেরাপিস্ট অনুমোদিত।',
    all: 'সব', fresh: 'নতুন', fav: 'প্রিয়', none: 'এখানে এখনো কিছু নেই।', nFav: 'গল্পের হার্টে চাপ দিলে এখানে জমা থাকবে।',
    pages: (n) => `${bnNum(n)} পাতা`, library: 'লাইব্রেরি', page: (i, n) => `পাতা ${bnNum(i)} / ${bnNum(n)}`,
    read: 'পড়ে শোনান', stop: 'থামান', rec: 'আমার কণ্ঠ রেকর্ড করুন', recAgain: 'আবার রেকর্ড করুন', recording: 'রেকর্ড হচ্ছে… থামাতে চাপুন',
    saved: 'আপনার কণ্ঠ এই ফোনে জমা হয়েছে', playMa: 'আপনার কণ্ঠ বাজছে', noVoice: 'এই ফোনে বাংলা কণ্ঠ নেই। নিজের কণ্ঠ রেকর্ড করুন।',
    back: 'আগের পাতা', next: 'পরের পাতা', again: 'আবার পড়ি', finish: 'শেষ', well: 'দারুণ! গল্পটি শেষ হলো।',
    favOn: 'প্রিয় থেকে সরান', favOff: 'প্রিয়তে রাখুন', steps: 'গল্পের ধাপ',
  },
};
const sb = (k, ...a) => { const v = SB[S.lang][k]; return typeof v === 'function' ? v(...a) : v; };

// ---------- what this phone remembers: favourites, stories already opened ----------
const SKEY = 'bridgeai2:story:' + (FORCED || 'main');
const SM = (() => { try { return { favs: [], opened: [], ...JSON.parse(localStorage.getItem(SKEY)) }; } catch { return { favs: [], opened: [] }; } })();
const smSave = () => { try { localStorage.setItem(SKEY, JSON.stringify(SM)); } catch {} };
S.story = null; // the plan whose story is open; null shows the library
S.stab = 'all';

// ---------- recorded voice, kept in this browser (IndexedDB) ----------
const VOICE = new Set();
const vkey = (planId, i, lang) => `${planId}|${i}|${lang}`;
const vdb = () => new Promise((res, rej) => { const r = indexedDB.open('bridgeai-voice', 1); r.onupgradeneeded = () => r.result.createObjectStore('v'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const vtx = async (mode, fn) => { const db = await vdb(); return new Promise((res, rej) => { const q = fn(db.transaction('v', mode).objectStore('v')); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); };
vtx('readonly', (o) => o.getAllKeys()).then((ks) => { ks.forEach((k) => VOICE.add(k)); if (S.db && S.story) render(); }).catch(() => {});

// ---------- reading aloud ----------
const RD = { mode: null, idx: -1, audio: null, timer: null, rec: null, recKey: null };
const setHl = (i) => { RD.idx = i; document.querySelectorAll('#words .w').forEach((el, k) => el.classList.toggle('on', k === i)); };
function stopReading() {
  try { speechSynthesis.cancel(); } catch {}
  if (RD.audio) { RD.audio.pause(); RD.audio = null; }
  clearInterval(RD.timer); clearTimeout(RD.timer);
  const was = RD.mode;
  RD.mode = null;
  setHl(-1);
  if (was && S.db) render(true);
}
function stopRecording2() { try { RD.rec?.stop(); } catch {} }
const pageOf = (plan) => plan.story.pages[Math.min(S.page, plan.story.pages.length - 1)];
const hasVoice = (lang) => { try { return speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(lang)); } catch { return false; } };

async function readAloud(plan) {
  if (RD.mode) return stopReading();
  const i = Math.min(S.page, plan.story.pages.length - 1), pg = plan.story.pages[i], lang = S.lang, text = pg[lang] || pg.en;
  const words = text.split(/\s+/).filter(Boolean), key = vkey(plan.id, i, lang);
  if (VOICE.has(key)) {
    try {
      const blob = await vtx('readonly', (o) => o.get(key));
      const audio = new Audio(URL.createObjectURL(blob));
      RD.audio = audio; RD.mode = 'rec';
      audio.ontimeupdate = () => audio.duration && setHl(Math.min(words.length - 1, Math.floor((audio.currentTime / audio.duration) * words.length)));
      audio.onended = stopReading;
      await audio.play();
      return render(true);
    } catch { VOICE.delete(key); RD.audio = null; RD.mode = null; }
  }
  if (!('speechSynthesis' in window)) return toast(sb('noVoice'));
  const u = new SpeechSynthesisUtterance(text), starts = [];
  let at = 0;
  for (const w of words) { at = text.indexOf(w, at); starts.push(at); at += w.length; }
  u.lang = lang === 'bn' ? 'bn-BD' : 'en-GB';
  u.voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang)) || null;
  u.rate = 0.85;
  let heard = false;
  u.onboundary = (e) => { heard = true; setHl(Math.max(0, starts.findLastIndex((s) => s <= e.charIndex))); };
  u.onend = stopReading;
  u.onerror = (e) => { if (!['interrupted', 'canceled'].includes(e.error)) toast(sb('noVoice')); stopReading(); }; // a phone that cannot speak says so
  RD.mode = 'tts';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  // Some voices never say which word they are on, so the highlight then walks along at a gentle reading pace.
  RD.timer = setTimeout(() => { if (RD.mode !== 'tts' || heard) return; let k = 0; setHl(0); RD.timer = setInterval(() => { if (++k < words.length) setHl(k); else clearInterval(RD.timer); }, 520); }, 1200);
  render(true);
}
async function recordVoice(plan) {
  if (RD.rec) return stopRecording2();
  stopReading();
  const i = Math.min(S.page, plan.story.pages.length - 1), key = vkey(plan.id, i, S.lang);
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return toast(t('micNo')); }
  const chunks = [], mr = new MediaRecorder(stream);
  mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  mr.onstop = async () => {
    stream.getTracks().forEach((x) => x.stop());
    clearTimeout(RD.recTimer);
    RD.rec = null; RD.recKey = null;
    const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
    if (blob.size > 800) {
      try { await vtx('readwrite', (o) => o.put(blob, key)); VOICE.add(key); toast(sb('saved')); } catch { toast('This browser cannot keep recordings.'); }
    }
    render(true);
  };
  mr.start();
  RD.rec = mr; RD.recKey = key;
  RD.recTimer = setTimeout(stopRecording2, 30000);
  render(true);
}

// ---------- the library and the reader ----------
const storiesOf = (c) => S.db.plans.filter((p) => p.childId === c.id && p.status === 'approved').sort((a, b) => b.approvedAt.localeCompare(a.approvedAt));
function storyTab(c) {
  const plans = storiesOf(c), plan = plans.find((p) => p.id === S.story);
  if (!plans.length) return `<div class="scroll softbg pad"><div class="in"><div class="card empty" style="margin-top:20px"><div class="m">${M.ele({ mood: 'calm' })}</div>${t('waiting', esc(S.db.therapist.short))}</div></div></div>`;
  return plan ? storyReader(c, plan) : storyLibrary(c, plans);
}
function storyLibrary(c, plans) {
  const name = S.lang === 'bn' ? c.name_bn : c.name;
  const shown = plans.filter((p) => S.stab === 'new' ? !SM.opened.includes(p.id) : S.stab === 'fav' ? SM.favs.includes(p.id) : true);
  return `<div class="scroll softbg pad"><div class="bar"><div class="grow"><h1 class="h2" style="font-size:26px;padding-left:4px">${sb('title', esc(name))}</h1></div>${langSeg()}</div><div class="in">
    <p class="sub" style="padding:0 6px 12px">${sb('sub')}</p>
    <div class="seg" style="margin-bottom:14px">${[['all', sb('all')], ['new', sb('fresh')], ['fav', sb('fav')]].map(([k, lab]) => `<button class="${S.stab === k ? 'on' : ''}" data-act="stab" data-k="${k}">${lab}</button>`).join('')}</div>
    ${shown.map((p) => `<button class="storycard" style="margin-bottom:10px" data-act="story" data-id="${p.id}">${pic(p.story, 0)}<span class="grow"><span class="h3" style="display:block">${esc(L(p.story.title))}</span><span class="small">${sb('pages', p.story.pages.length)}</span></span>
        ${SM.favs.includes(p.id) ? `<span style="color:var(--pink);font-size:18px">${I.heart}</span>` : ''}${SM.opened.includes(p.id) ? '' : `<span class="pill dark" style="margin-right:6px">${sb('fresh')}</span>`}</button>`).join('')
      || `<div class="card empty">${S.stab === 'fav' ? sb('nFav') : sb('none')}</div>`}
  </div></div>`;
}
function storyReader(c, plan) {
  const st = plan.story, n = st.pages.length;
  S.page = Math.min(Math.max(S.page, 0), n - 1);
  const pg = st.pages[S.page], lang = S.lang, text = pg[lang] || pg.en, words = text.split(/\s+/).filter(Boolean);
  const step = STORY_STEPS.indexOf(stepOf(st, S.page)), last = S.page === n - 1, key = vkey(plan.id, S.page, lang);
  const fav = SM.favs.includes(plan.id), mine = VOICE.has(key), recording = RD.rec && RD.recKey === key;
  const reading = RD.mode !== null;
  const warn = !mine && lang === 'bn' && !hasVoice('bn') ? `<p class="small" style="text-align:center;padding:0 12px">${sb('noVoice')}</p>` : '';
  return `<div class="softbg pad" style="flex:1;display:flex;flex-direction:column;min-height:0">
    <div class="bar"><button class="hbtn" data-act="storyback" aria-label="${sb('library')}">${I.back}</button>
      <div class="grow"><p class="h3" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(L(st.title))}</p><p class="small">${sb('page', S.page + 1, n)}</p></div>
      <button class="hbtn heart ${fav ? 'on' : ''}" data-act="fav" aria-pressed="${fav}" aria-label="${fav ? sb('favOn') : sb('favOff')}">${I.heart}</button>${langSeg()}</div>
    <div class="steps4" role="img" aria-label="${sb('steps')}: ${step + 1} / 4">${STORY_STEPS.map((_, k) => `<i class="${k <= step ? 'on' : ''}"></i>`).join('')}</div>
    <p class="phase">${STEP_NAME[lang === 'bn' ? 'bn' : 'en'][STORY_STEPS[step]]}</p>
    <div class="reader">${pic(st, S.page)}
      <p class="words" id="words" lang="${lang}"><span class="wt">${words.map((w, k) => `<span class="w ${RD.idx === k ? 'on' : ''}">${esc(w)}</span>`).join(' ')}</span></p>
      ${warn}
      <div class="readrow">
        <button class="chipb" data-act="readaloud" aria-pressed="${reading}"><span class="ic ${reading ? 't-pink' : 't-green'}">${reading ? I.stop : I.sound}</span>${reading ? (RD.mode === 'rec' ? sb('playMa') : sb('stop')) : sb('read')}</button>
        <button class="chipb ${recording ? 'on' : ''}" data-act="recvoice" aria-pressed="${Boolean(recording)}"><span class="ic ${recording ? 't-pink' : 't-orange'}">${recording ? I.stop : I.mic}</span>${recording ? sb('recording') : mine ? sb('recAgain') : sb('rec')}</button>
      </div>
      <div class="pager">${S.page === 0 ? `<span style="width:40px"></span>` : `<button class="hbtn" data-act="page" data-d="-1" aria-label="${sb('back')}">${I.back}</button>`}
        <span class="pdots">${st.pages.map((_, k) => `<i class="${k === S.page ? 'on' : ''}"></i>`).join('')}</span>
        ${last ? `<button class="btn p sm" data-act="finish">${I.check} ${sb('finish')}</button>` : `<button class="hbtn" data-act="page" data-d="1" aria-label="${sb('next')}">${I.next}</button>`}</div>
    </div></div>`;
}

// ---------- doctor: the rules the stories follow ----------
const STORY_RULES = [
  'Four steps in order: the situation, how I feel, what I can do, a good ending.',
  'One idea per page, in one to three short sentences.',
  'In the child’s own voice (“I”), and with the child’s own name.',
  'Make the feeling ordinary, not frightening: “this is okay”.',
  'Only calming strategies the therapist has approved for this child.',
  'The same child, the same clothes and the same place on every page.',
  'Calm colours, little detail, large writing.',
  'The word being read is highlighted when the story is read aloud.',
];

// ---------- taps ----------
const baseTab = act.tab, basePage = act.page, baseLang = act.lang;
Object.assign(act, {
  tab(el) {
    stopReading(); stopRecording2();
    if (S.role === 'parent' && el.dataset.tab === 'story' && S.tab.parent === 'story') S.story = null; // tapping Story again goes back to the library
    return baseTab(el);
  },
  page(el) { stopReading(); stopRecording2(); return basePage(el); },
  lang(el) { stopReading(); stopRecording2(); return baseLang(el); },
  story(el) {
    stopReading();
    S.tab.parent = 'story'; S.push = null; S.story = el.dataset.id; S.page = 0;
    if (!SM.opened.includes(S.story)) { SM.opened.push(S.story); smSave(); }
    render(true);
  },
  storyback() { stopReading(); stopRecording2(); S.story = null; render(true); },
  stab(el) { S.stab = el.dataset.k; render(true); },
  fav() { SM.favs = SM.favs.includes(S.story) ? SM.favs.filter((x) => x !== S.story) : [...SM.favs, S.story]; smSave(); render(true); },
  readaloud() { const p = S.db.plans.find((x) => x.id === S.story); if (p) return readAloud(p); },
  recvoice() { const p = S.db.plans.find((x) => x.id === S.story); if (p) return recordVoice(p); },
  finish() { stopReading(); S.story = null; toast(sb('well')); render(true); },
  rules() {
    openSheet(`${shead('What makes a good social story', 'BridgeAI asks the AI to follow these, and you approve every page.')}
      <div class="card" style="box-shadow:none">${STORY_RULES.map((r, i) => `<div class="rowline"><span class="count" style="min-width:28px">${i + 1}</span><span style="align-self:center">${esc(r)}</span></div>`).join('')}</div>`);
  },
});
