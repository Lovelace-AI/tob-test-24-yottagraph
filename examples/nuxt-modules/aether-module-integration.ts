// How to make Nuxt modules work with your existing module registry

import { defineNuxtModule } from '@nuxt/kit';
import type { FeatureModule } from '~/composables/useModuleRegistry';

export default defineNuxtModule({
    meta: {
        name: 'aether-feature-module',
    },

    setup(options, nuxt) {
        // Your feature module definition
        const featureModule: FeatureModule = {
            id: 'my-feature',
            name: 'My Feature',
            icon: 'mdi-star',
            routes: [
                {
                    path: '/my-feature',
                    component: () => import('./runtime/pages/index.vue'),
                },
            ],
            navigation: {
                title: 'My Feature',
                order: 10,
            },
        };

        // Register with your module system on app init
        nuxt.hook('app:created', () => {
            // This code runs in the browser
            const { useModuleRegistry } = await import('~/composables/useModuleRegistry');
            const registry = useModuleRegistry();
            registry.register(featureModule);
        });

        // Or generate a plugin that does the registration
        nuxt.hook('modules:done', () => {
            addPlugin({
                src: resolver.resolve('./runtime/register-plugin.ts'),
                mode: 'client',
                order: 10, // After your 01.module-registry.client.ts
            });
        });
    },
});

// runtime/register-plugin.ts
export default defineNuxtPlugin(() => {
    const moduleRegistry = useModuleRegistry();

    // Import the feature module definition
    import featureModule from './feature-module';

    // Register it
    moduleRegistry.register(featureModule);
});
