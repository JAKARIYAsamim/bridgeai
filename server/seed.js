// The demo data itself lives in public/seed-data.js, so the browser-only preview can use the same week.
import fs from 'fs';
import path from 'path';
import { seed as makeSeed, dayKey, daysAgo, newChild, editChild, profileText, scanFields, scanShape, SAMPLE_SCAN, fromLibrary, dailyFrom, noStory, progressEntry, suggestProgress, approvedProgress, GAS, sharedProfile } from '../public/seed-data.js';

// The barber story's pictures are one sheet of six panels. Until that file exists the app shows simple symbols instead.
const sheetFile = path.resolve(import.meta.dirname, '..', 'public', 'art', 'story-barber.png');

export { dayKey, daysAgo, newChild, editChild, profileText, scanFields, scanShape, SAMPLE_SCAN, fromLibrary, dailyFrom, noStory, progressEntry, suggestProgress, approvedProgress, GAS, sharedProfile };
export const seed = () => makeSeed({ barberSheet: fs.existsSync(sheetFile) });
