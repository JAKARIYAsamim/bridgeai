// Loads bridgeai/.env (KEY=value lines) before anything else reads process.env.
import fs from 'fs';
import path from 'path';

try {
  const file = path.resolve(import.meta.dirname, '..', '.env');
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (value && process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
} catch {}
