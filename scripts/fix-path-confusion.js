#!/usr/bin/env node
/**
 * Path Confusion Fixer
 * 
 * Resolves duplicate directory structures in .idumb/ by:
 * 1. Identifying conflicting paths
 * 2. Migrating data from legacy to standardized locations
 * 3. Removing redundant directories
 * 4. Updating path references
 */

import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, renameSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const cwd = process.cwd();

function log(message) {
    console.log(`[PATH-FIXER] ${message}`);
}

function findIdumbDirs(rootDir) {
    const idumbDirs = [];
    
    function scan(dir) {
        if (dir.includes('node_modules')) return;
        
        try {
            const items = readdirSync(dir);
            for (const item of items) {
                const fullPath = join(dir, item);
                const stat = statSync(fullPath);
                
                if (stat.isDirectory()) {
                    if (item === '.idumb') {
                        idumbDirs.push(fullPath);
                    }
                    scan(fullPath);
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
    }
    
    scan(rootDir);
    return idumbDirs;
}

function analyzeStructure(idumbDir) {
    const structure = {
        hasBrain: existsSync(join(idumbDir, 'brain')),
        hasIdumbBrain: existsSync(join(idumbDir, 'idumb-brain')),
        hasSessions: existsSync(join(idumbDir, 'sessions')),
        hasProjectOutput: existsSync(join(idumbDir, 'project-output')),
        hasIdumbProjectOutput: existsSync(join(idumbDir, 'idumb-project-output')),
        hasModules: existsSync(join(idumbDir, 'modules')),
        hasIdumbModules: existsSync(join(idumbDir, 'idumb-modules'))
    };
    
    return structure;
}

function mergeStateFiles(sourceFile, targetFile) {
    /**
     * Merge two state.json files intelligently:
     * - Keep newer version field
     * - Merge history arrays (dedupe by timestamp)
     * - Merge anchors arrays (dedupe by id)
     * - Keep newer scalar values
     */
    if (!existsSync(sourceFile) || !existsSync(targetFile)) return false;
    
    try {
        const source = JSON.parse(readFileSync(sourceFile, 'utf8'));
        const target = JSON.parse(readFileSync(targetFile, 'utf8'));
        
        // Determine which is newer by version or initialized date
        const sourceVersion = source.version || '0.0.0';
        const targetVersion = target.version || '0.0.0';
        const sourceDate = new Date(source.initialized || 0);
        const targetDate = new Date(target.initialized || 0);
        
        // Use newer version as base, merge in older data
        const isSourceNewer = sourceVersion > targetVersion || 
            (sourceVersion === targetVersion && sourceDate > targetDate);
        
        const base = isSourceNewer ? { ...source } : { ...target };
        const older = isSourceNewer ? target : source;
        
        // Merge history arrays (dedupe by timestamp)
        if (older.history && Array.isArray(older.history)) {
            const existingTimestamps = new Set((base.history || []).map(h => h.timestamp));
            for (const entry of older.history) {
                if (!existingTimestamps.has(entry.timestamp)) {
                    base.history = base.history || [];
                    base.history.push(entry);
                }
            }
            // Sort by timestamp
            base.history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        
        // Merge anchors arrays (dedupe by id)
        if (older.anchors && Array.isArray(older.anchors)) {
            const existingIds = new Set((base.anchors || []).map(a => a.id));
            for (const anchor of older.anchors) {
                if (!existingIds.has(anchor.id)) {
                    base.anchors = base.anchors || [];
                    base.anchors.push(anchor);
                }
            }
        }
        
        // Write merged state
        writeFileSync(targetFile, JSON.stringify(base, null, 2));
        log(`  Merged state files: ${sourceFile} -> ${targetFile}`);
        return true;
    } catch (error) {
        log(`  Failed to merge state files: ${error.message}`);
        return false;
    }
}

function mergeConfigFiles(sourceFile, targetFile) {
    /**
     * Merge two config.json files:
     * - Keep newer version
     * - Preserve user settings from both
     */
    if (!existsSync(sourceFile) || !existsSync(targetFile)) return false;
    
    try {
        const source = JSON.parse(readFileSync(sourceFile, 'utf8'));
        const target = JSON.parse(readFileSync(targetFile, 'utf8'));
        
        // Keep target as base (newer location), merge source values where target is empty
        const merged = { ...target };
        
        // Deep merge user settings
        if (source.user && !merged.user) {
            merged.user = source.user;
        } else if (source.user && merged.user) {
            merged.user = { ...source.user, ...merged.user };
        }
        
        writeFileSync(targetFile, JSON.stringify(merged, null, 2));
        log(`  Merged config files: ${sourceFile} -> ${targetFile}`);
        return true;
    } catch (error) {
        log(`  Failed to merge config files: ${error.message}`);
        return false;
    }
}

function migrateData(sourceDir, targetDir, merge = false) {
    if (!existsSync(sourceDir)) return false;
    
    log(`${merge ? 'Merging' : 'Migrating'} ${sourceDir} -> ${targetDir}`);
    
    // Create target directory
    mkdirSync(targetDir, { recursive: true });
    
    try {
        const items = readdirSync(sourceDir);
        for (const item of items) {
            const sourcePath = join(sourceDir, item);
            const targetPath = join(targetDir, item);
            
            if (statSync(sourcePath).isDirectory()) {
                migrateData(sourcePath, targetPath, merge);
            } else {
                // Handle file merge/move
                if (merge && existsSync(targetPath)) {
                    // Special handling for state.json and config.json
                    if (item === 'state.json') {
                        mergeStateFiles(sourcePath, targetPath);
                        unlinkSync(sourcePath);  // Remove source after merge
                    } else if (item === 'config.json') {
                        mergeConfigFiles(sourcePath, targetPath);
                        unlinkSync(sourcePath);  // Remove source after merge
                    } else {
                        // For other files, keep target (newer location)
                        log(`  Skipping ${item} (target exists)`);
                        unlinkSync(sourcePath);  // Remove duplicate
                    }
                } else {
                    // Move file (no conflict)
                    renameSync(sourcePath, targetPath);
                }
            }
        }
        
        // Remove empty source directory
        try {
            const remaining = readdirSync(sourceDir);
            if (remaining.length === 0) {
                unlinkSync(sourceDir);
                log(`  Removed empty: ${sourceDir}`);
            }
        } catch {
            // Ignore
        }
        
        return true;
    } catch (error) {
        log(`Migration failed: ${error.message}`);
        return false;
    }
}

function fixProject(projectDir) {
    log(`Analyzing project: ${projectDir}`);
    
    const structure = analyzeStructure(projectDir);
    let changesMade = false;
    
    // Fix brain directory
    if (structure.hasIdumbBrain && !structure.hasBrain) {
        const success = migrateData(
            join(projectDir, 'idumb-brain'),
            join(projectDir, 'brain')
        );
        if (success) changesMade = true;
    }
    
    // Fix project-output directory
    if (structure.hasIdumbProjectOutput && !structure.hasProjectOutput) {
        const success = migrateData(
            join(projectDir, 'idumb-project-output'),
            join(projectDir, 'project-output')
        );
        if (success) changesMade = true;
    }
    
    // Fix modules directory
    if (structure.hasIdumbModules && !structure.hasModules) {
        const success = migrateData(
            join(projectDir, 'idumb-modules'),
            join(projectDir, 'modules')
        );
        if (success) changesMade = true;
    }
    
    // Remove any remaining idumb-* directories that have been migrated
    const cleanupDirs = ['idumb-brain', 'idumb-project-output', 'idumb-modules'];
    for (const dir of cleanupDirs) {
        const fullPath = join(projectDir, dir);
        if (existsSync(fullPath)) {
            try {
                const items = readdirSync(fullPath);
                if (items.length === 0) {
                    unlinkSync(fullPath);
                    log(`Removed empty directory: ${dir}`);
                }
            } catch {
                // Directory not empty or inaccessible
            }
        }
    }
    
    if (changesMade) {
        log(`✓ Fixed path structure in ${projectDir}`);
    } else {
        log(`No changes needed for ${projectDir}`);
    }
    
    return changesMade;
}

function updateConfigReferences(projectDir) {
    const configPath = join(projectDir, 'brain', 'config.json');
    if (!existsSync(configPath)) return;
    
    try {
        const config = JSON.parse(readFileSync(configPath, 'utf8'));
        
        // Update path references if they use old format
        let updated = false;
        
        if (config.paths) {
            const pathUpdates = {
                'config': '.idumb/brain/config.json',
                'state': '.idumb/brain/state.json',
                'brain': '.idumb/brain/',
                'history': '.idumb/brain/history/',
                'context': '.idumb/brain/context/',
                'governance': '.idumb/brain/governance/',
                'validations': '.idumb/brain/governance/validations/',
                'sessions': '.idumb/sessions/',
                'drift': '.idumb/brain/drift/',
                'metadata': '.idumb/brain/metadata/',
                'output': '.idumb/project-output/',
                'phases': '.idumb/project-output/phases/',
                'roadmaps': '.idumb/project-output/roadmaps/',
                'research': '.idumb/project-output/research/',
                'modules': '.idumb/modules/'
            };
            
            for (const [key, newPath] of Object.entries(pathUpdates)) {
                if (config.paths[key] && config.paths[key] !== newPath) {
                    config.paths[key] = newPath;
                    updated = true;
                }
            }
        }
        
        if (updated) {
            writeFileSync(configPath, JSON.stringify(config, null, 2));
            log(`Updated config path references in ${projectDir}`);
        }
    } catch (error) {
        log(`Failed to update config: ${error.message}`);
    }
}

// Main execution
function main() {
    log('Starting path confusion fixer...');
    
    // Find all .idumb directories
    const idumbDirs = findIdumbDirs(cwd);
    
    if (idumbDirs.length === 0) {
        log('No .idumb directories found');
        return;
    }
    
    log(`Found ${idumbDirs.length} .idumb directories`);
    
    let fixedCount = 0;
    for (const dir of idumbDirs) {
        if (fixProject(dir)) {
            updateConfigReferences(dir);
            fixedCount++;
        }
    }
    
    log(`Fixed ${fixedCount} projects`);
    log('Path confusion fixer completed');
}

main();