<template>
    <v-container fluid class="pa-0 fill-height">
        <v-row class="fill-height ma-0">
            <v-col cols="12" class="pa-2 fill-height">
                <div class="feature-wrapper">
                    <FeatureHeader title="Event Receiver Demo" icon="mdi-antenna">
                        <template #actions>
                            <v-chip color="success" variant="outlined" size="small" class="mr-2">
                                <v-icon start size="small">mdi-broadcast</v-icon>
                                Always Listening
                            </v-chip>
                        </template>
                    </FeatureHeader>

                    <v-card class="feature-content" flat>
                        <v-card-text>
                            <p class="mb-4">
                                This feature listens for events on the Aether event bus. Try
                                switching to the Event Sender feature and sending some messages!
                            </p>

                            <!-- Controls -->
                            <v-row>
                                <v-col cols="12">
                                    <v-select
                                        v-model="eventFilter"
                                        :items="filterOptions"
                                        label="Event Type Filter"
                                        clearable
                                        hint="Filter events by type"
                                        persistent-hint
                                    />
                                </v-col>
                            </v-row>

                            <!-- Statistics -->
                            <v-row class="mt-4">
                                <v-col cols="6" sm="3">
                                    <v-card variant="outlined">
                                        <v-card-text class="text-center">
                                            <div class="text-h4">{{ receivedEvents.length }}</div>
                                            <div class="text-caption">Total Events</div>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                                <v-col cols="6" sm="3">
                                    <v-card variant="outlined">
                                        <v-card-text class="text-center">
                                            <div class="text-h4">{{ uniqueSources.size }}</div>
                                            <div class="text-caption">Sources</div>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                                <v-col cols="6" sm="3">
                                    <v-card variant="outlined">
                                        <v-card-text class="text-center">
                                            <div class="text-h4">{{ eventsPerSecond }}</div>
                                            <div class="text-caption">Events/sec</div>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                                <v-col cols="6" sm="3">
                                    <v-card variant="outlined">
                                        <v-card-text class="text-center">
                                            <div class="text-h4">{{ filteredEvents.length }}</div>
                                            <div class="text-caption">Filtered</div>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                            </v-row>

                            <!-- Events List -->
                            <v-divider class="my-6" />

                            <div class="d-flex align-center justify-space-between mb-3">
                                <h3 class="text-h6">Received Events</h3>
                                <v-badge
                                    :content="receivedEvents.length"
                                    :model-value="receivedEvents.length > 0"
                                    color="primary"
                                    inline
                                />
                            </div>

                            <v-virtual-scroll
                                :items="filteredEvents"
                                height="400"
                                item-height="80"
                                v-if="filteredEvents.length > 0"
                            >
                                <template v-slot:default="{ item }: { item: any }">
                                    <v-card
                                        class="mb-2"
                                        variant="outlined"
                                        :color="getEventCardColor(item.type)"
                                    >
                                        <v-card-text>
                                            <div class="d-flex justify-space-between align-start">
                                                <div>
                                                    <v-chip size="small" label>{{
                                                        item.type
                                                    }}</v-chip>
                                                    <span class="ml-2 text-caption"
                                                        >from
                                                        {{ item.data?.source || 'unknown' }}</span
                                                    >
                                                </div>
                                                <span class="text-caption">{{
                                                    formatTime(item.timestamp)
                                                }}</span>
                                            </div>
                                            <div class="mt-2">
                                                <strong>Data:</strong>
                                                {{ JSON.stringify(item.data, null, 2) }}
                                            </div>
                                        </v-card-text>
                                    </v-card>
                                </template>
                            </v-virtual-scroll>

                            <v-card v-else variant="outlined" class="text-center pa-8">
                                <v-icon size="64" color="grey">mdi-broadcast</v-icon>
                                <p class="text-h6 mt-4">No events received yet</p>
                                <p class="text-caption">
                                    Waiting for events from other features...
                                </p>
                            </v-card>

                            <!-- Clear Button -->
                            <v-btn
                                v-if="receivedEvents.length > 0"
                                variant="text"
                                size="small"
                                class="mt-2"
                                @click="clearEvents"
                            >
                                Clear Events
                            </v-btn>
                        </v-card-text>
                    </v-card>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
    import { ref, computed, onUnmounted, watch } from 'vue';
    import { useModuleBus } from '~/composables/useModuleBus';
    import FeatureHeader from '~/components/FeatureHeader.vue';

    // Get the global store
    const globalStore = (window as any).__eventReceiverGlobalStore;
    if (!globalStore) {
        throw new Error(
            'Event Receiver global store not initialized. Ensure the module setup() has run.'
        );
    }

    // Local UI state
    const eventFilter = ref<string | null>(null);

    // Use global store data
    const isListening = computed(() => globalStore.isListening);
    const receivedEvents = computed(() => globalStore.events);
    const eventCounts = computed(() => globalStore.eventCounts);

    // Filter options from received event types
    const filterOptions = computed(() => {
        return Array.from(new Set(receivedEvents.value.map((e: any) => e.type)));
    });

    // Filtered events based on selected filter
    const filteredEvents = computed(() => {
        if (!eventFilter.value) {
            return receivedEvents.value;
        }
        return receivedEvents.value.filter((e: any) => e.type === eventFilter.value);
    });

    // Unique sources
    const uniqueSources = computed(() => {
        return new Set(receivedEvents.value.map((e: any) => e.data?.source || 'unknown'));
    });

    // Events per second (rolling average over last 10 seconds)
    const eventsPerSecond = computed(() => {
        const now = Date.now();
        const tenSecondsAgo = now - 10000;
        const recentEvents = receivedEvents.value.filter((e: any) => {
            return e.timestamp.getTime() > tenSecondsAgo;
        });
        return (recentEvents.length / 10).toFixed(1);
    });

    // Clear events
    function clearEvents() {
        globalStore.events = [];
        // Don't clear eventCounts - those are lifetime stats
    }

    // Format time
    function formatTime(date: Date) {
        return date.toLocaleTimeString();
    }

    // Get event card color
    function getEventCardColor(type: string) {
        if (type.includes('error')) return 'error';
        if (type.includes('warning')) return 'warning';
        if (type.includes('success')) return 'success';
        if (type.includes('entity')) return 'info';
        return undefined;
    }

    // Note: The global store already handles all the event listening from app startup
    // We don't need to set up any listeners here - just display the accumulated events!
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
