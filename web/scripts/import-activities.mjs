// Converts data/activities.csv (exported from the content team's sheet) into data/activities.json.
// Every card is checked against the Activity template; any error stops the import.
// Usage: npm run import:activities
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = join(root, 'data', 'activities.csv');
const jsonPath = join(root, 'data', 'activities.json');

/** Minimal RFC 4180 parser: quoted fields may contain commas, quotes ("") and newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

const nonEmpty = z.string().trim().min(1);
const Step = z.object({ text_bn: nonEmpty, text_en: nonEmpty, image: nonEmpty });
const Activity = z.object({
  id: z.string().regex(/^[A-Z]{3}-\d{2}$/, 'id must look like SOC-01'),
  title_en: nonEmpty,
  title_bn: nonEmpty,
  domain: z.enum(['communication', 'social', 'imitation_play', 'sensory', 'daily_living', 'behaviour', 'motor', 'early_learning', 'caregiver_wellbeing']),
  routine_slot: z.enum(['morning', 'mealtime', 'bath_toilet', 'play', 'outing', 'bedtime', 'any']),
  age_bands: z.array(z.enum(['under_3', '3_5', '6_9', '10_plus', 'parent'])).min(1),
  comm_levels: z.array(z.enum(['preverbal', 'words_gestures', 'phrases', 'conversational', 'aac'])).min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  minutes: z.number().int().positive(),
  why_bn: nonEmpty,
  why_en: nonEmpty,
  needs_bn: z.array(nonEmpty).min(1),
  needs_en: z.array(nonEmpty).min(1),
  steps: z.array(Step).min(3, 'needs at least 3 steps').max(6, 'at most 6 steps'),
  success_bn: nonEmpty,
  success_en: nonEmpty,
  if_upset_bn: nonEmpty,
  if_upset_en: nonEmpty,
  video_url: z.string().url().optional(),
  safety_note_bn: nonEmpty,
  safety_note_en: nonEmpty,
  conflicts_with_flags: z.array(nonEmpty),
  evidence: z.array(nonEmpty).min(1),
  status: z.enum(['draft', 'reviewed', 'archived']),
  version: z.number().int().positive(),
  cover: nonEmpty,
});

const list = (s) => (s || '').split(';').map((x) => x.trim()).filter(Boolean);

const [header, ...rows] = parseCsv(readFileSync(csvPath, 'utf8'));
const cards = [];
const errors = [];
const seen = new Set();

for (const [n, cells] of rows.entries()) {
  const r = Object.fromEntries(header.map((h, i) => [h.trim(), (cells[i] ?? '').trim()]));
  const id = r.id || `row ${n + 2}`;
  const steps = [];
  for (let s = 1; s <= 6; s++) {
    const bn = r[`step${s}_bn`], en = r[`step${s}_en`];
    if (!bn && !en) continue;
    if (!bn) errors.push(`${id}: step ${s} is missing its Bangla text`);
    if (!en) errors.push(`${id}: step ${s} is missing its English text`);
    steps.push({ text_bn: bn, text_en: en, image: `/library/${r.id}/step-${s}.webp` });
  }
  const card = {
    id: r.id, title_en: r.title_en, title_bn: r.title_bn, domain: r.domain, routine_slot: r.routine_slot,
    age_bands: list(r.age_bands), comm_levels: list(r.comm_levels), difficulty: Number(r.difficulty), minutes: Number(r.minutes),
    why_bn: r.why_bn, why_en: r.why_en, needs_bn: list(r.needs_bn), needs_en: list(r.needs_en), steps,
    success_bn: r.success_bn, success_en: r.success_en, if_upset_bn: r.if_upset_bn, if_upset_en: r.if_upset_en,
    ...(r.video_url ? { video_url: r.video_url } : {}),
    safety_note_bn: r.safety_note_bn, safety_note_en: r.safety_note_en,
    conflicts_with_flags: list(r.conflicts_with_flags), evidence: list(r.evidence),
    status: r.status, version: Number(r.version), cover: `/library/${r.id}/cover.webp`,
  };
  if (seen.has(card.id)) errors.push(`${id}: duplicate id`);
  seen.add(card.id);
  const res = Activity.safeParse(card);
  if (!res.success) for (const issue of res.error.issues) errors.push(`${id}: ${issue.path.join('.') || 'card'}: ${issue.message}`);
  // Missing images are allowed (the app shows a placeholder) but are listed so the team knows.
  if (!existsSync(join(root, 'public', 'library', r.id || '_', 'cover.webp'))) card._missingImages = true;
  cards.push(card);
}

if (errors.length) {
  console.error(`Import failed with ${errors.length} error(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const missing = cards.filter((c) => c._missingImages).map((c) => c.id);
for (const c of cards) delete c._missingImages;
writeFileSync(jsonPath, JSON.stringify(cards, null, 2) + '\n', 'utf8');
const byStatus = cards.reduce((m, c) => ((m[c.status] = (m[c.status] || 0) + 1), m), {});
console.log(`Imported ${cards.length} cards to data/activities.json (${Object.entries(byStatus).map(([k, v]) => `${v} ${k}`).join(', ')}).`);
if (missing.length) console.log(`Note: no images yet for ${missing.length} card(s); the app shows placeholders: ${missing.join(', ')}`);
