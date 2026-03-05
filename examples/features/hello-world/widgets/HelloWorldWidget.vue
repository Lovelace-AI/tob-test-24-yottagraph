<template>
    <v-card :height="height" :width="width">
        <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" size="small">mdi-hand-wave</v-icon>
            {{ title }}
            <v-spacer />
            <v-chip size="x-small" color="primary" variant="tonal"> Widget Mode </v-chip>
        </v-card-title>

        <v-card-text>
            <v-alert
                v-if="!isAuthenticated"
                type="warning"
                variant="tonal"
                density="compact"
                class="mb-3"
            >
                Not authenticated
            </v-alert>

            <div v-else>
                <p class="text-body-2 mb-3">
                    Hello {{ userId }}! This module is running as an embedded widget.
                </p>

                <v-text-field
                    v-model="localMessage"
                    label="Send a message"
                    density="compact"
                    variant="outlined"
                    append-inner-icon="mdi-send"
                    @click:append-inner="sendMessage"
                    @keyup.enter="sendMessage"
                    hide-details
                />

                <v-divider class="my-3" />

                <div class="text-caption text-grey">
                    <div>Messages: {{ messageCount }}</div>
                    <div>Status: {{ status }}</div>
                </div>
            </div>
        </v-card-text>

        <v-card-actions v-if="showActions">
            <v-btn size="small" variant="text" @click="$emit('expand')"> Expand </v-btn>
            <v-spacer />
            <v-btn size="small" variant="text" color="primary" @click="openStandalone">
                Open Full View
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
    import { useUserState } from '../../../../composables/useUserState';
    import { useModuleBus } from '../../../../composables/useModuleBus';

    interface Props {
        // Widget customization props
        title?: string;
        height?: string | number;
        width?: string | number;
        showActions?: boolean;

        // Data props that might be passed from parent
        initialMessage?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        title: 'Hello World',
        height: 'auto',
        width: '100%',
        showActions: true,
        initialMessage: '',
    });

    const emit = defineEmits<{
        expand: [];
        message: [message: string];
    }>();

    // Access authentication state
    const { userId, userName, userIsPermitted } = useUserState();
    const isAuthenticated = computed(() => !!userName.value && userIsPermitted());

    // Module communication
    const bus = useModuleBus('hello-world-widget');

    // Local state
    const localMessage = ref(props.initialMessage);
    const messageCount = ref(0);
    const status = ref('Ready');

    // Listen for messages
    const unsubscribe = bus.on('module:message', (event) => {
        messageCount.value++;
        status.value = `Last message from ${event.moduleId}`;
    });

    // Send message
    function sendMessage() {
        if (!localMessage.value.trim()) return;

        // Emit to parent component
        emit('message', localMessage.value);

        // Broadcast to other modules
        bus.message.send(localMessage.value);

        localMessage.value = '';
        status.value = 'Message sent';
    }

    // Open in standalone mode
    function openStandalone() {
        // Navigate to the module's standalone route
        navigateTo('/modules/hello-world');
    }

    // Cleanup
    onUnmounted(() => {
        unsubscribe();
    });
</script>

<style scoped>
    /* Widget-specific styles */
    :deep(.v-card-title) {
        font-size: 0.875rem;
        padding: 12px;
    }

    :deep(.v-card-text) {
        padding: 12px;
    }

    :deep(.v-card-actions) {
        padding: 8px 12px;
    }
</style>
