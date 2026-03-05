/**
 * Full annotated module definition template.
 *
 * Copy this file when creating a new feature module.
 * See .cursor/rules/architecture.mdc for the condensed reference.
 */

import { defineFeatureModule } from '~/composables/useModuleRegistry';

export default defineFeatureModule({
    // Unique identifier (kebab-case)
    id: 'my-feature',

    // Display name shown in UI
    name: 'My Feature',

    // Material Design Icon -- MUST be at root level, NOT inside navigation
    icon: 'mdi-star',

    description: 'Brief description of what this module does',

    // Routes for this feature
    routes: [
        {
            path: '/my-feature',
            component: () => import('./pages/index.vue'),
            meta: { title: 'My Feature' },
        },
    ],

    // Sidebar navigation entry
    navigation: {
        title: 'My Feature', // MUST be 'title', NOT 'label'
        order: 10, // Lower = higher in sidebar
        show: () => true, // Conditional visibility
    },

    // Runs once at app startup -- use for persistent state and event listeners.
    // NEVER set up event listeners in component onMounted(); they will miss events.
    setup() {
        const { on, emit } = useModuleBus('my-feature');
        on('entity:selected', (data) => {
            // This listener persists across navigation
        });

        // Persistent state via provide/inject
        const store = reactive({
            selectedItems: [] as string[],
            isRunning: false,
        });
        provide('myFeatureStore', store);
    },

    // Runs when module is first installed
    onInstall() {
        console.log('Module installed');
    },

    // Cleanup when module is removed
    onUninstall() {
        console.log('Module uninstalled');
    },

    // Composables this module needs from other modules
    requires: ['useElementalService'],

    // Composables this module exposes to other modules
    provides: ['useMyFeature'],
});
