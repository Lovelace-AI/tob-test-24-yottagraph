<template>
    <v-dialog
        v-model="isOpen"
        :width="width"
        :persistent="persistent"
        @update:model-value="handleClose"
    >
        <v-card>
            <!-- Search Header -->
            <v-card-title class="pa-0">
                <v-text-field
                    v-model="searchQuery"
                    autofocus
                    flat
                    hide-details
                    placeholder="Search companies, people, other entities..."
                    prepend-inner-icon="mdi-magnify"
                    variant="solo"
                    density="comfortable"
                    @keydown.enter="executeSearch"
                    @keydown.esc="close"
                    class="search-input"
                >
                    <template v-slot:append-inner>
                        <v-chip
                            size="small"
                            variant="tonal"
                            class="mr-2"
                            @click="showFilters = !showFilters"
                        >
                            <v-icon start size="small">mdi-filter</v-icon>
                            {{ activeFilterCount }} Filters
                        </v-chip>
                        <v-progress-circular v-if="loading" indeterminate size="20" width="2" />
                    </template>
                </v-text-field>
            </v-card-title>

            <!-- Filter Panel -->
            <v-expand-transition>
                <div v-show="showFilters">
                    <v-divider />
                    <v-card-text class="pa-3">
                        <v-row dense>
                            <v-col cols="12" sm="4">
                                <v-select
                                    v-model="filters.entityType"
                                    label="Entity Type"
                                    :items="entityTypes"
                                    density="compact"
                                    hide-details
                                    clearable
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-select
                                    v-model="filters.status"
                                    label="Status"
                                    :items="statusOptions"
                                    density="compact"
                                    hide-details
                                    clearable
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-select
                                    v-model="filters.region"
                                    label="Region"
                                    :items="regionOptions"
                                    density="compact"
                                    hide-details
                                    clearable
                                />
                            </v-col>
                        </v-row>
                    </v-card-text>
                </div>
            </v-expand-transition>

            <v-divider />

            <!-- Search Results -->
            <v-card-text class="pa-0 search-results">
                <!-- Recent Searches -->
                <div v-if="!searchQuery && recentSearches.length > 0" class="pa-3">
                    <div class="text-caption text-disabled mb-2">Recent Searches</div>
                    <v-chip
                        v-for="search in recentSearches"
                        :key="search"
                        size="small"
                        class="mr-2 mb-2"
                        @click="searchQuery = search"
                    >
                        <v-icon start size="small">mdi-history</v-icon>
                        {{ search }}
                    </v-chip>
                </div>

                <!-- Results List -->
                <v-list v-else-if="results.length > 0" density="compact">
                    <template v-for="(group, type) in groupedResults" :key="type">
                        <v-list-subheader v-if="Object.keys(groupedResults).length > 1">
                            {{ type }} ({{ group.length }})
                        </v-list-subheader>
                        <v-list-item
                            v-for="result in group"
                            :key="result.id"
                            @click="selectResult(result)"
                        >
                            <template v-slot:prepend>
                                <v-icon>{{ getEntityIcon(result.type) }}</v-icon>
                            </template>
                            <v-list-item-title>{{ result.name }}</v-list-item-title>
                            <v-list-item-subtitle>
                                {{ result.description }}
                            </v-list-item-subtitle>
                            <template v-slot:append>
                                <v-chip
                                    v-if="result.status"
                                    size="x-small"
                                    :color="getStatusColor(result.status)"
                                >
                                    {{ result.status }}
                                </v-chip>
                            </template>
                        </v-list-item>
                    </template>
                </v-list>

                <!-- No Results -->
                <div v-else-if="searchQuery && !loading" class="text-center pa-6">
                    <v-icon size="48" color="grey">mdi-magnify-close</v-icon>
                    <div class="text-h6 mt-2">No results found</div>
                    <div class="text-caption text-disabled">
                        Try adjusting your search or filters
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="!searchQuery" class="text-center pa-6">
                    <v-icon size="48" color="grey">mdi-magnify</v-icon>
                    <div class="text-h6 mt-2">Start typing to search</div>
                    <div class="text-caption text-disabled">
                        Search across companies, people, and other entities
                    </div>
                </div>
            </v-card-text>

            <!-- Dialog Actions -->
            <v-divider />
            <v-card-actions>
                <v-spacer />
                <v-btn text @click="close"> Close </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted } from 'vue';
    import { useModuleBus } from '~/composables/useModuleBus';
    import { useElementalService } from '~/composables/useElementalService';
    import { debounce } from 'lodash-es';

    // Props from dialog configuration
    interface Props {
        initialQuery?: string;
        entityType?: string;
        filters?: Record<string, any>;
        width?: string | number;
        persistent?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        initialQuery: '',
        entityType: 'all',
        filters: () => ({}),
        width: '600px',
        persistent: false,
    });

    // Dialog model
    const isOpen = defineModel<boolean>({ default: true });

    const { emit } = useModuleBus('smart-dialogs');
    const _elementalService = useElementalService();

    // Component state
    const searchQuery = ref(props.initialQuery);
    const loading = ref(false);
    const results = ref([]);
    const showFilters = ref(false);
    const recentSearches = ref(['Acme Corp', 'Technology sector', 'Jane Smith']);

    // Filters
    const filters = ref({
        entityType: props.entityType,
        status: null,
        region: null,
        ...props.filters,
    });

    // Filter options
    const entityTypes = [
        { title: 'All Types', value: 'all' },
        { title: 'Companies', value: 'company' },
        { title: 'People', value: 'person' },
        { title: 'Organizations', value: 'organization' },
        { title: 'Locations', value: 'location' },
    ];

    const statusOptions = [
        { title: 'Active', value: 'active' },
        { title: 'Inactive', value: 'inactive' },
        { title: 'Alert', value: 'alert' },
    ];

    const regionOptions = [
        { title: 'North America', value: 'north_america' },
        { title: 'Europe', value: 'europe' },
        { title: 'Asia Pacific', value: 'asia_pacific' },
        { title: 'Middle East', value: 'middle_east' },
    ];

    // Computed
    const activeFilterCount = computed(() => {
        return Object.values(filters.value).filter((v) => v && v !== 'all').length;
    });

    const groupedResults = computed(() => {
        return results.value.reduce((acc, result) => {
            const type = result.type || 'Other';
            if (!acc[type]) acc[type] = [];
            acc[type].push(result);
            return acc;
        }, {});
    });

    // Methods
    const executeSearch = debounce(async () => {
        if (!searchQuery.value) {
            results.value = [];
            return;
        }

        loading.value = true;

        try {
            // Mock search implementation
            // In real implementation, this would call the appropriate API
            await new Promise((resolve) => setTimeout(resolve, 500));

            results.value = [
                {
                    id: '1',
                    type: 'company',
                    name: 'Acme Corporation',
                    description: 'Technology • San Francisco, CA',
                    status: 'active',
                },
                {
                    id: '2',
                    type: 'person',
                    name: 'Jane Smith',
                    description: 'CEO • Acme Corporation',
                    status: null,
                },
                {
                    id: '3',
                    type: 'organization',
                    name: 'Global Trade Alliance',
                    description: 'Industry Group • International',
                    status: 'active',
                },
            ];

            // Track search execution
            emit('search:executed', {
                query: searchQuery.value,
                filters: filters.value,
                resultCount: results.value.length,
            });
        } catch (error) {
            console.error('Search failed:', error);
            results.value = [];
        } finally {
            loading.value = false;
        }
    }, 300);

    function selectResult(result: any) {
        // Emit selection event
        emit(`${result.type}:selected`, {
            [`${result.type}Id`]: result.id,
            entity: result,
        });

        // Add to recent searches
        if (!recentSearches.value.includes(result.name)) {
            recentSearches.value.unshift(result.name);
            recentSearches.value = recentSearches.value.slice(0, 5);
        }

        // Close dialog
        close();
    }

    function close() {
        isOpen.value = false;
    }

    function handleClose(value: boolean) {
        if (!value) {
            emit('dialog:closed', { dialogId: 'entity-search' });
        }
    }

    function getEntityIcon(type: string): string {
        const icons = {
            company: 'mdi-domain',
            person: 'mdi-account',
            organization: 'mdi-account-group',
            location: 'mdi-map-marker',
        };
        return icons[type] || 'mdi-file-document';
    }

    function getStatusColor(status: string): string {
        const colors = {
            active: 'success',
            inactive: 'grey',
            alert: 'error',
        };
        return colors[status] || 'default';
    }

    // Watch for search changes
    watch(searchQuery, () => {
        executeSearch();
    });

    // Initialize
    onMounted(() => {
        if (searchQuery.value) {
            executeSearch();
        }
    });
</script>

<style scoped>
    .search-input :deep(.v-field) {
        border-radius: 0 !important;
    }

    .search-results {
        max-height: 400px;
        overflow-y: auto;
    }

    .search-results::-webkit-scrollbar {
        width: 8px;
    }

    .search-results::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
    }

    .search-results::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }
</style>
