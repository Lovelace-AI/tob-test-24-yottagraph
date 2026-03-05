// Initialize Electron authentication on app startup
export default defineNuxtPlugin(async () => {
    // Check if we're in Electron
    const isInElectron = typeof window !== 'undefined' && window.electronAPI;

    if (!isInElectron) {
        return;
    }

    // Wait a bit for everything to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Initialize auth (check for stored credentials)
    const { initializeAuth } = useElectronAuth();

    // Restore auth from secure storage if available
    await initializeAuth();
});
