<template>
    <div class="command-palette-container">
        <!-- Trigger Button (when not in overlay mode) -->
        <v-btn v-if="!isOpen" icon variant="text" @click="toggle" class="command-palette-trigger">
            <v-icon>mdi-console</v-icon>
            <v-tooltip activator="parent" location="bottom"> Command Palette (Ctrl+P) </v-tooltip>
        </v-btn>

        <!-- Command Palette Overlay -->
        <v-overlay
            v-model="isOpen"
            class="command-palette-overlay"
            :opacity="0.6"
            @click:outside="close"
        >
            <v-card class="command-palette" :width="width" elevation="8">
                <!-- Search Input -->
                <div class="command-search">
                    <v-text-field
                        ref="searchInput"
                        v-model="searchQuery"
                        autofocus
                        flat
                        hide-details
                        placeholder="Type a command or search..."
                        prepend-inner-icon="mdi-magnify"
                        variant="solo"
                        density="comfortable"
                        @keydown="handleKeydown"
                        class="command-input"
                    >
                        <template v-slot:append-inner>
                            <kbd class="text-caption">ESC</kbd>
                        </template>
                    </v-text-field>
                </div>

                <!-- Results -->
                <div class="command-results" ref="resultsContainer">
                    <!-- Recent Commands -->
                    <div v-if="!searchQuery && recentItems.length > 0" class="command-section">
                        <div class="command-section-title">Recent</div>
                        <div
                            v-for="(item, index) in recentItems"
                            :key="`recent-${item.id}`"
                            class="command-item"
                            :class="{ active: selectedIndex === index }"
                            @click="selectItem(item)"
                            @mouseenter="selectedIndex = index"
                        >
                            <v-icon size="small" class="mr-2">{{ item.icon }}</v-icon>
                            <span class="command-title">{{ item.title }}</span>
                            <v-spacer />
                            <kbd v-if="item.shortcut" class="command-shortcut">
                                {{ formatShortcut(item.shortcut) }}
                            </kbd>
                        </div>
                    </div>

                    <!-- Grouped Results -->
                    <template v-for="(group, category) in groupedResults" :key="category">
                        <div class="command-section">
                            <div class="command-section-title">{{ category }}</div>
                            <div
                                v-for="(item, index) in group"
                                :key="item.id"
                                class="command-item"
                                :class="{
                                    active: selectedIndex === getGlobalIndex(category, index),
                                }"
                                @click="selectItem(item)"
                                @mouseenter="selectedIndex = getGlobalIndex(category, index)"
                            >
                                <v-icon size="small" class="mr-2">{{ item.icon }}</v-icon>
                                <span class="command-title">
                                    <span v-html="highlightMatch(item.title)"></span>
                                </span>
                                <v-spacer />
                                <v-chip
                                    v-if="item.type === 'action'"
                                    size="x-small"
                                    variant="tonal"
                                    class="mr-2"
                                >
                                    Action
                                </v-chip>
                                <kbd v-if="item.shortcut" class="command-shortcut">
                                    {{ formatShortcut(item.shortcut) }}
                                </kbd>
                            </div>
                        </div>
                    </template>

                    <!-- No Results -->
                    <div v-if="searchQuery && flatResults.length === 0" class="command-empty">
                        <v-icon size="48" color="grey">mdi-magnify-close</v-icon>
                        <div class="text-h6 mt-2">No commands found</div>
                        <div class="text-caption text-disabled">Try a different search term</div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="command-footer">
                    <div class="command-hint"><kbd>↑↓</kbd> to navigate</div>
                    <div class="command-hint"><kbd>↵</kbd> to select</div>
                    <div class="command-hint"><kbd>ESC</kbd> to close</div>
                </div>
            </v-card>
        </v-overlay>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, inject, nextTick, onMounted, onUnmounted } from 'vue';
    import { useRouter } from 'vue-router';

    // Props from navigation provider config
    interface Props {
        width?: string | number;
    }

    const props = withDefaults(defineProps<Props>(), {
        width: '600px',
    });

    const router = useRouter();
    const commandPalette = inject('commandPalette');
    const navigationProvider = inject('navigationProvider');

    // Component refs
    const searchInput = ref();
    const resultsContainer = ref();

    // State
    const isOpen = computed(() => commandPalette?.state.isOpen || false);
    const searchQuery = ref('');
    const selectedIndex = ref(0);

    // Get all available items
    const allItems = computed(() => {
        return navigationProvider?.methods?.getItems() || [];
    });

    // Filter items based on search
    const filteredItems = computed(() => {
        if (!searchQuery.value) return [];
        return navigationProvider?.methods?.filterItems(allItems.value, searchQuery.value) || [];
    });

    // Recent items (when no search)
    const recentItems = computed(() => {
        if (searchQuery.value) return [];
        const recentIds = commandPalette?.state.recentCommands || [];
        return recentIds
            .map((id) => allItems.value.find((item) => item.id === id))
            .filter(Boolean)
            .slice(0, 5);
    });

    // Group results by category
    const groupedResults = computed(() => {
        const items = searchQuery.value ? filteredItems.value : allItems.value;
        return items.reduce((acc, item) => {
            const category = item.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});
    });

    // Flat list for keyboard navigation
    const flatResults = computed(() => {
        if (!searchQuery.value && recentItems.value.length > 0) {
            return recentItems.value;
        }
        return Object.values(groupedResults.value).flat();
    });

    // Methods
    function toggle() {
        commandPalette?.toggle();
    }

    function close() {
        commandPalette?.close();
    }

    function selectItem(item: any) {
        // Track command usage
        commandPalette?.executeCommand(item.id);

        // Execute navigation or action
        navigationProvider?.methods?.navigate(item);

        // Close palette
        close();
    }

    function handleKeydown(event: KeyboardEvent) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectedIndex.value = Math.min(
                    selectedIndex.value + 1,
                    flatResults.value.length - 1
                );
                scrollToSelected();
                break;

            case 'ArrowUp':
                event.preventDefault();
                selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
                scrollToSelected();
                break;

            case 'Enter':
                event.preventDefault();
                if (flatResults.value[selectedIndex.value]) {
                    selectItem(flatResults.value[selectedIndex.value]);
                }
                break;

            case 'Escape':
                event.preventDefault();
                close();
                break;
        }
    }

    function scrollToSelected() {
        nextTick(() => {
            const activeElement = resultsContainer.value?.querySelector('.command-item.active');
            if (activeElement) {
                activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        });
    }

    function getGlobalIndex(category: string, localIndex: number): number {
        let globalIndex = recentItems.value.length;
        for (const [cat, items] of Object.entries(groupedResults.value)) {
            if (cat === category) {
                return globalIndex + localIndex;
            }
            globalIndex += items.length;
        }
        return -1;
    }

    function highlightMatch(text: string): string {
        if (!searchQuery.value) return text;

        const regex = new RegExp(`(${searchQuery.value})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function formatShortcut(shortcut: string): string {
        return shortcut
            .replace(/ctrl/gi, '⌘')
            .replace(/shift/gi, '⇧')
            .replace(/alt/gi, '⌥')
            .replace(/\+/g, '');
    }

    // Global keyboard shortcut
    function handleGlobalKeydown(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
            event.preventDefault();
            toggle();
        }
    }

    // Watch for changes
    watch(isOpen, (newVal) => {
        if (newVal) {
            searchQuery.value = '';
            selectedIndex.value = 0;
            nextTick(() => {
                searchInput.value?.focus();
            });
        }
    });

    watch(searchQuery, () => {
        selectedIndex.value = 0;
    });

    // Lifecycle
    onMounted(() => {
        window.addEventListener('keydown', handleGlobalKeydown);
    });

    onUnmounted(() => {
        window.removeEventListener('keydown', handleGlobalKeydown);
    });
</script>

<style scoped>
    .command-palette-container {
        position: relative;
    }

    .command-palette-trigger {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 100;
    }

    .command-palette-overlay {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
    }

    .command-palette {
        max-height: 600px;
        display: flex;
        flex-direction: column;
        border-radius: 8px !important;
        overflow: hidden;
    }

    .command-search {
        flex-shrink: 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }

    .command-input :deep(.v-field) {
        border-radius: 0 !important;
    }

    .command-results {
        flex: 1;
        overflow-y: auto;
        max-height: 400px;
    }

    .command-results::-webkit-scrollbar {
        width: 8px;
    }

    .command-results::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
    }

    .command-results::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }

    .command-section {
        padding: 8px 0;
    }

    .command-section-title {
        padding: 4px 16px;
        font-size: 12px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.6);
        text-transform: uppercase;
    }

    .command-item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.1s;
    }

    .command-item:hover {
        background-color: rgba(0, 0, 0, 0.04);
    }

    .command-item.active {
        background-color: rgba(33, 150, 243, 0.12);
    }

    .command-title {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .command-title mark {
        background-color: rgba(255, 235, 59, 0.4);
        padding: 0 2px;
        border-radius: 2px;
    }

    .command-shortcut {
        font-family: monospace;
        font-size: 11px;
        padding: 2px 6px;
        background-color: rgba(0, 0, 0, 0.08);
        border-radius: 4px;
        margin-left: 8px;
    }

    .command-empty {
        text-align: center;
        padding: 48px 16px;
    }

    .command-footer {
        flex-shrink: 0;
        display: flex;
        gap: 16px;
        padding: 8px 16px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
        background-color: rgba(0, 0, 0, 0.02);
    }

    .command-hint {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
    }

    .command-hint kbd {
        font-family: monospace;
        font-size: 11px;
        padding: 2px 4px;
        background-color: rgba(0, 0, 0, 0.08);
        border-radius: 3px;
        margin: 0 2px;
    }

    /* Dark mode adjustments */
    .v-theme--dark {
        .command-section-title {
            color: rgba(255, 255, 255, 0.7);
        }

        .command-item:hover {
            background-color: rgba(255, 255, 255, 0.08);
        }

        .command-item.active {
            background-color: rgba(33, 150, 243, 0.24);
        }

        .command-shortcut {
            background-color: rgba(255, 255, 255, 0.12);
        }

        .command-footer {
            background-color: rgba(255, 255, 255, 0.04);
        }

        .command-hint {
            color: rgba(255, 255, 255, 0.7);
        }

        .command-hint kbd {
            background-color: rgba(255, 255, 255, 0.12);
        }
    }
</style>
