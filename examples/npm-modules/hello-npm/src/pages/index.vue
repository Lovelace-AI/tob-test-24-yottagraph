<template>
    <v-container>
        <v-row>
            <v-col cols="12">
                <div class="text-h4 mb-2">
                    <v-icon icon="mdi-npm" class="mr-2" />
                    Hello NPM Module
                </div>
                <div class="text-subtitle-1 text-medium-emphasis mb-6">
                    This is an example of an Aether module packaged as an NPM module.
                </div>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title>Module Features</v-card-title>
                    <v-card-text>
                        <v-list>
                            <v-list-item>
                                <template v-slot:prepend>
                                    <v-icon icon="mdi-package-variant" />
                                </template>
                                <v-list-item-title>NPM Packaging</v-list-item-title>
                                <v-list-item-subtitle>
                                    This module can be published to NPM and installed in any Aether
                                    app
                                </v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item>
                                <template v-slot:prepend>
                                    <v-icon icon="mdi-view-dashboard" />
                                </template>
                                <v-list-item-title>Dual Mode Support</v-list-item-title>
                                <v-list-item-subtitle>
                                    Works as both a standalone page and an embeddable widget
                                </v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item>
                                <template v-slot:prepend>
                                    <v-icon icon="mdi-cog" />
                                </template>
                                <v-list-item-title>Configuration</v-list-item-title>
                                <v-list-item-subtitle>
                                    Supports module configuration via aether.modules.json
                                </v-list-item-subtitle>
                            </v-list-item>

                            <v-list-item>
                                <template v-slot:prepend>
                                    <v-icon icon="mdi-broadcast" />
                                </template>
                                <v-list-item-title>Event Bus Integration</v-list-item-title>
                                <v-list-item-subtitle>
                                    Can communicate with other modules via the module bus
                                </v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title>Configuration</v-card-title>
                    <v-card-text>
                        <v-switch
                            v-model="showTimestamp"
                            label="Show Timestamp"
                            color="primary"
                            hide-details
                            class="mb-4"
                        />

                        <v-text-field
                            v-model="greeting"
                            label="Default Greeting"
                            variant="outlined"
                            density="compact"
                            hide-details
                            class="mb-4"
                        />

                        <v-text-field
                            v-model.number="refreshInterval"
                            label="Refresh Interval (ms)"
                            type="number"
                            variant="outlined"
                            density="compact"
                            :hint="`Send greeting every ${refreshInterval}ms when auto-send is enabled`"
                            persistent-hint
                            class="mb-4"
                        />

                        <v-switch
                            v-model="autoSend"
                            label="Auto-send greetings"
                            color="primary"
                            hide-details
                            class="mb-4"
                        />

                        <v-btn color="primary" variant="tonal" block @click="applyConfig">
                            Apply Configuration
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12">
                <v-card>
                    <v-card-title>Widget Demo</v-card-title>
                    <v-card-text>
                        <p class="mb-4">Below is the same module running in widget mode:</p>
                        <HelloWidget
                            title="Embedded Widget"
                            :height="400"
                            @message="onWidgetMessage"
                            @expand="onWidgetExpand"
                        />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-snackbar v-model="snackbar" :timeout="3000">
            {{ snackbarText }}
        </v-snackbar>
    </v-container>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { useHelloNpm } from '../composables/useHelloNpm';
    import HelloWidget from '../widgets/HelloWidget.vue';

    // Import Vuetify components explicitly
    import {
        VContainer,
        VRow,
        VCol,
        VCard,
        VCardTitle,
        VCardText,
        VIcon,
        VList,
        VListItem,
        VListItemTitle,
        VListItemSubtitle,
        VSwitch,
        VTextField,
        VBtn,
        VSnackbar,
    } from 'vuetify/components';

    // Use the module composable
    const { config, updateConfig, sendGreeting, isAutoSending, startAutoSend, stopAutoSend } =
        useHelloNpm();

    // Local state for configuration form
    const greeting = ref(config.value.greeting);
    const showTimestamp = ref(config.value.showTimestamp);
    const refreshInterval = ref(config.value.refreshInterval);
    const autoSend = ref(isAutoSending.value);

    // Snackbar state
    const snackbar = ref(false);
    const snackbarText = ref('');

    // Watch for config changes
    watch(config, (newConfig) => {
        greeting.value = newConfig.greeting;
        showTimestamp.value = newConfig.showTimestamp;
        refreshInterval.value = newConfig.refreshInterval;
    });

    // Watch for auto-send toggle
    watch(autoSend, (newValue) => {
        if (newValue) {
            startAutoSend();
        } else {
            stopAutoSend();
        }
    });

    // Sync with composable auto-send state
    watch(isAutoSending, (newValue) => {
        autoSend.value = newValue;
    });

    // Methods
    const applyConfig = () => {
        updateConfig({
            greeting: greeting.value,
            showTimestamp: showTimestamp.value,
            refreshInterval: refreshInterval.value,
        });

        snackbarText.value = 'Configuration updated!';
        snackbar.value = true;
    };

    const onWidgetMessage = (data: { message: string; timestamp: Date }) => {
        snackbarText.value = `Widget sent: ${data.message}`;
        snackbar.value = true;
    };

    const onWidgetExpand = () => {
        snackbarText.value = 'Widget requested full-screen mode';
        snackbar.value = true;
    };
</script>
