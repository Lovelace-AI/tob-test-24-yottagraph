import type { FeatureModule } from './types';
import IndexPage from './pages/index.vue';
import HelloWidget from './widgets/HelloWidget.vue';

// Module definition
const helloNpmModule: FeatureModule = {
    id: 'hello-npm',
    name: 'Hello NPM',
    icon: 'mdi-npm',
    description: 'Example module demonstrating NPM packaging for Aether',

    // Components
    standalone: IndexPage,
    widget: HelloWidget,

    // Routes for standalone mode
    routes: [
        {
            path: '/hello-npm',
            component: IndexPage,
            meta: {
                title: 'Hello NPM Module',
            },
        },
    ],

    // Navigation entry
    navigation: {
        title: 'Hello NPM',
        order: 200,
    },

    // Dependencies - these should be available in the host app
    requires: ['useModuleBus'],
    provides: ['useHelloNpm'],

    // Module configuration with defaults
    config: {
        greeting: 'Hello from NPM!',
        showTimestamp: true,
        refreshInterval: 5000,
    },

    // Lifecycle hooks
    async setup() {
        console.log('[Hello NPM] Module setup complete');
    },

    async onInstall() {
        console.log('[Hello NPM] Module installed');
    },

    async onUninstall() {
        console.log('[Hello NPM] Module uninstalled');
    },
};

// Export the module as default
export default helloNpmModule;

// Export composables that this module provides
export { useHelloNpm } from './composables/useHelloNpm';

// Export types
export type { HelloNpmConfig } from './types';
