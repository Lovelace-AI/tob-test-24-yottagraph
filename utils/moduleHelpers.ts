/**
 * Module Helper Utilities
 *
 * These utilities help modules work consistently whether they're
 * built-in features or NPM packages.
 */

import type { ModuleApi } from '~/composables/useModuleApi';
import { useModuleBus } from '~/composables/useModuleBus';

/**
 * Get the module bus for a specific module
 * Works for both local and NPM modules
 */
export function getModuleBus(moduleId: string) {
    // For local modules in /features, we can use the imported composable
    if (useModuleBus) {
        return useModuleBus(moduleId);
    }

    // For NPM modules, check for global API
    if (typeof window !== 'undefined') {
        const globalApi = (window as any).__aetherModuleApi as ModuleApi | undefined;
        if (globalApi?.useModuleBus) {
            return globalApi.useModuleBus(moduleId);
        }
    }

    // Fallback for development
    console.warn(`[Module ${moduleId}] Module bus not available, using mock implementation`);
    return {
        emit: (event: string, data: any) =>
            console.warn(`[Module ${moduleId}] Mock emit:`, event, data),
        on: () => () => {},
        off: () => {},
    };
}

/**
 * Create a universal module bus hook
 * This can be used by any module to access the event bus
 */
export function createUseModuleBus(moduleId: string) {
    return () => getModuleBus(moduleId);
}
