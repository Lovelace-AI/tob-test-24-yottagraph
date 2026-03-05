// Shared state for the News UI.

export const state = reactive({
    targetWatchlistIdForNewEntity: null as string | null,
    showAddEntityDialog: false,
    showBulkImportDialog: false,
    showSettingsDialog: false,
});
