// Demo data, shared by the server and by the browser-only preview. Every person here is invented. Dates are built relative to "today",
// so pressing Reset on the day of the pitch gives a fresh, current-looking week.

export const dayKey = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const daysAgo = (n) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

/** Common home activities a therapist can add to any plan with one tap. Each has three short steps, a how-to video,
    and a target that grows through the week: days 1-2 start small, days 3-5 build, days 6-7 stretch. */
const ph = (a, b, c) => [{ to: 2, ...a }, { to: 5, ...b }, { to: 7, ...c }];
export const LIBRARY = [
  { key: 'turn', icon: 'turn', minutes: 5, video: '/art/how-turn.mp4',
    title: { en: 'Turn-taking with a favourite toy', bn: 'প্রিয় খেলনা নিয়ে পালা করে খেলা' }, when: { en: 'After breakfast', bn: 'সকালের নাস্তার পর' },
    steps: { en: ['Sit face to face with one toy.', 'Say “My turn”, play, then say “Your turn” and hand it over.', 'Praise every wait: “Nice waiting!”'],
      bn: ['একটি খেলনা নিয়ে মুখোমুখি বসুন।', '“আমার পালা” বলে খেলুন, তারপর “তোমার পালা” বলে খেলনাটি দিন।', 'প্রতিবার অপেক্ষা করলে প্রশংসা করুন: “খুব সুন্দর অপেক্ষা করেছ!”'] },
    daily: ph({ en: '2 turns each', bn: '২ বার করে পালা' }, { en: '4 turns each', bn: '৪ বার করে পালা' }, { en: '6 turns each, then add a second toy', bn: '৬ বার করে পালা, তারপর আরেকটি খেলনা যোগ করুন' }) },
  { key: 'wait', icon: 'wait', minutes: 3, video: '/art/how-wait.mp4',
    title: { en: 'The “wait” card', bn: '“অপেক্ষা” কার্ড' }, when: { en: 'Snack time', bn: 'নাস্তার সময়' },
    steps: { en: ['Show the snack, then hold up the wait card.', 'Count aloud slowly while the child waits.', 'Give the snack straight away and praise.'],
      bn: ['নাস্তা দেখান, তারপর অপেক্ষা কার্ডটি তুলে ধরুন।', 'শিশু অপেক্ষা করার সময় ধীরে ধীরে জোরে গুনুন।', 'সাথে সাথে নাস্তা দিন এবং প্রশংসা করুন।'] },
    daily: ph({ en: 'Wait to a count of 3', bn: '৩ গোনা পর্যন্ত অপেক্ষা' }, { en: 'Wait to a count of 5', bn: '৫ গোনা পর্যন্ত অপেক্ষা' }, { en: 'Wait to a count of 10', bn: '১০ গোনা পর্যন্ত অপেক্ষা' }) },
  { key: 'sound', icon: 'sound', minutes: 3, video: '/art/how-sound.mp4',
    title: { en: 'Getting used to a sound', bn: 'শব্দের সাথে অভ্যস্ত হওয়া' }, when: { en: 'Afternoon', bn: 'বিকেলে' },
    steps: { en: ['Say “noise coming” and show the phone.', 'Play the recorded sound while the child holds a favourite toy.', 'Stop on time, even if it is going well, and praise.'],
      bn: ['“শব্দ আসছে” বলে ফোনটি দেখান।', 'শিশু প্রিয় খেলনা ধরে থাকা অবস্থায় রেকর্ড করা শব্দটি চালান।', 'ভালো চললেও ঠিক সময়ে থামুন এবং প্রশংসা করুন।'] },
    daily: ph({ en: 'Quiet volume, 10 seconds', bn: 'কম আওয়াজে ১০ সেকেন্ড' }, { en: 'Medium volume, 20 seconds', bn: 'মাঝারি আওয়াজে ২০ সেকেন্ড' }, { en: 'Normal volume, 30 seconds', bn: 'স্বাভাবিক আওয়াজে ৩০ সেকেন্ড' }) },
  { key: 'breath', icon: 'breath', minutes: 2, video: '/art/how-breath.mp4',
    title: { en: 'Smell the flower, blow the candle', bn: 'ফুলের গন্ধ নাও, মোমবাতি নেভাও' }, when: { en: 'Before bed', bn: 'ঘুমানোর আগে' },
    steps: { en: ['Hold up one finger as a flower: breathe in through the nose.', 'Hold up one finger as a candle: breathe out slowly.', 'Do it together and smile after each breath.'],
      bn: ['একটি আঙুল ফুলের মতো ধরুন: নাক দিয়ে শ্বাস নিন।', 'একটি আঙুল মোমবাতির মতো ধরুন: ধীরে শ্বাস ছাড়ুন।', 'একসাথে করুন এবং প্রতিবার শ্বাসের পর হাসুন।'] },
    daily: ph({ en: '3 breaths together', bn: 'একসাথে ৩ বার শ্বাস' }, { en: '5 breaths together', bn: 'একসাথে ৫ বার শ্বাস' }, { en: '5 breaths, and once when a little upset', bn: '৫ বার শ্বাস, এবং একটু মন খারাপ হলে একবার' }) },
  { key: 'story', icon: 'book', minutes: 4, video: '/art/how-story.mp4',
    title: { en: 'Read the social story', bn: 'সামাজিক গল্পটি পড়ুন' }, when: { en: 'Before bed', bn: 'ঘুমানোর আগে' },
    steps: { en: ['Read the story together in a calm place.', 'Point at each picture and say what is happening.', 'Act out one page together.'],
      bn: ['শান্ত জায়গায় একসাথে গল্পটি পড়ুন।', 'প্রতিটি ছবিতে আঙুল দিয়ে দেখান কী হচ্ছে।', 'একটি পাতা একসাথে অভিনয় করে দেখান।'] },
    daily: ph({ en: 'Read once, you turn the pages', bn: 'একবার পড়ুন, আপনি পাতা উল্টান' }, { en: 'Read once, the child turns the pages', bn: 'একবার পড়ুন, শিশু পাতা উল্টাবে' }, { en: 'Read once and act out one page', bn: 'একবার পড়ুন এবং একটি পাতা অভিনয় করুন' }) },
  { key: 'bubbles', icon: 'play', minutes: 5, video: '/art/how-bubbles.mp4',
    title: { en: 'Bubbles, face to face', bn: 'মুখোমুখি বাবল খেলা' }, when: { en: 'After a nap', bn: 'দুপুরের ঘুমের পর' },
    steps: { en: ['Sit at the child’s eye level with the bubbles.', 'Blow once, then pause and wait for a look.', 'When the child looks, say “More!” and blow again.'],
      bn: ['বাবল নিয়ে শিশুর চোখের সমান উচ্চতায় বসুন।', 'একবার ফুঁ দিন, তারপর থেমে তাকানোর অপেক্ষা করুন।', 'তাকালে বলুন “আরও!” এবং আবার ফুঁ দিন।'] },
    daily: ph({ en: 'Wait for 3 looks', bn: '৩ বার তাকানোর অপেক্ষা' }, { en: 'Wait for 5 looks', bn: '৫ বার তাকানোর অপেক্ষা' }, { en: '5 looks, and wait for a sound or word', bn: '৫ বার তাকানো, সাথে একটি শব্দ বা আওয়াজের অপেক্ষা' }) },
  { key: 'choice', icon: 'talk', minutes: 4, video: '/art/how-choice.mp4',
    title: { en: 'Two choices: “I want…”', bn: 'দুটি থেকে বেছে নেওয়া: “আমি চাই…”' }, when: { en: 'Snack time', bn: 'নাস্তার সময়' },
    steps: { en: ['Hold up two things the child likes.', 'Say the words for the child: “I want biscuit.”', 'Wait five seconds, then give what the child chooses.'],
      bn: ['শিশুর পছন্দের দুটি জিনিস তুলে ধরুন।', 'শিশুর হয়ে বাক্যটি বলুন: “আমি বিস্কুট চাই।”', 'পাঁচ সেকেন্ড অপেক্ষা করুন, তারপর যা বেছে নেয় তা দিন।'] },
    daily: ph({ en: 'Pointing or reaching counts', bn: 'আঙুল দিয়ে দেখালেই হবে' }, { en: 'One word: “biscuit”', bn: 'একটি শব্দ: “বিস্কুট”' }, { en: 'Two words: “want biscuit”', bn: 'দুটি শব্দ: “বিস্কুট চাই”' }) },
  { key: 'steps', icon: 'touch', minutes: 4, video: '/art/how-steps.mp4',
    title: { en: 'Picture steps for hand-washing', bn: 'ছবি দেখে হাত ধোয়া' }, when: { en: 'Before meals', bn: 'খাওয়ার আগে' },
    steps: { en: ['Stick four pictures by the tap: water, soap, rub, dry.', 'Point to each picture as the child does that step.', 'Help only where needed, and praise the finished hands.'],
      bn: ['কলের পাশে চারটি ছবি লাগান: পানি, সাবান, ঘষা, মোছা।', 'শিশু প্রতিটি ধাপ করার সময় সেই ছবিটি দেখান।', 'শুধু প্রয়োজনে সাহায্য করুন এবং শেষে প্রশংসা করুন।'] },
    daily: ph({ en: 'You help with every step', bn: 'প্রতিটি ধাপে আপনি সাহায্য করুন' }, { en: 'Help with soap only', bn: 'শুধু সাবানের ধাপে সাহায্য করুন' }, { en: 'The child does all four steps, you only point', bn: 'শিশু চারটি ধাপই করবে, আপনি শুধু ছবি দেখাবেন' }) },
];
/** The how-to video for an activity: its own, or the common one for that kind of activity. */
export const HOW_VIDEO = { ...Object.fromEntries(LIBRARY.map((x) => [x.icon, x.video])), play_kind: '/art/how-bubbles.mp4' };
/** A copy of a common activity, ready to sit in a plan. */
export function fromLibrary(key, id, goal) {
  const x = LIBRARY.find((l) => l.key === key);
  if (!x) throw new Error('That activity is not in the library.');
  const { key: lib, ...rest } = structuredClone(x);
  return { id, goal, lib, ...rest };
}
/** Three growing targets, as the AI or a form sends them, tidied into the plan's shape. Empty when they are missing. */
export function dailyFrom(list) {
  const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 90);
  const rows = (Array.isArray(list) ? list : []).slice(0, 3).map((d) => ({ en: clean(d?.en), bn: clean(d?.bn) })).filter((d) => d.en);
  return rows.length === 3 ? ph(...rows) : null;
}
/** An empty story, for a plan built by hand from common activities. */
export const noStory = () => ({ title: { en: '', bn: '' }, sheet: null, sheetStatus: 'none', cols: 3, rows: 2, pages: [] });

export function seed({ barberSheet = false } = {}) {
  const iso = (n, h, m) => {
    const d = daysAgo(n);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const rafiPlan = {
    id: 'plan-rafi-1',
    childId: 'rafi',
    createdAt: iso(6, 9, 10),
    approvedAt: iso(6, 9, 14),
    status: 'approved',
    source: 'sample',
    model: 'Prepared sample',
    goals: [
      { id: 'g1', text: 'Wait for his turn during play' },
      { id: 'g2', text: 'Tolerate the sound of the hair clipper before his haircut' },
    ],
    activities: [
      {
        id: 'a1',
        goal: 'g1',
        icon: 'turn',
        daily: ph({ en: '2 turns each with the train', bn: 'ট্রেন নিয়ে ২ বার করে পালা' }, { en: '4 turns each with the train', bn: 'ট্রেন নিয়ে ৪ বার করে পালা' }, { en: '6 turns each, then add his cars', bn: '৬ বার করে পালা, তারপর গাড়িগুলো যোগ করুন' }),
        minutes: 5,
        title: { en: 'Turn-taking with the train', bn: 'ট্রেন নিয়ে পালা করে খেলা' },
        when: { en: 'After breakfast', bn: 'সকালের নাস্তার পর' },
        steps: {
          en: [
            'Sit with Rafi and one toy train.',
            'Say “My turn”, roll the train, then say “Rafi’s turn” and give it to him.',
            'Praise him each time he waits: “Nice waiting!”',
          ],
          bn: [
            'রাফির সাথে একটি খেলনা ট্রেন নিয়ে বসুন।',
            '“আমার পালা” বলে ট্রেন চালান, তারপর “রাফির পালা” বলে ওকে দিন।',
            'প্রতিবার অপেক্ষা করলে প্রশংসা করুন: “খুব সুন্দর অপেক্ষা করেছ!”',
          ],
        },
      },
      {
        id: 'a2',
        goal: 'g1',
        icon: 'wait',
        daily: ph({ en: 'Wait to a count of 3', bn: '৩ গোনা পর্যন্ত অপেক্ষা' }, { en: 'Wait to a count of 5', bn: '৫ গোনা পর্যন্ত অপেক্ষা' }, { en: 'Wait to a count of 7', bn: '৭ গোনা পর্যন্ত অপেক্ষা' }),
        minutes: 3,
        title: { en: 'The “wait” card at snack time', bn: 'নাস্তার সময় “অপেক্ষা” কার্ড' },
        when: { en: 'Snack time', bn: 'নাস্তার সময়' },
        steps: {
          en: [
            'Show the wait card and count slowly to 5 before giving the snack.',
            'Add one more count every two days.',
            'Give the snack with a smile as soon as the count ends.',
          ],
          bn: [
            '“অপেক্ষা” কার্ড দেখিয়ে নাস্তা দেওয়ার আগে ধীরে ধীরে ৫ পর্যন্ত গুনুন।',
            'প্রতি দুই দিন পর গোনা এক করে বাড়ান।',
            'গোনা শেষ হলেই হাসিমুখে নাস্তা দিন।',
          ],
        },
      },
      {
        id: 'a3',
        goal: 'g2',
        icon: 'sound',
        daily: ph({ en: 'Clipper sound, quiet volume, 10 seconds', bn: 'ক্লিপারের শব্দ কম আওয়াজে ১০ সেকেন্ড' }, { en: 'Clipper sound, medium volume, 20 seconds', bn: 'ক্লিপারের শব্দ মাঝারি আওয়াজে ২০ সেকেন্ড' }, { en: 'The real clipper switched on across the room, 20 seconds', bn: 'আসল ক্লিপার ঘরের অন্য পাশে চালু রেখে ২০ সেকেন্ড' }),
        minutes: 5,
        title: { en: 'Clipper sound, little by little', bn: 'অল্প অল্প করে ক্লিপারের শব্দ' },
        when: { en: 'Evening play', bn: 'বিকেলের খেলার সময়' },
        steps: {
          en: [
            'While Rafi plays, play a hair clipper sound on your phone, very quietly, for 10 seconds.',
            'If he stays calm, praise him and make it a little louder the next day.',
            'If he is upset, stop, comfort him, and try again more quietly tomorrow.',
          ],
          bn: [
            'রাফি খেলার সময় ফোনে খুব কম আওয়াজে ১০ সেকেন্ড চুল কাটার মেশিনের শব্দ চালান।',
            'শান্ত থাকলে প্রশংসা করুন, পরদিন আওয়াজ একটু বাড়ান।',
            'অস্থির হলে বন্ধ করুন, আদর করুন, পরদিন আরও কম আওয়াজে চেষ্টা করুন।',
          ],
        },
      },
      {
        id: 'a4',
        goal: 'g2',
        icon: 'book',
        daily: ph({ en: 'Read once, Ma turns the pages', bn: 'একবার পড়ুন, মা পাতা উল্টাবেন' }, { en: 'Read once, Rafi turns the pages', bn: 'একবার পড়ুন, রাফি পাতা উল্টাবে' }, { en: 'Read once and practise the deep breath on page 4', bn: 'একবার পড়ুন এবং ৪ নম্বর পাতার লম্বা শ্বাস অনুশীলন করুন' }),
        minutes: 5,
        title: { en: 'Read the barber story', bn: 'সেলুনের গল্পটি পড়ুন' },
        when: { en: 'Before bed', bn: 'ঘুমানোর আগে' },
        steps: {
          en: [
            'Read “Rafi goes to the barber” together once a day.',
            'Point at each picture and say what Rafi is doing.',
            'Practise the slow, deep breath on page 4 together.',
          ],
          bn: [
            'প্রতিদিন একবার একসাথে “রাফি চুল কাটতে যায়” গল্পটি পড়ুন।',
            'প্রতিটি ছবিতে আঙুল দিয়ে দেখান রাফি কী করছে।',
            '৪ নম্বর পাতার লম্বা শ্বাস নেওয়া একসাথে অনুশীলন করুন।',
          ],
        },
      },
    ],
    story: {
      title: { en: 'Rafi goes to the barber', bn: 'রাফি চুল কাটতে যায়' },
      sheet: barberSheet ? '/art/story-barber.png' : null,
      sheetStatus: barberSheet ? 'ready' : 'none',
      cols: 3,
      rows: 2,
      pages: [
        {
          en: 'Rafi’s hair has grown long. Today Rafi is going to the barber with Ma.',
          bn: 'রাফির চুল বড় হয়ে গেছে। আজ রাফি মায়ের সাথে চুল কাটতে যাবে।',
        },
        {
          en: 'At the barbershop, other people are first. Rafi sits with his train and waits for his turn.',
          bn: 'সেলুনে আগে অন্যদের পালা। রাফি তার ট্রেন নিয়ে বসে নিজের পালার জন্য অপেক্ষা করে।',
        },
        {
          en: 'Now it is Rafi’s turn. He sits in the big chair. The barber puts a soft cape on him.',
          bn: 'এবার রাফির পালা। রাফি বড় চেয়ারে বসে। নাপিত চাচা ওর গায়ে একটি নরম কাপড় জড়িয়ে দেন।',
        },
        {
          en: 'The clipper makes a buzzing sound. It is only a sound. Rafi holds his train and takes a slow, deep breath.',
          bn: 'মেশিনটা ভোঁ ভোঁ শব্দ করে। এটা শুধুই একটা শব্দ। রাফি ট্রেনটা ধরে ধীরে ধীরে লম্বা শ্বাস নেয়।',
        },
        {
          en: 'The barber cuts Rafi’s hair. It tickles a little. Rafi sits still. Ma is right beside him.',
          bn: 'নাপিত চাচা রাফির চুল কাটেন। একটু সুড়সুড়ি লাগে। রাফি চুপ করে বসে থাকে। মা পাশেই আছেন।',
        },
        {
          en: 'All done! Rafi looks in the mirror. His hair looks nice. Ma is proud, and Rafi is proud too.',
          bn: 'শেষ! রাফি আয়নায় দেখে। চুল খুব সুন্দর লাগছে। মা খুশি, রাফিও খুব খুশি।',
        },
      ],
    },
  };

  const note = (n, h, m, o) => ({
    id: `log-rafi-${n}`,
    childId: 'rafi',
    date: dayKey(daysAgo(n)),
    at: iso(n, h, m),
    lang: 'bn',
    audio: null,
    analysed: true,
    source: 'sample',
    ...o,
  });

  const logs = [
    note(6, 20, 40, {
      text: 'আজ ট্রেন নিয়ে পালা করে খেলেছি। দুইবার অপেক্ষা করেছে, তৃতীয়বারে ট্রেন কেড়ে নিয়েছে। রাতে ভালো ঘুমিয়েছে।',
      en: 'We played turn-taking with the train today. He waited twice, then grabbed the train on the third turn. He slept well at night.',
      audio: '/art/note-voice-rafi-1.m4a',
      wins: ['Waited for 2 turns'],
      struggles: ['Grabbed the train on the 3rd turn'],
      triggers: [],
      mood: 'mixed',
      sleep: 'good',
    }),
    note(5, 21, 5, {
      text: 'সকালে ব্লেন্ডার চালাতেই কান চেপে ধরে খুব কেঁদেছে, শান্ত হতে প্রায় দশ মিনিট লেগেছে। নাস্তার সময় পাঁচ পর্যন্ত গোনা পর্যন্ত অপেক্ষা করেছে।',
      en: 'When I turned on the blender this morning he covered his ears and cried a lot; it took about ten minutes to calm him. At snack time he waited until the count of five.',
      media: [{ kind: 'photo', url: '/art/note-waitcard.svg' }],
      wins: ['Waited to a count of 5 at snack time'],
      struggles: ['Cried for about 10 minutes'],
      triggers: ['Blender noise'],
      mood: 'hard',
      sleep: 'unknown',
    }),
    note(3, 20, 15, {
      text: 'কাল রাতে দেরিতে ঘুমিয়েছে, আজ সারাদিন খিটখিটে ছিল। পালা করে খেলতে চায়নি। ক্লিপারের শব্দ কম আওয়াজে চালিয়েছি, কান ঢেকেছে কিন্তু কাঁদেনি।',
      en: 'He fell asleep late last night and was irritable all day. He did not want to take turns. I played the clipper sound quietly; he covered his ears but did not cry.',
      wins: ['Heard the clipper sound without crying'],
      struggles: ['Refused turn-taking', 'Irritable all day'],
      triggers: ['Late night'],
      mood: 'hard',
      sleep: 'poor',
    }),
    note(2, 19, 50, {
      text: 'আজ খুব ভালো দিন। গল্পটা দুইবার পড়তে চেয়েছে, ছবিতে নিজেকে দেখিয়ে হেসেছে। ট্রেন খেলায় চারবার অপেক্ষা করেছে।',
      en: 'A very good day. He asked to read the story twice and laughed, pointing at himself in the pictures. He waited four times in the train game.',
      audio: '/art/note-voice-rafi-2.m4a',
      wins: ['Waited for 4 turns', 'Asked for the story twice'],
      struggles: [],
      triggers: [],
      mood: 'good',
      sleep: 'good',
    }),
    note(1, 20, 30, {
      text: 'পাশের বাসায় ড্রিল মেশিনের শব্দে ভয় পেয়ে কেঁদেছে। পরে ক্লিপারের শব্দ মাঝারি আওয়াজে বিশ সেকেন্ড শুনেছে, ট্রেন ধরে লম্বা শ্বাস নিয়েছে। নাস্তার সময় সাত পর্যন্ত অপেক্ষা করেছে।',
      en: 'He was frightened and cried at the sound of a drill next door. Later he listened to the clipper sound at medium volume for twenty seconds, holding his train and taking a deep breath. At snack time he waited to a count of seven.',
      media: [{ kind: 'video', url: '/art/note-video-train.mp4' }],
      wins: ['20 seconds of clipper sound at medium volume', 'Waited to a count of 7'],
      struggles: ['Cried at a sudden noise'],
      triggers: ['Drill noise next door'],
      mood: 'mixed',
      sleep: 'unknown',
    }),
  ];

  const summary = {
    childId: 'rafi',
    generatedAt: iso(0, 7, 30),
    notesCount: 5,
    source: 'sample',
    model: 'Prepared sample',
    headline: 'Waiting for his turn is clearly improving. Sudden loud noises are still the main trigger.',
    goals: [
      {
        goal: 'Wait for his turn during play',
        status: 'improving',
        evidence: 'Waited for 2 turns at the start of the week and 4 turns by day five. The snack-time wait grew from a count of 5 to 7.',
      },
      {
        goal: 'Tolerate the sound of the hair clipper before his haircut',
        status: 'improving',
        evidence: 'Moved from quiet volume with his ears covered to 20 seconds at medium volume, using his train and the deep breath from the story.',
      },
    ],
    patterns: [
      {
        title: 'Sudden noise leads to crying',
        days: 2,
        detail: 'The blender and a neighbour’s drill both caused crying. The planned, gradual clipper sound did not.',
      },
      {
        title: 'A late night leads to a hard day',
        days: 1,
        detail: 'After falling asleep late he was irritable and refused turn-taking the next day.',
      },
      {
        title: 'The story is being used',
        days: 2,
        detail: 'He asked for the story twice in one day and copied the deep breath from page 4.',
      },
    ],
    suggestions: [
      'Extend turn-taking to a second toy, or to a sibling or cousin.',
      'Before the haircut, try the real clipper switched on across the room.',
      'Add a short warning routine before household noise, such as “noise coming”.',
    ],
    askParent: [
      'What time does he fall asleep on the late nights?',
      'Does he react differently to noise when he is warned first?',
    ],
    parentMessage: {
      en: 'A lovely week, Nusrat. Rafi is waiting a little longer every day. Keep the clipper sound short and calm.',
      bn: 'দারুণ একটি সপ্তাহ, নুসরাত। রাফি প্রতিদিন একটু বেশি অপেক্ষা করতে পারছে। ক্লিপারের শব্দ অল্প সময় ও শান্তভাবে চালিয়ে যান।',
    },
    parentMessageSent: true,
  };

  const more = moreFamilies(iso);

  return {
    rev: 1,
    centre: { name: 'Shishu Bikash Therapy Centre', city: 'Dhaka' },
    therapist: { name: 'Dr. Farhana Rahman', short: 'Dr. Farhana' },
    children: [
      {
        id: 'rafi',
        name: 'Rafi',
        name_bn: 'রাফি',
        age: 5,
        parent: 'Nusrat',
        lang: 'bn',
        sessions: '2 sessions a week',
        likes: 'toy trains, water play',
        sensitivities: 'sudden loud noises',
        look: 'a 5-year-old Bangladeshi boy with warm brown skin and short black hair, wearing a plain yellow t-shirt and blue shorts, often holding a small red toy train',
        family: 'his mother, a Bangladeshi woman with a long black braid wearing a teal salwar kameez',
        tint: 'lime',
        gender: 'boy',
        profile: pf('2', 'asd', '2024-05', ['speech'], 'phrases', 'simple', 'yes', ['sound'], ['spinning'], 'holding his red toy train and slow, deep breaths', { meltdowns: 'moderate', sleep: 'mild' }, ['ind', 'help', 'help', 'help'], ['speech', 'ot'], 3),
        shared: { at: iso(6, 9, 20), likes: 'toy trains, water play', profile: pf('2', 'asd', '2024-05', ['speech'], 'phrases', 'simple', 'yes', ['sound'], ['spinning'], 'holding his red toy train and slow, deep breaths', { meltdowns: 'moderate', sleep: 'mild' }, ['ind', 'help', 'help', 'help'], ['speech', 'ot'], 3) },
      },
      {
        id: 'ayaan',
        name: 'Ayaan',
        name_bn: 'আয়ান',
        age: 6,
        parent: 'Tahmina',
        lang: 'bn',
        sessions: '1 session a week',
        likes: 'drawing, building blocks',
        sensitivities: 'crowded places',
        look: 'a 6-year-old Bangladeshi boy with warm brown skin and curly black hair, wearing a green t-shirt and grey trousers',
        family: 'his mother, a Bangladeshi woman wearing a soft pink sari',
        tint: 'teal',
        gender: 'boy',
        profile: pf('1', 'asd', '2023-09', ['anxiety'], 'sentences', 'most', 'no', ['crowds', 'sound'], [], 'drawing quietly', { repetitive: 'mild' }, ['ind', 'ind', 'ind', 'help'], ['sped'], 5),
      },
      {
        id: 'mehjabin',
        name: 'Mehjabin',
        name_bn: 'মেহজাবিন',
        age: 4,
        parent: 'Imran',
        lang: 'bn',
        sessions: '3 sessions a week',
        likes: 'songs, soft toys',
        sensitivities: 'changes in routine',
        look: 'a 4-year-old Bangladeshi girl with warm brown skin and two short black pigtails, wearing a light orange frock',
        family: 'her father, a Bangladeshi man with glasses wearing a white shirt',
        tint: 'sun',
        gender: 'girl',
        profile: pf('na', 'asd', '', ['speech'], 'minimal', 'simple', 'yes', ['touch'], ['chewing'], 'her soft toy and a song', { meltdowns: 'moderate', toilet: 'moderate' }, ['help', 'help', 'dep', 'help'], ['speech'], 2),
      },
      ...more.children,
    ],
    plans: [rafiPlan, ...more.plans],
    logs: [...logs, ...more.logs],
    done: [
      [0, 'a1'],
      [1, 'a1'], [1, 'a2'], [1, 'a3'], [1, 'a4'],
      [2, 'a1'], [2, 'a2'], [2, 'a4'],
      [3, 'a3'],
      [4, 'a2'], [4, 'a4'],
      [5, 'a1'], [5, 'a2'],
      [6, 'a1'], [6, 'a4'],
    ].map(([n, activityId]) => ({ childId: 'rafi', date: dayKey(daysAgo(n)), activityId })).concat(more.done),
    summaries: { rafi: summary, ...more.summaries },
    progress: (() => { const p = progressSample([rafiPlan, ...more.plans]); p.rafi.shared = { date: dayKey(daysAgo(4)), at: iso(4, 18, 0), goals: rafiPlan.goals.map((g) => ({ text: g.text, level: 0 })), message: { en: 'Rafi has reached what we hoped for on both goals. Please keep the same routine this week.', bn: 'রাফি দুটি লক্ষ্যেই আমাদের প্রত্যাশা অনুযায়ী এগিয়েছে। এই সপ্তাহে একই রুটিন চালিয়ে যান।' } }; return p; })(),
    aiLog: [
      {
        id: 'ai-seed-1',
        at: iso(6, 9, 10),
        step: 'Home plan and story',
        child: 'Rafi',
        model: 'Prepared sample',
        check: 'Approved by Dr. Farhana before the parent saw it',
        status: 'approved',
        planId: 'plan-rafi-1',
      },
      {
        id: 'ai-seed-2',
        at: iso(0, 7, 30),
        step: 'Weekly summary',
        child: 'Rafi',
        model: 'Prepared sample',
        check: 'Read by the therapist, never sent to the parent as advice',
        status: 'info',
      },
    ],
  };
}

// ---------- prepared samples ----------
// Used only when no AI is connected (the browser-only preview). The app labels them "Prepared sample".

/** Seven more sample families, so the doctor's list looks like a real caseload. All invented. */
const pf = (level, dxType, dxDate, co, speech, understands, aac, sensitive, seeking, calming, behaviours, daily, therapies, hours) =>
  ({ level, dxType, dxDate, co, speech, understands, aac, sensitive, seeking, calming, behaviours, daily: Object.fromEntries(['eating', 'dressing', 'toileting', 'routines'].map((k, i) => [k, daily[i]])), therapies, hours });

function moreFamilies(iso) {
  const kid = (id, name, name_bn, age, gender, parent, sessions, likes, sensitivities, tint, profile) => ({ id, name, name_bn, age, gender, parent, lang: 'bn', sessions, likes, sensitivities, tint, profile, look: `a ${age}-year-old Bangladeshi ${gender}`, family: 'a parent' });
  const children = [
    kid('tasnim', 'Tasnim', 'তাসনিম', 7, 'girl', 'Shirin', '2 sessions a week', 'colouring, hide and seek', 'scratchy clothes', 'rose',
      pf('1', 'asd', '2023-03', ['anxiety'], 'sentences', 'most', 'no', ['touch'], [], 'a quiet corner and her colouring book', { repetitive: 'mild' }, ['ind', 'help', 'ind', 'help'], ['ot', 'sped'], 4)),
    kid('arib', 'Arib', 'আরিব', 5, 'boy', 'Sadia', '1 session a week', 'toy cars, bubbles', 'bright lights', 'teal',
      pf('2', 'asd', '2024-08', ['speech'], 'minimal', 'simple', 'yes', ['light'], ['spinning'], 'lining up his cars', { meltdowns: 'mild', screen: 'moderate' }, ['help', 'help', 'help', 'help'], ['speech'], 3)),
    kid('nabila', 'Nabila', 'নাবিলা', 6, 'girl', 'Rokeya', '2 sessions a week', 'dolls, rhymes', 'having her hair brushed', 'sun',
      pf('2', 'asd', '2023-11', ['anxiety', 'speech'], 'phrases', 'simple', 'no', ['touch', 'sound'], ['chewing'], 'slow breathing and holding her doll', { meltdowns: 'severe', sleep: 'moderate' }, ['ind', 'help', 'help', 'help'], ['ot', 'speech'], 4)),
    kid('zayan', 'Zayan', 'জায়ান', 4, 'boy', 'Farid', '3 sessions a week', 'balls, jumping', 'new foods', 'lime',
      pf('3', 'asd', '2025-02', ['adhd', 'speech'], 'nonverbal', 'notyet', 'yes', ['taste', 'smell'], ['jumping', 'touching'], 'jumping on a cushion', { feeding: 'severe', running: 'moderate', toilet: 'moderate' }, ['help', 'dep', 'dep', 'dep'], ['speech', 'ot', 'aba'], 2)),
    kid('ishrat', 'Ishrat', 'ইশরাত', 8, 'girl', 'Mahmuda', '1 session a week', 'puzzles, cats', 'being rushed', 'violet',
      pf('1', 'asperger', '2022-06', ['anxiety'], 'sentences', 'most', 'no', ['crowds'], [], 'time alone with a puzzle', { meltdowns: 'mild', repetitive: 'mild' }, ['ind', 'ind', 'ind', 'help'], ['sped'], 5)),
    kid('samir', 'Samir', 'সামির', 7, 'boy', 'Kamal', '2 sessions a week', 'cricket, picture books', 'loud classrooms', 'teal',
      pf('1', 'asd', '2023-01', ['adhd'], 'sentences', 'most', 'no', ['sound', 'crowds'], ['jumping'], 'his picture book in a quiet corner', { screen: 'mild' }, ['ind', 'ind', 'ind', 'help'], ['ot', 'sped'], 5)),
    kid('lamia', 'Lamia', 'লামিয়া', 5, 'girl', 'Jannat', '2 sessions a week', 'singing, sand play', 'wet hands', 'rose',
      pf('2', 'pddnos', '2024-04', ['none'], 'phrases', 'simple', 'yes', ['touch'], ['touching'], 'singing her favourite song', { toilet: 'moderate', feeding: 'mild' }, ['help', 'help', 'help', 'ind'], ['ot'], 3)),
  ];
  const act = (icon, minutes, en, bn, whenEn, whenBn, stepsEn, stepsBn, d = []) => ({ icon, minutes, title: { en, bn }, when: { en: whenEn, bn: whenBn }, steps: { en: stepsEn, bn: stepsBn }, ...(d.length ? { daily: ph(...d.map((x) => ({ en: x, bn: x }))) } : {}) });
  const plan = (cid, age, status, goals, acts, storyEn, storyBn, pages) => ({
    id: `plan-${cid}-1`, childId: cid, createdAt: iso(age, 15, 20), ...(status === 'approved' ? { approvedAt: iso(age, 15, 40) } : {}), status, source: 'sample', model: 'Prepared sample',
    goals: goals.map((text, i) => ({ id: `g${i + 1}`, text })),
    activities: acts.map((a, i) => ({ id: `plan-${cid}-1-a${i + 1}`, goal: `g${Math.min(i + 1, goals.length)}`, ...a })),
    story: { title: { en: storyEn, bn: storyBn }, sheet: null, sheetStatus: 'none', cols: 2, rows: 2, pages: pages.map(([en, bn]) => ({ en, bn })) },
  });
  const plans = [
    plan('tasnim', 9, 'approved', ['Get dressed for school with less help', 'Say what she needs in a short sentence'], [
      act('dress', 6, 'Two-choice dressing', 'দুটি থেকে বেছে পোশাক পরা', 'Before school', 'স্কুলে যাওয়ার আগে',
        ['Lay out two soft outfits and let Tasnim pick one.', 'Hand her one piece at a time and name it.', 'Praise each piece she puts on herself.'],
        ['দুটি নরম পোশাক সামনে রাখুন, তাসনিমকে একটি বেছে নিতে দিন।', 'একটি একটি করে পোশাক হাতে দিন এবং নাম বলুন।', 'নিজে পরলে প্রতিবার প্রশংসা করুন।'], ['She picks the outfit, you dress her', 'She puts on the dress herself', 'Dress and socks herself']),
      act('talk', 4, '“I want…” at snack time', 'নাস্তার সময় “আমি চাই…”', 'Afternoon snack', 'বিকেলের নাস্তায়',
        ['Hold up two snacks.', 'Model the sentence: “I want biscuit.”', 'Wait five seconds, then give what she asks for.'],
        ['দুটি নাস্তা তুলে ধরুন।', 'বাক্যটি বলে দেখান: “আমি বিস্কুট চাই।”', 'পাঁচ সেকেন্ড অপেক্ষা করুন, তারপর যা চায় তা দিন।'], ['Pointing counts', 'One word: “biscuit”', 'Full sentence: “I want biscuit”']),
    ], 'Tasnim gets ready for school', 'তাসনিম স্কুলের জন্য তৈরি হয়', [
      ['It is morning. Tasnim wakes up. Today is a school day.', 'সকাল হয়েছে। তাসনিম ঘুম থেকে ওঠে। আজ স্কুলের দিন।'],
      ['Ma shows two dresses. Tasnim picks the blue one.', 'মা দুটি জামা দেখান। তাসনিম নীলটি বেছে নেয়।'],
      ['Tasnim puts on her dress, then her socks. She does it herself.', 'তাসনিম জামা পরে, তারপর মোজা। সে নিজেই পরে।'],
      ['All ready! Ma smiles. Tasnim is proud.', 'সব তৈরি! মা হাসেন। তাসনিম খুব খুশি।'],
    ]),
    plan('arib', 8, 'approved', ['Look at a person’s face when asking for something', 'Play beside another child for five minutes'], [
      act('play_kind', 5, 'Bubbles, face to face', 'মুখোমুখি বাবল খেলা', 'After his nap', 'দুপুরের ঘুমের পর',
        ['Sit at Arib’s eye level with the bubbles.', 'Blow once, then pause and wait for him to look at you.', 'When he looks, say “More!” and blow again.'],
        ['বাবল নিয়ে আরিবের চোখের সমান উচ্চতায় বসুন।', 'একবার ফুঁ দিন, তারপর থেমে ওর তাকানোর অপেক্ষা করুন।', 'তাকালে বলুন “আরও!” এবং আবার ফুঁ দিন।'], ['Wait for 3 looks', 'Wait for 5 looks', '5 looks and a sound or word']),
      act('turn', 5, 'Cars side by side', 'পাশাপাশি গাড়ি খেলা', 'Evening', 'সন্ধ্যায়',
        ['Give Arib and his cousin two cars each.', 'Let them play next to each other without sharing yet.', 'Praise calm playing every minute.'],
        ['আরিব ও ওর ভাইকে দুটি করে গাড়ি দিন।', 'ভাগাভাগি ছাড়াই পাশাপাশি খেলতে দিন।', 'প্রতি মিনিটে শান্তভাবে খেলার প্রশংসা করুন।'], ['2 minutes side by side', '3 minutes side by side', '5 minutes, roll one car to his cousin']),
    ], 'Arib plays with his cousin', 'আরিব ভাইয়ের সাথে খেলে', [
      ['Arib’s cousin comes to visit. He brings his cars.', 'আরিবের ভাই বেড়াতে আসে। সে তার গাড়ি নিয়ে আসে।'],
      ['Arib has his cars too. They sit on the mat together.', 'আরিবেরও গাড়ি আছে। দুজনে মাদুরে একসাথে বসে।'],
      ['Arib rolls his car. His cousin rolls his car. Vroom!', 'আরিব গাড়ি চালায়। ভাইও গাড়ি চালায়। ভুম!'],
      ['Playing together is fun. Arib smiles.', 'একসাথে খেলা মজার। আরিব হাসে।'],
    ]),
    plan('nabila', 12, 'approved', ['Accept hair brushing for one minute', 'Calm down with a breathing routine'], [
      act('touch', 3, 'Brush the doll, then Nabila', 'আগে পুতুল, পরে নাবিলা', 'After her bath', 'গোসলের পর',
        ['Let Nabila brush her doll’s hair first.', 'Brush her hair for a slow count of ten.', 'Stop at ten every time, even if it is going well.'],
        ['আগে নাবিলাকে পুতুলের চুল আঁচড়াতে দিন।', 'ধীরে দশ গোনা পর্যন্ত ওর চুল আঁচড়ান।', 'ভালো চললেও প্রতিবার দশে থামুন।'], ['Brush to a count of 5', 'Brush to a count of 10', 'Brush for one minute']),
      act('breath', 2, 'Smell the flower, blow the candle', 'ফুলের গন্ধ নাও, মোমবাতি নেভাও', 'When she is upset', 'মন খারাপ হলে',
        ['Hold up one finger as a flower: breathe in.', 'Hold up one finger as a candle: breathe out.', 'Do it three times together.'],
        ['একটি আঙুল ফুলের মতো ধরুন: শ্বাস নিন।', 'একটি আঙুল মোমবাতির মতো ধরুন: শ্বাস ছাড়ুন।', 'একসাথে তিনবার করুন।'], ['3 breaths when calm', '5 breaths when calm', 'Try once when she is upset']),
    ], 'Nabila brushes her hair', 'নাবিলা চুল আঁচড়ায়', [
      ['Nabila has had her bath. Her hair is wet.', 'নাবিলার গোসল শেষ। ওর চুল ভেজা।'],
      ['First Nabila brushes her doll’s hair. Gently, gently.', 'আগে নাবিলা পুতুলের চুল আঁচড়ায়। আস্তে, আস্তে।'],
      ['Now Ma brushes Nabila’s hair. One, two, three… ten!', 'এবার মা নাবিলার চুল আঁচড়ান। এক, দুই, তিন… দশ!'],
      ['All done. Nabila’s hair is neat. She did it!', 'শেষ। নাবিলার চুল সুন্দর। সে পেরেছে!'],
    ]),
    plan('zayan', 10, 'approved', ['Try one new food each week', 'Sit at the table for five minutes'], [
      act('food', 5, 'One tiny taste', 'একটু চেখে দেখা', 'Lunch', 'দুপুরের খাবারে',
        ['Put one small piece of a new food beside his favourite food.', 'He may touch, smell or lick it. Any of these is a win.', 'Never force a bite.'],
        ['প্রিয় খাবারের পাশে নতুন খাবারের একটি ছোট টুকরা রাখুন।', 'সে ছুঁতে, শুঁকতে বা চাটতে পারে। সবই সাফল্য।', 'কখনো জোর করবেন না।'], ['Touch the new food', 'Smell or lick it', 'One tiny bite']),
      act('wait', 5, 'Sand timer at the table', 'টেবিলে বালুঘড়ি', 'Dinner', 'রাতের খাবারে',
        ['Turn the sand timer when Zayan sits down.', 'He stays until the sand runs out.', 'Then he may jump ten times as a reward.'],
        ['জায়ান বসলে বালুঘড়ি উল্টে দিন।', 'বালু শেষ না হওয়া পর্যন্ত সে বসে থাকবে।', 'তারপর পুরস্কার হিসেবে দশবার লাফাতে পারবে।'], ['Sit for 2 minutes', 'Sit for 3 minutes', 'Sit for 5 minutes']),
    ], 'Zayan tries a new food', 'জায়ান নতুন খাবার চেখে দেখে', [
      ['It is lunch time. Zayan sits at the table.', 'দুপুরের খাবারের সময়। জায়ান টেবিলে বসে।'],
      ['There is rice, and one small piece of carrot.', 'ভাত আছে, আর এক টুকরা ছোট গাজর।'],
      ['Zayan touches the carrot. He smells it. That is brave.', 'জায়ান গাজরটা ছোঁয়। গন্ধ নেয়। খুব সাহসী কাজ।'],
      ['Baba claps. Zayan can jump now!', 'বাবা হাততালি দেন। জায়ান এখন লাফাতে পারে!'],
    ]),
    plan('ishrat', 0, 'draft', ['Move from one activity to the next without distress', 'Ask for a break in words'], [
      act('wait', 3, 'Two-minute warning', 'দুই মিনিট আগে জানানো', 'Before any change', 'যেকোনো পরিবর্তনের আগে',
        ['Tell Ishrat: “Two more minutes, then dinner.”', 'Show two fingers, then one.', 'Praise her when she moves on calmly.'],
        ['ইশরাতকে বলুন: “আর দুই মিনিট, তারপর খাবার।”', 'দুটি আঙুল দেখান, তারপর একটি।', 'শান্তভাবে উঠলে প্রশংসা করুন।'], ['Warning before dinner only', 'Warning before dinner and bath', 'Warning before every change']),
      act('talk', 3, 'The break card', 'বিরতির কার্ড', 'Homework time', 'পড়ার সময়',
        ['Put a “break” card on the table.', 'When she is restless, point to it and say “Break, please.”', 'Give a two-minute break every time she asks.'],
        ['টেবিলে একটি “বিরতি” কার্ড রাখুন।', 'অস্থির হলে কার্ড দেখিয়ে বলুন “বিরতি চাই।”', 'চাইলে প্রতিবার দুই মিনিট বিরতি দিন।'], ['You point to the card for her', 'She points to the card', 'She says “Break, please”']),
    ], 'Ishrat and the two-minute warning', 'ইশরাত ও দুই মিনিটের সংকেত', [
      ['Ishrat is doing her puzzle. She loves puzzles.', 'ইশরাত পাজল মেলাচ্ছে। সে পাজল খুব ভালোবাসে।'],
      ['Ma says: “Two more minutes, then dinner.”', 'মা বলেন: “আর দুই মিনিট, তারপর খাবার।”'],
      ['Ishrat puts in one more piece. The puzzle can wait.', 'ইশরাত আরও একটি টুকরা বসায়। পাজল অপেক্ষা করতে পারে।'],
      ['Ishrat goes to dinner. After dinner, more puzzle!', 'ইশরাত খেতে যায়। খাওয়ার পর আবার পাজল!'],
    ]),
    plan('samir', 11, 'approved', ['Follow a two-step instruction', 'Stay calm in a noisy room'], [
      act('sound', 4, 'Two steps, one game', 'দুই ধাপের খেলা', 'After school', 'স্কুলের পর',
        ['Give two steps together: “Get the ball, then sit down.”', 'Use the same words each time.', 'Cheer when both steps are done.'],
        ['দুটি ধাপ একসাথে বলুন: “বল আনো, তারপর বসো।”', 'প্রতিবার একই শব্দ ব্যবহার করুন।', 'দুই ধাপ শেষ হলে বাহবা দিন।'], ['One step at a time', 'Two steps with a pause', 'Two steps said together']),
      act('breath', 3, 'Quiet corner', 'শান্ত কোণ', 'When it is noisy', 'শব্দ বেশি হলে',
        ['Make a corner with a cushion and his picture book.', 'When the room is loud, walk there together.', 'Stay two minutes, then come back.'],
        ['একটি বালিশ ও ওর ছবির বই দিয়ে একটি কোণ সাজান।', 'ঘরে শব্দ বেশি হলে একসাথে সেখানে যান।', 'দুই মিনিট থাকুন, তারপর ফিরে আসুন।'], ['Go together when it is calm', 'Go together when it is loud', 'He goes by himself']),
    ], 'Samir finds his quiet corner', 'সামিরের শান্ত কোণ', [
      ['Guests have come. The room is loud.', 'বাড়িতে মেহমান এসেছে। ঘরে অনেক শব্দ।'],
      ['Samir’s ears feel full. He tells Baba.', 'সামিরের কানে কষ্ট হয়। সে বাবাকে বলে।'],
      ['They go to the quiet corner. Samir opens his book.', 'ওরা শান্ত কোণে যায়। সামির বই খোলে।'],
      ['Samir feels better. He goes back to say hello.', 'সামিরের ভালো লাগে। সে ফিরে গিয়ে সালাম দেয়।'],
    ]),
    plan('lamia', 9, 'approved', ['Wash her hands with picture steps', 'Touch wet and sticky things in play'], [
      act('touch', 4, 'Hand-washing pictures', 'ছবি দেখে হাত ধোয়া', 'Before meals', 'খাওয়ার আগে',
        ['Stick four pictures by the tap: water, soap, rub, dry.', 'Point to each picture as Lamia does it.', 'Sing her favourite song while she rubs.'],
        ['কলের পাশে চারটি ছবি লাগান: পানি, সাবান, ঘষা, মোছা।', 'লামিয়া করার সময় প্রতিটি ছবি দেখান।', 'হাত ঘষার সময় ওর প্রিয় গান গেয়ে শোনান।'], ['You help with every step', 'Help with soap only', 'She does all four steps']),
      act('play_kind', 5, 'Wet sand play', 'ভেজা বালু নিয়ে খেলা', 'Afternoon', 'বিকেলে',
        ['Start with dry sand in a tray.', 'Add a little water each day.', 'Keep a towel beside her so she can wipe any time.'],
        ['ট্রেতে শুকনো বালু দিয়ে শুরু করুন।', 'প্রতিদিন একটু করে পানি মেশান।', 'পাশে তোয়ালে রাখুন, যেন যখন খুশি হাত মুছতে পারে।'], ['Dry sand only', 'A little water in the sand', 'Wet sand with both hands']),
    ], 'Lamia washes her hands', 'লামিয়া হাত ধোয়', [
      ['It is time to eat. First, Lamia washes her hands.', 'খাওয়ার সময় হয়েছে। আগে লামিয়া হাত ধোবে।'],
      ['Water on. Soap on. Rub, rub, rub!', 'পানি দাও। সাবান দাও। ঘষো, ঘষো, ঘষো!'],
      ['Lamia sings her song while she rubs.', 'ঘষতে ঘষতে লামিয়া গান গায়।'],
      ['Dry hands. Clean hands. Time to eat!', 'হাত মোছা শেষ। পরিষ্কার হাত। এবার খাওয়া!'],
    ]),
  ];
  const note = (cid, n, h, mood, text, en, wins = [], struggles = [], triggers = [], extra = {}) => ({ id: `log-${cid}-${n}`, childId: cid, date: dayKey(daysAgo(n)), at: iso(n, h, 10), lang: 'bn', audio: null, analysed: true, source: 'sample', text, en, wins, struggles, triggers, mood, sleep: 'unknown', ...extra });
  const logs = [
    note('tasnim', 3, 8, 'mixed', 'আজ জামা নিজে পরেছে, কিন্তু মোজা পরতে চায়নি।', 'She put on her dress herself today but refused the socks.', ['Put on her dress herself'], ['Refused socks']),
    note('tasnim', 1, 8, 'good', 'দুটি জামা থেকে নিজে বেছে নিয়েছে, কান্না ছাড়াই তৈরি হয়েছে।', 'She chose between two dresses herself and got ready without crying.', ['Chose her own dress', 'No crying'], [], [], { media: [{ kind: 'photo', url: '/art/note-dresses.svg' }] }),
    note('tasnim', 0, 16, 'good', 'নাস্তার সময় নিজে থেকে বলেছে “আমি বিস্কুট চাই”।', 'At snack time she said “I want biscuit” by herself.', ['Used a full sentence']),
    note('arib', 4, 17, 'good', 'বাবল খেলায় তিনবার আমার দিকে তাকিয়েছে।', 'He looked at me three times during the bubble game.', ['Looked at my face 3 times']),
    note('arib', 2, 19, 'mixed', 'ভাইয়ের সাথে দুই মিনিট পাশাপাশি খেলেছে, তারপর গাড়ি নিয়ে সরে গেছে।', 'He played beside his cousin for two minutes, then moved away with his cars.', ['Played side by side for 2 minutes'], ['Moved away after 2 minutes']),
    note('arib', 0, 15, 'good', 'আজ নিজে থেকে আমার চোখের দিকে তাকিয়ে “আরও” বলেছে।', 'Today he looked me in the eye and said “more” on his own.', ['Said “more” with eye contact']),
    note('nabila', 4, 20, 'mixed', 'পুতুলের চুল আঁচড়েছে, নিজের চুলে পাঁচ গোনা পর্যন্ত দিয়েছে।', 'She brushed her doll’s hair and let me brush hers to a count of five.', ['Allowed brushing to 5'], ['Pulled away at 5']),
    note('nabila', 2, 20, 'hard', 'চিরুনি দেখেই চিৎকার করেছে, প্রায় পনেরো মিনিট কেঁদেছে।', 'She screamed as soon as she saw the comb and cried for about fifteen minutes.', [], ['Cried for 15 minutes'], ['Seeing the comb'], { audio: '/art/note-voice-nabila-1.m4a' }),
    note('nabila', 1, 21, 'hard', 'আজও চুল আঁচড়াতে দেয়নি, শ্বাসের ব্যায়ামও করতে চায়নি।', 'She would not let me brush her hair again today and refused the breathing routine too.', [], ['Refused brushing', 'Refused breathing routine'], ['Hair brushing']),
    note('zayan', 5, 14, 'good', 'গাজরটা হাতে নিয়ে গন্ধ নিয়েছে। টেবিলে চার মিনিট বসেছে।', 'He picked up the carrot and smelled it. He sat at the table for four minutes.', ['Smelled a new food', 'Sat for 4 minutes']),
    note('samir', 2, 18, 'good', '“বল আনো, তারপর বসো” দুই ধাপই করেছে।', 'He did both steps of “get the ball, then sit down”.', ['Followed a two-step instruction']),
    note('samir', 1, 20, 'good', 'মেহমান আসার পর নিজে থেকে শান্ত কোণে গিয়েছে।', 'When guests came he went to the quiet corner by himself.', ['Used the quiet corner by himself']),
    note('samir', 0, 17, 'good', 'আজ স্কুল থেকে ফিরে খুব শান্ত ছিল।', 'He was very calm after school today.', ['Calm after school']),
    note('lamia', 3, 13, 'mixed', 'ছবি দেখে হাত ধুয়েছে, কিন্তু সাবান ধরতে চায়নি।', 'She washed her hands following the pictures but did not want to touch the soap.', ['Followed the pictures'], ['Avoided the soap'], [], { media: [{ kind: 'photo', url: '/art/note-handwash.svg' }] }),
    note('lamia', 1, 13, 'good', 'আজ সাবান ধরেছে, গান গাইতে গাইতে হাত ঘষেছে।', 'Today she held the soap and rubbed her hands while singing.', ['Held the soap']),
    note('lamia', 0, 13, 'good', 'ভেজা বালু দুই হাতে ধরেছে, তোয়ালে চায়নি।', 'She held wet sand in both hands and did not ask for the towel.', ['Touched wet sand with both hands']),
  ];
  const ticks = (cid, days) => days.flatMap((n) => [1, 2].map((a) => ({ childId: cid, date: dayKey(daysAgo(n)), activityId: `plan-${cid}-1-a${a}` })));
  const done = [...ticks('tasnim', [0, 1, 3, 4]), ...ticks('arib', [0, 2, 4]), ...ticks('nabila', [4]), ...ticks('zayan', [5, 6]), ...ticks('samir', [0, 1, 2, 3, 5]), ...ticks('lamia', [0, 1, 3])];
  const sum = (cid, notesCount, headline, parent, msgEn, msgBn) => {
    const p = plans.find((x) => x.childId === cid);
    return { childId: cid, generatedAt: iso(0, 7, 40), notesCount, source: 'sample', model: 'Prepared sample', headline,
      goals: p.goals.map((g, i) => ({ goal: g.text, status: i === 0 ? 'improving' : 'steady', evidence: i === 0 ? 'The parent’s notes show small, steady gains this week.' : 'Not enough notes yet to see a change.' })),
      patterns: [], suggestions: ['Keep the same routine for one more week before making it harder.'], askParent: [`What time of day does the practice go best for ${parent}?`],
      parentMessage: { en: msgEn, bn: msgBn }, parentMessageSent: true };
  };
  const summaries = {
    tasnim: sum('tasnim', 3, 'Dressing is getting easier, and she used a full sentence without a prompt.', 'Shirin', 'Wonderful week, Shirin. Keep offering two choices every morning.', 'দারুণ সপ্তাহ, শিরিন। প্রতিদিন সকালে দুটি থেকে বেছে নিতে দিন।'),
    arib: sum('arib', 3, 'Eye contact during play is growing; playing beside his cousin lasts about two minutes.', 'Sadia', 'Lovely progress, Sadia. Keep the bubble game short and fun.', 'খুব ভালো অগ্রগতি, সাদিয়া। বাবল খেলা ছোট ও আনন্দের রাখুন।'),
    nabila: sum('nabila', 1, 'She accepted brushing to a count of five after brushing her doll first.', 'Rokeya', 'Good start, Rokeya. Stop at the same count every day.', 'ভালো শুরু, রোকেয়া। প্রতিদিন একই গোনায় থামুন।'),
    zayan: sum('zayan', 1, 'He smelled a new food and sat at the table for four minutes.', 'Farid', 'Well done, Farid. Smelling a new food is a real step.', 'খুব ভালো, ফরিদ। নতুন খাবারের গন্ধ নেওয়াও একটি বড় ধাপ।'),
    samir: sum('samir', 3, 'He follows two-step instructions and now goes to the quiet corner by himself.', 'Kamal', 'Excellent week, Kamal. Samir is using his quiet corner on his own.', 'চমৎকার সপ্তাহ, কামাল। সামির নিজে থেকেই শান্ত কোণ ব্যবহার করছে।'),
    lamia: sum('lamia', 3, 'She now holds the soap and has touched wet sand with both hands.', 'Jannat', 'Great week, Jannat. Add a little more water to the sand each day.', 'দারুণ সপ্তাহ, জান্নাত। প্রতিদিন বালুতে একটু বেশি পানি মেশান।'),
  };
  return { children, plans, logs, done, summaries };
}

/** The clinical profile a doctor records for a child. One list, used by the form, the Profile tab, the server and the AI prompt.
    Support levels follow DSM-5. Asperger's and PDD-NOS are older labels now grouped under autism, kept because doctors and
    older reports still use them. The doctor records these; the AI never sets or changes them. */
export const PROFILE = {
  level: { label: 'Support level', opts: [['1', 'Level 1'], ['2', 'Level 2'], ['3', 'Level 3'], ['na', 'Not yet assessed']],
    help: { 1: 'Requires support', 2: 'Requires substantial support', 3: 'Requires very substantial support', na: 'Not yet assessed' } },
  dxType: { label: 'Diagnosis', opts: [['asd', 'Autism (ASD)'], ['asperger', 'Asperger’s'], ['pddnos', 'PDD-NOS'], ['other', 'Other']] },
  co: { label: 'Co-occurring conditions', multi: true, opts: [['adhd', 'ADHD'], ['epilepsy', 'Epilepsy'], ['anxiety', 'Anxiety'], ['id', 'Intellectual disability'], ['speech', 'Speech delay'], ['other', 'Other'], ['none', 'None']] },
  speech: { label: 'Speech', opts: [['nonverbal', 'Non-verbal'], ['minimal', 'Single words'], ['phrases', 'Short phrases'], ['sentences', 'Full sentences']] },
  understands: { label: 'Understands instructions', opts: [['notyet', 'Not yet'], ['simple', 'Simple only'], ['most', 'Most']] },
  aac: { label: 'Uses gestures, pictures or a device', opts: [['yes', 'Yes'], ['no', 'No']] },
  sensitive: { label: 'Sensitive to', multi: true, opts: [['sound', 'Sound'], ['light', 'Light'], ['touch', 'Touch'], ['taste', 'Taste or texture'], ['smell', 'Smell'], ['crowds', 'Crowds']] },
  seeking: { label: 'Sensory-seeking', multi: true, opts: [['spinning', 'Spinning'], ['jumping', 'Jumping'], ['chewing', 'Chewing'], ['touching', 'Touching things']] },
  behaviours: { label: 'Behaviour challenges', rated: [['mild', 'Mild'], ['moderate', 'Moderate'], ['severe', 'Severe']],
    opts: [['meltdowns', 'Meltdowns'], ['aggression', 'Aggression'], ['selfinjury', 'Self-injury'], ['running', 'Running away'], ['sleep', 'Sleep problems'], ['feeding', 'Feeding issues'], ['toilet', 'Toilet training'], ['repetitive', 'Repetitive behaviours'], ['screen', 'Screen dependence']] },
  daily: { label: 'Daily living skills', rated: [['ind', 'Independent'], ['help', 'Needs help'], ['dep', 'Fully dependent']],
    opts: [['eating', 'Eating'], ['dressing', 'Dressing'], ['toileting', 'Toileting'], ['routines', 'Following routines']] },
  therapies: { label: 'Therapy now', multi: true, opts: [['speech', 'Speech therapy'], ['ot', 'Occupational therapy'], ['aba', 'ABA'], ['sped', 'Special education']] },
};
const labelOf = (key, v, list = PROFILE[key].opts) => (list.find((o) => o[0] === v) || [])[1];
const low = (s) => (/^[A-Z-]+$/.test(s) ? s : s.toLowerCase()); // keeps ADHD and ABA in capitals

/** Keeps only answers that are on the lists above, so nothing unexpected is ever stored. */
export function cleanProfile(p = {}) {
  const out = {}, text = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
  for (const [key, spec] of Object.entries(PROFILE)) {
    const ok = (v) => spec.opts.some((o) => o[0] === v);
    if (spec.multi) { const list = [...new Set((Array.isArray(p[key]) ? p[key] : []).filter(ok))]; if (list.length) out[key] = list.includes('none') ? ['none'] : list; }
    else if (spec.rated) { const got = Object.entries(p[key] && typeof p[key] === 'object' ? p[key] : {}).filter(([k, v]) => ok(k) && spec.rated.some((r) => r[0] === v)); if (got.length) out[key] = Object.fromEntries(got); }
    else if (ok(p[key])) out[key] = p[key];
  }
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(p.dxDate || '')) out.dxDate = p.dxDate;
  if (text(p.calming, 200)) out.calming = text(p.calming, 200);
  const hours = Number(p.hours);
  if (p.hours !== '' && p.hours != null && hours >= 0 && hours <= 12) out.hours = Math.round(hours * 2) / 2;
  return out;
}

/** The profile as plain sentences, for the AI that drafts home activities. Empty when nothing is recorded. */
export function profileText(child) {
  const p = child.profile || {}, lines = [], list = (key) => (p[key] || []).filter((v) => v !== 'none').map((v) => low(labelOf(key, v))).join(', ');
  if (p.level && p.level !== 'na') lines.push(`Support level ${p.level} (${PROFILE.level.help[p.level].toLowerCase()}).`);
  if (p.speech) lines.push(`Speech: ${labelOf('speech', p.speech).toLowerCase()}.`);
  if (p.understands) lines.push(`Understands instructions: ${labelOf('understands', p.understands).toLowerCase()}.`);
  if (p.aac === 'yes') lines.push('Uses gestures, pictures or a device to communicate.');
  if (list('co')) lines.push(`Also has: ${list('co')}.`);
  if (list('sensitive')) lines.push(`Sensory sensitivities: ${list('sensitive')}.`);
  if (list('seeking')) lines.push(`Seeks sensory input by: ${list('seeking')}.`);
  if (p.calming) lines.push(`What calms the child: ${p.calming}.`);
  const rated = (key) => Object.entries(p[key] || {}).map(([k, v]) => `${low(labelOf(key, k))} (${low(labelOf(key, v, PROFILE[key].rated))})`).join(', ');
  if (rated('behaviours')) lines.push(`Behaviour challenges: ${rated('behaviours')}.`);
  if (rated('daily')) lines.push(`Daily living: ${rated('daily')}.`);
  if (list('therapies')) lines.push(`Current therapy: ${list('therapies')}.`);
  return lines.join(' ');
}

/** The fields a doctor can fill in for a child, checked and tidied. Throws a plain message when something is missing. */
function childFields(input, before = {}) {
  const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
  const name = clean(input.name, 40), parent = clean(input.parent, 40), age = Math.round(Number(input.age));
  if (!name) throw new Error('Add the child’s name.');
  if (!(age >= 1 && age <= 18)) throw new Error('Age must be between 1 and 18.');
  if (!parent) throw new Error('Add the parent’s name.');
  const per = Math.min(7, Math.max(1, Math.round(Number(input.sessions)) || 1));
  const gender = input.gender === 'girl' ? 'girl' : input.gender === 'boy' ? 'boy' : 'child';
  const profile = cleanProfile(input.profile);
  const senses = (profile.sensitive || []).map((v) => labelOf('sensitive', v).toLowerCase()).join(', ');
  return {
    name, name_bn: clean(input.name_bn, 40) || name, age, parent, gender, lang: 'bn',
    sessions: `${per} session${per > 1 ? 's' : ''} a week`,
    likes: clean(input.likes, 200) || before.likes || 'not noted yet',
    sensitivities: senses || before.sensitivities || 'not noted yet',
    profile,
  };
}

/** Turns the "add a child" form into a new child record. */
export function newChild(input, existing) {
  const f = childFields(input);
  const base = f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'child';
  let id = base, n = 2;
  while (existing.some((c) => c.id === id)) id = `${base}-${n++}`;
  return {
    id, ...f,
    look: `a ${f.age}-year-old Bangladeshi ${f.gender} with warm brown skin and black hair, wearing simple everyday clothes`,
    family: `${f.gender === 'girl' ? 'her' : f.gender === 'boy' ? 'his' : 'the child’s'} parent, a Bangladeshi adult in everyday clothes`,
    tint: ['lime', 'teal', 'sun', 'rose', 'violet'][existing.length % 5], addedAt: new Date().toISOString(),
  };
}

/** Applies an edited form to an existing child. The id, colour and picture description stay as they were. */
export function editChild(child, input) {
  return Object.assign(child, childFields(input, child));
}

/** What the AI is asked to return after reading a photo of an earlier report: the same answers the form has. */
export function scanShape() {
  const pick = (k) => PROFILE[k].opts.map((o) => o[0]).filter((v) => v !== 'none').join(' | ');
  return `{
  "name": "the child's name in English letters, or null",
  "name_bn": "the child's name in Bangla script if the report has it, or null",
  "age": "age in whole years as a number, or null",
  "gender": "boy | girl | null",
  "parent": "the parent's or guardian's name, or null",
  "likes": "interests and favourite things mentioned, as a short comma-separated list, or null",
  "sessions": "therapy sessions per week as a number, or null",
  "profile": {
    "level": "${pick('level')} | null",
    "dxType": "${pick('dxType')} | null",
    "dxDate": "date of diagnosis as YYYY-MM, or null",
    "co": ["any of: ${pick('co')}"],
    "speech": "${pick('speech')} | null",
    "understands": "${pick('understands')} | null",
    "aac": "yes | no | null",
    "sensitive": ["any of: ${pick('sensitive')}"],
    "seeking": ["any of: ${pick('seeking')}"],
    "calming": "what calms the child, or null",
    "behaviours": { "<one of: ${pick('behaviours')}>": "mild | moderate | severe" },
    "daily": { "<one of: ${pick('daily')}>": "ind | help | dep" },
    "therapies": ["any of: ${pick('therapies')}"],
    "hours": "school or centre hours a day as a number, or null"
  },
  "unsure": ["short plain notes about anything that was hard to read or unclear"]
}`;
}

/** Tidies what was read from a report into form answers, and lists which answers came from the report. */
export function scanFields(raw = {}) {
  const clean = (v, max) => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim().slice(0, max));
  const age = Math.round(Number(raw.age)), per = Math.round(Number(raw.sessions));
  const fields = {
    name: clean(raw.name, 40), name_bn: clean(raw.name_bn, 40), age: age >= 1 && age <= 18 ? String(age) : '',
    gender: raw.gender === 'girl' ? 'girl' : raw.gender === 'boy' ? 'boy' : '', parent: clean(raw.parent, 40), likes: clean(raw.likes, 200),
    sessions: per >= 1 && per <= 5 ? String(per) : '', profile: cleanProfile(raw.profile && typeof raw.profile === 'object' ? raw.profile : {}),
  };
  const filled = ['name', 'name_bn', 'age', 'gender', 'parent', 'likes', 'sessions'].filter((k) => fields[k]).concat(Object.keys(fields.profile));
  return { fields, filled, unsure: (Array.isArray(raw.unsure) ? raw.unsure : []).map((x) => clean(x, 160)).filter(Boolean).slice(0, 5) };
}

/** The answers that match the sample report picture (public/art/sample-report.png), for demos without a working AI key. */
export const SAMPLE_SCAN = {
  name: 'Tahsin Ahmed', name_bn: 'তাহসিন আহমেদ', age: 6, gender: 'boy', parent: 'Rumana Ahmed', likes: 'kites, rice pudding, water play', sessions: 3,
  profile: { level: '2', dxType: 'asd', dxDate: '2025-03', co: ['adhd', 'speech'], speech: 'phrases', understands: 'simple', aac: 'yes', sensitive: ['sound', 'crowds'], seeking: ['jumping'],
    calming: 'holding his kite, a quiet room', behaviours: { meltdowns: 'moderate', sleep: 'mild' }, daily: { eating: 'ind', dressing: 'help', toileting: 'dep', routines: 'help' }, therapies: ['speech', 'ot'], hours: 4 },
  unsure: ['The report does not say how well he copes with light or smell.'],
};

/** How progress is measured. Each measure is a standard one in autism therapy:
    - goal attainment scaling (GAS): the therapist rates each goal from -2 to +2 at every session; -1 is where the child started, 0 is the expected result;
    - home practice done, and how the days at home went, taken from what the parent ticks and notes;
    - upsets the parent noted;
    - ATEC, a parent checklist with four parts where a LOWER score means fewer difficulties, repeated every few months;
    - daily living skills at the start compared with now. */
export const GAS = [[-2, 'Much less than expected'], [-1, 'Where we started'], [0, 'Expected result'], [1, 'Better than expected'], [2, 'Much better than expected']];
export const ATEC = [['speech', 'Speech and communication', 28], ['social', 'Sociability', 40], ['sensory', 'Sensory and awareness', 36], ['health', 'Health and behaviour', 75]];

/** Sample history for the sample children: six earlier weeks, goal ratings and checklist scores. All invented. */
function progressSample(plans) {
  const week = (n) => dayKey(daysAgo(6 + 7 * n)); // the first day of the week that ended n weeks ago
  const make = (cid, practice, good, mixed, hard, upsets, gas, atec, was) => {
    const plan = plans.find((p) => p.childId === cid && p.status === 'approved');
    return [cid, {
      weeks: practice.map((p, i) => ({ start: week(practice.length - i), practice: p, good: good[i], mixed: mixed[i], hard: hard[i], upsets: upsets[i] })),
      goals: (plan?.goals || []).map((g, k) => ({ text: g.text, ratings: (gas[k] || []).map((level, i, all) => ({ date: dayKey(daysAgo(7 * (all.length - i) - 3)), level })) })),
      atec: atec.map(([weeksAgo, speech, social, sensory, health]) => ({ date: dayKey(daysAgo(weeksAgo * 7)), speech, social, sensory, health })),
      was: Object.fromEntries(['eating', 'dressing', 'toileting', 'routines'].map((k, i) => [k, was[i]])),
    }];
  };
  return Object.fromEntries([
    make('rafi', [30, 35, 40, 45, 50, 50], [0, 0, 1, 1, 1, 1], [2, 2, 2, 2, 2, 2], [4, 4, 3, 3, 3, 2], [7, 6, 6, 5, 4, 4], [[-2, -1, -1, 0, 0], [-2, -2, -1, -1, 0]], [[24, 18, 24, 20, 32], [12, 16, 21, 18, 28], [1, 14, 18, 17, 24]], ['help', 'dep', 'help', 'dep']),
    make('tasnim', [35, 40, 45, 50, 55, 55], [1, 1, 2, 2, 2, 2], [2, 2, 1, 1, 1, 1], [2, 1, 1, 1, 0, 0], [3, 3, 2, 2, 1, 1], [[-1, -1, 0, 0, 1], [-1, 0, 0, 1, 1]], [[20, 8, 16, 12, 20], [8, 6, 13, 11, 16]], ['ind', 'dep', 'ind', 'help']),
    make('arib', [25, 30, 30, 35, 40, 40], [1, 1, 1, 2, 2, 2], [2, 2, 2, 1, 1, 1], [2, 2, 1, 1, 1, 0], [4, 4, 3, 3, 2, 1], [[-2, -1, -1, 0, 0], [-1, -1, -1, 0, 0]], [[16, 22, 26, 18, 26], [4, 20, 22, 17, 23]], ['help', 'dep', 'dep', 'help']),
    make('nabila', [55, 50, 45, 35, 25, 20], [3, 2, 2, 1, 1, 0], [1, 2, 2, 2, 1, 1], [0, 0, 1, 1, 2, 2], [1, 1, 2, 2, 3, 3], [[-1, -1, -1, -2, -2], [-1, 0, -1, -1, -2]], [[18, 15, 22, 21, 30], [6, 15, 23, 22, 34]], ['ind', 'help', 'help', 'help']),
    make('zayan', [45, 50, 50, 40, 35, 30], [2, 2, 2, 2, 1, 1], [2, 2, 2, 1, 1, 1], [1, 1, 1, 1, 1, 0], [3, 3, 3, 2, 2, 1], [[-2, -2, -1, -1, -1], [-2, -1, -1, -1, -1]], [[14, 26, 30, 24, 38], [3, 25, 28, 23, 35]], ['dep', 'dep', 'dep', 'dep']),
    make('samir', [50, 55, 60, 65, 70, 70], [1, 2, 2, 3, 3, 3], [2, 2, 1, 1, 0, 0], [1, 1, 0, 0, 0, 0], [2, 2, 1, 1, 0, 0], [[-1, 0, 0, 1, 1], [-1, -1, 0, 0, 1]], [[22, 7, 14, 12, 18], [9, 5, 11, 10, 14]], ['ind', 'help', 'ind', 'dep']),
    make('lamia', [25, 30, 35, 35, 40, 40], [1, 1, 1, 2, 2, 2], [2, 2, 2, 1, 1, 1], [2, 1, 1, 1, 0, 0], [4, 3, 3, 2, 2, 1], [[-2, -1, -1, 0, 0], [-1, -1, 0, 0, 1]], [[18, 17, 21, 20, 25], [5, 15, 19, 17, 22]], ['dep', 'dep', 'dep', 'help']),
    make('ayaan', [], [], [], [], [], [], [[2, 9, 17, 13, 19]], []),
    make('mehjabin', [], [], [], [], [], [], [[1, 21, 24, 19, 29]], []),
    make('ishrat', [], [], [], [], [], [], [[3, 6, 15, 10, 17]], []),
  ]);
}

/** Tidies a goal rating or a checklist score before it is saved. Throws a plain message when a number is out of range. */
export function progressEntry(kind, input, today) {
  if (kind === 'rate') {
    const level = Number(input.level), goal = String(input.goal ?? '').trim().slice(0, 160);
    if (!goal || !GAS.some((g) => g[0] === level)) throw new Error('Choose a level for the goal.');
    return { goal, rating: { date: today, level } };
  }
  const row = { date: today };
  for (const [k, label, max] of ATEC) {
    const v = Number(input[k]);
    if (input[k] === '' || input[k] == null || !(v >= 0 && v <= max) || !Number.isInteger(v)) throw new Error(`${label} must be a whole number from 0 to ${max}.`);
    row[k] = v;
  }
  return { row };
}

/** What a parent sees for each level. Plain, kind words instead of numbers. */
export const PARENT_LEVEL = {
  '-2': { en: 'Needs more time', bn: 'আরও সময় দরকার' }, '-1': { en: 'Starting point', bn: 'শুরুর অবস্থা' }, 0: { en: 'On track', bn: 'ঠিক পথে' },
  1: { en: 'Ahead', bn: 'এগিয়ে আছে' }, 2: { en: 'Well ahead', bn: 'অনেক এগিয়ে' },
};

/** A progress suggestion worked out by simple rules from the week's summary and notes. It stands in for the AI when no AI
    is connected (and in the online preview), and is always labelled as a prepared sample. The therapist still decides. */
export function suggestProgress(child, plan, progress, summary, logs) {
  const hard = logs.filter((l) => l.mood === 'hard').length, good = logs.filter((l) => l.mood === 'good').length;
  const goals = plan.goals.map((g) => {
    const past = (progress?.goals || []).find((x) => x.text === g.text)?.ratings || [], last = past.length ? past[past.length - 1].level : -1;
    const seen = (summary?.goals || []).find((x) => x.goal === g.text);
    const rated = past.length && past[past.length - 1].date >= dayKey(daysAgo(6)); // already rated this week: do not move it twice on the same notes
    const step = rated ? 0 : seen ? (seen.status === 'improving' ? 1 : seen.status === 'needs_support' ? -1 : 0) : hard >= 2 ? -1 : good >= 2 ? 1 : 0;
    const level = Math.max(-2, Math.min(2, last + step));
    const why = rated ? 'Already rated this week, and the notes show nothing new since then.' : seen?.evidence || (step > 0 ? `${good} good ${good === 1 ? 'day' : 'days'} in ${child.parent}’s notes this week.` : step < 0 ? `${hard} hard days in ${child.parent}’s notes this week.` : `No clear change in ${child.parent}’s ${logs.length} ${logs.length === 1 ? 'note' : 'notes'} this week.`);
    return { text: g.text, level, was: last, why };
  });
  const move = goals.reduce((n, g) => n + (g.level - g.was), 0), name = child.name, bn = child.name_bn || child.name;
  const message = move > 0
    ? { en: `Good progress this week. ${name} has moved forward on ${goals.filter((g) => g.level > g.was).length === goals.length ? 'every goal' : 'one of the goals'}. Please keep the same routine at home.`, bn: `এই সপ্তাহে ভালো অগ্রগতি হয়েছে। ${bn} সামনে এগিয়েছে। বাড়িতে একই রুটিন চালিয়ে যান।` }
    : move < 0
      ? { en: `This was a harder week for ${name}. That is normal. We will make the steps a little smaller and try again.`, bn: `এই সপ্তাহটা ${bn}-এর জন্য একটু কঠিন ছিল। এটা স্বাভাবিক। আমরা ধাপগুলো আরও ছোট করে আবার চেষ্টা করব।` }
      : { en: `${name} is holding steady this week. Small daily practice is working. Please keep going.`, bn: `এই সপ্তাহে ${bn} স্থির আছে। প্রতিদিনের ছোট অনুশীলন কাজে দিচ্ছে। চালিয়ে যান।` };
  return { goals, message };
}

/** Tidies what the therapist approves: one level per goal and the words for the parent. */
export function approvedProgress(draft, input, today) {
  const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
  const goals = draft.goals.map((g, i) => {
    const level = Number((input.levels || [])[i]);
    return { text: g.text, level: GAS.some((x) => x[0] === level) ? level : g.level };
  });
  const message = { en: clean(input.message?.en, 400) || draft.message.en, bn: clean(input.message?.bn, 400) || draft.message.bn };
  return { date: today, goals, message };
}

/** Bangla names for the profile categories, for the parent's side. */
export const PROFILE_BN = {
  level: { label: 'সহায়তার মাত্রা', opts: { 1: 'লেভেল ১', 2: 'লেভেল ২', 3: 'লেভেল ৩', na: 'এখনো নির্ধারিত হয়নি' }, help: { 1: 'সহায়তা প্রয়োজন', 2: 'বেশ সহায়তা প্রয়োজন', 3: 'অনেক বেশি সহায়তা প্রয়োজন', na: 'এখনো নির্ধারিত হয়নি' } },
  dxType: { label: 'রোগ নির্ণয়', opts: { asd: 'অটিজম (এএসডি)', asperger: 'অ্যাসপারগার্স', pddnos: 'পিডিডি-এনওএস', other: 'অন্যান্য' } },
  co: { label: 'সাথে থাকা অন্যান্য অবস্থা', opts: { adhd: 'এডিএইচডি', epilepsy: 'মৃগী', anxiety: 'উদ্বেগ', id: 'বুদ্ধিগত প্রতিবন্ধিতা', speech: 'কথা বলায় দেরি', other: 'অন্যান্য', none: 'নেই' } },
  speech: { label: 'কথা বলা', opts: { nonverbal: 'কথা বলে না', minimal: 'একটি করে শব্দ', phrases: 'ছোট ছোট বাক্যাংশ', sentences: 'পুরো বাক্য' } },
  understands: { label: 'নির্দেশ বোঝে', opts: { notyet: 'এখনো নয়', simple: 'শুধু সহজ নির্দেশ', most: 'বেশিরভাগ' } },
  aac: { label: 'ইশারা, ছবি বা যন্ত্র ব্যবহার করে', opts: { yes: 'হ্যাঁ', no: 'না' } },
  sensitive: { label: 'যেসবে সংবেদনশীল', opts: { sound: 'শব্দ', light: 'আলো', touch: 'স্পর্শ', taste: 'স্বাদ বা খাবারের গঠন', smell: 'গন্ধ', crowds: 'ভিড়' } },
  seeking: { label: 'যা করতে পছন্দ করে', opts: { spinning: 'ঘোরা', jumping: 'লাফানো', chewing: 'চিবানো', touching: 'জিনিস ছোঁয়া' } },
  behaviours: { label: 'আচরণগত চ্যালেঞ্জ', rated: { mild: 'হালকা', moderate: 'মাঝারি', severe: 'তীব্র' },
    opts: { meltdowns: 'মেল্টডাউন', aggression: 'আক্রমণাত্মক আচরণ', selfinjury: 'নিজেকে আঘাত করা', running: 'দৌড়ে চলে যাওয়া', sleep: 'ঘুমের সমস্যা', feeding: 'খাওয়ার সমস্যা', toilet: 'টয়লেট প্রশিক্ষণ', repetitive: 'একই কাজ বারবার করা', screen: 'স্ক্রিনের প্রতি নির্ভরতা' } },
  daily: { label: 'দৈনন্দিন কাজ', rated: { ind: 'নিজে পারে', help: 'সাহায্য লাগে', dep: 'পুরোপুরি নির্ভরশীল' }, opts: { eating: 'খাওয়া', dressing: 'পোশাক পরা', toileting: 'টয়লেট ব্যবহার', routines: 'রুটিন মেনে চলা' } },
  therapies: { label: 'বর্তমান থেরাপি', opts: { speech: 'স্পিচ থেরাপি', ot: 'অকুপেশনাল থেরাপি', aba: 'এবিএ', sped: 'বিশেষ শিক্ষা' } },
};

/** Guidance for parents, written once by the centre. Each piece is a short video, a voice clip or a few written steps,
    and is shown only to families whose child's profile it fits (`fits`). Daily pieces rotate; weekly pieces stay for the week. */
export const GUIDE = [
  { id: 'noise', scope: 'daily', kind: 'audio', media: '/art/guide-noise.m4a', fits: (p) => (p.sensitive || []).includes('sound'),
    title: { en: 'Warn before a loud sound', bn: 'জোরে শব্দের আগে জানিয়ে দিন' }, body: { en: 'Say “noise coming”, count to three together, then start the blender or the drill.', bn: '“শব্দ আসছে” বলুন, একসাথে তিন পর্যন্ত গুনুন, তারপর ব্লেন্ডার বা ড্রিল চালু করুন।' } },
  { id: 'choices', scope: 'daily', kind: 'video', media: '/art/how-choice.mp4', fits: (p) => ['nonverbal', 'minimal', 'phrases'].includes(p.speech),
    title: { en: 'Offer two choices', bn: 'দুটি থেকে বেছে নিতে দিন' }, body: { en: 'Hold up two things and wait five seconds. A look, a point or a word all count.', bn: 'দুটি জিনিস তুলে ধরে পাঁচ সেকেন্ড অপেক্ষা করুন। তাকানো, আঙুল দেখানো বা একটি শব্দ, সবই চলবে।' } },
  { id: 'calm', scope: 'daily', kind: 'video', media: '/art/how-breath.mp4', fits: (p) => Boolean(p.behaviours?.meltdowns),
    title: { en: 'When your child is upset', bn: 'শিশু অস্থির হলে' }, body: { en: 'Go quiet, lower yourself to eye level, and breathe together: smell the flower, blow the candle.', bn: 'চুপ থাকুন, শিশুর চোখের সমান উচ্চতায় নামুন এবং একসাথে শ্বাস নিন: ফুলের গন্ধ নাও, মোমবাতি নেভাও।' } },
  { id: 'dress', scope: 'daily', kind: 'text', fits: (p) => p.daily?.dressing && p.daily.dressing !== 'ind',
    title: { en: 'Dressing, one piece at a time', bn: 'পোশাক পরা, একটি একটি করে' }, steps: { en: ['Lay the clothes out in order.', 'Hand over one piece and name it.', 'Help with the hard part only, then praise.'], bn: ['পোশাকগুলো ক্রম অনুযায়ী সাজিয়ে রাখুন।', 'একটি পোশাক হাতে দিন এবং নাম বলুন।', 'শুধু কঠিন অংশে সাহায্য করুন, তারপর প্রশংসা করুন।'] } },
  { id: 'bed', scope: 'daily', kind: 'audio', media: '/art/guide-bedtime.m4a', fits: (p) => Boolean(p.behaviours?.sleep),
    title: { en: 'A calm bedtime', bn: 'শান্তভাবে ঘুমাতে যাওয়া' }, body: { en: 'Same three steps every night: wash, story, lights low. Screens off one hour before bed.', bn: 'প্রতি রাতে একই তিনটি ধাপ: হাত-মুখ ধোয়া, গল্প, আলো কমানো। ঘুমের এক ঘণ্টা আগে স্ক্রিন বন্ধ।' } },
  { id: 'short', scope: 'daily', kind: 'text', fits: (p) => p.understands === 'simple' || p.understands === 'notyet',
    title: { en: 'One short instruction at a time', bn: 'একবারে একটি ছোট নির্দেশ' }, steps: { en: ['Say the child’s name first.', 'Use three or four words: “Shoes on.”', 'Wait ten seconds before you repeat.'], bn: ['আগে শিশুর নাম ধরে ডাকুন।', 'তিন-চার শব্দে বলুন: “জুতা পরো।”', 'আবার বলার আগে দশ সেকেন্ড অপেক্ষা করুন।'] } },
  { id: 'move', scope: 'daily', kind: 'text', fits: (p) => (p.seeking || []).some((s) => s === 'jumping' || s === 'spinning'),
    title: { en: 'A movement break before sitting', bn: 'বসার আগে একটু নড়াচড়া' }, steps: { en: ['Ten jumps or one minute of spinning.', 'Then a drink of water.', 'Then sit for the meal or the practice.'], bn: ['দশবার লাফ বা এক মিনিট ঘোরা।', 'তারপর একটু পানি।', 'তারপর খাওয়া বা অনুশীলনের জন্য বসা।'] } },
  { id: 'crowd', scope: 'daily', kind: 'text', fits: (p) => (p.sensitive || []).includes('crowds'),
    title: { en: 'Before a crowded place', bn: 'ভিড়ের জায়গায় যাওয়ার আগে' }, steps: { en: ['Say where you are going and for how long.', 'Take a favourite toy.', 'Agree on a quiet spot to rest.'], bn: ['কোথায় যাচ্ছেন এবং কতক্ষণ থাকবেন তা বলুন।', 'একটি প্রিয় খেলনা সাথে নিন।', 'বিশ্রামের জন্য একটি শান্ত জায়গা ঠিক করে রাখুন।'] } },
  { id: 'praise', scope: 'daily', kind: 'text', fits: () => true,
    title: { en: 'Praise the effort, straight away', bn: 'চেষ্টার প্রশংসা করুন, সাথে সাথে' }, steps: { en: ['Say exactly what was good: “Nice waiting!”', 'Smile and praise within two seconds.', 'Praise trying, not only success.'], bn: ['ঠিক কী ভালো হয়েছে তা বলুন: “খুব সুন্দর অপেক্ষা করেছ!”', 'দুই সেকেন্ডের মধ্যে হেসে প্রশংসা করুন।', 'শুধু সফল হলে নয়, চেষ্টা করলেও প্রশংসা করুন।'] } },
  { id: 'wwait', scope: 'weekly', kind: 'video', media: '/art/how-wait.mp4', fits: () => true,
    title: { en: 'This week’s skill: waiting', bn: 'এই সপ্তাহের দক্ষতা: অপেক্ষা করা' }, body: { en: 'Use the wait card at every snack this week and add one count every two days.', bn: 'এই সপ্তাহে প্রতিটি নাস্তায় অপেক্ষা কার্ড ব্যবহার করুন এবং প্রতি দুই দিনে এক গোনা বাড়ান।' } },
  { id: 'wsound', scope: 'weekly', kind: 'audio', media: '/art/guide-weeksound.m4a', fits: (p) => (p.sensitive || []).includes('sound'),
    title: { en: 'This week: make sounds predictable', bn: 'এই সপ্তাহ: শব্দকে আগে থেকে জানান' }, body: { en: 'Choose the three loudest things at home and give a warning before each one, all week.', bn: 'বাড়ির সবচেয়ে জোরে শব্দ করা তিনটি জিনিস বেছে নিন এবং পুরো সপ্তাহ প্রতিটির আগে জানিয়ে দিন।' } },
  { id: 'wwords', scope: 'weekly', kind: 'text', fits: (p) => ['nonverbal', 'minimal', 'phrases'].includes(p.speech),
    title: { en: 'This week’s three words', bn: 'এই সপ্তাহের তিনটি শব্দ' }, steps: { en: ['“More” at play and at meals.', '“Want” with every choice.', '“Finished” when an activity ends.'], bn: ['খেলা ও খাওয়ার সময় “আরও”।', 'প্রতিবার বেছে নেওয়ার সময় “চাই”।', 'কোনো কাজ শেষ হলে “শেষ”।'] } },
  { id: 'wtell', scope: 'weekly', kind: 'text', fits: () => true,
    title: { en: 'What to tell the doctor this week', bn: 'এই সপ্তাহে ডাক্তারকে যা জানাবেন' }, steps: { en: ['One thing that went well.', 'One thing that was hard, and what happened just before.', 'How your child slept.'], bn: ['একটি বিষয় যা ভালো হয়েছে।', 'একটি বিষয় যা কঠিন ছিল, এবং ঠিক তার আগে কী হয়েছিল।', 'শিশুর ঘুম কেমন হয়েছে।'] } },
];
/** The guidance that fits a profile: three daily pieces that change from day to day, and the weekly pieces. */
export function guideFor(profile, dayNumber) {
  const fit = GUIDE.filter((g) => g.fits(profile || {})), daily = fit.filter((g) => g.scope === 'daily'), start = daily.length ? dayNumber % daily.length : 0;
  return { daily: daily.slice(start).concat(daily.slice(0, start)).slice(0, 3), weekly: fit.filter((g) => g.scope === 'weekly').slice(0, 3) };
}
/** What the parent is shown about their child: a copy of the profile as it was when the doctor approved it. */
export const sharedProfile = (child) => ({ at: new Date().toISOString(), profile: structuredClone(child.profile || {}), likes: child.likes });

export const EXAMPLE_GOAL = 'Stay calm when the blender is on';

export function preparedPlan() {
  return {
    activities: [
      {
        goal: 1, icon: 'sound', minutes: 4,
        title: { en: 'Blender sound from far away', bn: 'দূর থেকে ব্লেন্ডারের শব্দ' },
        when: { en: 'Before lunch', bn: 'দুপুরের খাবারের আগে' },
        steps: {
          en: [
            'Tell Rafi “noise coming” and show him the blender before you turn it on.',
            'Run it for 3 seconds while he plays with his train in the next room.',
            'If he stays calm, praise him and move one step closer tomorrow. If he is upset, stop and go back a step.',
          ],
          bn: [
            'রাফিকে বলুন “শব্দ আসছে” এবং চালানোর আগে ব্লেন্ডারটি দেখান।',
            'রাফি পাশের ঘরে ট্রেন নিয়ে খেলার সময় ৩ সেকেন্ড ব্লেন্ডার চালান।',
            'শান্ত থাকলে প্রশংসা করুন, পরদিন এক ধাপ কাছে আসুন। অস্থির হলে থামুন এবং এক ধাপ পিছিয়ে যান।',
          ],
        },
      },
      {
        goal: 1, icon: 'touch', minutes: 3,
        title: { en: 'Rafi presses the button', bn: 'রাফি নিজে বোতাম চাপবে' },
        when: { en: 'Afternoon', bn: 'বিকেলে' },
        steps: {
          en: [
            'While the blender is off, let Rafi hold his train and touch the blender.',
            'Help him press the button for one second, then let go together.',
            'Clap and say “You made the noise stop!” If he pulls away, do not push.',
          ],
          bn: [
            'ব্লেন্ডার বন্ধ থাকা অবস্থায় রাফিকে ট্রেন হাতে নিয়ে ব্লেন্ডারটি ছুঁতে দিন।',
            'ওকে এক সেকেন্ডের জন্য বোতাম চাপতে সাহায্য করুন, তারপর একসাথে ছেড়ে দিন।',
            'হাততালি দিয়ে বলুন “তুমি শব্দ থামিয়েছ!” সরে গেলে জোর করবেন না।',
          ],
        },
      },
    ],
    story: {
      title: { en: 'Rafi and the blender', bn: 'রাফি ও ব্লেন্ডার' },
      pages: [
        { en: 'Ma is making a mango drink in the kitchen. Rafi likes mango drink.', bn: 'মা রান্নাঘরে আমের শরবত বানাচ্ছেন। রাফি আমের শরবত খুব পছন্দ করে।' },
        { en: 'The blender makes the drink. The blender is loud.', bn: 'ব্লেন্ডার দিয়ে শরবত তৈরি হয়। ব্লেন্ডারে জোরে শব্দ হয়।' },
        { en: 'Ma says, “Noise coming!” Now Rafi knows the sound will start.', bn: 'মা বলেন, “শব্দ আসছে!” এখন রাফি জানে শব্দ শুরু হবে।' },
        { en: 'The blender goes whirr. Rafi holds his train and takes a slow, deep breath.', bn: 'ব্লেন্ডার ঘরঘর শব্দ করে। রাফি ট্রেনটা ধরে ধীরে ধীরে লম্বা শ্বাস নেয়।' },
        { en: 'The sound is short. Then it stops. The kitchen is quiet again.', bn: 'শব্দটা অল্প সময়ের। তারপর থেমে যায়। রান্নাঘর আবার শান্ত।' },
        { en: 'The drink is ready! Rafi drinks it with Ma. Rafi stayed calm.', bn: 'শরবত তৈরি! রাফি মায়ের সাথে শরবত খায়। রাফি শান্ত ছিল।' },
      ],
    },
  };
}

export const EXAMPLE_NOTES = {
  en: 'He waited his turn twice today, but cried at the blender noise.',
  bn: 'আজ দুইবার নিজের পালার জন্য অপেক্ষা করেছে, কিন্তু ব্লেন্ডারের শব্দে কেঁদেছে।',
};
export const preparedNote = () => ({
  en: EXAMPLE_NOTES.en,
  wins: ['Waited for 2 turns'],
  struggles: ['Cried at the blender noise'],
  triggers: ['Blender noise'],
  mood: 'mixed',
  sleep: 'unknown',
});

/** The sample summary, brought up to date with how many notes there are now. */
export function preparedSummary(base, logs) {
  const blender = logs.filter((l) => /blender|ব্লেন্ডার/i.test(`${l.text} ${l.en}`)).length;
  const s = JSON.parse(JSON.stringify(base));
  s.notesCount = logs.length;
  s.generatedAt = new Date().toISOString();
  s.parentMessageSent = false;
  if (blender > 1) {
    s.headline = 'Waiting for his turn keeps improving. The blender caused crying again today, so sudden noise is still the main trigger.';
    s.patterns[0] = { title: 'Sudden noise leads to crying', days: 3, detail: 'The blender on two days and a neighbour’s drill once. The planned, gradual clipper sound did not.' };
    s.suggestions[2] = 'Start a warning routine before the blender, such as “noise coming”, and practise it at a distance.';
  }
  return s;
}
