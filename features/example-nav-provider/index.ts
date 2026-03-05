import { defineFeatureModule } from '~/composables/useModuleRegistry';
import type { NavigationProvider } from '~/types/extended-module-ui';

// Import navigation component
import CommandPaletteNav from './components/CommandPaletteNav.vue';

export default defineFeatureModule({
    id: 'command-palette-nav',
    name: 'Command Palette Navigation',
    icon: 'mdi-console',
    description: 'Replace sidebar with a command palette style navigation',

    // This module can still have its own pages
    routes: [
        {
            path: '/nav-settings',
            component: () => import('./pages/NavigationSettings.vue'),
            meta: {
                title: 'Navigation Settings',
            },
        },
    ],

    // Extended UI patterns
    ui: {
        // Custom navigation provider
        navigationProvider: {
            id: 'command-palette',
            name: 'Command Palette',
            description: 'Quick access to all features via command palette',
            component: CommandPaletteNav,

            config: {
                position: 'top', // Replace top navigation
                overlay: true, // Overlay mode when activated
                persistent: false, // Hide when not in use
                width: '600px',
            },

            methods: {
                // Get navigation items from all modules
                getItems: () => {
                    const { getAllModules } = useModuleRegistry();
                    const items = [];

                    // Collect navigation items from all modules
                    getAllModules().forEach((module) => {
                        if (module.navigation) {
                            items.push({
                                id: `nav-${module.id}`,
                                moduleId: module.id,
                                title: module.navigation.title || module.name,
                                icon: module.icon,
                                path: module.routes?.[0]?.path,
                                type: 'navigation',
                                category: 'Modules',
                                keywords: [module.name, module.description].filter(Boolean),
                            });
                        }

                        // Also include module actions
                        if (module.ui?.actions) {
                            module.ui.actions.forEach((action) => {
                                items.push({
                                    id: `action-${module.id}-${action.id}`,
                                    moduleId: module.id,
                                    title: action.name,
                                    icon: action.icon,
                                    shortcut: action.shortcut,
                                    type: 'action',
                                    category: 'Actions',
                                    keywords: [action.name, action.description].filter(Boolean),
                                    execute: action.execute,
                                });
                            });
                        }
                    });

                    // Add system commands
                    items.push(
                        {
                            id: 'cmd-settings',
                            title: 'Settings',
                            icon: 'mdi-cog',
                            path: '/settings',
                            type: 'navigation',
                            category: 'System',
                            keywords: ['preferences', 'configuration'],
                        },
                        {
                            id: 'cmd-help',
                            title: 'Help & Documentation',
                            icon: 'mdi-help-circle',
                            type: 'action',
                            category: 'System',
                            keywords: ['docs', 'guide', 'tutorial'],
                            execute: () => window.open('/docs', '_blank'),
                        },
                        {
                            id: 'cmd-theme-toggle',
                            title: 'Toggle Theme',
                            icon: 'mdi-theme-light-dark',
                            type: 'action',
                            category: 'System',
                            shortcut: 'ctrl+shift+t',
                            keywords: ['dark', 'light', 'theme'],
                            execute: () => {
                                const { toggleTheme } = useTheme();
                                toggleTheme();
                            },
                        }
                    );

                    return items;
                },

                // Filter items based on search
                filterItems: (items, query) => {
                    if (!query) return items;

                    const searchTerms = query.toLowerCase().split(' ');

                    return items
                        .map((item) => {
                            // Calculate relevance score
                            let score = 0;
                            const title = item.title.toLowerCase();
                            const keywords = item.keywords?.join(' ').toLowerCase() || '';

                            searchTerms.forEach((term) => {
                                if (title.includes(term)) score += 10;
                                if (title.startsWith(term)) score += 5;
                                if (keywords.includes(term)) score += 3;
                                if (item.shortcut?.toLowerCase().includes(term)) score += 2;
                            });

                            return { ...item, score };
                        })
                        .filter((item) => item.score > 0)
                        .sort((a, b) => b.score - a.score);
                },

                // Handle navigation
                navigate: (item) => {
                    if (item.type === 'navigation' && item.path) {
                        const router = useRouter();
                        router.push(item.path);
                    } else if (item.type === 'action' && item.execute) {
                        item.execute({ module: null, bus: null, state: {} });
                    }
                },
            },
        },

        // Keyboard shortcut to open command palette
        actions: [
            {
                id: 'open-command-palette',
                name: 'Open Command Palette',
                icon: 'mdi-console',
                shortcut: 'ctrl+p',
                execute: async (context) => {
                    const { emit } = useModuleBus('command-palette-nav');
                    emit('command-palette:toggle');
                },
            },
        ],
    },

    // Module dependencies
    requires: ['useModuleRegistry', 'useModuleBus', 'useRouter'],
    provides: ['useCommandPalette'],

    // Setup command palette state
    setup() {
        const { on, emit } = useModuleBus('command-palette-nav');

        // Command palette state
        const state = reactive({
            isOpen: false,
            searchQuery: '',
            selectedIndex: 0,
            recentCommands: [],
            favoriteCommands: [],
        });

        // Toggle command palette
        on('command-palette:toggle', () => {
            state.isOpen = !state.isOpen;
            if (state.isOpen) {
                state.searchQuery = '';
                state.selectedIndex = 0;
            }
        });

        // Open with initial query
        on('command-palette:open', (data) => {
            state.isOpen = true;
            state.searchQuery = data?.query || '';
            state.selectedIndex = 0;
        });

        // Close command palette
        on('command-palette:close', () => {
            state.isOpen = false;
        });

        // Track command usage
        on('command:executed', (data) => {
            const { commandId } = data;

            // Add to recent commands
            state.recentCommands = [
                commandId,
                ...state.recentCommands.filter((id) => id !== commandId),
            ].slice(0, 10);

            // Update favorites based on usage
            // (In a real implementation, this would be more sophisticated)
        });

        // Provide command palette API
        provide('commandPalette', {
            state: readonly(state),
            open: (query?: string) => emit('command-palette:open', { query }),
            close: () => emit('command-palette:close'),
            toggle: () => emit('command-palette:toggle'),
            executeCommand: (commandId: string) => {
                emit('command:executed', { commandId });
            },
        });
    },
});

// Mock theme composable
function useTheme() {
    return {
        toggleTheme: () => {
            console.log('Theme toggled');
        },
    };
}
