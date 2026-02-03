import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const LANG_MAP = { '1': 'en', '2': 'vi', 'english': 'en', 'vietnamese': 'vi' };
export function loadLocale(lang) {
  const code = LANG_MAP[String(lang).toLowerCase()] || 'en';
  const file = join(__dirname, code + '.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : JSON.parse(readFileSync(join(__dirname, 'en.json'), 'utf8'));
}
export function t(msg, key, vars = {}) {
  let v = msg; for (const k of key.split('.')) v = v?.[k];
  if (typeof v !== 'string') return key;
  let i = 0; const vk = Object.keys(vars);
  return v.replace(/%s/g, () => vars[vk[i++]] ?? '').replace(/\$\{(\w+)\}/g, (_, n) => vars[n] ?? '');
}
