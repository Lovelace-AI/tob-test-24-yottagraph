/**
 * Module API Helper
 *
 * Include this file in your NPM module to access Aether's core APIs
 * This provides a consistent interface whether the module is used
 * as a local feature or as an NPM package.
 */

// Module API interface matching Aether's core
interface ModuleApi {
    useModuleBus: (moduleId: string) => {
        emit: (event: string, data: any) => void;
        on: (event: string, handler: Function) => () => void;
        off: (event: string, handler?: Function) => void;
    };
    useNotification: () => {
        show: (options: any) => void;
        success: (message: string) => void;
        error: (message: string) => void;
        info: (message: string) => void;
        warning: (message: string) => void;
    };
    usePrefsStore: () => any;
    useElementalService: () => any;
}

/**
 * Get the Aether Module API
 * This works in both local and NPM contexts
 */
export function getModuleApi(): ModuleApi | null {
    if (typeof window !== 'undefined' && (window as any).__aetherModuleApi) {
        return (window as any).__aetherModuleApi;
    }
    return null;
}

/**
 * Get the module bus for your module
 * Includes fallback for development/testing
 */
export function getModuleBus(moduleId: string) {
    const api = getModuleApi();

    if (api?.useModuleBus) {
        return api.useModuleBus(moduleId);
    }

    // Development fallback
    console.warn(`[${moduleId}] Module API not available, using mock implementation`);
    return {
        emit: (event: string, data: any) => {
            console.log(`[${moduleId}] Mock emit:`, event, data);
        },
        on: (event: string, handler: Function) => {
            console.log(`[${moduleId}] Mock on:`, event);
            return () => {};
        },
        off: (event: string, handler?: Function) => {
            console.log(`[${moduleId}] Mock off:`, event);
        },
    };
}

/**
 * Get notifications API
 */
export function getNotifications() {
    const api = getModuleApi();

    if (api?.useNotification) {
        return api.useNotification();
    }

    // Development fallback
    return {
        show: (options: any) => console.log('[Notification]', options),
        success: (msg: string) => console.log('[Success]', msg),
        error: (msg: string) => console.error('[Error]', msg),
        info: (msg: string) => console.info('[Info]', msg),
        warning: (msg: string) => console.warn('[Warning]', msg),
    };
}
