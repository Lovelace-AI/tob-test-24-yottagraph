/**
 * Plugin to load saved server configuration from Electron storage
 * This runs on the client side only and overrides runtime config if custom servers are saved
 */

export default defineNuxtPlugin(async (nuxtApp) => {
    // Only run in Electron environment
    if (process.client && (window as any).electronAPI) {
        try {
            const electronAPI = (window as any).electronAPI;
            const savedConfig = await electronAPI.store.get('serverConfig');

            if (savedConfig) {
                const config = useRuntimeConfig();

                // Override query server address if saved (support legacy newsServerAddress)
                const address = savedConfig.queryServerAddress || savedConfig.newsServerAddress;
                if (address) {
                    (config.public as any).queryServerAddress = address;
                }

                console.log('Loaded server configuration from Electron storage:', {
                    queryServer: address || 'default',
                });
            }
        } catch (error) {
            console.error('Failed to load Electron config:', error);
            // Continue with default config
        }
    }
});
