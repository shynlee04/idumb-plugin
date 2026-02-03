// ESM i18n loader for iDumb CLI
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load locale files at module initialization
const locales = {
  en: JSON.parse(readFileSync(join(__dirname, 'locales/en.json'), 'utf8')),
  vi: JSON.parse(readFileSync(join(__dirname, 'locales/vi.json'), 'utf8'))
};

let currentLocale = 'en';

/**
 * Set the current locale
 * @param {string} locale - 'en' or 'vi'
 */
export function setLocale(locale) {
  if (locales[locale]) {
    currentLocale = locale;
  }
}

/**
 * Get current locale
 * @returns {string}
 */
export function getLocale() {
  return currentLocale;
}

/**
 * Get available locales
 * @returns {string[]}
 */
export function getAvailableLocales() {
  return Object.keys(locales);
}

/**
 * Translate a key with optional interpolation
 * @param {string} key - Translation key (dot notation supported)
 * @param {object} values - Interpolation values
 * @returns {string}
 */
export function t(key, values = {}) {
  const keys = key.split('.');
  let result = locales[currentLocale];
  
  for (const k of keys) {
    result = result?.[k];
    if (result === undefined) {
      // Fallback to English
      result = locales.en;
      for (const k2 of keys) {
        result = result?.[k2];
        if (result === undefined) break;
      }
      break;
    }
  }
  
  if (typeof result !== 'string') {
    return key; // Return key if not found
  }
  
  // Simple interpolation: {{name}} → values.name
  return result.replace(/\{\{(\w+)\}\}/g, (_, name) => 
    values[name] !== undefined ? values[name] : `{{${name}}}`
  );
}

export default { t, setLocale, getLocale, getAvailableLocales };
