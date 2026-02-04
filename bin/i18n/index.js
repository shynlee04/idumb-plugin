/**
 * iDumb i18n Module
 * 
 * Provides internationalization for the installer and CLI
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Available locales
const LOCALES = ['en', 'vi'];
const DEFAULT_LOCALE = 'en';

// Current locale
let currentLocale = DEFAULT_LOCALE;
let translations = {};

/**
 * Load locale file
 */
function loadLocale(locale) {
  const normalizedLocale = LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;

  try {
    const localePath = join(__dirname, 'locales', `${normalizedLocale}.json`);
    const content = readFileSync(localePath, 'utf8');
    translations = JSON.parse(content);
    currentLocale = normalizedLocale;
  } catch (e) {
    // Fallback to English if locale file not found
    if (normalizedLocale !== 'en') {
      console.warn(`Locale '${normalizedLocale}' not found, falling back to English`);
      loadLocale('en');
    } else {
      // Create minimal translations if en.json also missing
      translations = {
        installer: {
          welcome: { title: 'iDumb' },
          steps: {}
        }
      };
    }
  }

  return translations;
}

/**
 * Get current locale
 */
function getLocale() {
  return currentLocale;
}

/**
 * Set locale and load translations
 */
function setLocale(locale) {
  currentLocale = LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  loadLocale(currentLocale);
}

/**
 * Get translation by key path (e.g., 'installer.welcome.title')
 * Supports {{variable}} substitution
 */
function t(keyPath, variables = {}) {
  const keys = keyPath.split('.');
  let value = translations;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      // Return key if translation not found
      return keyPath;
    }
  }

  // Handle string result with variable substitution
  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
      return variables[varName] !== undefined ? variables[varName] : `{{${varName}}}`;
    });
  }

  return value;
}

/**
 * Get all available locales
 */
function getAvailableLocales() {
  return [...LOCALES];
}

// Initialize with default locale
loadLocale(DEFAULT_LOCALE);

// Export as default object and named exports
export { t, setLocale, getLocale, getAvailableLocales, loadLocale };

export default {
  t,
  setLocale,
  getLocale,
  getAvailableLocales,
  loadLocale
};
