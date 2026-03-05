# Extended Module UI Patterns Design

## Overview

This document outlines the design for extending Aether's feature module system to support diverse UI patterns beyond sidebar navigation. The goal is to enable features to expose their functionality as:

- **Cards**: Standalone visualizations in dashboards
- **Dialogs**: Modal interfaces for focused interactions
- **Navigation**: Alternative navigation systems
- **Overlays**: Floating panels and tooltips
- **Widgets**: Embeddable components (already supported)
- **Actions**: Global commands and shortcuts
- **Status Indicators**: System-wide status displays

## Design Principles

1. **Backwards Compatibility**: Existing modules continue to work without changes
2. **Progressive Enhancement**: Modules can adopt new patterns incrementally
3. **Type Safety**: Full TypeScript support with clear interfaces
4. **Composability**: UI patterns can be combined and nested
5. **Lifecycle Management**: Proper mounting/unmounting with cleanup
6. **Event-Driven**: Communication via the module bus remains central

## Extended FeatureModule Interface

```typescript
interface FeatureModule {
    // Existing properties remain unchanged
    id: string;
    name: string;
    icon: string;
    description?: string;

    // Existing component modes
    standalone?: Component;
    widget?: Component;

    // Existing navigation/routes
    routes?: RouteRecordRaw[];
    navigation?: NavigationConfig;

    // NEW: Extended UI patterns
    ui?: {
        // Dashboard cards
        cards?: CardDefinition[];

        // Dialog definitions
        dialogs?: DialogDefinition[];

        // Custom navigation provider
        navigationProvider?: NavigationProvider;

        // Floating overlays
        overlays?: OverlayDefinition[];

        // Global actions
        actions?: ActionDefinition[];

        // Status indicators
        statusIndicators?: StatusIndicatorDefinition[];

        // Custom slots for framework extension points
        slots?: SlotDefinition[];
    };

    // Existing lifecycle hooks
    setup?: () => void | Promise<void>;
    onInstall?: () => void | Promise<void>;
    onUninstall?: () => void | Promise<void>;
}
```

## UI Pattern Definitions

### Cards

Dashboard cards for data visualization and interaction:

```typescript
interface CardDefinition {
    id: string;
    title: string;
    description?: string;
    component: Component;

    // Card sizing and placement
    size?: 'small' | 'medium' | 'large' | 'full';
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;

    // Card behavior
    refreshInterval?: number;
    refreshable?: boolean;
    collapsible?: boolean;
    removable?: boolean;

    // Permissions/visibility
    show?: () => boolean;
    permissions?: string[];

    // Default props for the component
    defaultProps?: Record<string, any>;

    // Card categories for organization
    category?: string;
    tags?: string[];
}
```

### Dialogs

Modal interfaces for focused workflows:

```typescript
interface DialogDefinition {
    id: string;
    title: string;
    component: Component;

    // Dialog configuration
    width?: number | string;
    height?: number | string;
    fullscreen?: boolean;
    persistent?: boolean;

    // Activation
    trigger?: {
        // Can be triggered by events
        events?: string[];
        // Or by actions
        actionId?: string;
        // Or programmatically
        method?: string;
    };

    // Props passed to dialog component
    propsResolver?: (context: DialogContext) => Record<string, any>;
}

interface DialogContext {
    // Data passed when opening dialog
    data?: any;
    // Reference to the module
    module: FeatureModule;
    // Event bus for communication
    bus: ModuleBus;
}
```

### Navigation Providers

Alternative navigation systems:

```typescript
interface NavigationProvider {
    // Provider metadata
    id: string;
    name: string;
    description?: string;

    // The navigation component
    component: Component;

    // Provider configuration
    config?: {
        position?: 'left' | 'right' | 'top' | 'bottom';
        overlay?: boolean;
        persistent?: boolean;
        width?: number | string;
    };

    // Methods for navigation management
    methods?: {
        // Get navigation items from all modules
        getItems?: () => NavigationItem[];
        // Filter/sort items
        filterItems?: (items: NavigationItem[]) => NavigationItem[];
        // Handle navigation
        navigate?: (item: NavigationItem) => void;
    };
}
```

### Overlays

Floating panels and tooltips:

```typescript
interface OverlayDefinition {
    id: string;
    component: Component;

    // Overlay positioning
    position?: {
        anchor?: 'mouse' | 'element' | 'viewport';
        placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
        offset?: { x: number; y: number };
    };

    // Activation triggers
    triggers?: {
        events?: string[];
        hover?: string; // CSS selector
        click?: string; // CSS selector
        keyboard?: string; // Keyboard shortcut
    };

    // Behavior
    persistent?: boolean;
    closeOnClickOutside?: boolean;
    closeOnEscape?: boolean;
}
```

### Actions

Global commands and shortcuts:

```typescript
interface ActionDefinition {
    id: string;
    name: string;
    description?: string;
    icon?: string;

    // Activation
    shortcut?: string; // e.g., 'ctrl+shift+p'
    menuPath?: string[]; // e.g., ['File', 'New']
    toolbar?: boolean;

    // Execution
    execute: (context: ActionContext) => void | Promise<void>;

    // Availability
    enabled?: (context: ActionContext) => boolean;
    visible?: (context: ActionContext) => boolean;
}

interface ActionContext {
    module: FeatureModule;
    bus: ModuleBus;
    // Current application state
    state: AppState;
}
```

### Status Indicators

System-wide status displays:

```typescript
interface StatusIndicatorDefinition {
    id: string;
    component: Component;

    // Display location
    position?: 'header' | 'footer' | 'sidebar';
    order?: number;

    // Update behavior
    refreshInterval?: number;
    reactive?: boolean; // Use Vue reactivity

    // Visibility
    show?: () => boolean;
}
```

## Implementation Strategy

### 1. Core Infrastructure

Create new composables for UI pattern management:

```typescript
// composables/useModuleUI.ts
export interface ModuleUIRegistry {
    // Card management
    registerCard(moduleId: string, card: CardDefinition): void;
    unregisterCard(moduleId: string, cardId: string): void;
    getCards(filter?: CardFilter): CardDefinition[];

    // Dialog management
    registerDialog(moduleId: string, dialog: DialogDefinition): void;
    openDialog(dialogId: string, data?: any): Promise<any>;
    closeDialog(dialogId: string): void;

    // Navigation management
    setNavigationProvider(provider: NavigationProvider): void;
    getNavigationProvider(): NavigationProvider | null;

    // Action management
    registerAction(moduleId: string, action: ActionDefinition): void;
    executeAction(actionId: string): Promise<void>;
    getActions(filter?: ActionFilter): ActionDefinition[];
}
```

### 2. Component Mounting System

Implement a flexible mounting system for UI components:

```typescript
// utils/mountComponent.ts
export interface MountOptions {
    component: Component;
    props?: Record<string, any>;
    container?: HTMLElement | string;
    teleport?: boolean;
}

export function mountModuleComponent(options: MountOptions): {
    instance: ComponentInstance;
    unmount: () => void;
};
```

### 3. Layout Management

Create layout areas for different UI patterns:

```vue
<!-- layouts/default.vue -->
<template>
    <v-app>
        <!-- Existing header/navigation -->
        <AppHeader />
        <ModularSideNavPanel v-if="!customNavigation" />
        <CustomNavigationProvider v-else />

        <v-main>
            <!-- Main content -->
            <NuxtPage />

            <!-- Module overlays -->
            <ModuleOverlays />

            <!-- Global dialogs -->
            <ModuleDialogs />
        </v-main>

        <!-- Status indicators -->
        <ModuleStatusBar />
    </v-app>
</template>
```

### 4. Dashboard System

Create a dashboard system for cards:

```vue
<!-- features/dashboard/components/ModuleDashboard.vue -->
<template>
    <v-container fluid>
        <v-row>
            <v-col v-for="card in visibleCards" :key="card.id" :cols="getCardCols(card.size)">
                <DashboardCard :definition="card" @refresh="handleRefresh" @remove="handleRemove" />
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
    const { getCards } = useModuleUI();
    const visibleCards = computed(() =>
        getCards({ category: props.category }).filter((card) => !card.show || card.show())
    );
</script>
```

## Usage Examples

### 1. Vessel Tracker with Multiple UI Patterns

```typescript
export default defineFeatureModule({
    id: 'entity-monitor',
    name: 'Entity Monitor',
    icon: 'mdi-database-search',

    navigation: {
        title: 'Entity Monitor',
        order: 10,
    },

    ui: {
        // Dashboard card for entity summary
        cards: [
            {
                id: 'entity-summary',
                title: 'Entity Overview',
                component: EntitySummaryCard,
                size: 'medium',
                refreshInterval: 60000,
                category: 'operations',
            },
        ],

        // Dialog for entity details
        dialogs: [
            {
                id: 'entity-details',
                title: 'Entity Details',
                component: EntityDetailsDialog,
                width: '800px',
                trigger: {
                    events: ['entity:selected'],
                },
                propsResolver: (context) => ({
                    entityId: context.data?.entityId,
                }),
            },
        ],

        // Action for quick entity search
        actions: [
            {
                id: 'quick-entity-search',
                name: 'Quick Entity Search',
                shortcut: 'ctrl+k',
                execute: async (context) => {
                    await context.bus.emit('search:open', {
                        type: 'entity',
                    });
                },
            },
        ],

        // Status indicator for tracked entities
        statusIndicators: [
            {
                id: 'tracked-entities-count',
                component: TrackedEntitiesIndicator,
                position: 'header',
                refreshInterval: 30000,
            },
        ],
    },
});
```

### 2. Custom Navigation Provider

```typescript
export default defineFeatureModule({
    id: 'command-palette-nav',
    name: 'Command Palette Navigation',

    ui: {
        navigationProvider: {
            id: 'command-palette',
            name: 'Command Palette',
            component: CommandPaletteNav,
            config: {
                position: 'top',
                overlay: true,
            },
            methods: {
                getItems: () => {
                    // Aggregate from all modules
                    const registry = useModuleRegistry();
                    return registry
                        .getAllModules()
                        .filter((m) => m.navigation)
                        .map((m) => ({
                            ...m.navigation,
                            moduleId: m.id,
                        }));
                },
            },
        },
    },
});
```

### 3. Data Visualization Module

```typescript
export default defineFeatureModule({
    id: 'analytics-viz',
    name: 'Analytics Visualizations',

    ui: {
        // Multiple card sizes for different viz types
        cards: [
            {
                id: 'trend-chart',
                title: 'Trend Analysis',
                component: TrendChart,
                size: 'large',
                category: 'analytics',
            },
            {
                id: 'pie-breakdown',
                title: 'Category Breakdown',
                component: PieChart,
                size: 'small',
                category: 'analytics',
            },
            {
                id: 'heat-map',
                title: 'Activity Heatmap',
                component: HeatMap,
                size: 'full',
                category: 'analytics',
                defaultProps: {
                    colorScheme: 'viridis',
                },
            },
        ],

        // Overlay for data point details
        overlays: [
            {
                id: 'data-point-tooltip',
                component: DataPointTooltip,
                position: {
                    anchor: 'mouse',
                    placement: 'top',
                    offset: { x: 0, y: -10 },
                },
                triggers: {
                    hover: '.data-point',
                },
            },
        ],
    },
});
```

## Migration Strategy

### Phase 1: Core Infrastructure

1. Implement `ModuleUIRegistry` composable
2. Add UI pattern interfaces to type definitions
3. Create base components for cards, dialogs, etc.

### Phase 2: Layout Integration

1. Update default layout to include UI mount points
2. Create dashboard feature for card management
3. Implement dialog and overlay systems

### Phase 3: Module Updates

1. Update example modules to showcase new patterns
2. Create migration guide for existing modules
3. Update documentation and templates

### Phase 4: Advanced Features

1. Implement drag-and-drop for dashboard cards
2. Add persistence for user layout preferences
3. Create UI pattern marketplace/registry

## Benefits

1. **Flexibility**: Modules can expose functionality in multiple ways
2. **User Choice**: Users can choose their preferred interaction pattern
3. **Composability**: Different modules can work together seamlessly
4. **Innovation**: Enables new types of applications and workflows
5. **Consistency**: Shared patterns across all modules

## Considerations

1. **Performance**: Lazy load UI components to minimize initial bundle
2. **Mobile**: Ensure patterns work on mobile devices
3. **A11y**: All patterns must be keyboard navigable
4. **Testing**: Provide testing utilities for each pattern
5. **Documentation**: Clear examples for each UI pattern

## Next Steps

1. Review and refine the API design
2. Create proof-of-concept implementation
3. Build example modules using different patterns
4. Gather feedback from module developers
5. Implement core infrastructure
6. Update existing modules incrementally
