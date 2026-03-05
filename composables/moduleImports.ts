/**
 * Module Import Map for Dynamic Loading
 *
 * This file provides static imports for external Aether modules to ensure
 * proper bundling and avoid MIME type errors.
 *
 * AUTOMATED: Use `npm run add-module @org/module-name` to update this file
 * automatically along with nuxt.config.ts and the module registry.
 *
 * MANUAL: If adding manually:
 * 1. Add entry here: '@org/module-name': () => import('@org/module-name')
 * 2. Add to nuxt.config.ts optimizeDeps.include array
 * 3. Add to plugins/01.module-registry.client.ts
 * 4. Run: npm install @org/module-name
 * 5. Clear cache: rm -rf node_modules/.vite
 * 6. Restart dev server
 *
 * WHY THIS EXISTS: Vite needs static imports for proper module resolution.
 * The dynamic fallback in useModuleLoader often fails with MIME type errors.
 *
 * See docs/legacy/EXTERNAL_MODULE_LOADING.md for complete explanation.
 */

export const moduleImports: Record<string, () => Promise<any>> = {
    // Add new modules here - use npm run add-module for automatic setup
};
