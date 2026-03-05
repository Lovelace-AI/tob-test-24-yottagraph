<template>
    <v-navigation-drawer
        theme="dark"
        permanent
        app
        :width="drawerWidth"
        :class="{ 'drawer-resizable': true }"
        :style="{
            'background-color': currentThemeColors.surface + ' !important',
            color: currentThemeColors.textPrimary,
        }"
    >
        <v-list
            density="compact"
            nav
            :style="{ color: currentThemeColors.textPrimary }"
            :selected="[selectedItem]"
        >
            <!-- Dynamic Module Section -->
            <template v-if="visibleModules.length > 0">
                <v-list-item-title class="ml-4 my-2 text-overline">Features</v-list-item-title>

                <v-list-item
                    v-for="module in visibleModules"
                    :key="module.id"
                    :prepend-icon="module.icon"
                    :title="module.navigation?.title || module.name"
                    :value="module.id"
                    :to="`/${module.id}`"
                />
            </template>

            <!-- Core Pages -->
            <v-divider class="my-2" />

            <v-list-item prepend-icon="mdi-home" title="Home" value="home" to="/" />
            <v-list-item prepend-icon="mdi-robot" title="Agent Chat" value="chat" to="/chat" />
            <v-list-item prepend-icon="mdi-server" title="MCP Explorer" value="mcp" to="/mcp" />

            <!-- Module Management -->
            <v-divider class="my-2" />
            <v-list-item-title class="ml-4 my-2 text-overline">
                Module Management
                <v-btn
                    icon
                    variant="text"
                    size="x-small"
                    @click="showModuleManager = true"
                    class="float-right mr-2"
                >
                    <v-icon>mdi-puzzle-plus</v-icon>
                </v-btn>
            </v-list-item-title>

            <v-list-item
                density="compact"
                @click="showModuleManager = true"
                prepend-icon="mdi-puzzle"
            >
                <v-list-item-title>Browse Modules</v-list-item-title>
                <v-list-item-subtitle>{{ modules.length }} installed</v-list-item-subtitle>
            </v-list-item>
        </v-list>

        <!-- Drawer resize handle -->
        <div class="drawer-resize-handle" @mousedown.prevent="startResizeDrawer" />
    </v-navigation-drawer>

    <!-- Module Manager Dialog -->
    <v-dialog v-model="showModuleManager" max-width="800">
        <v-card>
            <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-puzzle</v-icon>
                Module Manager
                <v-spacer />
                <v-btn icon variant="text" @click="showModuleManager = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text>
                <v-tabs v-model="moduleTab">
                    <v-tab value="installed">Installed</v-tab>
                    <v-tab value="available">Available</v-tab>
                    <v-tab value="development">Development</v-tab>
                </v-tabs>

                <v-window v-model="moduleTab" class="mt-4">
                    <!-- Installed Modules -->
                    <v-window-item value="installed">
                        <v-list>
                            <v-list-item v-for="module in modules" :key="module.id">
                                <template v-slot:prepend>
                                    <v-icon>{{ module.icon }}</v-icon>
                                </template>

                                <v-list-item-title>{{ module.name }}</v-list-item-title>
                                <v-list-item-subtitle>{{
                                    module.description
                                }}</v-list-item-subtitle>

                                <template v-slot:append>
                                    <v-btn
                                        color="error"
                                        variant="text"
                                        size="small"
                                        @click="uninstallModule(module.id)"
                                    >
                                        Uninstall
                                    </v-btn>
                                </template>
                            </v-list-item>

                            <v-list-item v-if="modules.length === 0">
                                <v-list-item-title class="text-center text-grey">
                                    No modules installed
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-window-item>

                    <!-- Available Modules -->
                    <v-window-item value="available">
                        <v-list>
                            <v-list-item v-for="module in availableModules" :key="module.id">
                                <template v-slot:prepend>
                                    <v-icon>{{ module.icon }}</v-icon>
                                </template>

                                <v-list-item-title>{{ module.name }}</v-list-item-title>
                                <v-list-item-subtitle>{{
                                    module.description
                                }}</v-list-item-subtitle>

                                <template v-slot:append>
                                    <v-btn
                                        color="primary"
                                        variant="tonal"
                                        size="small"
                                        @click="installModule(module)"
                                        :loading="installing === module.id"
                                    >
                                        Install
                                    </v-btn>
                                </template>
                            </v-list-item>

                            <v-list-item v-if="availableModules.length === 0">
                                <v-list-item-title class="text-center text-grey">
                                    No modules available
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-window-item>

                    <!-- Development -->
                    <v-window-item value="development">
                        <v-container>
                            <v-row>
                                <v-col>
                                    <h3 class="mb-2">Load Module from URL</h3>
                                    <v-text-field
                                        v-model="devModuleUrl"
                                        label="Module URL"
                                        hint="Enter the URL of a module to load dynamically"
                                        persistent-hint
                                        append-inner-icon="mdi-download"
                                        @click:append-inner="loadDevModule"
                                    />

                                    <h3 class="mt-6 mb-2">Create New Module</h3>
                                    <v-btn color="primary" variant="tonal" block>
                                        <v-icon start>mdi-plus</v-icon>
                                        Create Module from Template
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-window-item>
                </v-window>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
    import { defineComponent, h } from 'vue';
    import { useCustomTheme } from '~/composables/useCustomTheme';
    import { useModuleRegistry } from '~/composables/useModuleRegistry';
    import { state } from '~/utils/appState';

    const { currentThemeColors } = useCustomTheme();
    const moduleRegistry = useModuleRegistry();
    const route = useRoute();

    // State
    const drawerWidth = ref(300);
    const isResizingDrawer = ref(false);
    const minDrawerWidth = 250;
    const maxDrawerWidth = 600;
    const showModuleManager = ref(false);
    const moduleTab = ref('installed');
    const devModuleUrl = ref('');
    const installing = ref<string | null>(null);

    // Get installed modules
    const modules = computed(() => moduleRegistry.getAllModules());

    // Get visible modules (respecting navigation settings)
    const visibleModules = computed(() => {
        return modules.value
            .filter((module) => {
                // Check if module has navigation settings
                if (!module.navigation) {
                    return false; // Skip modules without navigation
                }

                // Check if module has a show function
                if (typeof module.navigation.show === 'function') {
                    return module.navigation.show();
                }

                // Default to showing the module
                return true;
            })
            .sort((a, b) => {
                // Sort by navigation order
                const orderA = a.navigation?.order ?? 100;
                const orderB = b.navigation?.order ?? 100;
                return orderA - orderB;
            });
    });

    // Track the currently selected item based on route
    const selectedItem = computed(() => {
        const path = route.path;

        if (path === '/') {
            return 'home';
        }
        if (path === '/chat') {
            return 'chat';
        }
        if (path === '/mcp') {
            return 'mcp';
        }

        // Check if path matches a module
        const pathSegments = path.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
            const moduleId = pathSegments[0];
            if (moduleRegistry.isRegistered(moduleId)) {
                return moduleId;
            }
        }

        return null;
    });

    // Mock available modules for demo
    const availableModules = ref([
        {
            id: 'data-monitor',
            name: 'Data Monitor',
            icon: 'mdi-database-search',
            description: 'Monitor companies, people, and other entities',
            package: '@company/data-monitor',
        },
        {
            id: 'flight-monitor',
            name: 'Flight Monitor',
            icon: 'mdi-airplane',
            description: 'Monitor aircraft positions and flight paths',
            package: '@company/flight-monitor',
        },
        {
            id: 'weather-overlay',
            name: 'Weather Overlay',
            icon: 'mdi-weather-cloudy',
            description: 'Display weather data on maps',
            package: '@company/weather-overlay',
        },
    ]);

    // Module management functions
    async function installModule(moduleInfo: any) {
        installing.value = moduleInfo.id;

        try {
            // In a real implementation, this would:
            // 1. Download the module package
            // 2. Load and register the module
            // 3. Save to user preferences

            // Mock installation
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // For demo, create a functional mock module with navigation
            const mockModule = {
                id: moduleInfo.id,
                name: moduleInfo.name,
                icon: moduleInfo.icon,
                description: moduleInfo.description,

                // Add navigation settings so it appears in the sidebar
                navigation: {
                    title: moduleInfo.name,
                    order: 50, // Place after built-in modules
                    show: () => true,
                },

                // Create a simple placeholder component
                standalone: defineComponent({
                    name: `Mock${moduleInfo.id}`,
                    setup() {
                        return () =>
                            h(
                                'div',
                                {
                                    style: {
                                        padding: '24px',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '16px',
                                    },
                                },
                                [
                                    h(
                                        'v-icon',
                                        {
                                            size: 64,
                                            color: 'primary',
                                        },
                                        moduleInfo.icon
                                    ),
                                    h(
                                        'h2',
                                        {
                                            style: {
                                                textAlign: 'center',
                                                marginBottom: '8px',
                                            },
                                        },
                                        moduleInfo.name
                                    ),
                                    h(
                                        'p',
                                        {
                                            style: {
                                                textAlign: 'center',
                                                color: '#666',
                                                maxWidth: '400px',
                                            },
                                        },
                                        moduleInfo.description
                                    ),
                                    h(
                                        'v-chip',
                                        {
                                            color: 'success',
                                            variant: 'tonal',
                                        },
                                        'Demo Module - Successfully Installed'
                                    ),
                                    h(
                                        'v-card',
                                        {
                                            style: {
                                                marginTop: '24px',
                                                padding: '16px',
                                                maxWidth: '500px',
                                            },
                                        },
                                        [
                                            h(
                                                'p',
                                                { style: { marginBottom: '8px' } },
                                                '⚡ This is a mock module for demonstration.'
                                            ),
                                            h(
                                                'p',
                                                'In a real implementation, this would load the actual module functionality.'
                                            ),
                                        ]
                                    ),
                                ]
                            );
                    },
                }),

                routes: [
                    {
                        path: '/',
                        component: defineComponent({
                            name: `${moduleInfo.id}Page`,
                            setup() {
                                return () => h('div', 'Mock module page');
                            },
                        }),
                    },
                ],
            };

            await moduleRegistry.register(mockModule);

            // Remove from available list
            availableModules.value = availableModules.value.filter((m) => m.id !== moduleInfo.id);
        } catch (error) {
            console.error('Failed to install module:', error);
        } finally {
            installing.value = null;
        }
    }

    async function uninstallModule(moduleId: string) {
        if (confirm('Are you sure you want to uninstall this module?')) {
            // Get module info BEFORE unregistering (for demo modules)
            const module = moduleRegistry.getModule(moduleId);

            // Check if this was one of our demo modules
            const isDemoModule =
                module && ['data-monitor', 'flight-monitor', 'weather-overlay'].includes(module.id);

            // Unregister the module
            await moduleRegistry.unregister(moduleId);

            // Add demo modules back to available list
            if (isDemoModule && module) {
                availableModules.value.push({
                    id: module.id,
                    name: module.name,
                    icon: module.icon,
                    description: module.description || '',
                    package: `@company/${module.id}`,
                });

                // Sort available modules by name for consistency
                availableModules.value.sort((a, b) => a.name.localeCompare(b.name));
            }
        }
    }

    async function loadDevModule() {
        if (!devModuleUrl.value) return;

        try {
            // In a real implementation, this would dynamically import the module
            console.log('Loading module from:', devModuleUrl.value);

            // Dynamic import example:
            // const moduleExports = await import(devModuleUrl.value);
            // await moduleRegistry.register(moduleExports.default);

            devModuleUrl.value = '';
        } catch (error) {
            console.error('Failed to load development module:', error);
        }
    }

    // Drawer resize functionality
    function startResizeDrawer(event: MouseEvent) {
        isResizingDrawer.value = true;
        document.body.classList.add('resizing-drawer');
        const startX = event.clientX;
        const startWidth = drawerWidth.value;

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
            e.preventDefault();
            const deltaX = e.clientX - startX;
            const newWidth = startWidth + deltaX;
            drawerWidth.value = Math.min(Math.max(newWidth, minDrawerWidth), maxDrawerWidth);
        };

        const handleMouseUp = () => {
            isResizingDrawer.value = false;
            document.body.classList.remove('resizing-drawer');
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    // Auto-load modules on mount (in production, this would load from user preferences)
    onMounted(async () => {
        // Example: Load modules from localStorage or user preferences
        const savedModules = localStorage.getItem('aether-modules');
        if (savedModules) {
            try {
                const moduleList = JSON.parse(savedModules);
                for (const moduleInfo of moduleList) {
                    // await loadModule(moduleInfo);
                }
            } catch (error) {
                console.error('Failed to load saved modules:', error);
            }
        }
    });
</script>

<style scoped>
    .drawer-resize-handle {
        position: absolute;
        top: 0;
        right: -2px;
        width: 6px;
        height: 100%;
        cursor: col-resize;
        background-color: transparent;
        transition: background-color 0.2s;
        z-index: 1000;
    }

    .drawer-resize-handle:hover {
        background-color: rgba(0, 0, 0, 0.2);
    }

    .theme-dark .drawer-resize-handle:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
</style>
