<template>
    <v-card class="entity-summary-card" :loading="loading">
        <!-- Card Header with Actions -->
        <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-database-search</v-icon>
            <span>Entity Overview</span>
            <v-spacer />
            <v-btn icon size="small" variant="text" @click="refresh" :disabled="loading">
                <v-icon>mdi-refresh</v-icon>
            </v-btn>
        </v-card-title>

        <v-card-text>
            <!-- Summary Statistics -->
            <v-row dense>
                <v-col cols="12" sm="6" md="3">
                    <div class="text-center">
                        <div class="text-h4 font-weight-bold primary--text">
                            {{ statistics.total }}
                        </div>
                        <div class="text-caption">Total Entities</div>
                    </div>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <div class="text-center">
                        <div class="text-h4 font-weight-bold success--text">
                            {{ statistics.active }}
                        </div>
                        <div class="text-caption">Active</div>
                    </div>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <div class="text-center">
                        <div class="text-h4 font-weight-bold warning--text">
                            {{ statistics.idle }}
                        </div>
                        <div class="text-caption">Idle</div>
                    </div>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                    <div class="text-center">
                        <div class="text-h4 font-weight-bold error--text">
                            {{ statistics.alerts }}
                        </div>
                        <div class="text-caption">Alerts</div>
                    </div>
                </v-col>
            </v-row>

            <!-- Entity List -->
            <v-divider class="my-3" />

            <div class="entity-list">
                <div class="text-subtitle-2 mb-2">Recent Activity</div>
                <v-list dense>
                    <v-list-item
                        v-for="entity in recentEntities"
                        :key="entity.id"
                        @click="selectEntity(entity)"
                        class="px-0"
                    >
                        <template v-slot:prepend>
                            <v-icon :color="getStatusColor(entity.status)" size="small">
                                mdi-circle
                            </v-icon>
                        </template>
                        <v-list-item-title>{{ entity.name }}</v-list-item-title>
                        <v-list-item-subtitle>
                            {{ entity.industry }} · {{ formatTime(entity.lastUpdate) }}
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </div>

            <!-- View All Link -->
            <div class="text-center mt-3">
                <v-btn variant="text" color="primary" size="small" :to="moduleRoute">
                    View All Entities
                    <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
            </div>
        </v-card-text>

        <!-- Last Update Footer -->
        <v-card-actions class="px-4 py-2 text-caption">
            <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
            Updated {{ formatTime(lastUpdate) }}
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
    import { ref, computed, inject, onMounted } from 'vue';
    import { useRouter } from 'vue-router';
    import { useModuleBus } from '~/composables/useModuleBus';

    interface Props {
        showInactive?: boolean;
        maxItems?: number;
    }

    const props = withDefaults(defineProps<Props>(), {
        showInactive: false,
        maxItems: 5,
    });

    const emit = defineEmits<{
        refresh: [];
        entitySelected: [entity: any];
    }>();

    const router = useRouter();
    const { emit: busEmit } = useModuleBus('entity-monitor');
    const entityStore = inject('entityStore');

    const loading = ref(false);
    const lastUpdate = ref(new Date());

    const statistics = computed(() => {
        const entities = Array.from(entityStore?.trackedEntities?.values() || []);
        return {
            total: entities.length,
            active: entities.filter((e) => e.status === 'active').length,
            idle: entities.filter((e) => e.status === 'idle').length,
            alerts: entityStore?.alerts?.length || 0,
        };
    });

    const recentEntities = computed(() => {
        const entities = Array.from(entityStore?.trackedEntities?.values() || []);
        return entities
            .filter((e) => props.showInactive || e.status !== 'inactive')
            .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
            .slice(0, props.maxItems)
            .map((e) => ({
                id: e.nindex,
                name: e.label,
                industry: e.properties?.find((p) => p.name === 'industry')?.stringValue,
                status: e.status || 'unknown',
                lastUpdate: e.lastUpdate,
            }));
    });

    const moduleRoute = computed(() => '/entity-monitor');

    async function refresh() {
        loading.value = true;
        emit('refresh');

        try {
            busEmit('entities:refresh');
            await new Promise((resolve) => setTimeout(resolve, 1000));
            lastUpdate.value = new Date();
        } finally {
            loading.value = false;
        }
    }

    function selectEntity(entity: any) {
        emit('entitySelected', entity);
        busEmit('entity:selected', { entityId: entity.id });
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case 'active':
                return 'success';
            case 'idle':
                return 'warning';
            case 'alert':
                return 'error';
            default:
                return 'grey';
        }
    }

    function formatTime(date: Date | string): string {
        if (!date) return 'Never';
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return d.toLocaleDateString();
    }

    onMounted(() => {
        refresh();
    });
</script>

<style scoped>
    .entity-summary-card {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .entity-list {
        max-height: 200px;
        overflow-y: auto;
    }

    .entity-list::-webkit-scrollbar {
        width: 4px;
    }

    .entity-list::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
    }

    .entity-list::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 2px;
    }
</style>
