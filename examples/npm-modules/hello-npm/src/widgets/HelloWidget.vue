<template>
    <v-card class="hello-npm-widget" :height="height" :width="width">
        <v-card-title class="d-flex align-center">
            <v-icon :icon="icon" class="mr-2" />
            {{ title }}
            <v-spacer />
            <v-btn
                v-if="showActions"
                icon="mdi-fullscreen"
                size="small"
                variant="text"
                @click="$emit('expand')"
            />
        </v-card-title>

        <v-card-text>
            <div class="text-h6 mb-2">{{ currentGreeting }}</div>

            <v-text-field
                v-model="customMessage"
                label="Custom Message"
                variant="outlined"
                density="compact"
                hide-details
                class="mb-3"
            />

            <div class="d-flex gap-2 mb-4">
                <v-btn color="primary" variant="tonal" @click="sendMessage"> Send Greeting </v-btn>

                <v-btn variant="outlined" @click="clearHistory" :disabled="messageCount === 0">
                    Clear History
                </v-btn>
            </div>

            <v-divider class="mb-3" />

            <v-alert
                v-if="isAutoSending"
                type="info"
                variant="tonal"
                density="compact"
                class="mb-3"
            >
                <v-icon icon="mdi-timer" class="mr-1" />
                Auto-send is active
            </v-alert>

            <div class="message-history">
                <div class="text-caption text-medium-emphasis mb-2">
                    Message History ({{ messageCount }})
                </div>
                <v-list density="compact" class="pa-0">
                    <v-list-item
                        v-for="(item, index) in messageHistory.slice().reverse()"
                        :key="index"
                        class="px-0"
                    >
                        <template v-slot:prepend>
                            <v-icon icon="mdi-message" size="small" />
                        </template>
                        <v-list-item-title class="text-body-2">
                            {{ item.message }}
                        </v-list-item-title>
                        <v-list-item-subtitle class="text-caption">
                            {{ formatTime(item.timestamp) }}
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { useHelloNpm } from '../composables/useHelloNpm';

    // Import Vuetify components explicitly
    import {
        VCard,
        VCardTitle,
        VCardText,
        VIcon,
        VBtn,
        VTextField,
        VDivider,
        VList,
        VListItem,
        VListItemTitle,
        VListItemSubtitle,
        VSpacer,
        VAlert,
    } from 'vuetify/components';

    // Props
    interface Props {
        title?: string;
        icon?: string;
        height?: string | number;
        width?: string | number;
        showActions?: boolean;
        initialMessage?: string;
    }

    const props = withDefaults(defineProps<Props>(), {
        title: 'Hello NPM Widget',
        icon: 'mdi-npm',
        height: 'auto',
        width: '100%',
        showActions: true,
        initialMessage: '',
    });

    // Get emit function
    const emit = defineEmits<{
        expand: [];
        message: [data: { message: string; timestamp: Date }];
    }>();

    // Use the module composable
    const {
        currentGreeting,
        messageHistory,
        messageCount,
        sendGreeting,
        clearHistory,
        isAutoSending,
    } = useHelloNpm();

    // Local state
    const customMessage = ref(props.initialMessage);

    // Methods
    const sendMessage = () => {
        const message = customMessage.value || undefined;
        const result = sendGreeting(message);
        emit('message', result);
        customMessage.value = '';
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString();
    };
</script>

<style scoped>
    .hello-npm-widget {
        overflow: hidden;
    }

    .message-history {
        max-height: 200px;
        overflow-y: auto;
    }

    .gap-2 {
        gap: 8px;
    }
</style>
