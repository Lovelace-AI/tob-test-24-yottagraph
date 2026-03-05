<template>
    <KeepAlive v-if="moduleComponent">
        <component :is="moduleComponent" :key="route.path" />
    </KeepAlive>
    <v-container v-else>
        <v-alert v-if="moduleName" type="error" class="mt-4">
            <v-alert-title>Module Not Found</v-alert-title>
            <div>The module "{{ moduleName }}" is not available.</div>
            <div class="mt-2 text-caption">Requested path: {{ route.path }}</div>
            <template v-slot:append>
                <v-btn variant="text" to="/"> Go Home </v-btn>
            </template>
        </v-alert>
    </v-container>
</template>

<script setup lang="ts">
    import { useModuleRegistry } from '~/composables/useModuleRegistry';
    import { defineAsyncComponent } from 'vue';

    const route = useRoute();
    const moduleRegistry = useModuleRegistry();

    // Get the module name from the route
    const moduleName = computed(() => {
        const paths = route.params.module;
        // Handle both string and string[] cases
        if (typeof paths === 'string') {
            return paths;
        }
        if (Array.isArray(paths)) {
            return paths[0] || '';
        }
        return '';
    });

    // Add debug logging in development
    if (process.dev) {
        watchEffect(() => {
            console.log('[Module Route Debug]', {
                fullPath: route.fullPath,
                path: route.path,
                params: route.params,
                moduleName: moduleName.value,
                moduleExists: moduleRegistry.isRegistered(moduleName.value),
            });
        });
    }

    // Get the module component
    const moduleComponent = computed(() => {
        const module = moduleRegistry.getModule(moduleName.value);
        if (!module) {
            return null;
        }

        // Match the current path to find the right route
        const currentPath = route.path;
        let matchedRoute = module.routes?.[0]; // default to first route

        console.log('[Module Component] Finding route for path:', currentPath);
        console.log(
            '[Module Component] Available routes:',
            module.routes?.map((r) => r.path)
        );

        // Try to find exact match
        for (const moduleRoute of module.routes || []) {
            if (currentPath === moduleRoute.path) {
                console.log('[Module Component] Found exact match:', moduleRoute.path);
                matchedRoute = moduleRoute;
                break;
            }
        }

        if (!matchedRoute?.component) {
            return null;
        }

        // Handle both direct imports and dynamic imports
        const comp = matchedRoute.component;

        // If it's a function (dynamic import), wrap it with defineAsyncComponent
        if (typeof comp === 'function') {
            return defineAsyncComponent(comp as any);
        }

        // Otherwise it's already a component
        return comp;
    });
</script>
