<template>
    <v-navigation-drawer
        theme="dark"
        permanent
        app
        :width="newsDrawerWidth"
        :expand-on-hover="false"
        :class="{ 'news-drawer-resizable': true }"
        :style="{
            'background-color': currentThemeColors.surface + ' !important',
            color: currentThemeColors.textPrimary,
        }"
    >
        <v-list density="compact" nav :style="{ color: currentThemeColors.textPrimary }">
            <v-list-item-title class="ml-4 my-2 text-overline">News Views</v-list-item-title>

            <template v-for="view in allNewsSubViewDefinitions" :key="view.value">
                <v-list-item
                    :prepend-icon="view.icon"
                    :title="view.title"
                    :value="view.value"
                    @click="handleNewsSubViewClick(view.value as 'watched-entities' | 'news-inbox')"
                    :active="newsSubView === view.value"
                    :disabled="isNewsSubViewDisabled(view.value)"
                >
                    <template v-if="view.hasSubItems && view.value === 'news-inbox'" v-slot:append>
                        <!-- Always expanded - no toggle button -->
                        <v-progress-circular
                            v-if="countsLoading"
                            :size="20"
                            :width="2"
                            indeterminate
                            color="primary"
                            class="mr-2"
                        />
                    </template>
                </v-list-item>

                <!-- News Inbox subsections -->
                <v-expand-transition v-if="view.value === 'news-inbox'">
                    <div v-show="isInboxExpanded">
                        <v-list-item
                            v-for="section in inboxSections"
                            :key="`inbox-${section.value}`"
                            :prepend-icon="section.icon"
                            :title="section.title"
                            :value="section.value"
                            @click="handleInboxSectionClick(section.value)"
                            :active="
                                newsSubView === 'news-inbox' &&
                                selectedInboxSection === section.value
                            "
                            class="ml-4"
                            density="compact"
                        >
                            <template v-slot:append>
                                <v-progress-circular
                                    v-if="countsLoading && inboxCounts[section.value] === undefined"
                                    :size="16"
                                    :width="2"
                                    indeterminate
                                    :color="section.color"
                                />
                                <div
                                    v-else-if="inboxCounts[section.value] !== undefined"
                                    class="d-flex align-center gap-1"
                                >
                                    <v-chip :color="section.color" size="x-small" label>
                                        {{ (inboxCounts[section.value] || 0).toString() }}
                                    </v-chip>
                                    <v-progress-circular
                                        v-if="countsLoading"
                                        :size="14"
                                        :width="2"
                                        indeterminate
                                        :color="section.color"
                                        class="ml-1"
                                        style="opacity: 0.7"
                                    />
                                </div>
                            </template>
                        </v-list-item>
                    </div>
                </v-expand-transition>
            </template>

            <v-divider class="my-2"></v-divider>
            <!-- Watchlists Section -->
            <div class="d-flex align-center justify-space-between mx-4 my-2">
                <v-list-item-title class="text-overline">Watchlists</v-list-item-title>
                <div class="d-flex">
                    <v-btn
                        icon
                        variant="text"
                        size="small"
                        @click="state.showBulkImportDialog = true"
                        title="Bulk import from CSV"
                    >
                        <v-icon>mdi-file-upload-outline</v-icon>
                    </v-btn>
                    <v-btn
                        icon
                        variant="text"
                        size="small"
                        @click="handleAddWatchlistClicked"
                        title="Add new watchlist"
                    >
                        <v-icon>mdi-playlist-plus</v-icon>
                    </v-btn>
                </div>
            </div>

            <div
                v-for="(watchlist, index) in newsWatchlists"
                :key="watchlist.id"
                class="watchlist-container"
            >
                <v-list-item
                    @click="setNewsSelection('watchlist', watchlist)"
                    :active="
                        currentSelection?.type === 'watchlist' &&
                        currentSelection?.id === watchlist.id
                    "
                    class="watchlist-header-item"
                >
                    <template v-slot:prepend>
                        <div
                            @click.stop="toggleWatchlistManuallyExpanded(watchlist.id)"
                            :title="
                                isWatchlistManuallyExpanded(watchlist.id) ? 'Collapse' : 'Expand'
                            "
                            style="
                                cursor: pointer;
                                display: inline-flex;
                                align-items: center;
                                padding-right: 6px;
                                height: 100%;
                            "
                        >
                            <v-icon
                                :icon="
                                    isWatchlistManuallyExpanded(watchlist.id)
                                        ? 'mdi-chevron-down'
                                        : 'mdi-chevron-right'
                                "
                                size="small"
                            ></v-icon>
                        </div>
                    </template>

                    <v-list-item-title class="ml-1">{{ watchlist.name }}</v-list-item-title>

                    <template v-slot:append>
                        <v-btn
                            icon
                            variant="text"
                            size="x-small"
                            @click.stop="handleEditWatchlistNameClicked(watchlist)"
                            title="Edit watchlist name"
                            class="mr-1"
                        >
                            <v-icon size="small">mdi-pencil-outline</v-icon>
                        </v-btn>
                        <v-btn
                            icon
                            variant="text"
                            size="x-small"
                            @click.stop="confirmRemoveWatchlist(watchlist)"
                            title="Remove watchlist"
                            class="mr-1"
                        >
                            <v-icon size="small">mdi-delete-outline</v-icon>
                        </v-btn>
                        <v-btn
                            icon
                            variant="text"
                            size="x-small"
                            @click.stop="handleAddEntityToWatchlistClicked(watchlist.id)"
                            title="Add entity to this watchlist"
                        >
                            <v-icon size="small">mdi-plus-box-outline</v-icon>
                        </v-btn>
                    </template>
                </v-list-item>

                <v-expand-transition>
                    <div v-show="isWatchlistManuallyExpanded(watchlist.id)">
                        <v-list-item
                            v-for="entity in watchlist.entities"
                            :key="`${watchlist.id}-${entity.id}`"
                            :title="entity.name"
                            :value="`${watchlist.id}-${entity.id}`"
                            @click.stop="setNewsSelection('entity', entity, watchlist)"
                            :active="
                                currentSelection?.type === 'entity' &&
                                currentSelection?.id === entity.id
                            "
                            density="compact"
                            class="ml-7"
                        >
                            <template
                                v-slot:subtitle
                                v-if="watchlist.entities.indexOf(entity) >= 20"
                            >
                                <span class="text-warning text-caption"
                                    >Not loaded (exceeds limit)</span
                                >
                            </template>
                            <template v-slot:append>
                                <v-icon
                                    v-if="watchlist.entities.indexOf(entity) >= 20"
                                    size="x-small"
                                    color="warning"
                                    class="mr-2"
                                    :title="`Entity #${watchlist.entities.indexOf(entity) + 1} - only first 20 entities are loaded`"
                                    >mdi-alert</v-icon
                                >
                                <v-btn
                                    icon
                                    variant="text"
                                    size="x-small"
                                    @click.stop="removeEntityFromWatchlist(watchlist.id, entity.id)"
                                    title="Remove from watchlist"
                                >
                                    <v-icon size="small">mdi-close</v-icon>
                                </v-btn>
                            </template>
                        </v-list-item>
                        <v-list-item
                            v-if="!watchlist.entities || watchlist.entities.length === 0"
                            class="pl-8"
                            density="compact"
                        >
                            <v-list-item-title class="text-caption font-italic"
                                >No entities in this watchlist.</v-list-item-title
                            >
                        </v-list-item>
                    </div>
                </v-expand-transition>
            </div>
            <v-list-item v-if="!newsWatchlists || newsWatchlists.length === 0">
                <v-list-item-title class="text-caption font-italic mx-2"
                    >No watchlists yet. Click the
                    <v-icon size="x-small">mdi-playlist-plus</v-icon> to create
                    one.</v-list-item-title
                >
            </v-list-item>
        </v-list>

        <div class="drawer-resize-handle" @mousedown.prevent="startResizeDrawer"></div>
    </v-navigation-drawer>
</template>

<script setup lang="ts">
    import { useCustomTheme } from '~/composables/useCustomTheme';

    import { state } from '~/utils/appState';

    const { currentThemeColors } = useCustomTheme();

    const route = useRoute();

    // Define all possible news sub-views
    const allNewsSubViewDefinitions = ref([
        { title: 'Watched Entities', value: 'watched-entities', icon: 'mdi-view-dashboard' },
        { title: 'News Inbox', value: 'news-inbox', icon: 'mdi-inbox', hasSubItems: true },
    ]);

    // Inbox subsections
    const inboxSections = ref([
        { title: 'Important News', value: 'important', icon: 'mdi-alert-circle', color: 'error' },
        {
            title: 'Unread Articles',
            value: 'unread',
            icon: 'mdi-email-mark-as-unread',
            color: 'primary',
        },
        { title: 'Starred Articles', value: 'starred', icon: 'mdi-star', color: 'amber' },
        { title: 'All Articles', value: 'all', icon: 'mdi-inbox-full', color: 'grey' },
    ]);

    interface WatchlistEntity {
        id: string;
        name: string;
    }

    interface NewsWatchlist {
        id: string;
        name: string;
        entities: WatchlistEntity[];
    }

    const newsSubView = ref('watched-entities');
    const selectedInboxSection = ref<'important' | 'unread' | 'starred' | 'all'>('all');
    const isInboxExpanded = ref(true); // Always expanded - no toggle
    const countsLoading = ref(false); // TODO(tob) - just to satisfy existing code. Might be removed.
    const inboxCounts = ref<Record<string, number>>({});

    const currentSelection = ref<{
        type: 'watchlist' | 'entity';
        id: string;
        name?: string;
        watchlistId?: string;
        watchlistName?: string;
    } | null>(null);

    // State for manually expanded watchlists
    const manuallyExpandedWatchlistIds = ref<string[]>([]);

    // State for resizable drawer
    const newsDrawerWidth = ref(350); // Default width for news mode
    const isResizingDrawer = ref(false);
    const minDrawerWidth = 280;
    const maxDrawerWidth = 600;

    const newsWatchlists = ref<NewsWatchlist[]>([]);

    // Determine if a given news sub-view should be disabled based on current selection
    function isNewsSubViewDisabled(viewValue: string): boolean {
        // Currently no views are disabled
        return false;
    }

    function handleNewsSubViewClick(viewValue: 'watched-entities' | 'news-inbox') {
        if (isNewsSubViewDisabled(viewValue)) {
            return;
        }

        let targetQuery: Record<string, string> = { mode: 'news', subview: viewValue };

        if (viewValue === 'watched-entities') {
            let watchlistToSelectId: string | undefined =
                currentSelection.value?.type === 'watchlist'
                    ? currentSelection.value.id
                    : undefined;

            if (!watchlistToSelectId && newsWatchlists.value.length > 0) {
                watchlistToSelectId = newsWatchlists.value[0].id;
            }
            if (watchlistToSelectId) {
                targetQuery.watchlistId = watchlistToSelectId;
            }
        } else if (viewValue === 'news-inbox') {
            // Navigate to news inbox with default section
            isInboxExpanded.value = true;
            targetQuery.subview = 'news-inbox';
            targetQuery.inboxSection = selectedInboxSection.value || 'all';
        }
        console.log('[Index.vue] Navigating from handleNewsSubViewClick with query:', targetQuery);
        navigateTo({ path: '/', query: targetQuery });
    }

    function removeEntityFromWatchlist(watchlistId: string, entityIdToRemove: string) {
        const watchlistIndex = newsWatchlists.value.findIndex((w) => w.id === watchlistId);
        if (watchlistIndex !== -1) {
            const watchlist = newsWatchlists.value[watchlistIndex];

            // Create a new watchlist object with filtered entities
            const updatedWatchlist = {
                ...watchlist,
                entities: watchlist.entities.filter((e) => e.id !== entityIdToRemove),
            };

            // Replace the watchlist in the array to trigger Vue reactivity
            newsWatchlists.value = [
                ...newsWatchlists.value.slice(0, watchlistIndex),
                updatedWatchlist,
                ...newsWatchlists.value.slice(watchlistIndex + 1),
            ];

            // Check if we need to navigate away from this entity
            if (
                currentSelection.value?.type === 'entity' &&
                currentSelection.value.id === entityIdToRemove
            ) {
                // Check if this entity exists in ANY other watchlist
                const entityExistsElsewhere = newsWatchlists.value.some((w) =>
                    w.entities.some((e) => e.id === entityIdToRemove)
                );

                if (!entityExistsElsewhere) {
                    // Entity doesn't exist in any watchlist, navigate to the watchlist it was removed from
                    console.log(
                        `[Index.vue] Entity ${entityIdToRemove} no longer in any watchlist, navigating to watchlist view`
                    );
                    setNewsSelection('watchlist', { id: watchlist.id, name: watchlist.name });
                } else {
                    // Entity still exists in other watchlists, update the selection to reflect the new parent
                    const newParentWatchlist = newsWatchlists.value.find((w) =>
                        w.entities.some((e) => e.id === entityIdToRemove)
                    );
                    if (newParentWatchlist) {
                        console.log(
                            `[Index.vue] Entity ${entityIdToRemove} still exists in watchlist ${newParentWatchlist.name}`
                        );
                        // Update the current selection to reflect the new parent watchlist
                        currentSelection.value = {
                            ...currentSelection.value,
                            watchlistId: newParentWatchlist.id,
                            watchlistName: newParentWatchlist.name,
                        };
                    }
                }
            }

            console.log(
                `[Index.vue] Removed entity ${entityIdToRemove} from watchlist: ${watchlist.name}`
            );
        } else {
            console.error('Watchlist not found for entity removal:', watchlistId);
        }
    }

    // Modify setNewsSelection to accept item as potentially null for watchlists
    function setNewsSelection(
        type: 'watchlist' | 'entity',
        item: { id: string; name: string } | null,
        containingWatchlist?: { id: string; name: string }
    ) {
        if (type === 'watchlist') {
            if (item) {
                navigateTo({
                    path: '/',
                    query: {
                        ...route.query, // Preserve other query params like mode/subview
                        mode: 'news',
                        subview: 'watched-entities',
                        selectedWatchlistIds: item.id, // Set as single ID
                        neid: undefined, // Clear entity selection when selecting a watchlist
                    },
                });
            } else {
                // Clearing watchlist selection
                navigateTo({
                    path: '/',
                    query: {
                        ...route.query,
                        mode: 'news',
                        subview: 'watched-entities',
                        selectedWatchlistIds: undefined,
                        neid: undefined,
                    },
                });
            }
        } else if (type === 'entity' && item) {
            const queryParams: Record<string, any> = {
                mode: 'news',
                subview: 'entity-detail',
                neid: item.id,
            };

            const watchlistIds = useRouteQuery().watchlistIds;

            if (containingWatchlist) {
                queryParams.selectedWatchlistIds = containingWatchlist.id;
            } else if (watchlistIds.value.length === 1) {
                queryParams.selectedWatchlistIds = watchlistIds.value[0];
            }
            // If neither, selectedWatchlistIds will not be added to the query for the entity detail view.

            navigateTo({ path: '/', query: queryParams });

            if (containingWatchlist && !isWatchlistManuallyExpanded(containingWatchlist.id)) {
                toggleWatchlistManuallyExpanded(containingWatchlist.id);
            }
        } else if (type === 'entity' && !item) {
            // Clearing entity selection
            navigateTo({
                path: '/',
                query: {
                    ...route.query,
                    mode: 'news',
                    subview: 'watched-entities',
                    neid: undefined,
                    // Keep existing selectedWatchlistIds or clear if desired
                },
            });
        }
    }

    function handleInboxSectionClick(section: string) {
        selectedInboxSection.value = section as 'important' | 'unread' | 'starred' | 'all';
        navigateTo({
            path: '/',
            query: {
                mode: 'news',
                subview: 'news-inbox',
                inboxSection: section,
            },
        });
    }

    // Helper functions for manual watchlist expansion
    function isWatchlistManuallyExpanded(watchlistId: string): boolean {
        return manuallyExpandedWatchlistIds.value.includes(watchlistId);
    }

    function toggleWatchlistManuallyExpanded(watchlistId: string) {
        const index = manuallyExpandedWatchlistIds.value.indexOf(watchlistId);
        if (index > -1) {
            manuallyExpandedWatchlistIds.value.splice(index, 1);
        } else {
            manuallyExpandedWatchlistIds.value.push(watchlistId);
        }
    }

    // Drawer resize functions
    function startResizeDrawer(event: MouseEvent) {
        isResizingDrawer.value = true;
        document.body.classList.add('resizing-drawer');
        const startX = event.clientX;
        const startWidth = newsDrawerWidth.value;

        // Create invisible overlay to capture all mouse events
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '9999';
        overlay.style.cursor = 'col-resize';
        document.body.appendChild(overlay);

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault(); // Prevent text selection
            const deltaX = e.clientX - startX;
            const newWidth = startWidth + deltaX;
            newsDrawerWidth.value = Math.min(Math.max(newWidth, minDrawerWidth), maxDrawerWidth);
        };

        const handleMouseUp = () => {
            isResizingDrawer.value = false;
            document.body.classList.remove('resizing-drawer');
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            // Remove the overlay
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            // Save the drawer width to preferences if needed
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    function handleAddWatchlistClicked() {
        const newWatchlistName = prompt('Enter name for the new watchlist:', 'New Watchlist');
        if (newWatchlistName && newWatchlistName.trim() !== '') {
            const newId = `watchlist-${Date.now().toString()}`;
            newsWatchlists.value.push({ id: newId, name: newWatchlistName.trim(), entities: [] });
        } else if (newWatchlistName !== null) {
            // User entered empty string and pressed OK
            alert('Watchlist name cannot be empty.');
        }
    }

    function handleEditWatchlistNameClicked(watchlistToEdit: NewsWatchlist) {
        const newName = prompt('Enter new name for the watchlist:', watchlistToEdit.name);
        if (newName && newName.trim() !== '' && newName.trim() !== watchlistToEdit.name) {
            const watchlist = newsWatchlists.value.find((w) => w.id === watchlistToEdit.id);
            if (watchlist) {
                watchlist.name = newName.trim();
            }
        } else if (newName && newName.trim() === '') {
            alert('Watchlist name cannot be empty.');
        }
    }

    function confirmRemoveWatchlist(watchlistToRemove: NewsWatchlist) {
        if (
            confirm(
                `Are you sure you want to remove the watchlist "${watchlistToRemove.name}"? This will also remove all entities within it.`
            )
        ) {
            newsWatchlists.value = newsWatchlists.value.filter(
                (w) => w.id !== watchlistToRemove.id
            );
            if (currentSelection.value) {
                if (
                    currentSelection.value.type === 'watchlist' &&
                    currentSelection.value.id === watchlistToRemove.id
                ) {
                    currentSelection.value = null;
                } else if (
                    currentSelection.value.type === 'entity' &&
                    currentSelection.value.watchlistId === watchlistToRemove.id
                ) {
                    currentSelection.value = null;
                }
            }
        }
    }

    function handleAddEntityToWatchlistClicked(watchlistId: string) {
        state.targetWatchlistIdForNewEntity = watchlistId;
        state.showAddEntityDialog = true;
    }
</script>

<style scoped>
    /* Drawer resize handle for news mode */
    .drawer-resize-handle {
        position: absolute;
        top: 0;
        right: -2px; /* Slightly outside to make it easier to grab */
        width: 6px; /* Slightly wider for better usability */
        height: 100%;
        cursor: col-resize;
        background-color: transparent;
        transition: background-color 0.2s;
        z-index: 1000; /* Higher z-index to ensure it's on top */
    }

    .drawer-resize-handle:hover {
        background-color: rgba(0, 0, 0, 0.2);
    }

    .theme-dark .drawer-resize-handle:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
</style>
