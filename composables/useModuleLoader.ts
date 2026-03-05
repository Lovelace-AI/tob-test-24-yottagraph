/**
 * Module Loader for NPM-based Aether Modules
 *
 * This composable handles dynamic loading of Aether modules from NPM packages.
 * It reads configuration from aether.modules.json and loads modules dynamically.
 */

import type { FeatureModule } from './useModuleRegistry';
import { useModuleRegistry } from './useModuleRegistry';
import { moduleImports } from './moduleImports';

export interface ModuleConfig {
    name: string;
    enabled?: boolean;
    config?: Record<string, any>;
}

export interface ModuleLoaderOptions {
    configPath?: string;
    autoLoad?: boolean;
}

export const useModuleLoader = (options: ModuleLoaderOptions = {}) => {
    const { configPath = '/aether.modules.json', autoLoad = true } = options;
    const moduleRegistry = useModuleRegistry();

    const loadedModules = ref<Map<string, FeatureModule>>(new Map());
    const loadingState = ref<'idle' | 'loading' | 'loaded' | 'error'>('idle');
    const errors = ref<Map<string, Error>>(new Map());

    /**
     * Load module configuration from JSON file
     */
    const loadConfig = async (): Promise<ModuleConfig[]> => {
        try {
            // In a real app, this would load from the public directory or API
            const response = await $fetch<{ modules: ModuleConfig[] }>(configPath);
            return response.modules || [];
        } catch (error) {
            console.warn('No module configuration found at', configPath);
            return [];
        }
    };

    /**
     * Dynamically import and load a single module
     */
    const loadModule = async (moduleConfig: ModuleConfig): Promise<FeatureModule | null> => {
        const { name, enabled = true, config = {} } = moduleConfig;

        if (!enabled) {
            console.log(`Module ${name} is disabled, skipping`);
            return null;
        }

        try {
            console.log(`Loading module: ${name}`);

            // Dynamic import from node_modules
            let moduleExports;

            try {
                // Check if module is in our static import map first
                if (moduleImports[name]) {
                    console.log(`Loading module ${name} from import map`);
                    moduleExports = await moduleImports[name]();
                } else {
                    // Fallback to dynamic import for modules not in the map
                    console.log(`Loading module ${name} dynamically`);
                    // For npm packages, try to resolve from node_modules first
                    if (name.startsWith('@')) {
                        // Try explicit node_modules path for scoped packages
                        try {
                            const modulePath = `/node_modules/${name}/dist/index.js`;
                            moduleExports = await import(/* @vite-ignore */ modulePath);
                        } catch {
                            // Fallback to standard import
                            moduleExports = await import(/* @vite-ignore */ name);
                        }
                    } else {
                        // Standard import for non-scoped packages
                        moduleExports = await import(/* @vite-ignore */ name);
                    }
                }
            } catch (importError) {
                // Fallback for npm-linked modules during local development
                // This handles cases where Vite's module resolution doesn't work with npm link
                // See docs/guides/testing-modules.md for proper setup
                if (process.env.NODE_ENV === 'development') {
                    try {
                        // Try direct path import for npm-linked modules
                        // This assumes the module follows standard conventions (dist/index.js)
                        moduleExports = await import(
                            /* @vite-ignore */ `/node_modules/${name}/dist/index.js`
                        );
                    } catch (altError) {
                        // Re-throw original error if alternative also fails
                        throw importError;
                    }
                } else {
                    throw importError;
                }
            }

            // Get the default export which should be the FeatureModule
            const module = moduleExports.default;

            if (!module || !module.id) {
                throw new Error(`Module ${name} does not export a valid FeatureModule`);
            }

            // Apply configuration overrides
            if (config && Object.keys(config).length > 0) {
                module.config = { ...module.config, ...config };
            }

            // Store the loaded module
            loadedModules.value.set(name, module);

            // Register with the module registry
            moduleRegistry.register(module);

            console.log(`Successfully loaded module: ${name}`);
            return module;
        } catch (error) {
            const err = error as Error;
            console.error(`Failed to load module ${name}:`, err);
            errors.value.set(name, err);
            return null;
        }
    };

    /**
     * Load all configured modules
     */
    const loadAllModules = async () => {
        loadingState.value = 'loading';
        errors.value.clear();

        try {
            const configs = await loadConfig();

            if (configs.length === 0) {
                console.log('No external modules configured');
                loadingState.value = 'loaded';
                return;
            }

            console.log(`Found ${configs.length} modules to load`);

            // Load modules in parallel
            const results = await Promise.allSettled(configs.map((config) => loadModule(config)));

            // Count successful loads
            const successCount = results.filter(
                (r) => r.status === 'fulfilled' && r.value !== null
            ).length;
            const failCount = results.filter(
                (r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === null)
            ).length;

            console.log(`Module loading complete: ${successCount} succeeded, ${failCount} failed`);

            loadingState.value = failCount === 0 ? 'loaded' : 'error';
        } catch (error) {
            console.error('Failed to load modules:', error);
            loadingState.value = 'error';
        }
    };

    /**
     * Unload a module
     */
    const unloadModule = async (moduleName: string) => {
        const module = loadedModules.value.get(moduleName);
        if (!module) {
            console.warn(`Module ${moduleName} is not loaded`);
            return;
        }

        try {
            await moduleRegistry.unregister(module.id);
            loadedModules.value.delete(moduleName);
            errors.value.delete(moduleName);
            console.log(`Unloaded module: ${moduleName}`);
        } catch (error) {
            console.error(`Failed to unload module ${moduleName}:`, error);
        }
    };

    /**
     * Reload a specific module
     */
    const reloadModule = async (moduleName: string) => {
        await unloadModule(moduleName);

        // Find the original config
        const configs = await loadConfig();
        const config = configs.find((c) => c.name === moduleName);

        if (config) {
            await loadModule(config);
        }
    };

    /**
     * Get loaded module by name
     */
    const getModule = (moduleName: string): FeatureModule | undefined => {
        return loadedModules.value.get(moduleName);
    };

    /**
     * Check if a module is loaded
     */
    const isLoaded = (moduleName: string): boolean => {
        return loadedModules.value.has(moduleName);
    };

    // Auto-load modules if enabled
    if (autoLoad && process.client) {
        onMounted(() => {
            loadAllModules();
        });
    }

    return {
        // State
        loadingState: readonly(loadingState),
        loadedModules: readonly(loadedModules),
        errors: readonly(errors),

        // Methods
        loadAllModules,
        loadModule,
        unloadModule,
        reloadModule,
        getModule,
        isLoaded,
    };
};
