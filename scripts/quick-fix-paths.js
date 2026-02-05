#!/usr/bin/env node
/**
 * Quick Path Fix Command
 * 
 * Usage: node scripts/quick-fix-paths.js [project-path]
 * 
 * Fixes the duplicate directory structure confusion you're experiencing
 */

import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, renameSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';

const targetDir = process.argv[2] || process.cwd();

function log(message) {
    console.log(`[QUICK-FIX] ${message}`);
}

function fixProjectPaths(projectDir) {
    log(`Checking ${basename(projectDir)}`);
    
    const idumbDir = join(projectDir, '.idumb');
    if (!existsSync(idumbDir)) {
        log('No .idumb directory found');
        return false;
    }
    
    let fixed = false;
    
    // Fix brain directory
    const brainDir = join(idumbDir, 'brain');
    const idumbBrainDir = join(idumbDir, 'idumb-brain');
    
    if (existsSync(idumbBrainDir) && !existsSync(brainDir)) {
        log('Moving idumb-brain -> brain');
        renameSync(idumbBrainDir, brainDir);
        fixed = true;
    }
    
    // Fix project-output directory
    const outputDir = join(idumbDir, 'project-output');
    const idumbOutputDir = join(idumbDir, 'idumb-project-output');
    
    if (existsSync(idumbOutputDir) && !existsSync(outputDir)) {
        log('Moving idumb-project-output -> project-output');
        renameSync(idumbOutputDir, outputDir);
        fixed = true;
    }
    
    // Fix modules directory
    const modulesDir = join(idumbDir, 'modules');
    const idumbModulesDir = join(idumbDir, 'idumb-modules');
    
    if (existsSync(idumbModulesDir) && !existsSync(modulesDir)) {
        log('Moving idumb-modules -> modules');
        renameSync(idumbModulesDir, modulesDir);
        fixed = true;
    }
    
    // Clean up any remaining idumb-* directories that are now empty
    try {
        const items = readdirSync(idumbDir);
        for (const item of items) {
            if (item.startsWith('idumb-')) {
                const fullPath = join(idumbDir, item);
                try {
                    const subItems = readdirSync(fullPath);
                    if (subItems.length === 0) {
                        unlinkSync(fullPath);
                        log(`Removed empty ${item}`);
                    }
                } catch {
                    // Directory not accessible or not empty
                }
            }
        }
    } catch (error) {
        log(`Cleanup failed: ${error.message}`);
    }
    
    if (fixed) {
        log('✓ Path structure fixed');
    } else {
        log('No changes needed');
    }
    
    return fixed;
}

function findProjects(startDir) {
    const projects = [];
    
    function scan(dir) {
        if (dir.includes('node_modules')) return;
        
        try {
            const items = readdirSync(dir);
            
            // Check if this is a project directory (has package.json or .idumb)
            if (items.includes('package.json') || items.includes('.idumb')) {
                projects.push(dir);
            }
            
            // Continue scanning subdirectories
            for (const item of items) {
                const fullPath = join(dir, item);
                if (statSync(fullPath).isDirectory()) {
                    scan(fullPath);
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
    }
    
    scan(startDir);
    return projects;
}

// Main execution
function main() {
    log('Starting quick path fix...');
    
    if (existsSync(join(targetDir, '.idumb'))) {
        // Single project mode
        fixProjectPaths(targetDir);
    } else {
        // Scan mode - find all projects
        log('Scanning for projects...');
        const projects = findProjects(targetDir);
        
        log(`Found ${projects.length} projects`);
        
        let fixedCount = 0;
        for (const project of projects) {
            if (fixProjectPaths(project)) {
                fixedCount++;
            }
        }
        
        log(`Fixed ${fixedCount} projects`);
    }
    
    log('Quick path fix completed');
}

main();