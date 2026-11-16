// The words sent to the AI. Kept in one place so the team can show judges exactly what the AI is asked to do.
import { profileText, scanShape } from '../public/seed-data.js';

const SAFETY = `You are MIMO, a writing assistant inside a tool used by a qualified autism therapist and the families they work with.
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
    user: `Child: ${child.name} (Bangla spelling: ${child.name_bn}), age ${child.age}. Likes: ${child.likes}. Sensitive to: ${child.sensitivities}. Parent at home: ${child.parent}. Family language: Bangla.${profileText(child) ? `\nProfile recorded by the therapist (fit every activity to it; never comment on or change the diagnosis): ${profileText(child)}` : ''}

The therapist's goals for this week:
${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Write a home practice plan and one social story.

ACTIVITIES: exactly ${Math.min(4, Math.max(2, goals.length * 2))} in total, shared evenly across the goals. Each one takes 3 to 6 minutes, needs only things found in an ordinary Bangladeshi home, uses what the child likes where it fits, and has exactly 3 short steps a tired parent can follow. The last step says what to do if the child gets upset or how to praise.
For each activity also give "daily": three precise, countable targets that grow through the week (days 1-2 start small, days 3-5 build, days 6-7 stretch), each under 10 words, for example "Wait to a count of 3", "Wait to a count of 5", "Wait to a count of 10".

SOCIAL STORY: one story of exactly 6 pages about the situation in the goals that would most benefit from preparation. Write it about ${child.name} by name, in the present tense, positive and literal, 1 to 3 short sentences per page. Say what happens, what ${child.name} can do to stay calm, and end with success. No metaphors, no scary words.
For each page also give "scene": one sentence in English describing exactly what the picture shows (who, where, doing what), for an illustrator. Scenes must not need any written words in the picture.

Every text is needed in English ("en") and in natural, simple Bangla ("bn") as spoken in Dhaka. Use Bangla numerals in Bangla text.

Return JSON in exactly this shape:
{
  "activities": [
    { "goal": 1, "icon": "one of: ${ICONS.join(', ')}", "minutes": 5,
      "title": {"en": "", "bn": ""}, "when": {"en": "time of day, 2-3 words", "bn": ""},
      "steps": {"en": ["", "", ""], "bn": ["", "", ""]},
      "daily": [{"en": "target for days 1-2", "bn": ""}, {"en": "target for days 3-5", "bn": ""}, {"en": "target for days 6-7", "bn": ""}] }
  ],
  "story": {
    "title": {"en": "", "bn": ""},
    "setting": "one sentence in English describing the place and any other recurring people and how they look",
    "pages": [ {"en": "", "bn": "", "scene": ""} ]
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

/** Reading a photo of a report written by an earlier doctor, to pre-fill a new child's profile for the therapist to check. */
export function scanPrompt() {
  return {
    system: `${SAFETY}
You are reading a photo of a clinical report, prescription or assessment written earlier by another doctor. Your only job is to copy what it says into a form. A therapist will check every answer against the photo before anything is saved.
- Copy only what is written. If the report does not state something, use null or an empty list. Never guess, never infer a diagnosis or a level from the description, and never add your own opinion.
- Map the report's wording to the closest allowed answer only when the meaning is clear. If it is not clear, leave it empty and say so in "unsure".
- The report may be in English, Bangla or both, typed or handwritten.
Answer with one JSON object only.`,
    user: `Read the report in this photo and return exactly this shape:\n${scanShape()}`,
  };
}

/** A suggested progress update: a level for each goal and a short message for the parent. The therapist approves or changes it. */
export function progressPrompt(child, goals, logs, doneCount) {
  return {
    system: `${SAFETY}
You help a therapist prepare a progress update. You only SUGGEST; the therapist decides and nothing reaches the parent until they approve.
Use goal attainment scaling: -2 much less than expected, -1 where the child started, 0 the expected result, +1 better than expected, +2 much better than expected.
Base every suggestion only on the parent's notes and the practice count below. If the notes do not show a change, keep the last level. Never diagnose and never mention medication.
Answer with one JSON object only.`,
    user: `Child: ${child.name} (Bangla: ${child.name_bn}), age ${child.age}. Parent: ${child.parent}.
Goals and their last rated level:
${goals.map((g, i) => `${i + 1}. ${g.text} (last level: ${g.was})`).join('\n')}
Home activities ticked as done this week: ${doneCount}.
Parent's notes this week (oldest first):
${logs.map((l) => `- [${l.date}, day was ${l.mood}] ${l.en || l.text}`).join('\n') || '- none'}

Return exactly:
{ "goals": [ { "level": -2, "why": "one sentence naming the evidence in the notes" } ],
  "message": { "en": "two short, warm sentences for the parent: what went well and what to keep doing", "bn": "the same in natural, simple Bangla" } }
Give one entry in "goals" for each goal above, in the same order.`,
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
