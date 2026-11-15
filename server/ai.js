// All AI access lives here. Keys are read at runtime, kept in memory, never logged or sent to the browser.
//   Chat (plan, story text, note analysis, summary): Gemini, any OpenAI-compatible API, or an Azure deployment.
//   Speech-to-text: Gemini when a Gemini key is set; otherwise the browser's own speech recognition is used.
//   Pictures: gpt-image-2 through the local `neoimg` command.
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE_FILE = path.join(process.env.DATA_DIR || path.join(ROOT, 'data'), 'cache.json');

const ASTRA_URL = (process.env.ASTRA_URL || '').replace(/\/$/, ''); // the Azure endpoint is set in .env, never in the code
const astraKey = () => {
  if (process.env.ASTRA_API_KEY) return process.env.ASTRA_API_KEY;
  try {
    return fs.readFileSync(path.join(os.homedir(), '.neogpt', 'astra-api-key'), 'utf8').trim() || null;
  } catch {
    return null;
  }
};

function chatProviders() {
  const list = [];
  if (process.env.GEMINI_API_KEY) list.push({ id: 'gemini', model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', label: 'Google Gemini' });
  if (process.env.OPENAI_API_KEY) list.push({ id: 'openai', model: process.env.OPENAI_MODEL || 'gpt-4o-mini', label: 'OpenAI-compatible' });
  if (ASTRA_URL && astraKey()) list.push({ id: 'astra', model: process.env.ASTRA_MODEL || 'gpt-6-astra', label: 'GPT-6 Astra (Azure)' });
  const want = process.env.AI_PROVIDER;
  return want ? list.filter((p) => p.id === want).concat(list.filter((p) => p.id !== want)) : list;
}

const NEOIMG = process.env.NEOIMG || path.join(os.homedir(), '.local', 'bin', 'neoimg');

// What the app shows in "AI use": which tool is connected and whether its last call worked.
export const health = { chat: { ok: null, provider: null, model: null, error: null }, image: fs.existsSync(NEOIMG) };

export function aiStatus() {
  const p = chatProviders();
  return {
    chat: { configured: p.length > 0, ok: health.chat.ok, model: health.chat.model || p[0]?.model || null, label: health.chat.provider || p[0]?.label || null, error: health.chat.error },
    stt: Boolean(process.env.GEMINI_API_KEY),
    image: health.image,
  };
}

// ---------- cache: a real AI answer is kept so a dropped connection on stage can reuse it ----------
let cache = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
} catch {}
const keyOf = (kind, input) => crypto.createHash('sha1').update(kind + '\n' + JSON.stringify(input)).digest('hex');
function remember(k, value) {
  cache[k] = value;
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
}

function parseJson(text) {
  const t = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(t);
  } catch {
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error('The AI answer was not valid JSON.');
  }
}

async function post(url, headers, body, ms = 90_000) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(ms) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = j.error?.message || `request failed (${res.status})`;
    const err = new Error(res.status === 401 || res.status === 403 ? 'the API key was rejected' : msg.slice(0, 200));
    err.status = res.status;
    throw err;
  }
  return j;
}

async function callProvider(p, { system, user, audio, image }) {
  const picture = image ? `data:${image.mime};base64,${image.data}` : null;
  if (p.id === 'gemini') {
    const parts = [{ text: user }];
    if (audio) parts.push({ inline_data: { mime_type: audio.mime, data: audio.data } });
    if (image) parts.push({ inline_data: { mime_type: image.mime, data: image.data } });
    const j = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent`,
      { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0.5 } },
    );
    return (j.candidates?.[0]?.content?.parts || []).map((x) => x.text || '').join('');
  }
  if (audio) throw new Error('this AI provider cannot listen to audio');
  if (p.id === 'openai') {
    const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const j = await post(`${base}/chat/completions`, { authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, {
      model: p.model,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: picture ? [{ type: 'text', text: user }, { type: 'image_url', image_url: { url: picture } }] : user }],
    });
    return j.choices?.[0]?.message?.content || '';
  }
  // GPT-6 Astra on Azure (Responses API)
  const j = await post(`${ASTRA_URL}/responses`, { 'api-key': astraKey() }, {
    model: p.model,
    reasoning: { effort: 'low' },
    input: [{ role: 'system', content: system }, { role: 'user', content: picture ? [{ type: 'input_text', text: user }, { type: 'input_image', image_url: picture }] : user }],
    text: { format: { type: 'json_object' } },
  }, 150_000);
  if (j.output_text) return j.output_text;
  return (j.output || []).flatMap((o) => o.content || []).map((c) => c.text || '').join('');
}

/**
 * Ask the chat model for a JSON answer.
 * @returns {Promise<{data:object, model:string, cached:boolean}>}
 */
export async function ask(kind, { system, user, audio, image, cacheInput }) {
  const list = chatProviders().filter((p) => !audio || p.id === 'gemini');
  const k = cacheInput ? keyOf(kind, cacheInput) : null;
  let lastError = list.length ? null : new Error('no AI key is set');
  for (const p of list) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const data = parseJson(await callProvider(p, { system, user, audio, image }));
        health.chat = { ok: true, provider: p.label, model: p.model, error: null };
        if (k) remember(k, { data, model: p.model });
        return { data, model: p.model, cached: false };
      } catch (e) {
        lastError = e;
        if (e.status && e.status < 500 && e.status !== 429) break; // a bad key or request will not get better
        await new Promise((r) => setTimeout(r, 1200 * attempt));
      }
    }
  }
  health.chat = { ...health.chat, ok: false, error: lastError.message };
  if (k && cache[k]) return { ...cache[k], cached: true };
  const err = new Error(`AI is not connected: ${lastError.message}.`);
  err.aiDown = true;
  throw err;
}

// A tiny call at start-up so the app can show whether AI is really connected.
export async function ping() {
  if (!chatProviders().length) {
    health.chat = { ok: false, provider: null, model: null, error: 'no AI key is set' };
    return;
  }
  try {
    await ask('ping', { system: 'Reply in JSON.', user: 'Return {"ok":true}' });
  } catch {}
}

// ---------- pictures ----------
let imageQueue = Promise.resolve();
/** Draws one picture with gpt-image-2 and saves it at `outFile`. Calls run one at a time. */
export function drawImage(prompt, outFile, { size = process.env.IMAGE_SIZE || '2k', ratio = '3:2', quality = process.env.IMAGE_QUALITY || 'high' } = {}) {
  const run = () =>
    new Promise((resolve, reject) => {
      if (!fs.existsSync(NEOIMG)) return reject(new Error('the picture tool (neoimg) is not installed'));
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      execFile(NEOIMG, [prompt, '-q', quality, '-k', size, '-r', ratio, '-o', outFile], { timeout: 600_000, maxBuffer: 4 << 20 }, (err) => {
        if (err || !fs.existsSync(outFile)) return reject(new Error('the picture could not be made'));
        resolve(outFile);
      });
    });
  const job = imageQueue.then(run, run);
  imageQueue = job.catch(() => {});
  return job;
}
