<template>
    <v-card :height="height" :width="width">
        <v-card-title class="d-flex align-center pa-2">
            <v-icon size="small" class="mr-1">mdi-earth</v-icon>
            <span class="text-body-2">{{ title }}</span>
            <v-spacer />

            <!-- Widget actions -->
            <v-btn
                icon
                size="x-small"
                variant="text"
                @click="$emit('expand')"
                title="Expand to full view"
            >
                <v-icon size="small">mdi-arrow-expand</v-icon>
            </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-0 globe-widget-container">
            <CesiumViewer
                v-if="showViewer"
                :container-id="`cesium-widget-${widgetId}`"
                :show-animation="false"
                :show-timeline="false"
                :initial-view="initialView"
                @ready="onViewerReady"
                @click="onGlobeClick"
            />

            <!-- Loading state -->
            <v-overlay v-if="!showViewer" :model-value="true" contained persistent>
                <v-progress-circular indeterminate color="primary" />
            </v-overlay>
        </v-card-text>

        <!-- Mini info bar -->
        <v-card-actions v-if="lastClick" class="pa-2">
            <v-chip size="x-small" label>
                <v-icon start size="x-small">mdi-crosshairs-gps</v-icon>
                {{ lastClick.latitude.toFixed(2) }}°, {{ lastClick.longitude.toFixed(2) }}°
            </v-chip>
            <v-spacer />
            <v-btn size="x-small" variant="text" @click="flyToLocation"> Fly To </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
    import { useModuleBus } from '~/composables/useModuleBus';
    import CesiumViewer from '../components/CesiumViewer.vue';

    interface Props {
        title?: string;
        height?: string | number;
        width?: string | number;

        // Initial view configuration
        initialLongitude?: number;
        initialLatitude?: number;
        initialHeight?: number;

        // Entity data
        entities?: Array<{
            id: string;
            name: string;
            longitude: number;
            latitude: number;
        }>;
    }

    const props = withDefaults(defineProps<Props>(), {
        title: 'Globe View',
        height: 300,
        width: '100%',
        initialLongitude: 0,
        initialLatitude: 20,
        initialHeight: 20000000, // Higher for widget view
    });

    const emit = defineEmits<{
        expand: [];
        click: [position: { longitude: number; latitude: number }];
        entitySelected: [entity: any];
    }>();

    // Generate unique ID for this widget instance
    const widgetId = `widget-${Date.now()}`;

    // Module communication
    const bus = useModuleBus(`cesium-globe-${widgetId}`);

    // State
    const showViewer = ref(false);
    const viewer = ref<any>(null);
    const lastClick = ref<{ latitude: number; longitude: number } | null>(null);

    // Initial view configuration
    const initialView = computed(() => ({
        longitude: props.initialLongitude,
        latitude: props.initialLatitude,
        height: props.initialHeight,
    }));

    // Delay viewer initialization to prevent performance issues
    onMounted(() => {
        setTimeout(() => {
            showViewer.value = true;
        }, 100);
    });

    // Handle viewer ready
    function onViewerReady(cesiumViewer: any) {
        viewer.value = cesiumViewer;

        // Add any initial entities
        if (props.entities) {
            props.entities.forEach((entity) => {
                addEntityToGlobe(entity);
            });
        }

        // Listen for entity selections from other modules
        const unsubscribe = bus.entity.onSelected((data) => {
            // Fly to selected entity if it has coordinates
            if (data.metadata?.longitude && data.metadata?.latitude) {
                flyTo(data.metadata.longitude, data.metadata.latitude);
            }
        });

        onUnmounted(unsubscribe);
    }

    // Handle globe clicks
    function onGlobeClick(position: { longitude: number; latitude: number; height: number }) {
        lastClick.value = {
            latitude: position.latitude,
            longitude: position.longitude,
        };

        emit('click', {
            longitude: position.longitude,
            latitude: position.latitude,
        });

        // Share click position with other modules
        bus.emit('data:shared', {
            key: 'widget-click',
            value: position,
        });
    }

    // Add entity to globe
    function addEntityToGlobe(entity: any) {
        if (!viewer.value) return;

        viewer.value.entities.add({
            id: entity.id,
            name: entity.name,
            position: Cesium.Cartesian3.fromDegrees(entity.longitude, entity.latitude),
            point: {
                pixelSize: 8,
                color: Cesium.Color.CYAN,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
            },
        });
    }

    // Fly to location
    function flyToLocation() {
        if (lastClick.value && viewer.value) {
            flyTo(lastClick.value.longitude, lastClick.value.latitude);
        }
    }

    // Fly to specific coordinates
    function flyTo(longitude: number, latitude: number, height = 100000) {
        if (!viewer.value) return;

        viewer.value.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            duration: 2,
        });
    }

    // Watch for entity updates
    watch(
        () => props.entities,
        (newEntities) => {
            if (!viewer.value || !newEntities) return;

            // Clear and re-add entities
            viewer.value.entities.removeAll();
            newEntities.forEach((entity) => {
                addEntityToGlobe(entity);
            });
        },
        { deep: true }
    );

    // Cesium types will be available after dynamic import
    declare const Cesium: any;
</script>

<style scoped>
    .globe-widget-container {
        position: relative;
        height: calc(100% - 48px); /* Account for title */
        overflow: hidden;
    }

    /* Ensure Cesium fills the widget */
    :deep(.viewer) {
        height: 100% !important;
    }

    /* Smaller controls for widget mode */
    :deep(.cesium-viewer-toolbar) {
        transform: scale(0.8);
        transform-origin: top right;
    }

    /* Hide some controls in widget mode */
    :deep(.cesium-viewer-animationContainer),
    :deep(.cesium-viewer-timelineContainer),
    :deep(.cesium-viewer-fullscreenContainer) {
        display: none !important;
    }
</style>
