#!/usr/bin/env node
/**
 * Purge Path Poison
 * 
 * Fixes ALL incorrect path references across the codebase:
 * - .idumb/brain/ → .idumb/brain/
 * - .idumb/brain/ → .idumb/brain/
 * - .idumb/project-output/ → .idumb/project-output/
 * - .idumb/modules/ → .idumb/modules/
 */

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const REPLACEMENTS = [
  // Order matters - more specific first
  { from: /\.idumb\/idumb-brain\//g, to: '.idumb/brain/' },
  { from: /\.idumb-brain\//g, to: '.idumb/brain/' },
  { from: /\/idumb-brain\//g, to: '/brain/' },
  { from: /\.idumb\/idumb-project-output\//g, to: '.idumb/project-output/' },
  { from: /\.idumb-project-output\//g, to: '.idumb/project-output/' },
  { from: /\.idumb\/idumb-modules\//g, to: '.idumb/modules/' },
  { from: /\.idumb-modules\//g, to: '.idumb/modules/' },
];

const EXTENSIONS = ['.md', '.ts', '.js', '.json'];
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build'];

let filesFixed = 0;
let totalReplacements = 0;

function processFile(filePath) {
  const ext = extname(filePath);
  if (!EXTENSIONS.includes(ext)) return;
  
  try {
    let content = readFileSync(filePath, 'utf8');
    let modified = false;
    let fileReplacements = 0;
    
    for (const { from, to } of REPLACEMENTS) {
      const matches = content.match(from);
      if (matches) {
        content = content.replace(from, to);
        modified = true;
        fileReplacements += matches.length;
      }
    }
    
    if (modified) {
      writeFileSync(filePath, content);
      console.log(`✓ Fixed: ${filePath} (${fileReplacements} replacements)`);
      filesFixed++;
      totalReplacements += fileReplacements;
    }
  } catch (error) {
    console.error(`✗ Error: ${filePath} - ${error.message}`);
  }
}

function walkDir(dir) {
  if (!existsSync(dir)) return;
  
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      if (SKIP_DIRS.includes(item)) continue;
      
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (stat.isFile()) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    // Skip inaccessible directories
  }
}

console.log('=== PURGING PATH POISON ===\n');

const cwd = process.cwd();
walkDir(cwd);

console.log(`\n=== COMPLETE ===`);
console.log(`Files fixed: ${filesFixed}`);
console.log(`Total replacements: ${totalReplacements}`);
