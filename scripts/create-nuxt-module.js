#!/usr/bin/env node

/**
 * Creates a Nuxt module from an Aether feature
 * Usage: npm run create-module my-feature-name
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const featureName = process.argv[2];
if (!featureName) {
    console.error('Usage: npm run create-module <feature-name>');
    process.exit(1);
}

const featurePath = path.join(process.cwd(), 'features', featureName);
const modulePath = path.join(process.cwd(), 'modules', `aether-${featureName}`);

if (!fs.existsSync(featurePath)) {
    console.error(`Feature ${featureName} not found in features/`);
    process.exit(1);
}

console.log(`🚀 Creating Nuxt module from feature: ${featureName}`);

// 1. Create module directory structure
console.log('📁 Creating module structure...');
fs.mkdirSync(modulePath, { recursive: true });
fs.mkdirSync(path.join(modulePath, 'src/runtime'), { recursive: true });

// 2. Create package.json
console.log('📦 Creating package.json...');
const packageJson = {
    name: `@your-org/aether-${featureName}`,
    version: '1.0.0',
    description: `${featureName} feature module for Aether`,
    type: 'module',
    main: './src/module.mjs',
    exports: {
        '.': './src/module.mjs',
    },
    dependencies: {
        '@nuxt/kit': '^3.9.0',
    },
    peerDependencies: {
        nuxt: '^3.9.0',
    },
};
fs.writeFileSync(path.join(modulePath, 'package.json'), JSON.stringify(packageJson, null, 2));

// 3. Copy feature files to runtime
console.log('📋 Copying feature files...');
execSync(`cp -r ${featurePath}/* ${path.join(modulePath, 'src/runtime/')}`);

// 4. Fix imports in the copied files
console.log('🔧 Fixing imports...');
const indexPath = path.join(modulePath, 'src/runtime/index.ts');
if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf-8');
    // Normalize relative imports to use ~/composables paths
    content = content.replace(
        /from ['"]\.\.\/\.\.\/composables\/useModuleRegistry['"]/g,
        "from '~/composables/useModuleRegistry'"
    );
    content = content.replace(
        /from ['"]\.\.\/\.\.\/composables\/useModuleBus['"]/g,
        "from '~/composables/useModuleBus'"
    );
    fs.writeFileSync(indexPath, content);
}

// 5. Read the feature definition
const featureIndex = fs.readFileSync(path.join(featurePath, 'index.ts'), 'utf-8');

// 6. Create module.mjs
console.log('🔧 Creating module definition...');
// Convert feature-name to featureName for configKey
const camelCaseName = featureName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const configKey = 'aether' + camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);

const moduleContent = `import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@your-org/aether-${featureName}',
    configKey: '${configKey}'
  },
  
  defaults: {
    enabled: true
  },
  
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    
    // Ensure composables are transpiled
    nuxt.options.build.transpile.push('~/composables')
    
    // Add the plugin that registers with module registry
    addPlugin({
      src: resolve('./runtime/plugin.mjs'),
      mode: 'client'
    })
    
    // Pass options to runtime
    nuxt.options.runtimeConfig.public.${configKey} = options
  }
})`;

fs.writeFileSync(path.join(modulePath, 'src/module.mjs'), moduleContent);

// 7. Create the runtime plugin
console.log('🔌 Creating runtime plugin...');
const pluginContent = `import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { useModuleRegistry } from '~/composables/useModuleRegistry'
import featureModule from './index.ts'

export default defineNuxtPlugin((nuxtApp) => {
  // Wait for app to be ready
  nuxtApp.hook('app:mounted', () => {
    const moduleRegistry = useModuleRegistry()
    moduleRegistry.register(featureModule)
  })
})`;

fs.writeFileSync(path.join(modulePath, 'src/runtime/plugin.mjs'), pluginContent);

// 8. Create README
console.log('📝 Creating README...');
const readmeContent = `# @your-org/aether-${featureName}

This module was automatically generated from the ${featureName} feature.

## Installation

\`\`\`bash
npm install @your-org/aether-${featureName}
\`\`\`

## Usage

Add to your \`nuxt.config.ts\`:

\`\`\`typescript
export default defineNuxtConfig({
  modules: ['@your-org/aether-${featureName}']
})
\`\`\`
`;

fs.writeFileSync(path.join(modulePath, 'README.md'), readmeContent);

console.log(`
✅ Module created successfully at: ${modulePath}

Next steps:
1. cd modules/aether-${featureName}
2. npm install
3. npm publish (or push to GitHub)
4. In your main project: npm install @your-org/aether-${featureName}
5. Add to nuxt.config.ts modules array
6. Remove from features/ and plugin registration

🎉 Your feature is now a reusable Nuxt module!
`);
