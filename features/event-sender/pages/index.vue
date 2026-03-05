<template>
    <v-container fluid class="pa-0 fill-height">
        <v-row class="fill-height ma-0">
            <v-col cols="12" class="pa-2 fill-height">
                <div class="feature-wrapper">
                    <FeatureHeader title="Event Sender Demo" icon="mdi-broadcast" />

                    <v-card class="feature-content" flat>
                        <v-card-text>
                            <p class="mb-4">
                                This feature demonstrates sending events on the Aether event bus.
                                Other features can listen for these events and react accordingly.
                            </p>

                            <!-- Message Input -->
                            <v-text-field
                                v-model="message"
                                label="Message to send"
                                hint="Enter a message to broadcast to other modules"
                                persistent-hint
                                clearable
                                @keyup.enter="sendMessage"
                            />

                            <!-- Event Type Selection -->
                            <v-select
                                v-model="eventType"
                                :items="eventTypes"
                                label="Event Type"
                                class="mt-4"
                            />

                            <!-- Send Button -->
                            <v-btn
                                color="primary"
                                block
                                size="large"
                                class="mt-4"
                                @click="sendMessage"
                                :disabled="!message"
                            >
                                <v-icon start>mdi-send</v-icon>
                                Send Event
                            </v-btn>

                            <!-- Auto-send Toggle -->
                            <v-switch
                                v-model="autoSend"
                                label="Auto-send every 3 seconds"
                                class="mt-4"
                                color="primary"
                            />

                            <!-- Event History -->
                            <v-divider class="my-6" />

                            <h3 class="text-h6 mb-3">Sent Events History</h3>

                            <v-timeline density="compact" v-if="sentEvents.length > 0">
                                <v-timeline-item
                                    v-for="(event, index) in sentEvents"
                                    :key="index"
                                    :dot-color="getEventColor(event.type)"
                                    size="small"
                                >
                                    <template v-slot:opposite>
                                        <span class="text-caption">{{
                                            formatTime(event.timestamp)
                                        }}</span>
                                    </template>

                                    <v-card density="compact">
                                        <v-card-subtitle>{{ event.type }}</v-card-subtitle>
                                        <v-card-text>{{ event.data.message }}</v-card-text>
                                    </v-card>
                                </v-timeline-item>
                            </v-timeline>

                            <p v-else class="text-center text-grey">No events sent yet</p>

                            <!-- Clear History -->
                            <v-btn
                                v-if="sentEvents.length > 0"
                                variant="text"
                                size="small"
                                class="mt-2"
                                @click="clearHistory"
                            >
                                Clear History
                            </v-btn>
                        </v-card-text>
                    </v-card>

                    <!-- Instructions Card -->
                    <v-card class="mt-4">
                        <v-card-title>
                            <v-icon class="mr-2">mdi-information</v-icon>
                            How It Works
                        </v-card-title>
                        <v-card-text>
                            <ol>
                                <li>Enter a message in the text field above</li>
                                <li>Choose an event type (or use the default)</li>
                                <li>Click "Send Event" to broadcast the message</li>
                                <li>
                                    Switch to the "Event Receiver" feature to see received events
                                </li>
                                <li>Try enabling auto-send to see continuous communication</li>
                            </ol>

                            <v-alert type="info" variant="tonal" class="mt-4">
                                <strong>Pro Tip:</strong> Open the Module Debug panel (bottom of
                                side nav) to see a real-time visualization of event flow between
                                modules.
                            </v-alert>
                        </v-card-text>
                    </v-card>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onUnmounted, onMounted } from 'vue';
    import { useModuleBus } from '~/composables/useModuleBus';
    import FeatureHeader from '~/components/FeatureHeader.vue';

    // Get the global store and functions
    const globalStore = (window as any).__eventSenderGlobalStore;
    const sendEvent = (window as any).__eventSenderSendEvent;
    const setAutoSend = (window as any).__eventSenderSetAutoSend;
    if (!globalStore || !sendEvent || !setAutoSend) {
        throw new Error(
            'Event Sender global store not initialized. Ensure the module setup() has run.'
        );
    }

    // Local UI state (for form inputs only)
    const message = ref('Hello from Event Sender!');
    const eventType = ref('demo:message');

    // Use global store for persistent state
    const sentEvents = computed(() => globalStore.sentEvents);
    const autoSend = computed({
        get: () => globalStore.autoSendEnabled,
        set: (value) => {
            // Update the event type before enabling auto-send
            globalStore.autoSendEventType = eventType.value;
            setAutoSend(value);
        },
    });

    // Event types
    const eventTypes = [
        'demo:message',
        'demo:alert',
        'demo:data-update',
        'entity:selected',
        'filter:changed',
    ];

    // Send a message
    function sendMessage() {
        if (!message.value) {
            return;
        }

        // Use the global send function
        sendEvent(message.value, eventType.value);
    }

    // Update auto-send event type when changed
    watch(eventType, (newType) => {
        if (globalStore.autoSendEnabled) {
            globalStore.autoSendEventType = newType;
        }
    });

    // Helper functions
    function clearHistory() {
        globalStore.sentEvents = [];
        // Don't reset counts or totalSent - those are lifetime stats
    }

    function formatTime(date: Date) {
        return date.toLocaleTimeString();
    }

    function getEventColor(type: string) {
        const colors: Record<string, string> = {
            'demo:message': 'primary',
            'demo:alert': 'error',
            'demo:data-update': 'success',
            'entity:selected': 'info',
            'filter:changed': 'warning',
        };
        return colors[type] || 'grey';
    }
</script>

<style scoped>
    .feature-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .feature-content {
        border-radius: 0 0 4px 4px;
        flex: 1;
        overflow-y: auto;
    }

    .fill-height {
        height: 100%;
    }
</style>
