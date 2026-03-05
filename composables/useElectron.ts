/**
 * Composable for interacting with Electron APIs
 * This provides a clean interface to check if we're running in Electron
 * and access Electron-specific functionality
 */

export interface ElectronAPI {
    platform: string;
    isElectron: boolean;
    getVersion: () => Promise<string>;
    getPlatformInfo: () => Promise<any>;
    minimize?: () => void;
    maximize?: () => void;
    close?: () => void;
    store?: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
        delete: (key: string) => Promise<void>;
    };
}

export const useElectron = () => {
    // Check if we're running in Electron
    const isElectron = computed(() => {
        if (process.client) {
            return !!(window as any).electronAPI;
        }
        return false;
    });

    // Get the Electron API if available
    const electronAPI = computed<ElectronAPI | null>(() => {
        if (process.client && (window as any).electronAPI) {
            return (window as any).electronAPI;
        }
        return null;
    });

    // Platform information
    const platform = computed(() => {
        if (electronAPI.value) {
            return electronAPI.value.platform;
        }
        if (process.client) {
            return navigator.platform;
        }
        return 'unknown';
    });

    // App version (Electron version or web version)
    const getAppVersion = async () => {
        if (electronAPI.value) {
            return await electronAPI.value.getVersion();
        }
        // Return the version from runtime config for web
        const config = useRuntimeConfig();
        return config.public.versionString || '0.1.0';
    };

    // Window controls (only available in Electron)
    const windowControls = {
        minimize: () => electronAPI.value?.minimize?.(),
        maximize: () => electronAPI.value?.maximize?.(),
        close: () => electronAPI.value?.close?.(),
    };

    // Storage helpers (uses Electron's persistent storage if available)
    const storage = {
        get: async (key: string) => {
            if (electronAPI.value?.store) {
                return await electronAPI.value.store.get(key);
            }
            // Fallback to localStorage for web
            if (process.client) {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : null;
            }
            return null;
        },
        set: async (key: string, value: any) => {
            if (electronAPI.value?.store) {
                return await electronAPI.value.store.set(key, value);
            }
            // Fallback to localStorage for web
            if (process.client) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        },
        delete: async (key: string) => {
            if (electronAPI.value?.store) {
                return await electronAPI.value.store.delete(key);
            }
            // Fallback to localStorage for web
            if (process.client) {
                localStorage.removeItem(key);
            }
        },
    };

    return {
        isElectron: readonly(isElectron),
        platform: readonly(platform),
        getAppVersion,
        windowControls,
        storage,
    };
};
