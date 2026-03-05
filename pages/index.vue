<template>
    <v-container>
        <v-row align="center" justify="center">
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title class="text-h4 text-center"> Welcome to Aether </v-card-title>
                    <v-card-text class="text-center">
                        <p class="text-h6 mb-4">
                            A modular UI framework for building powerful applications
                        </p>

                        <v-row class="mt-6">
                            <v-col cols="12" sm="6" md="3">
                                <v-card variant="outlined" class="pa-4 text-center feature-card">
                                    <v-icon size="48" color="primary" class="mb-2"
                                        >mdi-puzzle</v-icon
                                    >
                                    <div class="text-subtitle-1">Modular<br />Architecture</div>
                                </v-card>
                            </v-col>
                            <v-col cols="12" sm="6" md="3">
                                <v-card variant="outlined" class="pa-4 text-center feature-card">
                                    <v-icon size="48" color="primary" class="mb-2">mdi-api</v-icon>
                                    <div class="text-subtitle-1">Query Server<br />APIs</div>
                                </v-card>
                            </v-col>
                            <v-col cols="12" sm="6" md="3">
                                <v-card variant="outlined" class="pa-4 text-center feature-card">
                                    <v-icon size="48" color="primary" class="mb-2"
                                        >mdi-shield-lock</v-icon
                                    >
                                    <div class="text-subtitle-1">Auth0<br />Security</div>
                                </v-card>
                            </v-col>
                            <v-col cols="12" sm="6" md="3">
                                <v-card variant="outlined" class="pa-4 text-center feature-card">
                                    <v-icon size="48" color="primary" class="mb-2"
                                        >mdi-earth</v-icon
                                    >
                                    <div class="text-subtitle-1">Cesium 3D<br />Maps</div>
                                </v-card>
                            </v-col>
                        </v-row>

                        <v-divider class="my-6" />

                        <div class="text-h6 mb-4">Get Started</div>
                        <p class="mb-4">
                            Explore the example features in the sidebar to see how Aether's module
                            system works:
                        </p>

                        <v-list density="compact" class="mx-auto" style="max-width: 400px">
                            <v-list-item>
                                <template v-slot:prepend>
                                    <v-icon>mdi-broadcast</v-icon>
                                </template>
                                <v-list-item-title>Event Sender/Receiver</v-list-item-title>
                                <v-list-item-subtitle
                                    >Inter-module communication</v-list-item-subtitle
                                >
                            </v-list-item>
                            <v-list-item>
                                <template v-slot:prepend>
                                    <v-icon>mdi-bug</v-icon>
                                </template>
                                <v-list-item-title>Module Debug Panel</v-list-item-title>
                                <v-list-item-subtitle
                                    >Visualize the module system</v-list-item-subtitle
                                >
                            </v-list-item>
                            <v-list-item>
                                <template v-slot:prepend>
                                    <v-icon>mdi-earth</v-icon>
                                </template>
                                <v-list-item-title>Cesium Globe</v-list-item-title>
                                <v-list-item-subtitle>3D map visualization</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>

                        <v-btn
                            color="primary"
                            size="large"
                            class="mt-6"
                            href="https://github.com/Lovelace-AI/aether"
                            target="_blank"
                        >
                            View Documentation
                            <v-icon end>mdi-open-in-new</v-icon>
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
    // Simple home page - no duplicate app structure needed
</script>

<style scoped>
    .feature-card {
        height: 100%;
        min-height: 140px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>
