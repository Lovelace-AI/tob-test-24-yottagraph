/**
 * Feature Module Definition Template
 *
 * Copy this template when creating a new feature:
 * 1. Copy the entire feature-template directory to features/your-feature-name
 * 2. Update all placeholders marked with TODO
 * 3. Implement your functionality
 */

import { defineFeatureModule } from '~/composables/useModuleRegistry';

export default defineFeatureModule({
    // TODO: Update with your feature's unique ID (kebab-case)
    id: 'feature-template',

    // TODO: Update with human-readable name
    name: 'Feature Template',

    // TODO: Choose appropriate Material Design Icon
    // Browse icons at: https://materialdesignicons.com/
    icon: 'mdi-star',

    // TODO: Brief description of what your feature does
    description: 'A template for creating new feature modules',

    // Define routes for this feature
    routes: [
        {
            path: '/feature-template', // TODO: Update path
            component: () => import('./pages/index.vue'),
            meta: {
                title: 'Feature Template', // TODO: Update page title
            },
        },
    ],

    // Navigation sidebar configuration
    navigation: {
        title: 'Feature Template', // TODO: Update nav title
        order: 100, // TODO: Set appropriate order (lower = higher in nav)
        // Optional: Only show in certain conditions
        // show: () => useUserState().isAuthenticated.value
    },

    // Dependencies - what this feature needs from Aether or other features
    requires: [
        // TODO: Add required composables/services
        // Examples:
        // 'useElementalService', // For API calls
        // 'useCesiumViewer',     // For map features
        // 'usePrefsStore',       // For preferences
        // 'useUserState',        // For auth state
    ],

    // Exports - what this feature provides to other features
    provides: [
        // TODO: Add what your feature exports
        // Example: 'useFeatureTemplate'
    ],

    // Optional: Feature configuration
    config: {
        // TODO: Add any configuration options
        // Example:
        // defaultView: 'grid',
        // refreshInterval: 30000
    },

    // Optional: Feature initialization
    async setup() {
        // TODO: Add any initialization logic
        // This runs when the feature is registered
        console.log('Feature Template initialized');
    },

    // Optional: Feature cleanup
    async cleanup() {
        // TODO: Add any cleanup logic
        // This runs when the feature is unregistered
        console.log('Feature Template cleaned up');
    },
});
