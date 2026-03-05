const { clearUser } = useUserState();

// This is called when the /logout route is hit.
export default defineNuxtRouteMiddleware(async (to, from) => {
    await clearUser();

    // For Electron, also clear stored auth tokens
    const { isElectron } = useElectron();
    if (isElectron.value) {
        // Clear auth cookies
        if (window.electronAPI?.clearAuthCookies) {
            await window.electronAPI.clearAuthCookies();
        }

        // Clear stored auth tokens from secure storage
        const { clearStoredAuth } = useElectronAuth();
        await clearStoredAuth();

        // Trigger window transition from main to login window
        if (window.electronAPI?.authLogoutTransition) {
            await window.electronAPI.authLogoutTransition();
            // In Electron, the window transition handles navigation
            // Don't navigate here to avoid loading login in the wrong window
            return;
        }
    }

    return navigateTo('/login');
});
