import { hashMode } from '#build/router.options';

export default defineNuxtPlugin(async () => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    // Auth0 redirects to /a0callback?code=... after login.
    // In hash-mode routing (DEPLOY_TARGET=electron), the router uses /#/
    // paths and can't see /a0callback, so redirect to the hash equivalent.
    // In history mode (Vercel), /a0callback resolves natively.
    // Either way, return early to avoid the cookie-check race below.
    if (path === '/a0callback') {
        if (hashMode) {
            window.location.replace(
                `${window.location.origin}/#/a0callback${window.location.search}`
            );
        }
        return;
    }

    // Already on the hash-based callback route -- let middleware handle it
    if (hash.startsWith('#/a0callback')) {
        return;
    }

    const { setUserFromCookie, setUserFromString } = useUserState();
    const userName = useRuntimeConfig().public.userName;

    if (userName && userName.length > 0) {
        setUserFromString(userName);
    } else {
        const result = await setUserFromCookie();

        if (!result) {
            navigateTo('/logout');
        }
    }
});
