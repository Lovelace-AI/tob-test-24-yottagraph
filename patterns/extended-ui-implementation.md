# Implementing Extended UI Patterns in Aether

## Quick Start Guide

This guide shows how to implement the extended UI patterns proposed in the [Extended Module UI Patterns Design](./EXTENDED_MODULE_UI_PATTERNS.md) document.

## Overview

The extended UI patterns allow feature modules to expose their functionality in multiple ways:

1. **Cards** - Dashboard widgets for data visualization
2. **Dialogs** - Modal interfaces for focused workflows
3. **Navigation Providers** - Replace the default sidebar
4. **Overlays** - Floating panels and tooltips
5. **Actions** - Global commands and shortcuts
6. **Status Indicators** - System-wide status displays

## Implementation Examples

### 1. Dashboard Cards

Dashboard cards allow modules to expose visualizations and summaries that can be composed into dashboards.

```typescript
// features/entity-monitor/index.ts
export default defineFeatureModule({
    id: 'entity-monitor',
    name: 'Entity Monitor',

    ui: {
        cards: [
            {
                id: 'entity-summary',
                title: 'Fleet Summary',
                component: FleetSummaryCard,
                size: 'medium',
                refreshInterval: 60000,
                category: 'operations',
                // Only show if user has tracked entities
                show: () => {
                    const { hasEntities } = useEntityState();
                    return hasEntities.value;
                },
            },
        ],
    },
});
```

**Card Component Example:**

```vue
<!-- FleetSummaryCard.vue -->
<template>
    <v-card :loading="loading">
        <v-card-title>
            <v-icon class="mr-2">mdi-database-search</v-icon>
            Entity Overview
            <v-spacer />
            <v-btn icon size="small" @click="refresh">
                <v-icon>mdi-refresh</v-icon>
            </v-btn>
        </v-card-title>

        <v-card-text>
            <!-- Statistics Grid -->
            <v-row>
                <v-col v-for="stat in statistics" :key="stat.label">
                    <div class="text-center">
                        <div class="text-h4" :class="stat.color">
                            {{ stat.value }}
                        </div>
                        <div class="text-caption">{{ stat.label }}</div>
                    </div>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>
```

### 2. Context-Aware Dialogs

Dialogs can be triggered by events, keyboard shortcuts, or programmatically.

```typescript
// features/smart-search/index.ts
export default defineFeatureModule({
    id: 'smart-search',

    ui: {
        dialogs: [
            {
                id: 'universal-search',
                title: 'Search Everything',
                component: UniversalSearchDialog,
                width: '600px',
                trigger: {
                    events: ['search:open'],
                    actionId: 'quick-search',
                },
                propsResolver: (context) => ({
                    initialQuery: context.data?.query,
                    filters: context.data?.filters,
                }),
            },
        ],

        actions: [
            {
                id: 'quick-search',
                name: 'Quick Search',
                shortcut: 'ctrl+k',
                execute: async () => {
                    const { openDialog } = useModuleUI();
                    await openDialog('universal-search');
                },
            },
        ],
    },
});
```

### 3. Alternative Navigation

Replace the default sidebar with a custom navigation system.

```typescript
// features/command-palette/index.ts
export default defineFeatureModule({
    id: 'command-palette',

    ui: {
        navigationProvider: {
            id: 'command-palette',
            component: CommandPaletteNav,
            config: {
                position: 'top',
                overlay: true,
            },
            methods: {
                getItems: () => {
                    // Aggregate navigation from all modules
                    return getAllNavigationItems();
                },
                filterItems: (items, query) => {
                    // Smart filtering with fuzzy search
                    return fuzzySearch(items, query);
                },
            },
        },
    },
});
```

## Core Infrastructure Components

### ModuleUIRegistry Composable

```typescript
// composables/useModuleUI.ts
export function useModuleUI() {
    const registry = useModuleUIRegistry();

    return {
        // Card management
        registerCard: (moduleId: string, card: CardDefinition) => {
            registry.cards.set(`${moduleId}-${card.id}`, {
                ...card,
                moduleId,
            });
        },

        getCards: (filter?: CardFilter) => {
            const cards = Array.from(registry.cards.values());
            if (!filter) return cards;

            return cards.filter((card) => {
                if (filter.category && card.category !== filter.category) return false;
                if (filter.tags && !filter.tags.some((tag) => card.tags?.includes(tag)))
                    return false;
                if (card.show && !card.show()) return false;
                return true;
            });
        },

        // Dialog management
        openDialog: async (dialogId: string, data?: any) => {
            const dialog = registry.dialogs.get(dialogId);
            if (!dialog) throw new Error(`Dialog ${dialogId} not found`);

            const props = dialog.propsResolver
                ? dialog.propsResolver({ data, module: dialog.module, bus: null })
                : data;

            // Implementation would mount dialog component
            return mountDialog(dialog, props);
        },
    };
}
```

### Dashboard Layout Component

```vue
<!-- features/dashboard/components/DashboardGrid.vue -->
<template>
    <v-container fluid>
        <v-row>
            <v-col v-for="card in visibleCards" :key="card.id" :cols="getCardColumns(card.size)">
                <component
                    :is="card.component"
                    v-bind="card.defaultProps"
                    @refresh="handleRefresh(card)"
                />
            </v-col>
        </v-row>

        <!-- Add Card Button -->
        <v-btn fab fixed bottom right @click="showAddCardDialog">
            <v-icon>mdi-plus</v-icon>
        </v-btn>
    </v-container>
</template>

<script setup>
    const { getCards } = useModuleUI();
    const visibleCards = computed(() => getCards({ category: props.category }));

    function getCardColumns(size) {
        const sizes = {
            small: { xs: 12, sm: 6, md: 4, lg: 3 },
            medium: { xs: 12, sm: 12, md: 6, lg: 4 },
            large: { xs: 12, sm: 12, md: 12, lg: 8 },
            full: { xs: 12, sm: 12, md: 12, lg: 12 },
        };
        return sizes[size] || sizes.medium;
    }
</script>
```

## Usage in Applications

### 1. Enable Extended UI in Your App

```typescript
// plugins/02.extended-ui.client.ts
export default defineNuxtPlugin(() => {
    const moduleRegistry = useModuleRegistry();
    const moduleUI = useModuleUI();

    // Process UI extensions when modules are registered
    moduleRegistry.on('module:registered', (module) => {
        if (module.ui?.cards) {
            module.ui.cards.forEach((card) => {
                moduleUI.registerCard(module.id, card);
            });
        }

        if (module.ui?.dialogs) {
            module.ui.dialogs.forEach((dialog) => {
                moduleUI.registerDialog(module.id, dialog);
            });
        }

        // Handle other UI patterns...
    });
});
```

### 2. Create a Dashboard Page

```vue
<!-- pages/dashboard.vue -->
<template>
    <v-container fluid class="pa-0 fill-height">
        <v-row class="fill-height ma-0">
            <v-col cols="12" class="pa-4">
                <FeatureHeader
                    title="Dashboard"
                    icon="mdi-view-dashboard"
                    subtitle="Customizable workspace"
                />

                <DashboardGrid
                    :category="selectedCategory"
                    :user-layout="userLayout"
                    @layout-changed="saveLayout"
                />
            </v-col>
        </v-row>
    </v-container>
</template>
```

### 3. Switch Navigation Providers

```vue
<!-- layouts/default.vue -->
<template>
    <v-app>
        <AppHeader />

        <!-- Use custom navigation if provided -->
        <component
            v-if="navigationProvider"
            :is="navigationProvider.component"
            v-bind="navigationProvider.config"
        />
        <!-- Otherwise use default sidebar -->
        <ModularSideNavPanel v-else />

        <v-main>
            <NuxtPage />
        </v-main>
    </v-app>
</template>

<script setup>
    const { getNavigationProvider } = useModuleUI();
    const navigationProvider = computed(() => getNavigationProvider());
</script>
```

## Best Practices

### 1. Card Development

- Keep cards focused on a single metric or visualization
- Provide refresh functionality for dynamic data
- Use loading states during data fetching
- Respect the size constraints
- Make cards responsive

### 2. Dialog Development

- Use dialogs for focused workflows
- Provide clear actions (Save, Cancel)
- Handle keyboard shortcuts (ESC to close)
- Validate input before closing
- Show loading states for async operations

### 3. Navigation Providers

- Ensure all modules remain accessible
- Provide search/filter capabilities
- Support keyboard navigation
- Include visual feedback for active items
- Maintain performance with many items

## Type Definitions

Create a types file for the extended UI patterns:

```typescript
// types/extended-module-ui.ts
import type { Component } from 'vue';

export interface CardDefinition {
    id: string;
    title: string;
    component: Component;
    size?: 'small' | 'medium' | 'large' | 'full';
    // ... other properties
}

export interface DialogDefinition {
    id: string;
    title: string;
    component: Component;
    width?: string | number;
    // ... other properties
}

export interface ExtendedFeatureModule extends FeatureModule {
    ui?: {
        cards?: CardDefinition[];
        dialogs?: DialogDefinition[];
        navigationProvider?: NavigationProvider;
        // ... other patterns
    };
}
```

## Migration Guide

To migrate existing modules to use extended UI patterns:

1. **Identify UI Components**: Find components that could work as cards or dialogs
2. **Extract Components**: Ensure they're self-contained with clear props
3. **Add UI Section**: Add the `ui` section to your module definition
4. **Test Integration**: Verify the components work in their new contexts
5. **Document Usage**: Update your module's README with UI pattern examples

## Next Steps

1. Implement the core `useModuleUI` composable
2. Create the dashboard feature module
3. Update the layout system to support UI mount points
4. Migrate existing modules to showcase patterns
5. Create a UI pattern showcase/gallery
