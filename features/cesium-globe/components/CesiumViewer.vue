<template>
    <div ref="viewerContainer" class="viewer">
        <div :id="containerId" />

        <!-- Module status overlay -->
        <v-overlay
            v-if="!isAuthenticated"
            :model-value="true"
            persistent
            class="align-center justify-center"
        >
            <v-card>
                <v-card-text>
                    <v-icon color="warning" size="48">mdi-lock</v-icon>
                    <p class="mt-2">Authentication required to use the globe viewer</p>
                </v-card-text>
            </v-card>
        </v-overlay>
    </div>
</template>

<script setup lang="ts">
    import {
        ref,
        shallowRef,
        computed,
        onMounted,
        onUnmounted,
        nextTick,
        readonly,
        withDefaults,
    } from 'vue';
    import { useUserState } from '~/composables/useUserState';
    import { useRuntimeConfig } from '#app';
    import { loadCesium } from '~/utils/cesium-loader';

    // Cesium will be imported dynamically
    let Cesium: any = null;

    interface Props {
        // Allow multiple instances with unique container IDs
        containerId?: string;

        // Initial view settings
        initialView?: {
            longitude?: number;
            latitude?: number;
            height?: number;
        };

        // Feature toggles
        showAnimation?: boolean;
        showTimeline?: boolean;
        enableDrawing?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        containerId: 'cesiumContainer',
        showAnimation: true,
        showTimeline: true,
        enableDrawing: false,
        initialView: () => ({
            longitude: 0,
            latitude: 20,
            height: 15000000,
        }),
    });

    const emit = defineEmits<{
        ready: [viewer: Cesium.Viewer];
        click: [position: { longitude: number; latitude: number; height: number }];
        error: [error: Error];
    }>();

    // Access Aether's auth state
    const { userName, userId, userIsPermitted } = useUserState();

    // Computed property to check if user is authenticated
    const isAuthenticated = computed(() => !!userName.value && userIsPermitted());

    // Local state
    const viewer = shallowRef<any>(null);
    const viewerContainer = ref<HTMLElement>();

    onMounted(async () => {
        console.log('Cesium viewer mounting, auth state:', {
            isAuthenticated: isAuthenticated.value,
            userName: userName.value,
            userId: userId.value,
        });

        if (!isAuthenticated.value) {
            console.warn('Cesium viewer requires authentication');
            return;
        }

        try {
            // Use our custom Cesium loader
            Cesium = await loadCesium();

            // Initialize Cesium token
            const config = useRuntimeConfig();
            if (
                config.public.cesiumAccessToken &&
                typeof config.public.cesiumAccessToken === 'string'
            ) {
                Cesium.Ion.defaultAccessToken = config.public.cesiumAccessToken;
            } else {
                // If no token provided, disable Ion to avoid using default token
                console.warn('No Cesium Ion token provided. Some features may be limited.');
                // You could optionally set an empty token to prevent default
                // Cesium.Ion.defaultAccessToken = '';
            }

            // Delay initialization to ensure DOM is ready
            await nextTick();
            initializeViewer();
        } catch (error) {
            console.error('Failed to initialize Cesium:', error);
            emit('error', error as Error);
        }
    });

    function initializeViewer() {
        // Ensure container exists
        const container = document.getElementById(props.containerId);
        if (!container) {
            console.error(`Cesium container '${props.containerId}' not found`);
            throw new Error(`Container '${props.containerId}' not found`);
        }

        const viewerOptions: any = {
            baseLayer: false, // Don't use default Ion imagery
            baseLayerPicker: true,
            animation: props.showAnimation,
            timeline: props.showTimeline,
            shouldAnimate: true,
            homeButton: true,
            sceneModePicker: true,
            navigationHelpButton: true,
            fullscreenButton: true,
            geocoder: true, // Note: geocoder uses Ion by default
            selectionIndicator: true,
            infoBox: true,
        };

        // Create viewer instance
        viewer.value = new Cesium.Viewer(props.containerId, viewerOptions);

        // Ensure the viewer fills its container
        const cesiumContainer = viewer.value.container;
        if (cesiumContainer) {
            cesiumContainer.style.width = '100%';
            cesiumContainer.style.height = '100%';
        }

        // Also ensure the canvas fills the container
        const canvas = viewer.value.canvas;
        if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }

        // Add a free basemap layer (OpenStreetMap) that doesn't require Ion
        const osmLayer = viewer.value.imageryLayers.addImageryProvider(
            new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/',
            })
        );

        // Set initial view
        viewer.value.scene.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(
                props.initialView.longitude!,
                props.initialView.latitude!,
                props.initialView.height!
            ),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-90),
                roll: 0,
            },
        });

        // Configure viewer settings
        viewer.value.clock.shouldAnimate = true;
        viewer.value.clock.multiplier = 3600; // 1 hour passes every second
        viewer.value.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
        viewer.value.scene.globe.enableLighting = true;

        // Add click handler
        viewer.value.screenSpaceEventHandler.setInputAction((click: any) => {
            const cartesian = viewer.value!.camera.pickEllipsoid(
                click.position,
                viewer.value!.scene.globe.ellipsoid
            );

            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const longitude = Cesium.Math.toDegrees(cartographic.longitude);
                const latitude = Cesium.Math.toDegrees(cartographic.latitude);
                const height = cartographic.height;

                emit('click', { longitude, latitude, height });
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Emit ready event
        emit('ready', viewer.value);
    }

    // Cleanup
    onUnmounted(() => {
        if (viewer.value && !viewer.value.isDestroyed()) {
            viewer.value.destroy();
        }
    });

    // Expose viewer instance for parent components
    defineExpose({
        viewer: readonly(viewer),

        // Utility methods
        flyTo(longitude: number, latitude: number, height = 10000) {
            if (!viewer.value) return;

            viewer.value.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
                duration: 3,
            });
        },

        addEntity(options: any) {
            if (!viewer.value) return null;
            return viewer.value.entities.add(options);
        },

        clearEntities() {
            if (!viewer.value) return;
            viewer.value.entities.removeAll();
        },
    });
</script>

<style scoped>
    .viewer {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .viewer > div {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }

    /* Ensure Cesium container fills the space - using attribute selector since ID is dynamic */
    :deep([id^='cesium']) {
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
        top: 0;
        left: 0;
    }

    /* Also target the cesium canvas */
    :deep(.cesium-widget canvas) {
        width: 100% !important;
        height: 100% !important;
    }

    /* Override Cesium's default styles to match Aether theme */
    :deep(.cesium-viewer) {
        font-family: inherit;
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
    }

    :deep(.cesium-widget-credits) {
        display: none !important;
    }
</style>
