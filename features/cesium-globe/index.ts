import { defineFeatureModule } from '../../composables/useModuleRegistry';
import { reactive } from 'vue';
import CesiumGlobePage from './pages/index.vue';
import CesiumGlobeWidget from './widgets/CesiumGlobeWidget.vue';

export default defineFeatureModule({
    id: 'cesium-globe',
    name: '3D Globe Viewer',
    icon: 'mdi-earth',
    description: 'Interactive 3D globe with entity tracking and geospatial visualization',

    // Components
    standalone: CesiumGlobePage,
    widget: CesiumGlobeWidget,

    // Routes for standalone mode
    routes: [
        {
            path: '/cesium-globe',
            component: CesiumGlobePage,
            meta: {
                title: '3D Globe Viewer',
            },
        },
    ],

    // Navigation settings
    navigation: {
        title: 'Cesium Globe',
        order: 80,
    },

    // Dependencies
    requires: [
        'useUserState', // For authentication
        'useModuleBus', // For inter-module communication
        'useElementalService', // For loading entity data (when integrated)
    ],

    provides: [
        'useCesiumViewer', // Access to the Cesium viewer instance
        'useCesiumDrawing', // Drawing tools (to be implemented)
    ],

    // Setup runs at app startup - perfect for creating persistent stores
    setup() {
        // Create a global store for Cesium entities and state
        // This persists across navigation so drawing/entities aren't lost
        const globalStore = reactive({
            entities: [] as Array<{
                id: string;
                options: any;
                timestamp: Date;
            }>,
            drawingMode: false,
            cameraPosition: null as null | {
                longitude: number;
                latitude: number;
                height: number;
                heading: number;
                pitch: number;
                roll: number;
            },
            selectedEntity: null as string | null,
            viewerReady: false,
        });

        // Helper function to add an entity to the store
        function addEntityToStore(options: any) {
            const entity = {
                id: options.id || `entity-${Date.now()}-${Math.random()}`, // Use provided ID or generate one
                options,
                timestamp: new Date(),
            };
            globalStore.entities.push(entity);
            return entity.id;
        }

        // Helper function to remove an entity from the store
        function removeEntityFromStore(id: string) {
            const index = globalStore.entities.findIndex((e) => e.id === id);
            if (index > -1) {
                globalStore.entities.splice(index, 1);
            }
        }

        // Helper function to clear all entities
        function clearAllEntitiesFromStore() {
            globalStore.entities = [];
        }

        // Expose the store and helper functions globally
        (window as any).__cesiumGlobeStore = globalStore;
        (window as any).__cesiumGlobeAddEntity = addEntityToStore;
        (window as any).__cesiumGlobeRemoveEntity = removeEntityFromStore;
        (window as any).__cesiumGlobeClearEntities = clearAllEntitiesFromStore;

        console.log('[Cesium Globe] Global store initialized with entity persistence');
    },

    // Lifecycle hooks
    async onInstall() {
        console.log('🌍 Cesium Globe module installed');

        // Note: useRuntimeConfig can only be called within setup context or Nuxt plugins
        // Token checking is done in the component itself

        // Could initialize any module-specific state here
    },

    async onUninstall() {
        console.log('Cesium Globe module uninstalled');

        // Cleanup any resources
        // Note: Individual viewer instances clean themselves up
    },
});

// Export components for direct use if needed
export { default as CesiumViewer } from './components/CesiumViewer.vue';
export { default as CesiumGlobeWidget } from './widgets/CesiumGlobeWidget.vue';
