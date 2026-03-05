import { defineFeatureModule } from '~/composables/useModuleRegistry';

export default defineFeatureModule({
    id: 'entity-lookup',
    name: 'Entity Lookup',
    icon: 'mdi-magnify',
    description: 'Search for Named Entity IDs (NEIDs) by entity name',

    routes: [
        {
            path: '/entity-lookup',
            component: () => import('./pages/index.vue'),
        },
    ],

    navigation: {
        title: 'Entity Lookup',
        order: 50,
        show: () => true,
    },

    requires: ['useElementalService'],
    provides: [],

    setup() {
        console.log('Entity Lookup feature initialized');
    },
});
