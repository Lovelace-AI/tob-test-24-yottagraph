export default defineNuxtRouteMiddleware(async (to, from) => {
    const { userIsPermitted, userName } = useUserState();

    // Check for Electron stored auth on first load
    if (!userName.value && typeof window !== 'undefined' && window.electronAPI) {
        const { restoreAuth } = useElectronAuth();
        const restored = await restoreAuth();
        if (restored) {
            return navigateTo('/');
        }
    }

    // to.path is the URL the user is trying to navigate to.
    if (!userName.value) {
        if (to.path !== '/a0callback' && to.path !== '/login' && to.path !== '/logout') {
            return navigateTo('/login');
        }
    } else {
        // If we have a username, check the permissions. If the user doesn't have
        // the right ones, take them to the chilling out page. Otherwise let them
        // continue to the main UI.

        if (!userIsPermitted()) {
            if (to.path !== '/pending' && to.path !== '/logout') {
                return navigateTo('pending');
            }
            return;
        }

        const allowedPaths = ['/', '/logout', '/chat'];

        // Check if this is a registered module path
        const { isRegistered } = useModuleRegistry();
        const pathSegments = to.path.split('/').filter(Boolean);
        const isModulePath = pathSegments.length > 0 && isRegistered(pathSegments[0]);

        if (!allowedPaths.includes(to.path) && !isModulePath) {
            return navigateTo('/');
        }
    }
});
