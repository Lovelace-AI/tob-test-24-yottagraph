import { defineFeatureModule } from '~/composables/useModuleRegistry';
import type { DialogDefinition } from '~/types/extended-module-ui';

// Import components
import EntitySearchDialog from './dialogs/EntitySearchDialog.vue';
import EntityDetailsDialog from './dialogs/EntityDetailsDialog.vue';
import QuickActionsDialog from './dialogs/QuickActionsDialog.vue';

export default defineFeatureModule({
    id: 'smart-dialogs',
    name: 'Smart Dialogs',
    icon: 'mdi-window-restore',
    description: 'Context-aware dialogs for entity interaction',

    // No traditional routes - this is dialog-only
    routes: [],

    // Extended UI patterns
    ui: {
        // Dialog definitions
        dialogs: [
            {
                id: 'entity-search',
                title: 'Universal Search',
                component: EntitySearchDialog,
                width: '600px',
                height: 'auto',
                persistent: false,
                trigger: {
                    // Can be triggered by keyboard shortcut
                    actionId: 'universal-search',
                    // Or by events from other modules
                    events: ['search:open', 'navbar:search-clicked'],
                },
                propsResolver: (context) => ({
                    initialQuery: context.data?.query || '',
                    entityType: context.data?.type || 'all',
                    filters: context.data?.filters || {},
                }),
            },
            {
                id: 'entity-details',
                title: 'Entity Details',
                component: EntityDetailsDialog,
                width: '800px',
                height: '600px',
                fullscreen: false,
                persistent: true, // Don't close on click outside
                trigger: {
                    events: [
                        'entity:view-details',
                        'entity:selected',
                        'company:selected',
                        'person:selected',
                        'organization:selected',
                    ],
                },
                propsResolver: (context) => ({
                    entityId:
                        context.data?.entityId ||
                        context.data?.companyId ||
                        context.data?.personId ||
                        context.data?.organizationId,
                    entityType: context.data?.entityType || 'entity',
                    section: context.data?.section || 'overview',
                }),
            },
            {
                id: 'quick-actions',
                title: 'Quick Actions',
                component: QuickActionsDialog,
                width: '400px',
                height: 'auto',
                trigger: {
                    events: ['entity:quick-actions'],
                },
                propsResolver: (context) => ({
                    entity: context.data?.entity,
                    actions: context.data?.actions || getDefaultActions(context.data?.entity),
                }),
            },
        ],

        // Global keyboard shortcuts
        actions: [
            {
                id: 'universal-search',
                name: 'Open Universal Search',
                description: 'Search for any entity in the system',
                icon: 'mdi-magnify',
                shortcut: 'ctrl+k',
                menuPath: ['Edit', 'Search'],
                toolbar: true,
                execute: async (context) => {
                    const { openDialog } = useModuleUI();
                    await openDialog('entity-search');
                },
            },
            {
                id: 'quick-actions-menu',
                name: 'Quick Actions',
                description: 'Show quick actions for selected entity',
                icon: 'mdi-lightning-bolt',
                shortcut: 'ctrl+shift+a',
                execute: async (context) => {
                    // Get currently selected entity from global state
                    const { selectedEntity } = useGlobalSelection();
                    if (selectedEntity.value) {
                        const { openDialog } = useModuleUI();
                        await openDialog('quick-actions', {
                            entity: selectedEntity.value,
                        });
                    }
                },
                enabled: (context) => {
                    const { selectedEntity } = useGlobalSelection();
                    return !!selectedEntity.value;
                },
            },
        ],
    },

    // Module dependencies
    requires: ['useElementalService', 'useModuleBus', 'useModuleUI'],
    provides: ['useSmartDialogs'],

    // Setup dialog management
    setup() {
        const { on, emit } = useModuleBus('smart-dialogs');
        const { openDialog, closeDialog } = useModuleUI();

        // Dialog state management
        const dialogState = reactive({
            openDialogs: new Set<string>(),
            dialogHistory: [],
            lastSearch: null,
        });

        // Listen for dialog requests from other modules
        on('dialog:open', async (data) => {
            const { dialogId, props } = data;
            if (dialogState.openDialogs.has(dialogId)) {
                // Dialog already open, bring to front
                emit('dialog:focus', { dialogId });
            } else {
                await openDialog(dialogId, props);
                dialogState.openDialogs.add(dialogId);
            }
        });

        // Track dialog lifecycle
        on('dialog:closed', (data) => {
            const { dialogId } = data;
            dialogState.openDialogs.delete(dialogId);
            dialogState.dialogHistory.push({
                dialogId,
                closedAt: new Date(),
            });
        });

        // Smart search integration
        on('search:executed', (data) => {
            dialogState.lastSearch = {
                query: data.query,
                results: data.results,
                timestamp: new Date(),
            };
        });

        // Provide dialog utilities
        provide('dialogState', readonly(dialogState));
        provide('smartDialogs', {
            openEntityDetails: (entityId: string, entityType: string) => {
                return openDialog('entity-details', { entityId, entityType });
            },
            openSearch: (query?: string) => {
                return openDialog('entity-search', { initialQuery: query });
            },
            openQuickActions: (entity: any) => {
                return openDialog('quick-actions', { entity });
            },
        });
    },
});

// Helper function to get default actions for an entity
function getDefaultActions(entity: any) {
    if (!entity) return [];

    const actions = [
        {
            id: 'view-details',
            label: 'View Details',
            icon: 'mdi-eye',
            action: 'entity:view-details',
        },
        {
            id: 'track',
            label: 'Track',
            icon: 'mdi-map-marker',
            action: 'entity:track',
        },
        {
            id: 'share',
            label: 'Share',
            icon: 'mdi-share-variant',
            action: 'entity:share',
        },
    ];

    // Add entity-specific actions
    if (entity.type === 'company') {
        actions.push({
            id: 'view-report',
            label: 'View Report',
            icon: 'mdi-file-chart',
            action: 'company:view-report',
        });
    }

    return actions;
}

// Composable for global entity selection
function useGlobalSelection() {
    // This would typically be provided by a global state management module
    const selectedEntity = ref(null);
    return { selectedEntity };
}
