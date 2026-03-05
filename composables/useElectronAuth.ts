// Composable for handling Electron-specific authentication with secure storage
import * as Iron from 'iron-webcrypto';

interface UserCookie {
    user: {
        sub: string;
        name: string;
        email: string;
        email_verified: boolean;
        picture: string;
    };
    scope: string;
    expires_in: number;
    token_type: string;
    permissions: string;
    access_token?: string;
}

export const useElectronAuth = () => {
    const { isElectron } = useElectron();
    const config = useRuntimeConfig();

    // Check if we have stored auth credentials
    const checkStoredAuth = async () => {
        if (!isElectron.value || !window.electronAPI?.auth) return null;

        try {
            const result = await window.electronAPI.auth.checkStored();
            if (result.hasStoredAuth && result.tokens) {
                return result.tokens;
            }
        } catch (error) {
            console.error('[Electron Auth] Error checking stored auth:', error);
        }

        return null;
    };

    // Restore authentication from stored tokens
    const restoreAuth = async () => {
        if (!isElectron.value) return false;

        try {
            let storedData = await checkStoredAuth();
            if (!storedData) return false;

            // Check if we have the cookie data stored
            if (storedData.cookieData) {
                // Check if the stored session is expired
                if (storedData.expires_at && storedData.expires_at < Date.now()) {
                    // Try to refresh if we have a refresh token
                    if (storedData.refresh_token) {
                        const refreshed = await refreshTokens();
                        if (!refreshed) {
                            await clearStoredAuth();
                            return false;
                        }
                        // Continue with the refreshed data
                        storedData = await checkStoredAuth();
                        if (!storedData || !storedData.cookieData) {
                            return false;
                        }
                    } else {
                        // No refresh token, clear and fail
                        await clearStoredAuth();
                        return false;
                    }
                }

                // Recreate the sealed cookie
                const cookieSecret = config.public.cookieSecret;
                const sealedCookie = await Iron.seal(
                    globalThis.crypto,
                    storedData.cookieData,
                    cookieSecret,
                    Iron.defaults
                );

                // Set the cookie
                const cookieName = config.public.auth0CookieName;
                const cookie = useCookie(cookieName, {
                    default: () => '',
                    sameSite: 'lax',
                });
                cookie.value = sealedCookie;

                // Also restore the composable state
                const { setUserFromCookie } = useUserState();
                await setUserFromCookie();

                return true;
            }

            return false;
        } catch (error) {
            console.error('[Electron Auth] Failed to restore auth:', error);
            return false;
        }
    };

    // Store auth data securely (including cookie data for session restoration)
    const storeAuth = async (tokens: any, cookieData?: UserCookie) => {
        if (!isElectron.value || !window.electronAPI?.auth) return false;

        try {
            // Store both the raw tokens and the cookie data
            const dataToStore = {
                ...tokens,
                cookieData: cookieData || null,
            };

            const result = await window.electronAPI.auth.storeTokens(dataToStore);
            return result.success;
        } catch (error) {
            console.error('[Electron Auth] Failed to store auth:', error);
            return false;
        }
    };

    // Clear stored auth (logout)
    const clearStoredAuth = async () => {
        if (!isElectron.value || !window.electronAPI?.auth) return;

        try {
            await window.electronAPI.auth.logout();
        } catch (error) {
            console.error('[Electron Auth] Failed to clear stored auth:', error);
        }
    };

    // Refresh tokens if needed
    const refreshTokens = async () => {
        if (!isElectron.value || !window.electronAPI?.auth) return null;

        try {
            const result = await window.electronAPI.auth.refreshTokens();
            if (result.success && result.tokens) {
                return result.tokens;
            }
        } catch (error) {
            console.error('[Electron Auth] Failed to refresh tokens:', error);
        }

        return null;
    };

    // Auto-restore auth on app startup
    const initializeAuth = async () => {
        if (!isElectron.value) return;

        const restored = await restoreAuth();

        if (restored) {
            // If we're on the login page, navigate to home
            const route = useRoute();
            const router = useRouter();
            if (route.path === '/login') {
                await router.replace('/');
            }
        }
    };

    return {
        checkStoredAuth,
        restoreAuth,
        storeAuth,
        clearStoredAuth,
        refreshTokens,
        initializeAuth,
    };
};
