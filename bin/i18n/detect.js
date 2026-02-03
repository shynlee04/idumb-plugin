// System language detection for iDumb CLI
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Detect system locale from environment variables
 * @returns {string} - 'en' or 'vi'
 */
export function detectSystemLocale() {
  const envLocale = process.env.LANG || 
                    process.env.LANGUAGE || 
                    process.env.LC_ALL || 
                    process.env.LC_MESSAGES || '';
  
  const langCode = envLocale.split(/[_.-]/)[0]?.toLowerCase();
  
  if (langCode === 'vi' || langCode === 'vie') return 'vi';
  return 'en';
}

/**
 * Load saved locale preference from .idumb config
 * @param {string} configPath - Path to config.json
 * @returns {string|null}
 */
export function loadSavedLocale(configPath) {
  try {
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      const lang = config?.user?.language?.communication;
      if (lang === 'vietnamese' || lang === 'vi') return 'vi';
      if (lang === 'english' || lang === 'en') return 'en';
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Check global OpenCode config for locale
 * @returns {string|null}
 */
export function loadGlobalLocale() {
  const globalConfigPath = join(homedir(), '.config', 'opencode', '.idumb', 'config.json');
  return loadSavedLocale(globalConfigPath);
}

/**
 * Get best locale: saved preference → global → system → default
 * @param {string} projectConfigPath - Path to project config.json
 * @returns {string}
 */
export function getBestLocale(projectConfigPath) {
  // 1. Check project-level config
  const projectLocale = loadSavedLocale(projectConfigPath);
  if (projectLocale) return projectLocale;
  
  // 2. Check global config
  const globalLocale = loadGlobalLocale();
  if (globalLocale) return globalLocale;
  
  // 3. Detect from system
  return detectSystemLocale();
}

export default { detectSystemLocale, loadSavedLocale, loadGlobalLocale, getBestLocale };
