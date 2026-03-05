/**
 * Main composable for the Feature Template
 *
 * TODO: Rename this file and update the function name
 * TODO: Implement your feature's business logic
 */

import { ref, computed } from 'vue';

export function useFeatureTemplate() {
    // State
    const data = ref<any[]>([]);
    const loading = ref(false);
    const error = ref<Error | null>(null);

    // Configuration
    const config = ref({
        refreshInterval: 30000,
        maxItems: 100,
    });

    // TODO: Add your feature's state
    // Example:
    // const selectedEntity = ref(null);
    // const filters = ref({ type: 'all', status: 'active' });

    // Computed properties
    const hasData = computed(() => data.value.length > 0);
    const dataCount = computed(() => data.value.length);

    // TODO: Add your computed properties
    // Example:
    // const filteredData = computed(() => {
    //   return data.value.filter(item => {
    //     // Apply filters
    //   });
    // });

    // Methods
    async function loadData() {
        loading.value = true;
        error.value = null;

        try {
            // TODO: Implement data loading
            // Example using Query Server:
            // const { getStatus } = useElementalService();
            // const response = await client.someMethod();
            // data.value = response.data;

            // Placeholder
            await new Promise((resolve) => setTimeout(resolve, 1000));
            data.value = [
                { id: 1, name: 'Sample Item 1' },
                { id: 2, name: 'Sample Item 2' },
            ];
        } catch (e) {
            error.value = e as Error;
            console.error('Failed to load data:', e);
        } finally {
            loading.value = false;
        }
    }

    async function refresh() {
        await loadData();
    }

    // TODO: Add your feature's methods
    // Example:
    // async function selectEntity(entityId: string) {
    //   const entity = data.value.find(e => e.id === entityId);
    //   selectedEntity.value = entity;
    // }

    // Initialize
    onMounted(() => {
        loadData();

        // Optional: Set up auto-refresh
        // const interval = setInterval(() => {
        //   refresh();
        // }, config.value.refreshInterval);
        //
        // onUnmounted(() => {
        //   clearInterval(interval);
        // });
    });

    // Return public API
    return {
        // State
        data: readonly(data),
        loading: readonly(loading),
        error: readonly(error),
        config,

        // Computed
        hasData,
        dataCount,

        // Methods
        loadData,
        refresh,

        // TODO: Export your feature's API
        // selectEntity,
        // updateFilters,
        // etc.
    };
}

// TODO: Add any helper composables or utilities
// Example:
// export function useFeatureFilters() {
//   // Filter-specific logic
// }

// TODO: Add TypeScript types
// Example:
// export interface FeatureItem {
//   id: string;
//   name: string;
//   // ... other properties
// }
