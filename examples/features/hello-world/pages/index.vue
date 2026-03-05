<template>
    <v-container>
        <v-row>
            <v-col>
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-hand-wave</v-icon>
                        Hello World Module (Standalone Mode)
                    </v-card-title>

                    <v-card-text>
                        <p class="mb-4">
                            This is an example module running in standalone mode. It has access to
                            all Aether features including authentication and preferences.
                        </p>

                        <v-alert type="info" variant="tonal" class="mb-4">
                            <strong>User:</strong> {{ userId || 'Not authenticated' }}<br />
                            <strong>Module Mode:</strong> Standalone
                        </v-alert>

                        <v-divider class="my-4" />

                        <h3 class="mb-2">Module Communication Demo</h3>

                        <v-text-field
                            v-model="message"
                            label="Broadcast a message"
                            append-inner-icon="mdi-send"
                            @click:append-inner="broadcastMessage"
                            @keyup.enter="broadcastMessage"
                            clearable
                        />

                        <v-list v-if="receivedMessages.length > 0" class="mt-4">
                            <v-list-subheader>Received Messages</v-list-subheader>
                            <v-list-item
                                v-for="(msg, index) in receivedMessages"
                                :key="index"
                                :subtitle="new Date(msg.timestamp).toLocaleTimeString()"
                            >
                                <v-list-item-title>
                                    {{ msg.data.message }} (from: {{ msg.moduleId }})
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>

                        <v-divider class="my-4" />

                        <h3 class="mb-2">Module Features</h3>

                        <v-list>
                            <v-list-item prepend-icon="mdi-check-circle">
                                <v-list-item-title>Full page layout</v-list-item-title>
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-check-circle">
                                <v-list-item-title>Access to routing</v-list-item-title>
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-check-circle">
                                <v-list-item-title
                                    >Can use all Aether composables</v-list-item-title
                                >
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-check-circle">
                                <v-list-item-title
                                    >Communicates with other modules</v-list-item-title
                                >
                            </v-list-item>
                        </v-list>
                    </v-card-text>

                    <v-card-actions>
                        <v-spacer />
                        <v-btn color="primary" variant="tonal" @click="testPreferences">
                            Test Preferences
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
    import { useUserState } from '../../../../composables/useUserState';
    import { useModuleBus } from '../../../../composables/useModuleBus';

    // Access Aether's authentication state
    const { userId, userName, userIsPermitted } = useUserState();
    const isAuthenticated = computed(() => !!userName.value && userIsPermitted());

    // Use module communication bus
    const bus = useModuleBus('hello-world');

    // Local state
    const message = ref('');
    const receivedMessages = ref<any[]>([]);

    // Listen for messages from other modules
    const unsubscribe = bus.on('module:message', (event) => {
        receivedMessages.value.unshift(event);

        // Keep only last 5 messages
        if (receivedMessages.value.length > 5) {
            receivedMessages.value.pop();
        }
    });

    // Broadcast a message
    function broadcastMessage() {
        if (!message.value.trim()) return;

        bus.message.send(message.value);
        message.value = '';
    }

    // Test preferences integration
    function testPreferences() {
        // In a real module, this would use Aether's preference system
        console.log('Testing preferences integration...');

        // Example: Save module-specific preferences
        // const { setModulePreference } = usePreferences();
        // setModulePreference('hello-world', 'lastVisit', new Date().toISOString());
    }

    // Cleanup on unmount
    onUnmounted(() => {
        unsubscribe();
    });
</script>
