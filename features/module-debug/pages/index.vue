<template>
    <v-container fluid class="pa-0 fill-height">
        <v-row class="fill-height ma-0">
            <v-col cols="12" class="pa-2 fill-height">
                <div class="feature-wrapper">
                    <FeatureHeader title="Module System Debug Panel" icon="mdi-bug">
                        <template #actions>
                            <v-btn
                                variant="text"
                                size="small"
                                @click="refreshData"
                                :loading="loading"
                                color="white"
                            >
                                <v-icon>mdi-refresh</v-icon>
                            </v-btn>
                            <v-switch
                                v-model="autoRefresh"
                                label="Auto-refresh"
                                density="compact"
                                hide-details
                                class="ml-4"
                                style="display: inline-flex"
                                color="white"
                            />
                        </template>
                    </FeatureHeader>

                    <v-card class="feature-content" flat>
                        <v-card-text>
                            <v-tabs v-model="tab">
                                <v-tab value="modules">Modules</v-tab>
                                <v-tab value="events">Event Flow</v-tab>
                                <v-tab value="dependencies">Dependencies</v-tab>
                                <v-tab value="console">Console</v-tab>
                            </v-tabs>

                            <v-window v-model="tab" class="mt-4">
                                <!-- Modules Tab -->
                                <v-window-item value="modules">
                                    <v-row>
                                        <v-col cols="12" md="6">
                                            <h3 class="text-h6 mb-3">
                                                Registered Modules ({{ modules.length }})
                                            </h3>
                                            <v-list density="compact">
                                                <v-list-item
                                                    v-for="module in modules"
                                                    :key="module.id"
                                                    @click="selectedModule = module"
                                                    :active="selectedModule?.id === module.id"
                                                >
                                                    <template v-slot:prepend>
                                                        <v-icon>{{ module.icon }}</v-icon>
                                                    </template>

                                                    <v-list-item-title>{{
                                                        module.name
                                                    }}</v-list-item-title>
                                                    <v-list-item-subtitle
                                                        >ID: {{ module.id }}</v-list-item-subtitle
                                                    >

                                                    <template v-slot:append>
                                                        <v-chip
                                                            size="x-small"
                                                            :color="
                                                                module.status === 'active'
                                                                    ? 'success'
                                                                    : 'warning'
                                                            "
                                                        >
                                                            {{ module.status || 'active' }}
                                                        </v-chip>
                                                    </template>
                                                </v-list-item>
                                            </v-list>
                                        </v-col>

                                        <v-col cols="12" md="6">
                                            <h3 class="text-h6 mb-3">Module Details</h3>
                                            <v-card v-if="selectedModule" variant="outlined">
                                                <v-card-text>
                                                    <div class="mb-2">
                                                        <strong>ID:</strong> {{ selectedModule.id }}
                                                    </div>
                                                    <div class="mb-2">
                                                        <strong>Name:</strong>
                                                        {{ selectedModule.name }}
                                                    </div>
                                                    <div class="mb-2">
                                                        <strong>Description:</strong>
                                                        {{ selectedModule.description || 'None' }}
                                                    </div>
                                                    <div class="mb-2">
                                                        <strong>Routes:</strong>
                                                        {{ selectedModule.routes?.length || 0 }}
                                                    </div>
                                                    <div class="mb-2">
                                                        <strong>Requires:</strong>
                                                        <v-chip
                                                            v-for="req in selectedModule.requires ||
                                                            []"
                                                            :key="req"
                                                            size="x-small"
                                                            class="ml-1"
                                                        >
                                                            {{ req }}
                                                        </v-chip>
                                                        <span
                                                            v-if="!selectedModule.requires?.length"
                                                            class="text-grey"
                                                            >None</span
                                                        >
                                                    </div>
                                                    <div class="mb-2">
                                                        <strong>Provides:</strong>
                                                        <v-chip
                                                            v-for="prov in selectedModule.provides ||
                                                            []"
                                                            :key="prov"
                                                            size="x-small"
                                                            color="primary"
                                                            class="ml-1"
                                                        >
                                                            {{ prov }}
                                                        </v-chip>
                                                        <span
                                                            v-if="!selectedModule.provides?.length"
                                                            class="text-grey"
                                                            >None</span
                                                        >
                                                    </div>
                                                </v-card-text>
                                            </v-card>
                                            <v-alert v-else type="info" variant="tonal">
                                                Select a module to view details
                                            </v-alert>
                                        </v-col>
                                    </v-row>
                                </v-window-item>

                                <!-- Event Flow Tab -->
                                <v-window-item value="events">
                                    <div class="event-flow-container">
                                        <!-- Event Flow Visualization -->
                                        <div
                                            class="event-visualization mb-4"
                                            style="height: 400px; position: relative"
                                        >
                                            <svg
                                                width="100%"
                                                height="100%"
                                                viewBox="0 0 800 400"
                                                ref="eventSvg"
                                                preserveAspectRatio="xMidYMid meet"
                                            >
                                                <!-- Module nodes -->
                                                <g
                                                    v-for="(node, index) in moduleNodes"
                                                    :key="node.id"
                                                >
                                                    <circle
                                                        :cx="node.x"
                                                        :cy="node.y"
                                                        r="45"
                                                        :fill="getModuleColor(node.id)"
                                                        stroke="#333"
                                                        stroke-width="2"
                                                        @click="
                                                            selectedModule = modules.find(
                                                                (m: any) => m.id === node.id
                                                            )
                                                        "
                                                        @mouseenter="hoveredNode = node"
                                                        @mouseleave="hoveredNode = null"
                                                        style="
                                                            cursor: pointer;
                                                            transition: all 0.2s;
                                                        "
                                                        :style="{
                                                            'stroke-width':
                                                                hoveredNode?.id === node.id ? 4 : 2,
                                                            filter:
                                                                hoveredNode?.id === node.id
                                                                    ? 'brightness(1.2)'
                                                                    : 'none',
                                                        }"
                                                    />
                                                    <!-- Module name with better text handling -->
                                                    <text
                                                        :x="node.x"
                                                        :y="node.y - 5"
                                                        text-anchor="middle"
                                                        dominant-baseline="middle"
                                                        fill="white"
                                                        font-size="11"
                                                        font-weight="bold"
                                                        style="pointer-events: none"
                                                    >
                                                        {{ node.name.split(' ')[0] }}
                                                    </text>
                                                    <text
                                                        :x="node.x"
                                                        :y="node.y + 8"
                                                        text-anchor="middle"
                                                        dominant-baseline="middle"
                                                        fill="white"
                                                        font-size="10"
                                                        style="pointer-events: none"
                                                    >
                                                        {{
                                                            node.name.split(' ').slice(1).join(' ')
                                                        }}
                                                    </text>
                                                </g>

                                                <!-- Tooltip for hovered module -->
                                                <g v-if="hoveredNode" style="pointer-events: none">
                                                    <rect
                                                        :x="hoveredNode.x - 60"
                                                        :y="hoveredNode.y - 70"
                                                        width="120"
                                                        height="25"
                                                        rx="4"
                                                        fill="rgba(0, 0, 0, 0.8)"
                                                    />
                                                    <text
                                                        :x="hoveredNode.x"
                                                        :y="hoveredNode.y - 55"
                                                        text-anchor="middle"
                                                        fill="white"
                                                        font-size="12"
                                                    >
                                                        {{ hoveredNode.name }}
                                                    </text>
                                                </g>

                                                <!-- Event connections -->
                                                <g v-for="event in activeEvents" :key="event.id">
                                                    <line
                                                        :x1="event.fromX"
                                                        :y1="event.fromY"
                                                        :x2="event.currentX"
                                                        :y2="event.currentY"
                                                        :stroke="getEventColor(event.type)"
                                                        stroke-width="3"
                                                        stroke-dasharray="5,5"
                                                        :opacity="event.opacity"
                                                    >
                                                        <animate
                                                            attributeName="stroke-dashoffset"
                                                            from="0"
                                                            to="10"
                                                            dur="0.5s"
                                                            repeatCount="indefinite"
                                                        />
                                                    </line>
                                                    <circle
                                                        :cx="event.currentX"
                                                        :cy="event.currentY"
                                                        r="5"
                                                        :fill="getEventColor(event.type)"
                                                        :opacity="event.opacity"
                                                    />
                                                </g>
                                            </svg>
                                        </div>

                                        <!-- Event History -->
                                        <h3 class="text-h6 mb-3">
                                            Recent Events ({{ eventHistory.length }})
                                        </h3>
                                        <v-data-table
                                            :headers="eventHeaders"
                                            :items="eventHistory"
                                            :items-per-page="10"
                                            density="compact"
                                        >
                                            <template
                                                v-slot:item.timestamp="{ item }: { item: any }"
                                            >
                                                {{ formatTime(item.timestamp) }}
                                            </template>
                                            <template v-slot:item.type="{ item }: { item: any }">
                                                <v-chip
                                                    size="small"
                                                    :color="getEventColor(item.type)"
                                                >
                                                    {{ item.type }}
                                                </v-chip>
                                            </template>
                                            <template v-slot:item.data="{ item }: { item: any }">
                                                <code class="text-caption"
                                                    >{{
                                                        JSON.stringify(item.data).substring(0, 50)
                                                    }}...</code
                                                >
                                            </template>
                                        </v-data-table>
                                    </div>
                                </v-window-item>

                                <!-- Dependencies Tab -->
                                <v-window-item value="dependencies">
                                    <div class="dependency-graph">
                                        <h3 class="text-h6 mb-3">Module Dependencies</h3>
                                        <v-alert type="info" variant="tonal" class="mb-4">
                                            Shows which modules depend on each other through their
                                            "requires" and "provides" declarations.
                                        </v-alert>

                                        <!-- Dependency Matrix -->
                                        <v-table density="compact">
                                            <template v-slot:default>
                                                <thead>
                                                    <tr>
                                                        <th>Module</th>
                                                        <th>Requires</th>
                                                        <th>Provides</th>
                                                        <th>Used By</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="module in modules" :key="module.id">
                                                        <td>
                                                            <v-icon size="small" class="mr-1">{{
                                                                module.icon
                                                            }}</v-icon>
                                                            {{ module.name }}
                                                        </td>
                                                        <td>
                                                            <v-chip
                                                                v-for="req in module.requires || []"
                                                                :key="req"
                                                                size="x-small"
                                                                class="mr-1"
                                                            >
                                                                {{ req }}
                                                            </v-chip>
                                                            <span
                                                                v-if="!module.requires?.length"
                                                                class="text-grey"
                                                                >-</span
                                                            >
                                                        </td>
                                                        <td>
                                                            <v-chip
                                                                v-for="prov in module.provides ||
                                                                []"
                                                                :key="prov"
                                                                size="x-small"
                                                                color="primary"
                                                                class="mr-1"
                                                            >
                                                                {{ prov }}
                                                            </v-chip>
                                                            <span
                                                                v-if="!module.provides?.length"
                                                                class="text-grey"
                                                                >-</span
                                                            >
                                                        </td>
                                                        <td>
                                                            <v-chip
                                                                v-for="user in getModulesUsingProvides(
                                                                    module
                                                                )"
                                                                :key="user.id"
                                                                size="x-small"
                                                                color="secondary"
                                                                class="mr-1"
                                                            >
                                                                {{ user.name }}
                                                            </v-chip>
                                                            <span
                                                                v-if="
                                                                    getModulesUsingProvides(module)
                                                                        .length === 0
                                                                "
                                                                class="text-grey"
                                                                >-</span
                                                            >
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </template>
                                        </v-table>
                                    </div>
                                </v-window-item>

                                <!-- Console Tab -->
                                <v-window-item value="console">
                                    <div class="console-output">
                                        <div class="d-flex justify-space-between align-center mb-3">
                                            <h3 class="text-h6">Debug Console</h3>
                                            <v-btn
                                                variant="text"
                                                size="small"
                                                @click="clearConsole"
                                            >
                                                Clear
                                            </v-btn>
                                        </div>

                                        <v-card variant="outlined" class="console-log">
                                            <v-card-text class="pa-2">
                                                <pre class="console-content">{{
                                                    consoleOutput
                                                }}</pre>
                                            </v-card-text>
                                        </v-card>

                                        <!-- Debug Actions -->
                                        <v-row class="mt-4">
                                            <v-col cols="12" sm="6">
                                                <v-btn
                                                    block
                                                    variant="tonal"
                                                    @click="logModuleState"
                                                >
                                                    Log Module State
                                                </v-btn>
                                            </v-col>
                                            <v-col cols="12" sm="6">
                                                <v-btn
                                                    block
                                                    variant="tonal"
                                                    @click="testEventBroadcast"
                                                >
                                                    Test Event Broadcast
                                                </v-btn>
                                            </v-col>
                                        </v-row>
                                    </div>
                                </v-window-item>
                            </v-window>
                        </v-card-text>
                    </v-card>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
    import { useModuleRegistry } from '~/composables/useModuleRegistry';
    import { useModuleBus } from '~/composables/useModuleBus';
    import FeatureHeader from '~/components/FeatureHeader.vue';

    // Get module system
    const moduleRegistry = useModuleRegistry();
    const { emit, onAll } = useModuleBus('module-debug');

    // Get the global store
    const globalStore = (window as any).__moduleDebugGlobalStore;
    if (!globalStore) {
        console.error(
            '[Module Debug] Global store not initialized. Ensure the module setup() has run.'
        );
    }

    // State
    const tab = ref('modules');
    const loading = ref(false);
    const autoRefresh = ref(true);
    const modules = ref<any[]>([]);
    const selectedModule = ref<any>(null);
    // Use global store for event history if available
    const eventHistory = globalStore ? computed(() => globalStore.eventHistory) : ref<any[]>([]);
    // Active events for animation are managed locally by this component
    const activeEvents = ref<any[]>([]);
    const consoleOutput = ref('Module Debug Console initialized\n');

    // Track last processed event to animate new ones
    let lastProcessedEventId = 0;

    // For event visualization
    const eventSvg = ref<SVGElement>();
    const moduleNodes = ref<any[]>([]);
    const hoveredNode = ref<any>(null);

    // Event table headers
    const eventHeaders = [
        { text: 'Time', value: 'timestamp', width: '120px' },
        { text: 'Type', value: 'type' },
        { text: 'Source', value: 'source' },
        { text: 'Data', value: 'data' },
    ];

    // Refresh interval
    let refreshInterval: NodeJS.Timeout | null = null;

    // Load module data
    function refreshData() {
        loading.value = true;

        // Get all modules
        modules.value = moduleRegistry.getAllModules();

        // Calculate module positions for visualization
        updateModuleNodes();

        loading.value = false;
    }

    // Update module node positions for visualization
    function updateModuleNodes() {
        const width = 800;
        const height = 400;
        const padding = 60; // Padding from edges
        const centerX = width / 2;
        const centerY = height / 2;

        // Dynamic radius based on number of modules, but constrained by padding
        const moduleCount = modules.value.length;
        const maxRadius = Math.min(width / 2 - padding, height / 2 - padding);
        const minRadius = Math.min(120, maxRadius);
        const radiusPerModule = 15;
        const radius = Math.min(maxRadius, minRadius + (moduleCount - 4) * radiusPerModule);

        // Try a grid layout if too many modules for circular layout
        if (moduleCount > 8) {
            // Grid layout for many modules
            const cols = Math.ceil(Math.sqrt(moduleCount));
            const rows = Math.ceil(moduleCount / cols);
            const cellWidth = width / (cols + 1);
            const cellHeight = height / (rows + 1);

            moduleNodes.value = modules.value.map((module: any, index: number) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                return {
                    id: module.id,
                    name: module.name,
                    x: cellWidth * (col + 1),
                    y: cellHeight * (row + 1),
                };
            });
        } else {
            // Circular layout for fewer modules
            moduleNodes.value = modules.value.map((module: any, index: number) => {
                const angle = (index / modules.value.length) * 2 * Math.PI - Math.PI / 2; // Start from top
                return {
                    id: module.id,
                    name: module.name,
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle),
                };
            });
        }
    }

    // Note: Event handling is now done in the module's setup() method
    // This component just displays the accumulated events from the global store

    // Animate event between modules
    function animateEvent(event: any) {
        console.log('[Module Debug] Animating event:', event.type, 'from', event.source);
        console.log(
            '[Module Debug] Module nodes:',
            moduleNodes.value.map((n: any) => n.id)
        );

        // Find source module node
        const sourceNode = moduleNodes.value.find((n: any) => n.id === event.source);
        if (!sourceNode) {
            console.log('[Module Debug] No source node found for:', event.source);
            return;
        }

        // Animate to modules that are known to be listening
        // In the future, we could track which modules actually have active listeners
        // For now, we know event-receiver and module-debug always listen to all events
        const listeningModules = ['event-receiver', 'module-debug'];

        // You could also add specific listeners based on event type
        // For example, entity:selected might go to a map module

        listeningModules.forEach((listenerId: string) => {
            const targetNode = moduleNodes.value.find((n: any) => n.id === listenerId);
            console.log('[Module Debug] Checking listener:', listenerId, 'found:', !!targetNode);

            if (targetNode && targetNode.id !== event.source) {
                const animatedEvent = reactive({
                    id: `${event.id}-${targetNode.id}`,
                    type: event.type,
                    fromX: sourceNode.x,
                    fromY: sourceNode.y,
                    toX: targetNode.x,
                    toY: targetNode.y,
                    currentX: sourceNode.x,
                    currentY: sourceNode.y,
                    progress: 0,
                    opacity: 1,
                    color: getEventColor(event.type),
                });

                console.log('[Module Debug] Creating animation:', {
                    from: `${sourceNode.id} (${sourceNode.x}, ${sourceNode.y})`,
                    to: `${targetNode.id} (${targetNode.x}, ${targetNode.y})`,
                    color: animatedEvent.color,
                });

                activeEvents.value.push(animatedEvent);

                // Animate using a simpler approach that Vue can track
                const duration = 2000; // 2 seconds
                const startTime = Date.now();

                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Update the reactive object properties
                    animatedEvent.progress = progress;
                    animatedEvent.currentX =
                        sourceNode.x + (targetNode.x - sourceNode.x) * progress;
                    animatedEvent.currentY =
                        sourceNode.y + (targetNode.y - sourceNode.y) * progress;
                    animatedEvent.opacity = 1 - progress * 0.8;

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        // Remove from active events
                        const index = activeEvents.value.findIndex(
                            (e: any) => e.id === animatedEvent.id
                        );
                        if (index > -1) {
                            activeEvents.value.splice(index, 1);
                        }
                    }
                };

                requestAnimationFrame(animate);
            }
        });
    }

    // Get modules that use this module's provides
    function getModulesUsingProvides(module: any) {
        if (!module.provides?.length) return [];

        return modules.value.filter((m: any) => {
            return m.requires?.some((req: string) => module.provides.includes(req));
        });
    }

    // Console functions
    function log(message: string) {
        const timestamp = new Date().toLocaleTimeString();
        consoleOutput.value += `[${timestamp}] ${message}\n`;

        // Keep console size reasonable
        const lines = consoleOutput.value.split('\n');
        if (lines.length > 100) {
            consoleOutput.value = lines.slice(-100).join('\n');
        }
    }

    function clearConsole() {
        consoleOutput.value = 'Console cleared\n';
    }

    function logModuleState() {
        log('=== Module State ===');
        modules.value.forEach((module: any) => {
            log(`${module.name} (${module.id})`);
            log(`  Status: ${module.status || 'active'}`);
            log(`  Routes: ${module.routes?.length || 0}`);
            log(`  Requires: ${module.requires?.join(', ') || 'none'}`);
            log(`  Provides: ${module.provides?.join(', ') || 'none'}`);
        });
        log('===================');
    }

    function testEventBroadcast() {
        const testEvent = {
            source: 'module-debug',
            message: 'Test broadcast from debug panel',
            timestamp: new Date().toISOString(),
        };

        log('Broadcasting test event...');
        emit('debug:test', testEvent);
    }

    // Helper functions
    function formatTime(date: Date) {
        return date.toLocaleTimeString();
    }

    function getModuleColor(moduleId: string) {
        const colors = ['#1976D2', '#388E3C', '#D32F2F', '#F57C00', '#7B1FA2', '#00796B'];
        const index = modules.value.findIndex((m: any) => m.id === moduleId);
        return colors[index % colors.length];
    }

    function getEventColor(eventType: string) {
        const colors: Record<string, string> = {
            'demo:message': '#2196F3',
            'demo:alert': '#F44336',
            'demo:data-update': '#4CAF50',
            'entity:selected': '#03A9F4',
            'filter:changed': '#FF9800',
            'debug:test': '#9C27B0',
            'module:message': '#2196F3', // Add color for module:message events
        };
        const color = colors[eventType] || '#757575';
        console.log('[Module Debug] Event color for', eventType, ':', color);
        return color;
    }

    // Auto-refresh
    watch(autoRefresh, (enabled) => {
        if (enabled) {
            refreshInterval = setInterval(refreshData, 1000);
        } else {
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
        }
    });

    // Watch for new events and animate them
    watch(
        eventHistory,
        (newHistory) => {
            if (!newHistory || newHistory.length === 0) return;

            // Only animate if we have module nodes positioned
            if (moduleNodes.value.length === 0) return;

            // Find new events to animate
            const newEvents = newHistory.filter((event: any) => event.id > lastProcessedEventId);

            // Animate each new event
            newEvents.forEach((event: any) => {
                animateEvent(event);
                lastProcessedEventId = Math.max(lastProcessedEventId, event.id);
            });
        },
        { deep: true }
    );

    // Lifecycle
    onMounted(() => {
        console.log('[Module Debug] Component mounting...');
        refreshData();

        // Process any events that came in before we mounted
        if (eventHistory.value && eventHistory.value.length > 0) {
            // Set the last processed ID to the oldest event
            const oldestEvent = eventHistory.value[eventHistory.value.length - 1];
            if (oldestEvent) {
                lastProcessedEventId = oldestEvent.id - 1;
            }
        }

        // Start auto-refresh if enabled
        if (autoRefresh.value) {
            refreshInterval = setInterval(refreshData, 1000);
        }

        log('Debug panel mounted - displaying events captured since app startup');
        console.log(
            '[Module Debug] Component mounted, event history:',
            eventHistory.value?.length || 0
        );
    });

    onUnmounted(() => {
        // Clean up refresh interval
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
    });
</script>

<style scoped>
    .console-log {
        background-color: #1e1e1e;
        color: #d4d4d4;
        font-family: 'Consolas', 'Monaco', monospace;
        max-height: 400px;
        overflow-y: auto;
    }

    .console-content {
        margin: 0;
        font-size: 0.875rem;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .event-visualization {
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: visible; /* Don't clip SVG content */
    }

    .theme--dark .event-visualization {
        background-color: #1e1e1e;
        border-color: #333;
    }

    .feature-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .feature-content {
        border-radius: 0 0 4px 4px;
        flex: 1;
        overflow-y: auto;
    }

    .fill-height {
        height: 100%;
    }
</style>
