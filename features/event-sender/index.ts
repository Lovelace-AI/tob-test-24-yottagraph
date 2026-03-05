/**
 * Event Sender Example Feature
 *
 * Demonstrates how to send events on the Aether event bus
 * for inter-module communication.
 *
 * ARCHITECTURE NOTE FOR AI AGENTS:
 * This feature shows the CORRECT pattern for persistent event history.
 * Sent events are stored in a global reactive store created in the setup() method.
 * This ensures the history persists even when navigating away from the UI.
 *
 * Key Pattern:
 * 1. setup() method runs at app startup (not component mount)
 * 2. Creates a global reactive store for sent event history
 * 3. Component UI uses this persistent store
 *
 * This prevents loss of history when the component unmounts.
 */

import { defineFeatureModule } from '../../composables/useModuleRegistry';
import { useModuleBus } from '../../composables/useModuleBus';
import { reactive } from 'vue';

export default defineFeatureModule({
    id: 'event-sender',
    name: 'Event Sender',
    icon: 'mdi-broadcast',
    description: 'Example feature that sends events to other modules',

    routes: [
        {
            path: '/event-sender',
            component: () => import('./pages/index.vue'),
            meta: {
                title: 'Event Sender Demo',
            },
        },
    ],

    navigation: {
        title: 'Event Sender',
        order: 90,
    },

    // This feature uses the event bus
    requires: ['useModuleBus'],

    // What this module provides
    provides: ['useSentEventHistory'],

    // Example configuration
    config: {
        defaultMessage: 'Hello from Event Sender!',
        maxEventHistory: 50,
        broadcastInterval: null, // No auto-broadcast by default
    },

    setup() {
        // Get event bus for this module
        const { emit } = useModuleBus('event-sender');

        // Create a global reactive store for sent events
        // This persists from app startup and survives component unmount/remount
        const globalStore = reactive({
            sentEvents: [] as Array<{
                id: string;
                type: string;
                data: any;
                timestamp: Date;
            }>,
            eventCounts: {} as Record<string, number>,
            totalSent: 0,
            startTime: new Date(),
            // Auto-send state
            autoSendEnabled: false,
            autoSendInterval: null as NodeJS.Timeout | null,
            autoSendMessage: 'Hello from Event Sender!',
            autoSendEventType: 'demo:message',
        });

        // Helper function to send an event (used by both manual and auto-send)
        function sendEvent(message: string, eventType: string) {
            const eventData = {
                message,
                source: 'event-sender',
                timestamp: new Date().toISOString(),
            };

            // Emit the event
            emit(eventType, eventData);

            // Add to history
            const event = {
                id: `${Date.now()}-${Math.random()}`,
                type: eventType,
                data: eventData,
                timestamp: new Date(),
            };

            globalStore.sentEvents.unshift(event);
            globalStore.eventCounts[eventType] = (globalStore.eventCounts[eventType] || 0) + 1;
            globalStore.totalSent++;

            // Keep only last 50 events
            if (globalStore.sentEvents.length > 50) {
                globalStore.sentEvents = globalStore.sentEvents.slice(0, 50);
            }
        }

        // Auto-send management function
        function setAutoSend(enabled: boolean) {
            if (enabled && !globalStore.autoSendEnabled) {
                // Send immediately
                const counter = globalStore.totalSent + 1;
                const message = `Auto-message #${counter} at ${new Date().toLocaleTimeString()}`;
                sendEvent(message, globalStore.autoSendEventType);

                // Clear any existing interval
                if (globalStore.autoSendInterval) {
                    clearInterval(globalStore.autoSendInterval);
                }

                // Start new interval
                globalStore.autoSendInterval = setInterval(() => {
                    try {
                        // Check if we should still be running
                        if (!globalStore.autoSendEnabled) {
                            if (globalStore.autoSendInterval) {
                                clearInterval(globalStore.autoSendInterval);
                                globalStore.autoSendInterval = null;
                            }
                            return;
                        }

                        const counter = globalStore.totalSent + 1;
                        const message = `Auto-message #${counter} at ${new Date().toLocaleTimeString()}`;
                        const eventType = globalStore.autoSendEventType || 'demo:message';
                        sendEvent(message, eventType);
                    } catch (error) {
                        console.error('[Event Sender] Auto-send error:', error);
                        // Stop auto-send on error
                        if (globalStore.autoSendInterval) {
                            clearInterval(globalStore.autoSendInterval);
                            globalStore.autoSendInterval = null;
                        }
                        globalStore.autoSendEnabled = false;
                    }
                }, 3000);

                globalStore.autoSendEnabled = true;
            } else if (!enabled && globalStore.autoSendEnabled) {
                // Stop auto-send
                if (globalStore.autoSendInterval) {
                    clearInterval(globalStore.autoSendInterval);
                    globalStore.autoSendInterval = null;
                }
                globalStore.autoSendEnabled = false;
            }
        }

        // Expose functions globally
        (window as any).__eventSenderGlobalStore = globalStore;
        (window as any).__eventSenderSendEvent = sendEvent;
        (window as any).__eventSenderSetAutoSend = setAutoSend;
    },
});
