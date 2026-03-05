/**
 * Event Receiver Example Feature
 *
 * Demonstrates how to receive and handle events from the Aether event bus
 * for inter-module communication.
 *
 * ARCHITECTURE NOTE FOR AI AGENTS:
 * This feature shows the CORRECT pattern for persistent event listening.
 * Events are captured in the setup() method below, which runs at app startup.
 * This ensures no events are missed, even if the user hasn't opened the UI yet.
 *
 * Key Pattern:
 * 1. setup() method runs at app startup (not component mount)
 * 2. Creates a global reactive store for captured events
 * 3. Component UI just displays the accumulated events
 *
 * This is different from component-only listening which misses events
 * that occur before the component is mounted.
 */

import { defineFeatureModule } from '../../composables/useModuleRegistry';
import { useModuleBus } from '../../composables/useModuleBus';
import { reactive } from 'vue';

export default defineFeatureModule({
    id: 'event-receiver',
    name: 'Event Receiver',
    icon: 'mdi-antenna',
    description: 'Example feature that receives and displays events from other modules',

    routes: [
        {
            path: '/event-receiver',
            component: () => import('./pages/index.vue'),
            meta: {
                title: 'Event Receiver Demo',
            },
        },
    ],

    navigation: {
        title: 'Event Receiver',
        order: 91,
    },

    // This feature uses the event bus
    requires: ['useModuleBus'],

    // What this module provides
    provides: ['useEventHistory'],

    config: {
        maxEventHistory: 50,
        showNotifications: true,
    },

    setup() {
        // Set up global event listeners that persist from app startup
        // This runs BEFORE any components are mounted!
        const { onAll } = useModuleBus('event-receiver-global');

        // Create a global reactive event store
        const globalStore = reactive({
            events: [] as Array<{
                id: string;
                type: string;
                data: any;
                timestamp: Date;
            }>,
            eventCounts: {} as Record<string, number>,
            latestEvent: null as null | {
                id: string;
                type: string;
                data: any;
                timestamp: Date;
            },
            isListening: true,
            startTime: new Date(),
        });

        // Listen to ALL events from app startup
        const unsubscribe = onAll((eventType: string, eventData: any) => {
            // Store events for later viewing
            const event = {
                id: `${Date.now()}-${Math.random()}`,
                type: eventType,
                data: eventData?.data || eventData,
                timestamp: new Date(),
            };

            globalStore.events.unshift(event);

            // Update counts
            globalStore.eventCounts[eventType] = (globalStore.eventCounts[eventType] || 0) + 1;

            // Track the latest event for notification purposes
            globalStore.latestEvent = event;

            // Keep only last 1000 events to prevent memory issues
            if (globalStore.events.length > 1000) {
                globalStore.events.pop();
            }
        });

        // Expose the event store for components to use
        (window as any).__eventReceiverGlobalStore = globalStore;

        // Optional: clean up on app teardown (though rarely needed)
        // You could store the unsubscribe function globally if needed
    },
});
