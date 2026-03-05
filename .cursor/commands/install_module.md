# Installation Guide for Aether Modules

## Parameters

Parse the user's input for these parameters:

| Parameter      | Required | Example                        | Description                                                  |
| -------------- | -------- | ------------------------------ | ------------------------------------------------------------ |
| `package-name` | Yes      | `aether-module-demo-sentiment` | The npm package name (with or without `@lovelace-ai/` scope) |
| `version`      | No       | `1.2.0`, `latest`              | Specific version to install (defaults to latest)             |

**Example invocations:**

- `/install_module aether-module-demo-sentiment`
- `/install_module @lovelace-ai/aether-module-data-monitor`
- `/install_module aether-module-demo-sentiment 1.2.0`

### Collecting Missing Parameters

If any required parameters are missing from the user's input, use the **AskQuestion tool** to collect them in a single structured prompt.

**When to use AskQuestion:**

- `package-name` is missing or ambiguous
- User says something vague like "install the sentiment module" without the full package name

**Example AskQuestion call for missing parameters:**

```
AskQuestion({
  title: "Install Module",
  questions: [
    {
      id: "package-name",
      prompt: "Which module do you want to install?",
      options: [
        { id: "aether-module-demo-sentiment", label: "aether-module-demo-sentiment" },
        { id: "aether-module-data-monitor", label: "aether-module-data-monitor" },
        // ... list available modules from registry or known modules
        { id: "other", label: "Other (I'll specify the name)" }
      ]
    },
    // Include version question only if user mentioned wanting a specific version
    {
      id: "version",
      prompt: "Which version do you want to install?",
      options: [
        { id: "latest", label: "latest (recommended)" },
        { id: "specific", label: "Specific version (I'll specify)" }
      ]
    }
  ]
})
```

**Before asking:**

1. Check `package.json` to see what `@lovelace-ai/` modules are already installed (to avoid re-installing)
2. Only include questions for parameters that are actually missing
3. If the user selects "Other" for package-name, follow up with a text prompt asking for the full package name
4. If the user selects "Specific version", follow up asking which version they want

---

This document provides step-by-step instructions for an AI agent to install a published Aether module from GitHub Packages into an existing Aether project.

## Overview

Published Aether modules are Nuxt modules that self-register with Aether's module system. Installation involves adding the package dependency and configuring Nuxt to load it.

**Package naming convention:**

- npm package name: `@lovelace-ai/{package-name}`
- Example: `@lovelace-ai/aether-module-demo-sentiment`

---

## Pre-Flight Checklist

### 1. Identify the Module

Determine the full package name to install. If the user provides a partial name, construct the full scoped name:

- User says: `aether-module-demo-sentiment`
- Full name: `@lovelace-ai/aether-module-demo-sentiment`

### 2. Verify npm Registry Access

The project must have access to the GitHub Packages registry. Check that `.npmrc` exists in the project root:

```bash
cat .npmrc
```

Expected content:

```
@lovelace-ai:registry=https://npm.pkg.github.com
```

**Authentication:** The user's global `~/.npmrc` must contain the auth token:

```
@lovelace-ai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ghp_YOUR_TOKEN_HERE
```

**Note:** GitHub tokens may use either `ghp_` (classic PAT) or `github_pat_` (fine-grained PAT) prefix.

If authentication fails during installation, inform the user they need to configure their GitHub token.

### 3. Check if Already Installed

Before proceeding, verify the module isn't already installed:

```bash
grep "@lovelace-ai/{package-name}" package.json
```

If the module is already in dependencies, skip to verification.

---

## Installation Process

### Step 1: Install the npm Package

```bash
npm install @lovelace-ai/{package-name}
```

Verify installation succeeded:

```bash
grep "{package-name}" package.json
```

The package should appear in either `dependencies` or `devDependencies`.

### Step 2: Add Module to Nuxt Configuration

Edit `nuxt.config.ts` to add the module to the `modules` array.

**Find the modules array:**

```typescript
modules: ['vuetify-nuxt-module'],
```

**Add the new module:**

```typescript
modules: ['vuetify-nuxt-module', '@lovelace-ai/{package-name}'],
```

**Important:** The module name in the array should match the npm package name exactly.

### Step 3: Add to Vite optimizeDeps (if needed)

Some modules require explicit inclusion in Vite's dependency optimization. Check if the `optimizeDeps.include` array exists in `nuxt.config.ts`:

```typescript
vite: {
    optimizeDeps: {
        include: ['vuetify'],
    },
},
```

Add the module if the array exists:

```typescript
vite: {
    optimizeDeps: {
        include: ['vuetify', '@lovelace-ai/{package-name}'],
    },
},
```

**Note:** Try without this first. Only add if you see MIME type errors or module resolution failures during dev.

### Step 4: Configure Shared Library Support (if needed)

Some modules depend on shared libraries like `@lovelace-ai/elemental-components`. Aether must have these configured **centrally** for modules to work correctly.

**Check if the module uses elemental-components:**

After installation, check the module's peer dependencies:

```bash
npm view @lovelace-ai/{package-name} peerDependencies --registry=https://npm.pkg.github.com
```

**If `@lovelace-ai/elemental-components` is listed**, ensure Aether has the following configured:

#### 4a. Install elemental-components (if not already installed)

```bash
grep "elemental-components" package.json
```

If missing from dependencies, install it:

```bash
npm install @lovelace-ai/elemental-components
```

#### 4b. Add styles to nuxt.config.ts

Check the `css` array in `nuxt.config.ts`. It should include the elemental-components styles:

```typescript
css: ['~/assets/theme-styles.css', '@lovelace-ai/elemental-components/styles'],
```

**If the styles are missing**, add them:

```typescript
// Before
css: ['~/assets/theme-styles.css'],

// After
css: ['~/assets/theme-styles.css', '@lovelace-ai/elemental-components/styles'],
```

#### 4c. Configure the plugin to call setupElementalComponents()

Check `plugins/00.elemental-components-vuetify.ts`. It should use the library's setup function:

```typescript
import { defineNuxtPlugin } from '#app';
import { setupElementalComponents } from '@lovelace-ai/elemental-components';

export default defineNuxtPlugin((nuxtApp) => {
    setupElementalComponents(nuxtApp.vueApp);
});
```

**If the plugin manually registers components** (like importing `VDatePicker`, `VTimePicker` from vuetify and calling `nuxtApp.vueApp.component()`), replace the entire file contents with the code above.

**Why?** The `setupElementalComponents()` function from the library:

- Registers all Vuetify components that elemental-components uses internally
- Automatically includes new components when the library is updated
- Is the recommended approach per the library documentation

#### 4d. Scan module for Vuetify component usage and register missing components

**Why this is needed:** The `vuetify-nuxt-module` uses tree-shaking to only include Vuetify components that are detected in your source code. However, it **cannot detect** Vuetify components used inside compiled npm packages (like installed Aether modules). This causes components like `<v-menu>`, `<v-dialog>`, etc. to not render properly.

**Scan the installed module for Vuetify component usage:**

```bash
grep -rohE '<v-[a-z-]+' node_modules/@lovelace-ai/{package-name}/dist/ | sort -u | sed 's/<v-/V/' | sed 's/-\([a-z]\)/\U\1/g'
```

This command:

1. Recursively searches all files in the module's dist directory
2. Finds all Vuetify component tags (e.g., `<v-menu`, `<v-card`, `<v-btn`)
3. Converts them to PascalCase component names (e.g., `VMenu`, `VCard`, `VBtn`)

**Example output:**

```
VAlert
VBtn
VCard
VCol
VDivider
VIcon
VMenu
VProgressCircular
VRow
VTextField
```

**Check which components are already registered:**

The `setupElementalComponents()` function registers `VDatePicker` and `VTimePicker`. Any other Vuetify components found in the scan need to be manually registered.

**Update the plugin to register missing components:**

Edit `plugins/00.elemental-components-vuetify.ts` to import and register any components found in the scan that aren't already covered:

```typescript
import { defineNuxtPlugin } from '#app';
import { setupElementalComponents } from '@lovelace-ai/elemental-components';
// Import Vuetify components used by installed modules
import {
    VMenu,
    VDialog,
    VCard,
    VBtn,
    VIcon,
    VTextField,
    VAlert,
    VProgressCircular,
    VDivider,
    VRow,
    VCol,
    // Add any other components found in the scan
} from 'vuetify/components';

export default defineNuxtPlugin((nuxtApp) => {
    // Register Vuetify components used by compiled modules
    // (vuetify-nuxt-module's tree-shaking can't detect these)
    const moduleComponents = {
        VMenu,
        VDialog,
        VCard,
        VBtn,
        VIcon,
        VTextField,
        VAlert,
        VProgressCircular,
        VDivider,
        VRow,
        VCol,
        // Add any other components found in the scan
    };

    Object.entries(moduleComponents).forEach(([name, component]) => {
        nuxtApp.vueApp.component(name, component);
    });

    // Setup elemental components (registers VDatePicker, VTimePicker)
    setupElementalComponents(nuxtApp.vueApp);
});
```

**Important notes:**

- Only add components that were found in the scan and aren't already registered
- Common components that modules often use: `VMenu`, `VDialog`, `VCard`, `VBtn`, `VIcon`, `VTextField`, `VAlert`, `VProgressCircular`, `VDivider`, `VRow`, `VCol`
- If installing multiple modules, scan all of them and combine the results
- Components registered multiple times are harmless (Vue just uses the last registration)

### Step 5: Clear Caches and Regenerate Types

Nuxt and Vite cache module resolution. Clear the caches and regenerate types to ensure the new module loads correctly:

```bash
rm -rf node_modules/.vite .nuxt
npx nuxi prepare
```

### Step 6: Verify Installation

Start (or restart) the development server to verify the module loads:

```bash
npm run dev
```

**What to check:**

1. No errors in the console during startup
2. Look for the module's registration log message: `[Aether] {Module Name} module registered`
3. The module should appear in the navigation menu (if it has navigation)
4. Navigate to the module's route (check the module's README for the path, e.g., `/sentiment-graph`)
5. If the module uses elemental-components (e.g., date pickers), verify they render correctly

If there are errors, see the Troubleshooting section.

---

## Post-Install Commit

After successful installation, commit the changes following the workflow in `git-support.mdc`.

---

## Module Configuration (Optional)

Some modules support runtime configuration. Check the module's README or documentation for available options.

**To configure a module in nuxt.config.ts:**

```typescript
modules: [
    'vuetify-nuxt-module',
    [
        '@lovelace-ai/{package-name}',
        {
            // Module-specific options
            autoRegister: true,
        },
    ],
],
```

**Alternative syntax using the module's config key:**

```typescript
modules: ['vuetify-nuxt-module', '@lovelace-ai/{package-name}'],

// Module configuration using configKey
sentimentGraph: {
    autoRegister: true,
},
```

**Finding the configKey:** Look in the module's `src/module.ts` file for the `configKey` property in the module definition (e.g., `configKey: 'sentimentGraph'`).

---

## Verification Checklist

Before considering the installation complete, verify:

- [ ] Package appears in `package.json` dependencies
- [ ] Module is listed in `nuxt.config.ts` modules array
- [ ] Caches have been cleared (`.vite` and `.nuxt`)
- [ ] Dev server starts without errors
- [ ] Module registration message appears in console
- [ ] Module appears in navigation (if it has navigation)
- [ ] If module uses elemental-components: Aether has styles and plugin configured (Step 4a-4c)
- [ ] Module scanned for Vuetify components and missing ones registered in plugin (Step 4d)
- [ ] All UI elements render correctly (menus, dialogs, date pickers, etc.)
- [ ] Changes have been committed

---

## Troubleshooting

### Installation Errors

**Error: 404 Not Found**

The package doesn't exist or you don't have access:

1. Verify the package name is correct
2. Check that the package has been published
3. Verify your GitHub token has read access to the package

**Error: Unable to authenticate**

The npm registry authentication is not configured:

1. Check `~/.npmrc` has the auth token
2. Verify the token is valid and not expired
3. Ensure the token has `read:packages` scope

### Runtime Errors

**Module not appearing in navigation:**

1. Verify the module is in the `modules` array in `nuxt.config.ts`
2. Check the console for registration errors
3. Ensure `autoRegister: true` (the default) is not disabled

**MIME type errors or module resolution failures:**

1. Add the module to `optimizeDeps.include` in `nuxt.config.ts`
2. Clear caches: `rm -rf node_modules/.vite .nuxt`
3. Regenerate types: `npx nuxi prepare`
4. Restart the dev server

**Import errors or missing dependencies:**

1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Run `npx nuxi prepare` to regenerate Nuxt types
3. Check if the module has peer dependencies that need to be installed

**Elemental-components UI broken (date pickers missing, styling issues):**

If a module uses `@lovelace-ai/elemental-components` and the UI appears broken:

1. Verify `@lovelace-ai/elemental-components` is installed in Aether's `package.json`
2. Verify styles are in `nuxt.config.ts`: `css: [..., '@lovelace-ai/elemental-components/styles']`
3. Verify the plugin calls `setupElementalComponents()` (not manual component registration)
4. See Step 4a-4c above for detailed verification steps

**Vuetify components not rendering (menus cut off, dialogs not appearing, etc.):**

If Vuetify components like `<v-menu>`, `<v-dialog>`, `<v-card>`, etc. don't render correctly in an installed module:

1. **This is a tree-shaking issue.** The `vuetify-nuxt-module` can't detect Vuetify components used inside compiled npm packages.

2. **Scan the module for Vuetify component usage:**

```bash
grep -rohE '<v-[a-z-]+' node_modules/@lovelace-ai/{package-name}/dist/ | sort -u
```

3. **Register the missing components** in `plugins/00.elemental-components-vuetify.ts`. Import them from `vuetify/components` and register with `nuxtApp.vueApp.component()`.

4. **Common culprits:** `VMenu`, `VDialog`, `VCard`, `VTooltip`, `VOverlay`

5. See Step 4d above for detailed instructions.

### Build Errors

If the module works in development but fails during build:

1. Check for SSR compatibility issues (Aether runs with `ssr: false`)
2. Verify all peer dependencies are installed
3. Check the module's documentation for build requirements

---

## Uninstalling a Module

To remove a previously installed module:

1. **Remove from nuxt.config.ts:**
    - Remove from `modules` array
    - Remove from `optimizeDeps.include` if present
    - Remove any module-specific configuration

2. **Uninstall the package:**

```bash
npm uninstall @lovelace-ai/{package-name}
```

3. **Clean up Vuetify component registrations (optional):**

If the module was the only one using certain Vuetify components, you can remove them from `plugins/00.elemental-components-vuetify.ts`. However, keeping extra component registrations is harmless and may be needed by future modules.

4. **Clear caches and commit:**

```bash
rm -rf node_modules/.vite .nuxt
```

Then commit the changes following the workflow in `git-support.mdc`.
