# Publishing Guide for Aether Feature Modules

## Parameters

Parse the user's input for these parameters:

| Parameter      | Required | Example                        | Description                                                                  |
| -------------- | -------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `feature-name` | Yes      | `sentiment-graph`              | Directory name under `features/`                                             |
| `package-name` | No       | `aether-module-demo-sentiment` | Directory name under `packages/` (derived from feature-name if not provided) |
| `version-type` | Yes      | `patch`, `minor`, `major`      | Type of version bump                                                         |

**Example invocations:**

- `/publish_module sentiment-graph patch`
- `/publish_module sentiment-graph minor`
- `/publish_module data-monitor major aether-module-data-monitor`

### Collecting Missing Parameters

If any required parameters are missing from the user's input, use the **AskQuestion tool** to collect them in a single structured prompt. This provides a better UX than asking multiple follow-up questions.

**When to use AskQuestion:**

- `feature-name` is missing or ambiguous
- `version-type` is not specified
- `package-name` is needed for a **new package** (first-time publish) — check if `packages/{package-name}/` already exists; if it does, use the existing package name rather than asking

**Example AskQuestion call for missing parameters:**

```
AskQuestion({
  title: "Publish Module Parameters",
  questions: [
    {
      id: "feature-name",
      prompt: "Which feature do you want to publish?",
      options: [
        { id: "sentiment-graph", label: "sentiment-graph" },
        { id: "data-monitor", label: "data-monitor" },
        // ... list available features from features/ directory
      ]
    },
    // Include this question ONLY for new packages (no existing packages/ directory)
    {
      id: "package-name",
      prompt: "What should the npm package be named?",
      options: [
        { id: "aether-module-{feature-name}", label: "aether-module-{feature-name} (recommended)" },
        { id: "other", label: "Other (I'll specify a custom name)" }
      ]
    },
    {
      id: "version-type",
      prompt: "What type of version update is this?",
      options: [
        { id: "patch", label: "patch (bug fixes, minor tweaks)" },
        { id: "minor", label: "minor (new features, backwards compatible)" },
        { id: "major", label: "major (breaking changes)" }
      ]
    }
  ]
})
```

**Before asking:**

1. Check `features/` directory to populate the feature-name options with actual available features
2. Check `packages/` directory to determine if this is a new or existing package — only include the `package-name` question for new packages
3. Only include questions for parameters that are actually missing

---

This document provides step-by-step instructions for an AI agent to package and publish any Aether feature module as an npm package.

## Overview

Aether features in `features/{feature-name}/` can be packaged as standalone Nuxt modules and published to GitHub Packages. The packaging process syncs code from the feature directory, converts imports for standalone use, and publishes to the npm registry.

**Important:** Published modules are designed to operate **only within Aether**. They can rely on Aether-internal components (like `FeatureHeader`), composables, and infrastructure being available at runtime. These modules are not intended to work as generic standalone Nuxt modules outside of the Aether ecosystem.

**Naming convention:**

- Feature source: `features/{feature-name}/`
- Package location: `packages/{package-name}/`
- npm package name: `@lovelace-ai/{package-name}`

---

## Pre-Flight Checklist

### 1. Identify the Feature and Package

Determine:

- **Feature name**: The directory name under `features/` (e.g., `sentiment-graph`)
- **Package name**: The directory name under `packages/` (e.g., `aether-module-demo-sentiment`)
- **npm package name**: The full scoped name (e.g., `@lovelace-ai/aether-module-demo-sentiment`)

### 2. Determine Version Type

Version types and their meanings:

- **patch** (1.0.0 → 1.0.1): Bug fixes, minor tweaks
- **minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **major** (1.0.0 → 2.0.0): Breaking changes

**If not provided:** Use the AskQuestion pattern defined in the Parameters section above.

**Note:** The user may have already updated the version in the feature code. Check `packages/{package-name}/package.json` to see the current version before making any version changes.

### 3. Pre-Packaging Git Commit

Before making any changes to the codebase, ensure all feature files are committed. If there are uncommitted changes in `features/{feature-name}/` or related files, commit them following the workflow in `git-support.mdc`.

---

## Packaging Process

### Step 1: Check Package Directory Status

Determine if the package directory already exists or needs to be created.

```bash
ls -la packages/{package-name}/
```

**If the directory exists:** This is an UPDATE - skip to Step 3 (Copy Source Files).

**If the directory does not exist:** This is a NEW PACKAGE - continue with Step 2.

### Step 2: Create Package Directory Structure (New Package Only)

Create the required directory structure:

```bash
mkdir -p packages/{package-name}/src/runtime/{components,composables,pages}
```

Target structure:

```
packages/{package-name}/
├── src/
│   ├── module.ts                      # Nuxt module definition
│   └── runtime/
│       ├── plugin.ts                  # Auto-registration plugin
│       ├── module-definition.ts       # Aether feature module definition
│       ├── components/
│       │   └── *.vue                  # Feature components
│       ├── composables/
│       │   └── *.ts                   # Feature composables
│       └── pages/
│           └── index.vue              # Main page
├── package.json
├── tsconfig.json
└── README.md
```

**Note:** Modules do NOT need `elemental-setup.ts` or similar files for shared libraries. Aether handles this centrally.

### Step 3: Copy Source Files

Copy the latest feature files to the package directory:

```bash
# Copy components (if they exist)
cp features/{feature-name}/components/*.vue packages/{package-name}/src/runtime/components/

# Copy composables (if they exist)
cp features/{feature-name}/composables/*.ts packages/{package-name}/src/runtime/composables/

# Copy pages (if they exist)
cp features/{feature-name}/pages/*.vue packages/{package-name}/src/runtime/pages/
```

**Note:** Not all features will have all three directories. Only copy what exists.

### Step 4: Convert Imports

**Critical:** All copied `.vue` and `.ts` files must have their imports converted from Aether app style to package style.

#### Import Conversion Rules

Search for and replace these import patterns in all copied files:

| Before (Feature Style)                                                    | After (Package Style)                             |
| ------------------------------------------------------------------------- | ------------------------------------------------- |
| `import { useElementalService } from '~/composables/useElementalService'` | `import { useElementalService } from '#imports'`  |
| `import { defineFeatureModule } from '~/composables/useModuleRegistry'`   | `import { defineFeatureModule } from '#imports'`  |
| `import { useModuleBus } from '~/composables/useModuleBus'`               | `import { useModuleBus } from '#imports'`         |
| Any `~/composables/...` import                                            | Consolidate into `import { ... } from '#imports'` |

**Example conversion:**

```typescript
// BEFORE (feature module style)
import { useElementalService } from '~/composables/useElementalService';
import { defineFeatureModule } from '~/composables/useModuleRegistry';

// AFTER (package style)
import { useElementalService, defineFeatureModule } from '#imports';
```

#### Imports to Keep As-Is

The following import patterns should NOT be changed:

1. **Relative imports within the package** - Keep these for referencing sibling files:

    ```typescript
    // These stay as relative imports
    import SentimentChart from '../components/SentimentChart.vue';
    import { useSentimentData } from '../composables/useSentimentData';
    ```

2. **Aether-internal components** - Keep `~/components/...` imports since they reference Aether core components that will be available at runtime:

    ```typescript
    // Keep as-is - FeatureHeader is an Aether core component
    import FeatureHeader from '~/components/FeatureHeader.vue';
    ```

3. **Vuetify styles** - Keep the vuetify styles import in the module definition:

    ```typescript
    import 'vuetify/styles';
    ```

4. **External package imports** - Keep imports from npm packages:
    ```typescript
    import { DateTimePicker } from '@lovelace-ai/elemental-components';
    import { ref, computed } from 'vue';
    ```

**Note:** For shared libraries like `@lovelace-ai/elemental-components`, the module does NOT need to handle CSS or plugin setup. Aether handles this centrally. The module only needs to declare the peerDependency (see "Identifying Peer Dependencies" below).

### Step 5: Create/Update Package Configuration Files (New Package Only)

If creating a new package, these files must be created. If updating, verify they exist and are correct.

#### package.json

```json
{
    "name": "@lovelace-ai/{package-name}",
    "version": "1.0.0",
    "description": "Aether module for {feature description}",
    "author": "Lovelace AI",
    "license": "MIT",
    "type": "module",
    "exports": {
        ".": {
            "import": "./dist/module.mjs",
            "require": "./dist/module.cjs"
        }
    },
    "main": "./dist/module.cjs",
    "module": "./dist/module.mjs",
    "types": "./dist/types.d.ts",
    "files": ["dist"],
    "scripts": {
        "prepack": "nuxt-module-build build",
        "dev": "nuxi dev playground",
        "dev:build": "nuxi build playground",
        "dev:prepare": "nuxt-module-build build --stub && nuxi prepare playground",
        "build": "nuxt-module-build build",
        "prepublishOnly": "npm run build"
    },
    "repository": {
        "type": "git",
        "url": "git+https://github.com/leah-at-lovelace/aether_20260107.git",
        "directory": "packages/{package-name}"
    },
    "publishConfig": {
        "registry": "https://npm.pkg.github.com",
        "access": "restricted"
    },
    "peerDependencies": {
        "vue": "^3.0.0",
        "vuetify": "^3.0.0",
        "nuxt": "^3.0.0"
    },
    "devDependencies": {
        "@nuxt/module-builder": "^0.5.5",
        "@nuxt/kit": "^3.9.0",
        "nuxt": "^3.9.0",
        "vue": "^3.4.0",
        "vuetify": "^3.4.0",
        "typescript": "^5.3.0"
    },
    "keywords": ["nuxt", "nuxt-module", "aether"]
}
```

#### Identifying Peer Dependencies

Before finalizing `package.json`, scan the feature's source files for external package imports. Any npm packages used by the feature (beyond Vue, Vuetify, and Nuxt) should be added to `peerDependencies`.

**How to identify:**

1. Search for imports from `@lovelace-ai/...` packages (e.g., `@lovelace-ai/elemental-components`)
2. Search for imports from other npm packages not in the base template
3. Check for any specialized libraries (charting, date handling, etc.)

#### Verifying Peer Dependency Versions

**⚠️ CRITICAL:** Before adding ANY peer dependency, you MUST verify the package exists and use a REAL version number. Do NOT copy example versions like `^1.0.0` without checking.

**For each peer dependency, verify it exists and check available versions:**

```bash
# For @lovelace-ai scoped packages (GitHub Packages)
npm view @lovelace-ai/{package-name} versions --registry=https://npm.pkg.github.com

# For public npm packages
npm view {package-name} versions
```

**Example workflow:**

```bash
# Check what versions of elemental-components exist
$ npm view @lovelace-ai/elemental-components versions --registry=https://npm.pkg.github.com
[ '0.1.0', '0.1.1', '0.1.2', '0.1.3' ]

# Use the actual latest version range, NOT a made-up version
# Correct: "^0.1.0" (matches available versions)
# WRONG:   "^1.0.0" (no such version exists - will cause install failures!)
```

**Example with verified versions:**

```json
"peerDependencies": {
    "vue": "^3.0.0",
    "vuetify": "^3.0.0",
    "nuxt": "^3.0.0",
    "@lovelace-ai/elemental-components": "^0.1.0"
}
```

**Note:** Peer dependencies tell the consuming Aether application which packages must be available. Since modules only run within Aether, these dependencies are typically already installed. However, if the version range doesn't match any published version, installation will fail.

#### tsconfig.json

```json
{
    "compilerOptions": {
        "strict": true,
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "target": "ESNext",
        "lib": ["ESNext", "DOM"],
        "esModuleInterop": true,
        "skipLibCheck": true,
        "declaration": true,
        "noEmit": true,
        "isolatedModules": true,
        "resolveJsonModule": true,
        "jsx": "preserve",
        "paths": {
            "#imports": ["./src/runtime/types"],
            "#app": ["./node_modules/nuxt/dist/app"]
        }
    },
    "include": ["src/**/*.ts", "src/**/*.vue"],
    "exclude": ["node_modules", "dist", "playground"]
}
```

**Note:** The `paths` configuration enables TypeScript to resolve `#imports` and `#app` during development. At build time, the Nuxt module builder handles these automatically.

#### src/module.ts

```typescript
import {
    defineNuxtModule,
    createResolver,
    addPlugin,
    addComponentsDir,
    addImportsDir,
} from '@nuxt/kit';

export interface ModuleOptions {
    /**
     * Whether to auto-register with Aether's module registry
     * @default true
     */
    autoRegister?: boolean;
}

export default defineNuxtModule<ModuleOptions>({
    meta: {
        name: '@lovelace-ai/{package-name}',
        configKey: '{configKey}', // camelCase version of feature name
        compatibility: {
            nuxt: '^3.0.0',
        },
    },

    defaults: {
        autoRegister: true,
    },

    setup(options, nuxt) {
        const { resolve } = createResolver(import.meta.url);

        // Add runtime plugin that registers the module with Aether
        if (options.autoRegister) {
            addPlugin({
                src: resolve('./runtime/plugin'),
                mode: 'client',
            });
        }

        // Add components directory
        addComponentsDir({
            path: resolve('./runtime/components'),
            prefix: '{ComponentPrefix}', // PascalCase prefix for components
        });

        // Add composables directory
        addImportsDir(resolve('./runtime/composables'));

        // Add the page route
        nuxt.hook('pages:extend', (pages) => {
            pages.push({
                name: '{feature-name}',
                path: '/{feature-name}',
                file: resolve('./runtime/pages/index.vue'),
                meta: {
                    title: '{Feature Title}',
                },
            });
        });
    },
});
```

**Note:** Modules do NOT need to handle setup for shared libraries like `@lovelace-ai/elemental-components`. Aether handles CSS and Vuetify component registration centrally. The module only needs to declare the peerDependency.

#### src/runtime/plugin.ts

```typescript
import { defineNuxtPlugin } from '#app';
import { useModuleRegistry } from '#imports';
import featureModule from './module-definition';

/**
 * Plugin that auto-registers the module with Aether's module registry.
 * This runs on the client side and ensures the module appears in navigation.
 */
export default defineNuxtPlugin(() => {
    const moduleRegistry = useModuleRegistry();

    // Register the feature module
    moduleRegistry.register(featureModule);

    console.log('[Aether] {Feature Title} module registered');
});
```

#### src/runtime/module-definition.ts

```typescript
import 'vuetify/styles';
import { defineFeatureModule } from '#imports';

/**
 * Feature module definition.
 * This gets registered with Aether's module registry.
 */
export default defineFeatureModule({
    id: '{feature-name}',
    name: '{Feature Title}',
    icon: '{mdi-icon}',
    description: '{Feature description}',

    // IMPORTANT: Routes are now handled by the Nuxt module via pages:extend hook
    // Leave this empty - do NOT copy the routes array from the feature module
    routes: [],

    navigation: {
        title: '{Feature Title}',
        order: 10,
    },

    requires: ['useElementalService'], // List actual dependencies
});
```

**Critical note about module-definition.ts:** The `routes` array MUST be empty because routing is handled by the Nuxt module's `pages:extend` hook in `module.ts`.

---

## Shared Library Dependencies (e.g., elemental-components)

If your module uses shared libraries like `@lovelace-ai/elemental-components`, the setup is split between the **module** and **Aether**:

### Module Responsibility (Publish Side)

The module only needs to **declare the peerDependency**. Do NOT add CSS pushing or plugin setup in the module.

**How to detect if your module uses elemental-components:**

```bash
grep -r "@lovelace-ai/elemental-components" features/{feature-name}/
```

**If found, add to `peerDependencies` in `package.json`:**

```json
"peerDependencies": {
    "vue": "^3.0.0",
    "vuetify": "^3.0.0",
    "nuxt": "^3.0.0",
    "@lovelace-ai/elemental-components": "^0.1.0"
}
```

That's it for the module. No `elemental-setup.ts` file, no CSS pushing in `module.ts`.

### Aether Responsibility (Install Side)

Aether handles shared library setup **centrally** so multiple modules can use them without duplication:

1. **Package installed**: `@lovelace-ai/elemental-components` in Aether's `package.json`
2. **Styles imported**: `'@lovelace-ai/elemental-components/styles'` in `nuxt.config.ts` css array
3. **Plugin configured**: `plugins/00.elemental-components-vuetify.ts` calls `setupElementalComponents()`

This is configured once in Aether, not per-module. See `install_module.md` for verification steps during module installation.

### Why This Approach?

- **Avoid duplication**: Multiple modules using elemental-components don't each push CSS and add plugins
- **Central configuration**: Aether knows what shared libraries it supports
- **Simpler modules**: Modules just declare peerDependencies, no setup code needed

---

## Version and Publish

### Step 6: Update Version

Navigate to the package directory and update the version:

```bash
cd packages/{package-name}
```

Update based on user's specification:

```bash
# For patch (bug fixes): 1.0.0 → 1.0.1
npm version patch

# For minor (new features): 1.0.0 → 1.1.0
npm version minor

# For major (breaking changes): 1.0.0 → 2.0.0
npm version major
```

**Skip this step** if the user has already manually updated the version.

### Step 7: Build the Package

```bash
cd packages/{package-name}

# Install dependencies if needed
npm install

# Build the module
npm run build
```

### Step 7.5: Verify Build Output

Before publishing, verify the build produced the expected files:

```bash
ls -la dist/
```

Expected output should include:

- `module.mjs` - ESM module entry
- `module.cjs` - CommonJS module entry
- `types.d.ts` or `types.d.mts` - TypeScript declarations
- `runtime/` directory containing compiled components, composables, and pages

If the `dist/` directory is missing or empty, the build failed. Check for errors in the build output.

### Step 7.6: Pre-Publish Verification Checklist

Before publishing, verify all of the following:

**Import Conversions:**

- [ ] All `~/composables/...` imports converted to `#imports`
- [ ] Relative imports within package preserved (e.g., `../components/...`)
- [ ] Aether component imports preserved (e.g., `~/components/FeatureHeader.vue`)

**Module Configuration:**

- [ ] `vuetify/styles` import present in `module-definition.ts`
- [ ] `routes` array is empty in `module-definition.ts`
- [ ] Route is added via `pages:extend` hook in `module.ts`

**Peer Dependencies:**

- [ ] `package.json` includes all required peer dependencies
- [ ] If module uses `@lovelace-ai/elemental-components`, it's listed in `peerDependencies`
- [ ] All peer dependency versions verified to exist (run `npm view` for each)

**Package Configuration:**

- [ ] `package.json` has correct name, version, and repository
- [ ] `tsconfig.json` has correct `paths` configuration

**Build Output:**

- [ ] `npm run build` completed without errors
- [ ] `dist/` directory contains `module.mjs`, `module.cjs`, and `runtime/`

### Step 8: Publish to GitHub Packages

#### Configure npm Registry

Ensure `.npmrc` exists in the package directory with the registry scope:

```
@lovelace-ai:registry=https://npm.pkg.github.com
```

**Authentication:** The auth token should be configured in your **global** `~/.npmrc` file (not committed to the repo):

```
@lovelace-ai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_YOUR_TOKEN_HERE
```

This separation keeps auth tokens out of the repository while still allowing npm to find the correct registry.

#### Publish

```bash
npm publish
```

---

## Post-Publish Commit

After successful publication, return to the repository root and commit the package files following the workflow in `git-support.mdc`. Include the published version number in the work summary.

---

## Post-Publish: Configure Package Access (New Packages Only)

**Skip this section if updating an existing package.** Access is only configured once when the package is first created.

After publishing a **new** package to GitHub Packages, the user must manually configure access through the GitHub web UI. There is no REST API for this, so it cannot be automated via CLI.

**Use AskQuestion to ensure the user sees this:**

```
AskQuestion({
  title: "Manual Step Required: Configure Package Access",
  questions: [
    {
      id: "access-configured",
      prompt: "Please configure package access in GitHub:\n\n1. Go to: https://github.com/orgs/Lovelace-AI/packages/npm/{package-name}/settings\n\n2. Under 'Manage Actions access': Add the 'aether' repository with Write privileges\n\n3. Under 'Manage user and team access': Add 'Lovelace-AI/engineering' team with Admin privileges\n\nHave you completed this step?",
      options: [
        { id: "yes", label: "Yes, I've configured access" },
        { id: "skip", label: "Skip (I'll do it later)" }
      ]
    }
  ]
})
```

---

## Troubleshooting

### Package Access Issues

If the package doesn't appear in the organization's package listings, or team members can't access it:

1. Go to the package settings page:
   `https://github.com/orgs/Lovelace-AI/packages/npm/{package-name}/settings`

2. **Check Actions access** (top section):
    - Verify the `aether` repository is listed with **Write** privileges
    - If missing, click "Add Repository" and add it

3. **Check user and team access** (bottom section):
    - Verify the Engineering team (`Lovelace-AI/engineering`) has **Admin** privileges
    - If missing, click "Add teams or people" and add it

### Build Errors

If `npm run build` fails:

1. Check that all imports are correctly converted to `#imports`
2. Ensure `tsconfig.json` exists
3. Run `npm run dev:prepare` to generate type stubs first

### Publish Errors

If `npm publish` fails:

1. Verify your global `~/.npmrc` has the auth token configured
2. Check that the package `.npmrc` has the correct registry scope
3. Ensure the version number is higher than the last published version
4. Verify you have write access to the GitHub Packages registry

### Import Errors at Runtime

If the module fails to load in Aether:

1. Verify all Aether composables (`useElementalService`, `useModuleRegistry`, etc.) are imported from `#imports`
2. Check that `module-definition.ts` has `routes: []` (empty array)
3. Ensure the page route is correctly defined in `module.ts`

### Peer Dependency Installation Failures

If consumers of your module get errors like `No matching version found for @lovelace-ai/package@^X.Y.Z`:

1. **You published with an invalid peer dependency version.** The version range doesn't match any published version.
2. Check the actual available versions: `npm view @lovelace-ai/{package} versions --registry=https://npm.pkg.github.com`
3. Update `package.json` with a valid version range and republish
4. **Prevention:** Always verify peer dependency versions exist BEFORE publishing (see "Verifying Peer Dependency Versions" section)
