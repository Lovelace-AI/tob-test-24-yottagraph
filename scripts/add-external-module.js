#!/usr/bin/env node

/**
 * Helper script to add external Aether modules to the project
 * This handles the Vite optimizeDeps configuration automatically
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: npm run add-module <module-name>');
    console.log('Example: npm run add-module @myorg/aether-weather');
    process.exit(1);
}

const moduleName = args[0];
const configPath = path.join(process.cwd(), 'nuxt.config.ts');

console.log(`Adding external module: ${moduleName}`);

try {
    // Read the current config
    let config = fs.readFileSync(configPath, 'utf8');

    // Find the optimizeDeps.include array
    const includeMatch = config.match(/optimizeDeps:\s*{\s*include:\s*\[([\s\S]*?)\]/);

    if (!includeMatch) {
        console.error('Could not find optimizeDeps.include in nuxt.config.ts');
        process.exit(1);
    }

    const currentIncludes = includeMatch[1];

    // Check if module already exists
    if (currentIncludes.includes(moduleName)) {
        console.log(`Module ${moduleName} is already in optimizeDeps`);
        process.exit(0);
    }

    // Add the new module
    const updatedIncludes = currentIncludes.trimEnd() + `\n                '${moduleName}',`;
    const updatedConfig = config.replace(
        includeMatch[0],
        `optimizeDeps: {\n            include: [${updatedIncludes}\n            ]`
    );

    // Write back
    fs.writeFileSync(configPath, updatedConfig);
    console.log(`✅ Added ${moduleName} to nuxt.config.ts`);

    // Update moduleImports.ts
    const moduleImportsPath = path.join(process.cwd(), 'composables/moduleImports.ts');
    if (fs.existsSync(moduleImportsPath)) {
        let moduleImportsContent = fs.readFileSync(moduleImportsPath, 'utf8');

        // Check if module already exists
        if (!moduleImportsContent.includes(`'${moduleName}':`)) {
            // Find the insertion point (before the closing brace and comment)
            const insertMatch = moduleImportsContent.match(
                /export const moduleImports[^{]*{([\s\S]*?)(\s*\/\/ Add new modules[\s\S]*?)\s*};/
            );

            if (insertMatch) {
                const existingImports = insertMatch[1].trimEnd();
                const comment = insertMatch[2];
                const newImport = `\n    '${moduleName}': () => import('${moduleName}'),`;

                const updatedContent = moduleImportsContent.replace(
                    insertMatch[0],
                    `export const moduleImports: Record<string, () => Promise<any>> = {${existingImports}${newImport}\n${comment}\n};`
                );

                fs.writeFileSync(moduleImportsPath, updatedContent);
                console.log(`✅ Added ${moduleName} to moduleImports.ts`);
            }
        } else {
            console.log(`Module ${moduleName} already in moduleImports.ts`);
        }
    }

    // Now update the module registry
    const registryPath = path.join(process.cwd(), 'plugins/01.module-registry.client.ts');

    if (fs.existsSync(registryPath)) {
        let registry = fs.readFileSync(registryPath, 'utf8');

        // Add import if not already there
        if (!registry.includes(moduleName)) {
            // Find the last import
            const lastImportMatch = registry.match(/import.*from.*\n(?!import)/);
            if (lastImportMatch) {
                const insertPos = lastImportMatch.index + lastImportMatch[0].length - 1;
                const moduleVar = moduleName.split('/').pop().replace(/-/g, '');
                const newImport = `\n// External module\nimport ${moduleVar} from '${moduleName}';`;

                registry = registry.slice(0, insertPos) + newImport + registry.slice(insertPos);

                // Add registration
                const registerMatch = registry.match(
                    /moduleRegistry\.register\([^)]+\);(?![\s\S]*moduleRegistry\.register)/
                );
                if (registerMatch) {
                    const insertPos = registerMatch.index + registerMatch[0].length;
                    const newRegister = `\n    moduleRegistry.register(${moduleVar});`;
                    registry =
                        registry.slice(0, insertPos) + newRegister + registry.slice(insertPos);
                }

                fs.writeFileSync(registryPath, registry);
                console.log(`✅ Added ${moduleName} to module registry`);
            }
        }
    }

    // Update aether.modules.json
    const aetherModulesPath = path.join(process.cwd(), 'public/aether.modules.json');
    if (fs.existsSync(aetherModulesPath)) {
        try {
            const aetherModules = JSON.parse(fs.readFileSync(aetherModulesPath, 'utf8'));

            // Check if module already exists
            const moduleExists = aetherModules.modules.some((m) => m.name === moduleName);

            if (!moduleExists) {
                // Add new module entry
                aetherModules.modules.push({
                    name: moduleName,
                    enabled: true,
                    config: {
                        // Add default config structure
                        // Users can customize this later
                    },
                });

                fs.writeFileSync(aetherModulesPath, JSON.stringify(aetherModules, null, 4));
                console.log(`✅ Added ${moduleName} to aether.modules.json`);
            } else {
                console.log(`Module ${moduleName} already in aether.modules.json`);
            }
        } catch (error) {
            console.warn('Could not update aether.modules.json:', error.message);
        }
    }

    console.log('\n📝 Next steps:');
    console.log('1. Run "npm install ' + moduleName + '"');
    console.log('2. Clear Vite cache: rm -rf node_modules/.vite');
    console.log('3. Restart your dev server');
    console.log('4. (Optional) Customize module config in public/aether.modules.json');
} catch (error) {
    console.error('Error updating configuration:', error.message);
    process.exit(1);
}
