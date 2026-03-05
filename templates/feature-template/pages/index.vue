<template>
    <v-container fluid class="pa-0 fill-height">
        <v-row class="fill-height ma-0">
            <v-col cols="12" class="pa-2 fill-height">
                <div class="feature-wrapper">
                    <!-- TODO: Update title and icon to match your feature -->
                    <FeatureHeader title="Feature Template" icon="mdi-puzzle-outline" />

                    <v-card class="feature-content" flat>
                        <v-card-text>
                            <!-- TODO: Replace with your feature's UI -->
                            <p class="mb-4">
                                This is a template for creating new feature modules in Aether.
                            </p>
                            <p>Replace this content with your feature's functionality.</p>

                            <v-btn color="primary" @click="handleAction" class="mt-4">
                                Sample Action
                            </v-btn>

                            <!-- Example of using preferences (app-namespaced automatically) -->
                            <v-card class="mt-6" variant="outlined" v-if="showPrefsExample">
                                <v-card-title>Preferences Example</v-card-title>
                                <v-card-text>
                                    <v-select
                                        v-model="viewMode"
                                        :items="['grid', 'list', 'map']"
                                        label="View Mode"
                                    />
                                    <p class="mt-2">
                                        This preference is automatically saved to:
                                        <code
                                            >/users/{userId}/apps/{appId}/features/feature-template/viewMode</code
                                        >
                                    </p>
                                </v-card-text>
                            </v-card>
                        </v-card-text>
                    </v-card>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue';
    import FeatureHeader from '~/components/FeatureHeader.vue';

    // TODO: Import your feature's composables
    // import { useFeatureTemplate } from '../composables/useFeatureTemplate';

    // Example state
    const showPrefsExample = ref(true);
    const viewMode = ref('grid');

    // TODO: Add your feature's logic
    function handleAction() {
        console.log('Action triggered!');
        // Your feature logic here
    }

    // Example: Using Aether's built-in features
    // const { isAuthenticated } = useUserState();
    // const { getStatus } = useElementalService();
    // const { storedTheme } = usePrefsStore();

    // TODO: Add reactive computed properties
    const currentViewMode = computed(() => {
        return `Current view: ${viewMode.value}`;
    });

    // TODO: Add lifecycle hooks if needed
    onMounted(() => {
        console.log('Feature page mounted');
    });
</script>

<style scoped>
    /* Use the standard feature layout structure */
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

    /* TODO: Add your feature-specific styles below */
    /* Remember to use Vuetify's utility classes when possible */

    /* Example: For Cesium or full-screen features that need absolute positioning */
    .fullscreen-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }
</style>
