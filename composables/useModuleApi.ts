/**
 * Module API Provider
 *
 * This composable provides a consistent API for modules to access core functionality,
 * whether they're built-in features or NPM packages.
 *
 * It solves the problem of NPM modules not being able to import from ~/composables
 * by providing a global, consistent interface.
 */

import type { FeatureModule } from './useModuleRegistry';
import { useModuleBus } from './useModuleBus';
import { useNotification } from './useNotification';
import { usePrefsStore } from './usePrefsStore';
import { useElementalService } from './useElementalService';

// Module API interface that all modules can rely on
export interface ModuleApi {
    // Core composables
    useModuleBus: typeof useModuleBus;
    useNotification: typeof useNotification;
    usePrefsStore: typeof usePrefsStore;
    useElementalService: typeof useElementalService;

    // Additional APIs can be added here
}

// Global module API instance
let moduleApi: ModuleApi | null = null;

/**
 * Initialize the module API
 * Called once during app initialization
 */
export function initializeModuleApi() {
    if (moduleApi) return moduleApi;

    moduleApi = {
        useModuleBus,
        useNotification,
        usePrefsStore,
        useElementalService,
    };

    // Make it globally available for NPM modules
    if (typeof window !== 'undefined') {
        (window as any).__aetherModuleApi = moduleApi;
    }

    return moduleApi;
}

/**
 * Get the module API
 * Works for both local and NPM modules
 */
export function useModuleApi(): ModuleApi {
    // For local modules, we can use the direct instance
    if (moduleApi) return moduleApi;

    // For NPM modules running before initialization
    if (typeof window !== 'undefined' && (window as any).__aetherModuleApi) {
        return (window as any).__aetherModuleApi;
    }

    // Initialize if needed
    return initializeModuleApi();
}

/**
 * Helper to create a module-aware composable
 * This allows modules to access the API in a clean way
 */
export function createModuleComposable<T extends keyof ModuleApi>(composableName: T): ModuleApi[T] {
    return (...args: any[]) => {
        const api = useModuleApi();
        return (api[composableName] as any)(...args);
    };
}
