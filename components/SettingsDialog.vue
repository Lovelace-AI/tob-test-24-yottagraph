<template>
    <v-card
        :style="{
            backgroundColor: currentThemeColors.surface,
            border: `1px solid ${currentThemeColors.border}`,
        }"
        min-width="500"
    >
        <v-card-title class="d-flex align-center">
            <span>Settings</span>
            <v-spacer></v-spacer>
            <v-btn icon variant="text" @click="state.showSettingsDialog = false">
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text>
            <v-container>
                <!-- Server Configuration (Electron only) -->
                <v-row v-if="isElectron">
                    <v-col cols="12">
                        <h3 class="text-h6 mb-2">Server Configuration</h3>
                        <v-alert
                            v-if="serverConfigSaved"
                            type="success"
                            density="compact"
                            class="mb-4"
                            closable
                            @click:close="serverConfigSaved = false"
                        >
                            Server configuration saved. Please restart the application for changes
                            to take effect.
                        </v-alert>

                        <v-alert
                            v-if="serverConfigError"
                            type="error"
                            density="compact"
                            class="mb-4"
                            closable
                            @click:close="serverConfigError = ''"
                        >
                            {{ serverConfigError }}
                        </v-alert>

                        <v-text-field
                            v-model="queryServerAddress"
                            label="Query Server Address"
                            placeholder="https://query.news.prod.g.lovelace.ai"
                            variant="outlined"
                            density="comfortable"
                            class="mb-3"
                            :loading="testingQueryServer"
                            :error="queryServerError"
                            :error-messages="queryServerError ? 'Invalid server address' : ''"
                        >
                            <template v-slot:append-inner>
                                <v-btn
                                    size="small"
                                    variant="text"
                                    @click="testQueryServer"
                                    :disabled="testingQueryServer || !queryServerAddress"
                                >
                                    Test
                                </v-btn>
                            </template>
                        </v-text-field>

                        <div class="text-caption text-medium-emphasis mt-2">
                            Note: Server configuration changes require an application restart.
                        </div>
                    </v-col>
                </v-row>

                <!-- Server Configuration Info (Web only) -->
                <v-row v-else>
                    <v-col cols="12">
                        <h3 class="text-h6 mb-2">Server Configuration</h3>
                        <v-alert type="info" density="compact" variant="tonal">
                            Server configuration can only be changed in the desktop application.
                        </v-alert>

                        <div class="mt-3">
                            <div class="text-body-2 mb-1">Current Query Server:</div>
                            <code class="text-caption">{{ currentQueryServer }}</code>
                        </div>
                    </v-col>
                </v-row>
            </v-container>
        </v-card-text>

        <v-divider />

        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="state.showSettingsDialog = false"> Cancel </v-btn>
            <v-btn
                color="primary"
                variant="flat"
                @click="saveSettings"
                :disabled="savingSettings"
                :loading="savingSettings"
            >
                Save
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, watch } from 'vue';
    import { useCustomTheme } from '~/composables/useCustomTheme';
    import { useElectron } from '~/composables/useElectron';
    import { state } from '~/utils/appState';

    const { currentThemeColors } = useCustomTheme();
    const { isElectron, storage } = useElectron();
    const config = useRuntimeConfig();

    // Server configuration
    const queryServerAddress = ref('');
    const currentQueryServer = computed(() => config.public.queryServerAddress as string);

    // State
    const testingQueryServer = ref(false);
    const savingSettings = ref(false);
    const serverConfigSaved = ref(false);
    const serverConfigError = ref('');
    const queryServerError = ref(false);

    // Clear error states when user types
    watch(queryServerAddress, () => {
        queryServerError.value = false;
        if (serverConfigError.value) {
            serverConfigError.value = '';
        }
    });

    // Load saved server config on mount (Electron only)
    onMounted(async () => {
        if (isElectron.value) {
            const savedConfig = await storage.get('serverConfig');
            if (savedConfig) {
                queryServerAddress.value =
                    savedConfig.queryServerAddress || savedConfig.newsServerAddress || '';
            } else {
                queryServerAddress.value = currentQueryServer.value;
            }
        }
    });

    // Test server connectivity
    async function testServer(address: string): Promise<boolean> {
        try {
            const baseURL = address.startsWith('http') ? address : `https://${address}`;
            const response = await fetch(`${baseURL}/status`, {
                method: 'GET',
                mode: 'cors',
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });
            return response.ok;
        } catch (error) {
            console.error('Server test failed:', error);
            return false;
        }
    }

    async function testQueryServer() {
        testingQueryServer.value = true;
        serverConfigError.value = '';
        queryServerError.value = false;

        try {
            const isValid = await testServer(queryServerAddress.value);
            if (!isValid) {
                serverConfigError.value = 'Could not connect to query server';
                queryServerError.value = true;
            }
        } finally {
            testingQueryServer.value = false;
        }
    }

    async function saveSettings() {
        savingSettings.value = true;
        serverConfigError.value = '';
        serverConfigSaved.value = false;
        queryServerError.value = false;

        try {
            // Save server configuration if in Electron
            if (isElectron.value) {
                const serverChanged = queryServerAddress.value !== currentQueryServer.value;

                if (serverChanged && queryServerAddress.value) {
                    const isValid = await testServer(queryServerAddress.value);
                    if (!isValid) {
                        serverConfigError.value =
                            'Query server validation failed. Settings not saved.';
                        queryServerError.value = true;
                        return;
                    }

                    await storage.set('serverConfig', {
                        queryServerAddress: queryServerAddress.value,
                    });

                    serverConfigSaved.value = true;
                }
            }

            // Close dialog - delay only if we showed the success message
            if (serverConfigSaved.value) {
                setTimeout(() => {
                    state.showSettingsDialog = false;
                }, 1500);
            } else {
                state.showSettingsDialog = false;
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            serverConfigError.value = 'Failed to save settings. Please try again.';
        } finally {
            savingSettings.value = false;
        }
    }
</script>

<style scoped>
    code {
        padding: 2px 4px;
        background-color: rgba(0, 0, 0, 0.05);
        border-radius: 3px;
        font-family: monospace;
    }
</style>
