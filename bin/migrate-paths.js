#!/usr/bin/env node
/**
 * iDumb Path Migration Script
 *
 * Consolidates duplicate directories from multiple init iterations:
 * - .idumb/idumb-brain/ → .idumb/brain/
 * - .idumb/idumb-project-output/ → .idumb/project-core/
 * - .idumb/sessions/ (at root) → .idumb/sessions/ (consolidated)
 *
 * Usage: node bin/migrate-paths.js
 */

import { existsSync, readdirSync, mkdirSync, renameSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = process.cwd()

/**
 * Migration configurations
 */
const MIGRATIONS = [
  {
    from: '.idumb/idumb-brain',
    to: '.idumb/brain',
    strategy: 'merge',
    description: 'Consolidate duplicate brain directories'
  },
  {
    from: '.idumb/idumb-project-output',
    to: '.idumb/project-core',
    strategy: 'merge',
    description: 'Move project output to canonical location'
  },
  {
    from: '.idumb/sessions',
    to: '.idumb/sessions',
    strategy: 'keep',
    description: 'Keep sessions at root (already correct)'
  }
]

/**
 * Generates a backup path with timestamp
 */
function backupPath(path) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${path}.backup-${timestamp}`
}

/**
 * Recursively merges two directories
 * Preserves existing files in destination, moves only new ones
 */
function mergeDirectory(from, to, dryRun = false) {
  console.log(`\n📁 Merging ${from} → ${to}`)

  if (!existsSync(from)) {
    console.log(`  ⊘ Source does not exist, skipping`)
    return
  }

  if (!existsSync(to)) {
    console.log(`  → Creating destination directory`)
    if (!dryRun) mkdirSync(to, { recursive: true })
  }

  const files = readdirSync(from, { withFileTypes: true })
  let moved = 0
  let skipped = 0

  for (const file of files) {
    const fromPath = join(from, file.name)
    const toPath = join(to, file.name)

    if (existsSync(toPath)) {
      console.log(`  ⚠️  Skipping existing: ${file.name}`)
      skipped++
    } else {
      if (!dryRun) {
        if (file.isDirectory()) {
          mergeDirectory(fromPath, toPath, dryRun)
        } else {
          renameSync(fromPath, toPath)
        }
      }
      console.log(`  ✅ Moved: ${file.name}`)
      moved++
    }
  }

  console.log(`  📊 Summary: ${moved} moved, ${skipped} skipped`)

  // Try to remove empty source directory
  try {
    if (!dryRun && existsSync(from)) {
      const remaining = readdirSync(from)
      if (remaining.length === 0) {
        rmSync(from, { recursive: true })
        console.log(`  🧹 Removed empty source directory`)
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Could not remove source directory: ${error.message}`)
  }
}

/**
 * Runs the migration process
 */
function runMigration(dryRun = false) {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║        iDumb Path Migration - Consolidate Duplicates      ║')
  console.log('╚════════════════════════════════════════════════════════╝')
  console.log(`\n📂 Project Root: ${PROJECT_ROOT}`)
  console.log(`🧪 Dry Run: ${dryRun ? 'YES (no changes will be made)' : 'NO (actual migration)'}\n`)

  let completed = 0
  let skipped = 0

  for (const migration of MIGRATIONS) {
    console.log(`\n─────────────────────────────────────────────────────────`)
    console.log(`📋 Migration: ${migration.description}`)
    console.log(`   From: ${migration.from}`)
    console.log(`   To:   ${migration.to}`)
    console.log(`   Strategy: ${migration.strategy}`)

    const fromPath = join(PROJECT_ROOT, migration.from)
    const toPath = join(PROJECT_ROOT, migration.to)

    if (!existsSync(fromPath)) {
      console.log(`\n⊘ Skipped: Source does not exist`)
      skipped++
      continue
    }

    if (migration.strategy === 'merge') {
      // Check if we need to backup
      if (existsSync(toPath)) {
        const backup = backupPath(toPath)
        console.log(`\n💾 Backup would be created: ${backup}`)
        console.log(`   (Backup not implemented in dry-run mode)`)

        if (!dryRun) {
          // TODO: Implement actual backup
          console.log(`   ⚠️  Warning: Backup not yet implemented`)
        }
      }

      // Execute merge
      mergeDirectory(fromPath, toPath, dryRun)
      completed++

    } else if (migration.strategy === 'keep') {
      console.log(`\n✓ Keeping as-is (already in correct location)`)
      completed++
    }

    console.log(`✅ Complete: ${migration.from}`)
  }

  console.log(`\n═════════════════════════════════════════════════════════`)
  console.log(`📊 Migration Summary:`)
  console.log(`   Completed: ${completed}/${MIGRATIONS.length}`)
  console.log(`   Skipped: ${skipped}/${MIGRATIONS.length}`)

  if (dryRun) {
    console.log(`\n💡 This was a DRY RUN. No changes were made.`)
    console.log(`   Run with --actual flag to perform migration:`)
    console.log(`   node bin/migrate-paths.js --actual`)
  } else {
    console.log(`\n✨ Migration complete!`)
    console.log(`\n🔍 Next steps:`)
    console.log(`   1. Verify structure: ls -la .idumb/`)
    console.log(`   2. Check for remaining duplicates`)
    console.log(`   3. Test plugin functionality`)
    console.log(`   4. Commit changes`)
  }
  console.log(`═════════════════════════════════════════════════════════\n`)
}

// Check command line arguments
const args = process.argv.slice(2)
const dryRun = !args.includes('--actual')

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
iDumb Path Migration Script

Usage:
  node bin/migrate-paths.js [options]

Options:
  --help, -h     Show this help message
  --actual       Perform actual migration (default: dry-run)

Description:
  Consolidates duplicate .idumb/ directories from multiple init iterations.
  By default, runs in dry-run mode to show what would happen.

Examples:
  node bin/migrate-paths.js           # Dry-run (see what would happen)
  node bin/migrate-paths.js --actual  # Perform actual migration
`)
  process.exit(0)
}

// Run migration
runMigration(dryRun)
