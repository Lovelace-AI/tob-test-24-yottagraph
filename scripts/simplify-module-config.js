#!/usr/bin/env node

/**
 * Concept: Generate module configurations from aether.modules.json
 *
 * This would make aether.modules.json the single source of truth
 * and generate the other files from it.
 */

const fs = require('fs');
const path = require('path');

async function generateFromModulesJson() {
    const modulesJsonPath = path.join(process.cwd(), 'public/aether.modules.json');

    if (!fs.existsSync(modulesJsonPath)) {
        console.error('No aether.modules.json found');
        return;
    }

    const { modules } = JSON.parse(fs.readFileSync(modulesJsonPath, 'utf8'));
    const enabledModules = modules.filter((m) => m.enabled !== false);

    // Generate nuxt.config.ts optimizeDeps
    console.log('\nAdd to nuxt.config.ts optimizeDeps.include:');
    enabledModules.forEach((m) => {
        console.log(`    '${m.name}',`);
    });

    // Generate moduleImports.ts
    console.log('\nAdd to moduleImports.ts:');
    enabledModules.forEach((m) => {
        console.log(`    '${m.name}': () => import('${m.name}'),`);
    });

    // Generate module registry imports
    console.log('\nAdd to module registry:');
    enabledModules.forEach((m) => {
        const varName = m.name.split('/').pop().replace(/-/g, '');
        console.log(`import ${varName} from '${m.name}';`);
        console.log(`moduleRegistry.register(${varName});`);
    });
}

// This is just a concept - would need proper file manipulation
generateFromModulesJson();
