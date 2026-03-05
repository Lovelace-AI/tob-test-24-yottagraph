/**
 * Module Debug Panel
 *
 * Provides a visual debugging interface for the Aether module system,
 * showing registered modules, event flow, and system state
 */

import { defineFeatureModule } from '../../composables/useModuleRegistry';
import { useModuleBus } from '../../composables/useModuleBus';
import { reactive } from 'vue';

export default defineFeatureModule({
    id: 'module-debug',
    name: 'Module Debug',
    icon: 'mdi-bug',
    description: 'Debug panel for visualizing module system and event flow',

    routes: [
        {
            path: '/module-debug',
            component: () => import('./pages/index.vue'),
            meta: {
                title: 'Module System Debug',
            },
        },
    ],

    navigation: {
        title: 'Debug Panel',
        order: 999, // Put at bottom
        show: () => {
            // Only show in development mode or with debug flag
            // For now, always show in dev builds
            return true;
        },
    },

    // Dependencies
    requires: ['useModuleBus', 'useModuleRegistry'],

    // Configuration
    config: {
        maxEventHistory: 100,
        eventVisualizationDuration: 3000, // ms
        autoRefresh: true,
        refreshInterval: 1000, // ms
    },

    setup() {
        console.log('Module Debug feature initialized');

        // Enable debug mode
        if (process.env.NODE_ENV === 'development') {
            localStorage.setItem('aether-debug', 'true');
        }

        // Set up global event listening from app startup
        const { onAll } = useModuleBus('module-debug');

        // Create a global reactive store for captured events
        const globalStore = reactive({
            eventHistory: [] as Array<{
                id: number;
                type: string;
                source: string;
                data: any;
                timestamp: Date;
            }>,
            activeEvents: [] as Array<any>,
            allHandlersCount: 0,
            startTime: new Date(),
        });

        // Listen to ALL events from app startup
        console.log('[Module Debug] Setting up global event listener in setup()');
        const unsubscribe = onAll((eventType: string, data: any) => {
            // Events from module bus are wrapped in ModuleEvent structure
            const source = data?.moduleId || data?.data?.source || data?.source || 'Unknown';

            const event = {
                id: Date.now(),
                type: eventType,
                source: source,
                data: data,
                timestamp: new Date(),
            };

            // Add to history
            globalStore.eventHistory.unshift(event);
            if (globalStore.eventHistory.length > 100) {
                globalStore.eventHistory = globalStore.eventHistory.slice(0, 100);
            }

            // Note: Animation is handled by the component when it's mounted
            // We just store the events here
        });

        // Expose the store globally for the component to use
        (window as any).__moduleDebugGlobalStore = globalStore;
        (window as any).__moduleDebugUnsubscribe = unsubscribe;
    },
});
