<template>
    <v-app class="theme-brand">
        <template v-if="showAppFramework">
            <AppHeader />
            <ModularSideNavPanel />

            <v-main class="fill-height">
                <ServerStatus />
                <NuxtPage />
            </v-main>

            <!-- Global Dialogs -->
            <v-dialog v-model="state.showSettingsDialog" max-width="600">
                <SettingsDialog />
            </v-dialog>

            <!-- Global Notifications -->
            <NotificationContainer />

            <!-- Server Status Footer -->
            <ServerStatusFooter />
        </template>
        <template v-else>
            <!-- Just render the page without any framework -->
            <NuxtPage />
        </template>
    </v-app>
</template>

<script setup lang="ts">
    import { state } from './utils/appState';

    // Module registration now happens in plugins/01.module-registry.client.ts
    // This ensures modules are available before routing occurs

    const route = useRoute();
    const { userName } = useUserState();

    // Define which routes should not show the app framework
    const noFrameworkRoutes = ['/login', '/a0callback', '/logout', '/pending'];

    // Compute whether to show the app framework
    const showAppFramework = computed(() => {
        // Don't show framework on auth-related pages
        if (noFrameworkRoutes.includes(route.path)) {
            return false;
        }

        // Also don't show framework if user is not authenticated
        // (though middleware should redirect to login anyway)
        if (!userName.value) {
            return false;
        }

        return true;
    });

    onMounted(() => {
        const config = useRuntimeConfig();

        console.log('App mounted', config.public.tobTest);
        console.log('Server status', config.public['queryServerAddress']);
    });
</script>
