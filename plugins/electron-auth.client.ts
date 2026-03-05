// This plugin handles Auth0 callbacks for Electron apps
export default defineNuxtPlugin(async () => {
    // Only run in Electron
    const { isElectron } = useElectron();
    if (!isElectron.value) return;

    const route = useRoute();
    const router = useRouter();

    // Check if we have an auth code in the query params (for production)
    const authCode = route.query.auth_code as string;

    if (authCode) {
        console.log('[electron-auth] Found auth code in query params, processing...');

        // Remove the auth_code from the URL to clean it up
        const { auth_code, ...cleanQuery } = route.query;

        // Navigate to the callback page with the code
        await router.replace({
            path: '/a0callback',
            query: { code: authCode, ...cleanQuery },
        });
    }
});
