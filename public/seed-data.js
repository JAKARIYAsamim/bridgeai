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

export function seed({ barberSheet = false } = {}) {
  const iso = (n, h, m) => {
    const d = daysAgo(n);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const rafiPlan = {
    id: 'plan-rafi-1',
    childId: 'rafi',
    createdAt: iso(7, 16, 10),
    approvedAt: iso(7, 16, 14),
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
          step: 'situation',
          en: 'My hair has grown long. Today Ma and I are going to the barber.',
          bn: 'আমার চুল বড় হয়ে গেছে। আজ আমি মায়ের সাথে চুল কাটতে যাব।',
        },
        {
          step: 'situation',
          en: 'At the barbershop, other people go first. I sit with my train and wait for my turn.',
          bn: 'সেলুনে আগে অন্যদের পালা। আমি আমার ট্রেন নিয়ে বসে নিজের পালার জন্য অপেক্ষা করি।',
        },
        {
          step: 'situation',
          en: 'Now it is my turn. I sit in the big chair. The barber puts a soft cape on me.',
          bn: 'এবার আমার পালা। আমি বড় চেয়ারে বসি। নাপিত চাচা আমার গায়ে একটি নরম কাপড় জড়িয়ে দেন।',
        },
        {
          step: 'feeling',
          en: 'The clipper makes a buzzing sound. It is only a sound, and that is okay. I hold my train and take a slow, deep breath.',
          bn: 'মেশিনটা ভোঁ ভোঁ শব্দ করে। এটা শুধুই একটা শব্দ, আর এটা ঠিক আছে। আমি ট্রেনটা ধরে ধীরে ধীরে লম্বা শ্বাস নিই।',
        },
        {
          step: 'do',
          en: 'The barber cuts my hair. It tickles a little. I sit still. Ma is right beside me.',
          bn: 'নাপিত চাচা আমার চুল কাটেন। একটু সুড়সুড়ি লাগে। আমি চুপ করে বসে থাকি। মা পাশেই আছেন।',
        },
        {
          step: 'ending',
          en: 'All done! I look in the mirror. My hair looks nice. Ma is proud, and I am proud too.',
          bn: 'শেষ! আমি আয়নায় দেখি। আমার চুল খুব সুন্দর লাগছে। মা খুশি, আমিও খুব খুশি।',
        },
      ],
    },
  };

  // An earlier week. It is not the live plan, but its story stays in the family's library.
  const earlier = preparedPlan();
  const olderPlan = {
    id: 'plan-rafi-0',
    childId: 'rafi',
    createdAt: iso(14, 16, 10),
    approvedAt: iso(14, 16, 14),
    status: 'approved',
    source: 'sample',
    model: 'Prepared sample',
    goals: [{ id: 'g1', text: EXAMPLE_GOAL }],
    activities: earlier.activities.map((a, i) => ({ ...a, id: 'a-old-' + (i + 1), goal: 'g1' })),
    story: { ...earlier.story, sheet: null, sheetStatus: 'none', cols: 3, rows: 2 },
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
      wins: ['Waited for 2 turns'],
      struggles: ['Grabbed the train on the 3rd turn'],
      triggers: [],
      mood: 'mixed',
      sleep: 'good',
    }),
    note(5, 21, 5, {
      text: 'সকালে ব্লেন্ডার চালাতেই কান চেপে ধরে খুব কেঁদেছে, শান্ত হতে প্রায় দশ মিনিট লেগেছে। নাস্তার সময় পাঁচ পর্যন্ত গোনা পর্যন্ত অপেক্ষা করেছে।',
      en: 'When I turned on the blender this morning he covered his ears and cried a lot; it took about ten minutes to calm him. At snack time he waited until the count of five.',
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
      wins: ['Waited for 4 turns', 'Asked for the story twice'],
      struggles: [],
      triggers: [],
      mood: 'good',
      sleep: 'good',
    }),
    note(1, 20, 30, {
      text: 'পাশের বাসায় ড্রিল মেশিনের শব্দে ভয় পেয়ে কেঁদেছে। পরে ক্লিপারের শব্দ মাঝারি আওয়াজে বিশ সেকেন্ড শুনেছে, ট্রেন ধরে লম্বা শ্বাস নিয়েছে। নাস্তার সময় সাত পর্যন্ত অপেক্ষা করেছে।',
      en: 'He was frightened and cried at the sound of a drill next door. Later he listened to the clipper sound at medium volume for twenty seconds, holding his train and taking a deep breath. At snack time he waited to a count of seven.',
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

  // Strategies Dr. Farhana has approved for Rafi. The Help screen can only ever offer these.
  const rafiStrategies = [
    {
      id: 'noise',
      keys: { en: ['noise', 'noisy', 'loud', 'blender', 'drill', 'clipper', 'sound', 'scream', 'cover'], bn: ['শব্দ', 'ব্লেন্ডার', 'চিৎকার', 'ড্রিল', 'কান চেপে'] },
      title: { en: 'When a loud noise upsets Rafi', bn: 'জোরে শব্দে রাফি অস্থির হলে' },
      steps: {
        en: ['Switch the noise off, or take Rafi to a quieter room.', 'Offer his ear defenders or headphones if he will wear them.', 'Speak softly and sit beside him until he calms.'],
        bn: ['শব্দ বন্ধ করুন, অথবা রাফিকে শান্ত ঘরে নিয়ে যান।', 'ওর হেডফোন বা কান ঢাকার জিনিস দিন, যদি পরতে চায়।', 'নরম গলায় কথা বলুন, শান্ত না হওয়া পর্যন্ত পাশে বসে থাকুন।'],
      },
      say: { en: 'The noise is gone. You are safe.', bn: 'শব্দ চলে গেছে। তুমি নিরাপদ।' },
    },
    {
      id: 'wait',
      keys: { en: ['wait', 'turn', 'grab', 'share', 'snatch'], bn: ['পালা', 'অপেক্ষা', 'কেড়ে'] },
      title: { en: 'When Rafi cannot wait', bn: 'রাফি অপেক্ষা করতে না পারলে' },
      steps: {
        en: ['Show the wait card and count slowly to 5.', 'Say in a calm voice: “Rafi’s turn is coming.”', 'Give the toy or snack as soon as the count ends and praise him: “Nice waiting!”'],
        bn: ['“অপেক্ষা” কার্ড দেখিয়ে ধীরে ধীরে ৫ পর্যন্ত গুনুন।', 'শান্ত গলায় বলুন: “রাফির পালা আসছে।”', 'গোনা শেষ হলেই খেলনা বা নাস্তা দিন আর প্রশংসা করুন: “খুব সুন্দর অপেক্ষা করেছ!”'],
      },
      say: { en: 'First wait, then your turn.', bn: 'আগে অপেক্ষা, তারপর তোমার পালা।' },
    },
    {
      id: 'food',
      keys: { en: ['eat', 'eating', 'food', 'meal', 'refuse', 'refusing', 'hungry', 'lunch', 'dinner', 'breakfast'], bn: ['খেতে', 'খাবার', 'খাচ্ছে না', 'ভাত'] },
      title: { en: 'When Rafi does not want to eat', bn: 'রাফি খেতে না চাইলে' },
      steps: {
        en: ['Stay calm and keep the meal short and quiet.', 'Put one small bite of a food he likes beside the new food.', 'Do not force him. Praise any touch or taste, and try again at the next meal.'],
        bn: ['শান্ত থাকুন, খাওয়ার সময় ছোট আর নিরিবিলি রাখুন।', 'নতুন খাবারের পাশে ওর পছন্দের খাবারের একটি ছোট টুকরো রাখুন।', 'জোর করবেন না। ছুঁয়ে দেখলে বা চাখলেও প্রশংসা করুন, পরের বেলায় আবার চেষ্টা করুন।'],
      },
      say: { en: 'You can try one small bite.', bn: 'তুমি ছোট একটু চেখে দেখতে পারো।' },
    },
    {
      id: 'sleep',
      keys: { en: ['sleep', 'sleeping', 'bed', 'bedtime', 'night', 'awake'], bn: ['ঘুম', 'ঘুমাতে', 'রাতে'] },
      title: { en: 'When Rafi will not go to sleep', bn: 'রাফি ঘুমাতে না চাইলে' },
      steps: {
        en: ['Dim the lights and turn off screens and loud sounds.', 'Follow the same short routine: wash, pyjamas, one quiet story.', 'Sit beside him quietly, and keep bedtime at the same hour each night.'],
        bn: ['আলো কমিয়ে দিন, মোবাইল-টিভি ও জোরে শব্দ বন্ধ করুন।', 'প্রতিদিন একই ছোট নিয়ম: মুখ ধোয়া, ঘুমের জামা, একটি শান্ত গল্প।', 'পাশে চুপচাপ বসে থাকুন, আর প্রতি রাতে একই সময়ে শুতে নিন।'],
      },
      say: { en: 'It is time to rest. I am right here.', bn: 'এখন বিশ্রামের সময়। আমি এখানেই আছি।' },
    },
  ];

  return {
    rev: 1,
    // The other therapists are sample figures. Dr. Farhana's own row is worked out live from the data below.
    centre: {
      name: 'Shishu Bikash Therapy Centre', city: 'Dhaka', manager: 'Shirin Akter',
      team: [
        { name: 'Sadia Rahman', children: 9, active: 5, summaries: 6 },
        { name: 'Farhan Ahmed', children: 7, active: 6, summaries: 7 },
        { name: 'Tania Sultana', children: 8, active: 7, summaries: 8 },
      ],
    },
    therapist: { name: 'Dr. Farhana Rahman', short: 'Dr. Farhana', phone: '+880 1700 000 000' },
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
        phone: '+880 1700 000 001',
        invite: 'SHI-RAFI-26',
        strategies: rafiStrategies,
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
        phone: '+880 1700 000 002',
        invite: 'SHI-AYAAN-26',
        strategies: [],
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
        phone: '+880 1700 000 003',
        invite: 'SHI-MEHJABIN-26',
        strategies: [],
      },
    ],
    plans: [rafiPlan, olderPlan],
    logs,
    done: [
      [0, 'a1'],
      [1, 'a1'], [1, 'a2'], [1, 'a3'], [1, 'a4'],
      [2, 'a1'], [2, 'a2'], [2, 'a4'],
      [3, 'a3'],
      [4, 'a2'], [4, 'a4'],
      [5, 'a1'], [5, 'a2'],
      [6, 'a1'], [6, 'a4'],
    ].map(([n, activityId]) => ({ childId: 'rafi', date: dayKey(daysAgo(n)), activityId })),
    summaries: { rafi: summary },
    // Help a parent asked for. Yesterday's is a sample, so the doctor's Alerts screen is not empty on day one.
    helps: [
      { id: 'help-seed-1', childId: 'rafi', parent: 'Nusrat', at: iso(1, 18, 5), text: 'Screaming and covering his ears when the blender is on', lang: 'en', kind: 'advice', strategyId: 'noise', helped: true, seen: true },
    ],
    reminders: [],
    reports: [],
    aiLog: [
      {
        id: 'ai-seed-1',
        at: iso(7, 16, 10),
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
        { step: 'situation', art: 'blender1', en: 'My name is Rafi. This is our kitchen. Ma cooks here.', bn: 'আমার নাম রাফি। এটা আমাদের রান্নাঘর। মা এখানে রান্না করেন।' },
        { step: 'feeling', art: 'blender2', en: 'Sometimes Ma uses the blender. It makes a loud noise. My ears can feel uncomfortable. That is okay.', bn: 'মা মাঝে মাঝে ব্লেন্ডার চালান। এতে জোরে শব্দ হয়। আমার কানে অস্বস্তি লাগতে পারে। এটা ঠিক আছে।' },
        { step: 'do', art: 'blender3', en: 'When it is loud, I can put on my blue headphones. Or I can say, “Ma, please stop for a moment.”', bn: 'শব্দ হলে আমি আমার নীল হেডফোন পরতে পারি। অথবা বলতে পারি, “মা, একটু থামো।”' },
        { step: 'ending', art: 'blender4', en: 'The noise stops soon. Then Ma and I drink yummy juice. I did it!', bn: 'শব্দ একটু পরেই থেমে যায়। তারপর মা আর আমি মজার জুস খাই। আমি পেরেছি!' },
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
