// The words sent to the AI. Kept in one place so the team can show judges exactly what the AI is asked to do.

const SAFETY = `You are BridgeAI, a writing assistant inside a tool used by a qualified autism therapist and the families they work with.
Rules you always follow:
- You never diagnose, never suggest medication, and never give medical advice.
- You only turn the therapist's own goals into simple home practice, or organise what a parent reported.
- A therapist reviews everything you write before a parent sees it, so be concrete and easy to check.
- Use plain, warm, respectful language. Never describe the child as a problem.
- Answer with one JSON object only, no other text.`;

export const ICONS = ['turn', 'wait', 'sound', 'book', 'breath', 'play', 'talk', 'touch', 'food', 'sleep', 'outdoor', 'dress'];

export function planPrompt(child, goals) {
  return {
    system: SAFETY,
    user: `Child: ${child.name} (Bangla spelling: ${child.name_bn}), age ${child.age}. Likes: ${child.likes}. Sensitive to: ${child.sensitivities}. Parent at home: ${child.parent}. Family language: Bangla.

The therapist's goals for this week:
${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Write a home practice plan and one social story.

ACTIVITIES: exactly ${Math.min(4, Math.max(2, goals.length * 2))} in total, shared evenly across the goals. Each one takes 3 to 6 minutes, needs only things found in an ordinary Bangladeshi home, uses what the child likes where it fits, and has exactly 3 short steps a tired parent can follow. The last step says what to do if the child gets upset or how to praise.

SOCIAL STORY: one story of exactly 6 pages about the situation in the goals that would most benefit from preparation. Follow these rules:
1. Four steps in this order: the situation (pages 1 and 2), how I feel (page 3), what I can do (pages 4 and 5), a good ending (page 6). Give every page its "step": situation, feeling, do or ending.
2. One idea per page, 1 to 3 short sentences, present tense, concrete and literal. No metaphors, no scary words.
3. Write it in the child's own voice ("I"), and say the child's name on page 1 ("My name is ${child.name}.").
4. Make the feeling ordinary, never frightening: say that it is okay.
5. For "what I can do", use only calming strategies the therapist has approved for this child: ${(child.strategies || []).map((x) => x.title.en).join('; ') || 'none listed, so keep it to a slow deep breath, a favourite toy, or asking an adult for a break'}. Do not invent other techniques.
6. The same place and the same people on every page.
For each page also give "scene": one sentence in English describing exactly what the picture shows (who, where, doing what), for an illustrator. Scenes must not need any written words in the picture.

Every text is needed in English ("en") and in natural, simple Bangla ("bn") as spoken in Dhaka. Use Bangla numerals in Bangla text.

Return JSON in exactly this shape:
{
  "activities": [
    { "goal": 1, "icon": "one of: ${ICONS.join(', ')}", "minutes": 5,
      "title": {"en": "", "bn": ""}, "when": {"en": "time of day, 2-3 words", "bn": ""},
      "steps": {"en": ["", "", ""], "bn": ["", "", ""]} }
  ],
  "story": {
    "title": {"en": "", "bn": ""},
    "setting": "one sentence in English describing the place and any other recurring people and how they look",
    "pages": [ {"step": "situation | feeling | do | ending", "en": "", "bn": "", "scene": ""} ]
  }
}
"goal" is the number of the goal the activity belongs to.`,
  };
}

export function storySheetPrompt(child, story) {
  const pos = ['top left', 'top middle', 'top right', 'bottom left', 'bottom middle', 'bottom right'];
  return `A sheet of exactly six square illustration panels arranged in a precise grid of 3 columns and 2 rows, all panels exactly the same size, separated by thin straight white gutters, with a thin white border around the sheet. No text, no letters, no numbers, no captions anywhere.
Style for every panel: soft rounded 3D clay illustration for a young children's picture book, simple and uncluttered, calm pastel colours with gentle mint-green and warm cream tones, soft even light, clear literal scenes that are easy to understand, nothing frightening.
The same child appears in every panel and must look identical each time: ${child.name}, ${child.look}, with a simple friendly face with small dot eyes. Also recurring: ${child.family}. ${story.setting || ''}
${story.pages.map((p, i) => `Panel ${i + 1} (${pos[i]}): ${p.scene}`).join('\n')}`;
}

export function notePrompt(child, goals, text) {
  return {
    system: SAFETY,
    user: `A parent (${child.parent}) left this daily voice note about ${child.name}, age ${child.age}. It may be in Bangla, English, or a mix, and may contain speech-recognition mistakes.

Note: """${text}"""

This week's goals from the therapist:
${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Organise the note. Only use what the parent actually said; do not guess or add advice.

Return JSON:
{
  "clean": "the note in its original language with obvious speech-recognition mistakes fixed, meaning unchanged",
  "lang": "bn or en",
  "en": "faithful English translation (or the cleaned English note)",
  "wins": ["short phrases, things that went well, max 3"],
  "struggles": ["short phrases, things that were hard, max 3"],
  "triggers": ["what seemed to set off a hard moment, e.g. 'Blender noise', max 3"],
  "mood": "good | mixed | hard",
  "sleep": "good | poor | unknown"
}
Use empty arrays when nothing was said.`,
  };
}

export function transcribePrompt() {
  return {
    system: 'You transcribe short voice notes from parents. Answer with one JSON object only.',
    user: 'Transcribe this voice note exactly as spoken, in the language spoken (Bangla in Bangla script, English in English). Do not translate or add anything. Return {"text": "...", "lang": "bn or en"}. If there is no speech, return {"text": "", "lang": "en"}.',
  };
}

export function summaryPrompt(child, goals, logs, doneCounts) {
  return {
    system: SAFETY,
    user: `Prepare a one-page pre-session summary for the therapist of ${child.name}, age ${child.age} (parent: ${child.parent}).

This week's goals:
${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Parent's daily notes (English translation, oldest first):
${logs.map((l) => `- ${l.date}: ${l.en || l.text} [mood: ${l.mood || 'unknown'}; sleep: ${l.sleep || 'unknown'}; triggers: ${(l.triggers || []).join(', ') || 'none mentioned'}]`).join('\n')}

Home activities marked done this week: ${doneCounts}.

Write only what the notes support, and name the evidence. Spot patterns across days (for example a repeated trigger, sleep and next-day behaviour, what helps). "days" is the number of notes that show the pattern. Suggestions are options for the therapist to consider in the next session, not instructions to the parent, and never medical.

Return JSON:
{
  "headline": "one or two sentences: the most important thing to know before the session",
  "goals": [ {"goal": "the goal text", "status": "improving | steady | needs_support", "evidence": "one or two sentences with specifics from the notes"} ],
  "patterns": [ {"title": "short", "days": 2, "detail": "one sentence"} ],
  "suggestions": ["2 or 3 short options for the therapist"],
  "askParent": ["2 short questions worth asking the parent in the session"],
  "parentMessage": {"en": "one or two encouraging sentences to the parent, addressed by name, no advice beyond the approved plan", "bn": "the same in natural Bangla"}
}
Include one entry in "goals" per goal, and 2 to 4 patterns. If a goal was only just set and no note mentions it yet, use status "steady" and say there are no notes on it yet.`,
  };
}
