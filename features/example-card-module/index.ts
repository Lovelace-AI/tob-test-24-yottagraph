import { defineFeatureModule } from '~/composables/useModuleRegistry';
import type { CardDefinition } from '~/types/extended-module-ui';

// Import components
import EntityStatusPage from './pages/index.vue';
import EntitySummaryCard from './components/EntitySummaryCard.vue';
import EntityAlertCard from './components/EntityAlertCard.vue';
import EntityMapCard from './components/EntityMapCard.vue';

export default defineFeatureModule({
    id: 'entity-monitor',
    name: 'Entity Monitor',
    icon: 'mdi-database-search',
    description: 'Real-time entity monitoring with dashboard cards',

    // Traditional page-based interface
    routes: [
        {
            path: '/entity-monitor',
            component: EntityStatusPage,
            meta: {
                title: 'Entity Monitor',
            },
        },
    ],

    // Navigation entry
    navigation: {
        title: 'Entity Monitor',
        order: 30,
    },

    // Extended UI patterns
    ui: {
        // Dashboard cards for different views
        cards: [
            {
                id: 'entity-summary',
                title: 'Entity Overview',
                description: 'Overview of all tracked entities',
                component: EntitySummaryCard,
                size: 'medium',
                refreshInterval: 60000,
                refreshable: true,
                category: 'operations',
                tags: ['entities', 'tracking', 'summary'],
                defaultProps: {
                    showInactive: false,
                },
            },
            {
                id: 'entity-alerts',
                title: 'Entity Alerts',
                description: 'Active alerts and warnings',
                component: EntityAlertCard,
                size: 'small',
                refreshInterval: 30000,
                category: 'operations',
                tags: ['entities', 'alerts', 'monitoring'],
                show: () => {
                    const { hasActiveAlerts } = useEntityAlerts();
                    return hasActiveAlerts.value;
                },
            },
            {
                id: 'entity-map',
                title: 'Entity Locations',
                description: 'Live map of entity locations',
                component: EntityMapCard,
                size: 'large',
                minHeight: 400,
                refreshInterval: 120000,
                category: 'operations',
                tags: ['entities', 'map', 'locations'],
                defaultProps: {
                    zoom: 8,
                    center: [0, 0],
                },
            },
        ],
    },

    // Module dependencies
    requires: ['useElementalService', 'useModuleBus'],
    provides: ['useEntityMonitor', 'useEntityAlerts'],

    // Setup persistent state and listeners
    setup() {
        const { on, emit } = useModuleBus('entity-monitor');

        // State that persists across navigation
        const entityStore = reactive({
            trackedEntities: new Map(),
            alerts: [],
            lastUpdate: null,
        });

        // Listen for entity selection from other modules
        on('entity:selected', async (data) => {
            const { entityId } = data;
            if (!entityStore.trackedEntities.has(entityId)) {
                const entityData = await fetchEntityData(entityId);
                entityStore.trackedEntities.set(entityId, entityData);
            }
        });

        // Periodic update of entity data
        const updateInterval = setInterval(async () => {
            for (const [entityId, entity] of entityStore.trackedEntities) {
                const updated = await fetchEntityData(entityId);
                entityStore.trackedEntities.set(entityId, updated);
            }
            entityStore.lastUpdate = new Date();
            emit('entities:updated', {
                count: entityStore.trackedEntities.size,
            });
        }, 60000);

        provide('entityStore', readonly(entityStore));

        onUnmounted(() => {
            clearInterval(updateInterval);
        });
    },
});

async function fetchEntityData(entityId: string) {
    const { request } = useElementalService();
    try {
        const result = await request('/query', {
            method: 'POST',
            body: { nindex: entityId },
        });
        return result;
    } catch (error) {
        console.error('Failed to fetch entity data:', error);
        return null;
    }
}

function useEntityAlerts() {
    const entityStore = inject('entityStore');

    const hasActiveAlerts = computed(() => {
        return entityStore?.alerts?.length > 0;
    });

    return {
        hasActiveAlerts,
        alerts: computed(() => entityStore?.alerts || []),
    };
}
