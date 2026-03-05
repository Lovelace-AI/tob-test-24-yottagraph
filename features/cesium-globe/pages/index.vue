<template>
    <v-container fluid class="pa-0 fill-height">
        <v-row class="fill-height ma-0">
            <v-col cols="12" class="pa-2 fill-height">
                <div class="feature-wrapper">
                    <FeatureHeader title="3D Globe Viewer" icon="mdi-earth">
                        <template #actions>
                            <!-- Quick actions -->
                            <v-btn
                                icon
                                variant="text"
                                @click="clearAllEntities"
                                title="Clear all entities"
                                color="white"
                            >
                                <v-icon>mdi-delete-sweep</v-icon>
                            </v-btn>

                            <v-btn
                                icon
                                variant="text"
                                @click="toggleDrawingMode"
                                :color="drawingMode ? 'white' : 'white'"
                                title="Toggle drawing mode"
                            >
                                <v-icon>mdi-draw</v-icon>
                            </v-btn>

                            <v-btn
                                icon
                                variant="text"
                                @click="showHelp = true"
                                title="Help"
                                color="white"
                            >
                                <v-icon>mdi-help-circle-outline</v-icon>
                            </v-btn>
                        </template>
                    </FeatureHeader>

                    <!-- Cesium viewer -->
                    <v-card class="feature-content" flat>
                        <CesiumViewer
                            ref="cesiumViewer"
                            @ready="onViewerReady"
                            @click="onGlobeClick"
                            @error="onViewerError"
                        />
                    </v-card>
                </div>

                <!-- Entity info panel -->
                <v-navigation-drawer
                    v-model="showEntityInfo"
                    location="right"
                    temporary
                    width="350"
                >
                    <v-card flat>
                        <v-card-title class="d-flex align-center">
                            <v-icon class="mr-2">mdi-information</v-icon>
                            Entity Details
                            <v-spacer />
                            <v-btn icon variant="text" size="small" @click="showEntityInfo = false">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-card-title>

                        <v-card-text v-if="selectedEntity">
                            <v-list>
                                <v-list-item>
                                    <v-list-item-title>Name</v-list-item-title>
                                    <v-list-item-subtitle>{{
                                        selectedEntity.name || 'Unknown'
                                    }}</v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="selectedEntity.position">
                                    <v-list-item-title>Position</v-list-item-title>
                                    <v-list-item-subtitle>
                                        Lat:
                                        {{ selectedEntity.position.latitude.toFixed(4) }}°<br />
                                        Lon: {{ selectedEntity.position.longitude.toFixed(4) }}°
                                    </v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item v-if="selectedEntity.properties">
                                    <v-list-item-title>Properties</v-list-item-title>
                                    <v-list-item-subtitle>
                                        <pre>{{
                                            JSON.stringify(selectedEntity.properties, null, 2)
                                        }}</pre>
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-navigation-drawer>

                <!-- Help dialog -->
                <v-dialog v-model="showHelp" max-width="600">
                    <v-card>
                        <v-card-title>
                            <v-icon class="mr-2">mdi-help-circle</v-icon>
                            Globe Viewer Help
                        </v-card-title>

                        <v-card-text>
                            <h3 class="mb-2">Navigation</h3>
                            <v-list density="compact">
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon size="small">mdi-mouse</v-icon>
                                    </template>
                                    <v-list-item-title>Left Click + Drag</v-list-item-title>
                                    <v-list-item-subtitle>Rotate the globe</v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon size="small">mdi-mouse</v-icon>
                                    </template>
                                    <v-list-item-title>Right Click + Drag</v-list-item-title>
                                    <v-list-item-subtitle>Zoom in/out</v-list-item-subtitle>
                                </v-list-item>

                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon size="small">mdi-mouse</v-icon>
                                    </template>
                                    <v-list-item-title>Middle Click + Drag</v-list-item-title>
                                    <v-list-item-subtitle>Pan the view</v-list-item-subtitle>
                                </v-list-item>
                            </v-list>

                            <h3 class="mt-4 mb-2">Features</h3>
                            <v-list density="compact">
                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon size="small">mdi-draw</v-icon>
                                    </template>
                                    <v-list-item-title>Drawing Mode</v-list-item-title>
                                    <v-list-item-subtitle
                                        >Click to add points, shapes, and
                                        regions</v-list-item-subtitle
                                    >
                                </v-list-item>

                                <v-list-item>
                                    <template v-slot:prepend>
                                        <v-icon size="small">mdi-crosshairs-gps</v-icon>
                                    </template>
                                    <v-list-item-title>Entity Tracking</v-list-item-title>
                                    <v-list-item-subtitle
                                        >Click on entities to see details</v-list-item-subtitle
                                    >
                                </v-list-item>
                            </v-list>
                        </v-card-text>

                        <v-card-actions>
                            <v-spacer />
                            <v-btn color="primary" variant="text" @click="showHelp = false">
                                Got it
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, watch } from 'vue';
    import { useModuleBus } from '~/composables/useModuleBus';
    import CesiumViewer from '../components/CesiumViewer.vue';
    import FeatureHeader from '~/components/FeatureHeader.vue';

    // Get the global store
    const globalStore = (window as any).__cesiumGlobeStore;
    const addEntityToStore = (window as any).__cesiumGlobeAddEntity;
    const removeEntityFromStore = (window as any).__cesiumGlobeRemoveEntity;
    const clearAllEntitiesFromStore = (window as any).__cesiumGlobeClearEntities;

    if (!globalStore) {
        throw new Error(
            'Cesium Globe global store not initialized. Ensure the module setup() has run.'
        );
    }

    // Module communication
    const bus = useModuleBus('cesium-globe');

    // Component refs
    const cesiumViewer = ref<InstanceType<typeof CesiumViewer>>();

    // Use global store for persistent state
    const drawingMode = computed({
        get: () => globalStore.drawingMode,
        set: (value) => {
            globalStore.drawingMode = value;
        },
    });
    const selectedEntity = computed({
        get: () => globalStore.selectedEntity,
        set: (value) => {
            globalStore.selectedEntity = value;
        },
    });
    const storedEntities = computed(() => globalStore.entities);

    // Local UI state only
    const showEntityInfo = ref(false);
    const showHelp = ref(false);
    const viewer = ref<any>(null);

    // Handle viewer ready
    function onViewerReady(cesiumViewer: any) {
        viewer.value = cesiumViewer;
        globalStore.viewerReady = true;
        console.log('Cesium viewer ready, restoring entities:', storedEntities.value.length);

        // Restore all entities from the global store
        storedEntities.value.forEach((storedEntity) => {
            try {
                // Add custom ID to the options
                const entityOptions = {
                    ...storedEntity.options,
                    id: storedEntity.id, // Cesium accepts 'id' in the options
                    name: storedEntity.id, // Also set name for easier identification
                };
                viewer.value.entities.add(entityOptions);
            } catch (error) {
                console.error('Failed to restore entity:', storedEntity.id, error);
            }
        });

        // Restore camera position if available
        if (globalStore.cameraPosition) {
            try {
                viewer.value.camera.setView({
                    destination: Cesium.Cartesian3.fromDegrees(
                        globalStore.cameraPosition.longitude,
                        globalStore.cameraPosition.latitude,
                        globalStore.cameraPosition.height
                    ),
                    orientation: {
                        heading: Cesium.Math.toRadians(globalStore.cameraPosition.heading),
                        pitch: Cesium.Math.toRadians(globalStore.cameraPosition.pitch),
                        roll: Cesium.Math.toRadians(globalStore.cameraPosition.roll),
                    },
                });
                console.log('Restored camera position');
            } catch (error) {
                console.error('Failed to restore camera position:', error);
            }
        }

        // Listen for entity selection from other modules
        bus.entity.onSelected((data) => {
            console.log('Entity selected from another module:', data);
            // Could fly to entity location or highlight it
        });

        // Listen for filter changes
        bus.filters.onChange((filters) => {
            console.log('Filters changed:', filters);
            // Could update displayed entities based on filters
        });
    }

    // Handle globe clicks
    function onGlobeClick(position: { longitude: number; latitude: number; height: number }) {
        console.log('Globe clicked at:', position);

        // Broadcast the click position
        bus.emit('data:shared', {
            key: 'globe-click',
            value: position,
        });

        // If in drawing mode, add a point
        if (drawingMode.value && cesiumViewer.value) {
            // Generate entity ID first
            const entityId = `entity-${Date.now()}-${Math.random()}`;

            // Create entity options with ID included
            const entityOptions = {
                id: entityId, // Include ID in options
                name: `Point ${storedEntities.value.length + 1}`,
                position: Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude),
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                },
            };

            // Add to global store (store will generate its own ID, but we'll update it)
            addEntityToStore(entityOptions);

            // Then add to viewer
            cesiumViewer.value.addEntity(entityOptions);

            console.log('Added entity to store and viewer:', entityId);
        }
    }

    // Handle viewer errors
    function onViewerError(error: Error) {
        console.error('Cesium viewer error:', error);
        // Could show user-friendly error message
    }

    // Clear all entities
    function clearAllEntities() {
        if (cesiumViewer.value) {
            // Clear from viewer
            cesiumViewer.value.clearEntities();
            // Clear from global store
            clearAllEntitiesFromStore();
            console.log('Cleared all entities from viewer and store');
        }
    }

    // Toggle drawing mode
    function toggleDrawingMode() {
        drawingMode.value = !drawingMode.value;

        // Notify other modules
        bus.emit('data:shared', {
            key: 'drawing-mode',
            value: drawingMode.value,
        });
    }

    // Component lifecycle
    onMounted(() => {
        // Entities are automatically restored from the global store when the viewer is ready
        console.log('Cesium Globe mounted, entities in store:', storedEntities.value.length);
        isUnmounting = false;
    });

    // Stop any Cesium access immediately when route changes
    onBeforeUnmount(() => {
        // Immediately flag that we're unmounting
        isUnmounting = true;

        // Stop the camera save interval RIGHT NOW
        if (cameraSaveInterval) {
            clearInterval(cameraSaveInterval);
            cameraSaveInterval = null;
        }

        // Clear the viewer reference to prevent any access
        viewer.value = null;
    });

    // Save camera position periodically while viewer is active
    let cameraSaveInterval: NodeJS.Timeout | null = null;
    let isUnmounting = false;

    function saveCameraPosition() {
        // Don't even try if we're unmounting
        if (isUnmounting || !viewer.value) {
            return;
        }

        try {
            // Don't access any Cesium properties directly - wrap everything in try/catch
            const camera = viewer.value.camera;
            const position = camera.positionCartographic;

            globalStore.cameraPosition = {
                longitude: Cesium.Math.toDegrees(position.longitude),
                latitude: Cesium.Math.toDegrees(position.latitude),
                height: position.height,
                heading: Cesium.Math.toDegrees(camera.heading),
                pitch: Cesium.Math.toDegrees(camera.pitch),
                roll: Cesium.Math.toDegrees(camera.roll),
            };
        } catch (error) {
            // Silently ignore any errors - this will catch proxy errors too
        }
    }

    // Start saving camera position when viewer is ready
    watch(viewer, (newViewer) => {
        if (newViewer && !isUnmounting) {
            // Save camera position every 2 seconds
            cameraSaveInterval = setInterval(() => {
                if (!isUnmounting) {
                    saveCameraPosition();
                }
            }, 2000);
        }
    });

    onUnmounted(() => {
        // Set flag to prevent any further Cesium access
        isUnmounting = true;

        // Clear the interval
        if (cameraSaveInterval) {
            clearInterval(cameraSaveInterval);
            cameraSaveInterval = null;
        }

        // Do NOT try to save camera position here - Cesium is being destroyed

        // Mark viewer as not ready
        globalStore.viewerReady = false;
    });

    // Import Cesium for entity creation (would need to be available)
    // Cesium types will be available after dynamic import
    declare const Cesium: any;
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
        overflow: hidden;
    }

    .fill-height {
        height: 100%;
    }
</style>
