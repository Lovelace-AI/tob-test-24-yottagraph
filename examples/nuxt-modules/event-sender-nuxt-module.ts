// @aether/event-sender-module/src/module.ts

import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit';

export default defineNuxtModule({
    meta: {
        name: '@aether/event-sender',
        configKey: 'aetherEventSender',
    },

    defaults: {
        enableDebug: false,
    },

    setup(options, nuxt) {
        const { resolve } = createResolver(import.meta.url);

        // 1. Add the feature registration plugin
        addPlugin({
            src: resolve('./runtime/plugin.ts'),
            mode: 'client',
        });

        // 2. Auto-import composables
        nuxt.options.imports.dirs = nuxt.options.imports.dirs || [];
        nuxt.options.imports.dirs.push(resolve('./runtime/composables'));

        // 3. Transpile runtime
        nuxt.options.build.transpile.push('@aether/event-sender');
    },
});

// @aether/event-sender-module/src/runtime/plugin.ts
export default defineNuxtPlugin(() => {
    const moduleRegistry = useModuleRegistry();

    moduleRegistry.register({
        id: 'event-sender',
        name: 'Event Sender',
        icon: 'mdi-send',
        description: 'Send events on the module bus',

        routes: [
            {
                path: '/event-sender',
                component: () => import('./pages/event-sender.vue'),
            },
        ],

        navigation: {
            title: 'Event Sender',
            order: 20,
            show: () => true,
        },

        provides: ['useEventSender'],
    });
});

// In user's nuxt.config.ts
export default defineNuxtConfig({
    modules: [
        '@aether/event-sender', // Just add this!
        '@aether/event-receiver', // Auto-registers both
        '@aether/entity-lookup', // Each is self-contained
        '@aether/doom', // Including complex ones
    ],
});
