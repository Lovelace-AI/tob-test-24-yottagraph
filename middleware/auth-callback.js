// This is called when the /a0callback route is hit.
export default defineNuxtRouteMiddleware(async (to, from) => {
    const { setUserFromAuth0, userCookie, accessToken, userId, userName, userPicture } =
        useUserState();
    const { isElectron } = useElectron();

    const code = to.query?.code;
    let authError = null;
    let authTokens = null;

    if (!code) {
        authError = 'No authorization code received from Auth0';
    } else {
        try {
            // Get auth tokens during authentication
            authTokens = await setUserFromAuth0(code);

            // In Electron, store the tokens and cookie data securely for future sessions
            if (isElectron.value && authTokens) {
                const { storeAuth } = useElectronAuth();

                // Wait a tick for the state to be updated
                await new Promise((resolve) => setTimeout(resolve, 100));

                // Extract user data from the ID token
                const idTokenPayload = authTokens.id_token
                    ? JSON.parse(atob(authTokens.id_token.split('.')[1]))
                    : {};

                // Create the cookie data structure to store
                const cookieData = {
                    user: {
                        sub: userId.value || idTokenPayload.sub,
                        name: userName.value || idTokenPayload.name,
                        email: idTokenPayload.email || '',
                        email_verified: idTokenPayload.email_verified || false,
                        picture: userPicture.value || idTokenPayload.picture,
                    },
                    scope: authTokens.scope,
                    expires_in: authTokens.expires_in,
                    token_type: authTokens.token_type,
                    permissions: 'read:all', // This matches REQUIRED_ACCESS in useUserState
                    access_token: accessToken.value || authTokens.access_token,
                };

                // Calculate expires_at timestamp from expires_in
                const tokensWithExpiry = {
                    ...authTokens,
                    expires_at: Date.now() + authTokens.expires_in * 1000,
                };

                await storeAuth(tokensWithExpiry, cookieData);
            }
        } catch (error) {
            authError = error.message || 'Authentication failed';
            console.error('[auth-callback] Authentication failed:', error);
        }
    }

    // Navigate to home or login page with error if auth failed
    if (authError) {
        return navigateTo({
            path: '/login',
            query: {
                error: authError,
                // Keep other query params except code
                ...Object.fromEntries(Object.entries(to.query).filter(([key]) => key !== 'code')),
            },
        });
    }

    // In Electron login window, trigger window transition
    if (isElectron.value && to.query?.electron_login_window === 'true') {
        // Trigger the transition to main window
        await window.electronAPI.authLoginSuccess();
        // The login window will be closed by the main process
        // Just show a success message while transitioning
        return;
    }

    // Success - send to home page
    return navigateTo({
        path: '/',
        // pass through query params except for code
        query: { ...to.query, code: undefined },
    });
});
