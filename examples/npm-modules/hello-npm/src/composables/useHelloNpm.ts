import { ref, computed } from 'vue';
import type { HelloNpmConfig, HelloNpmEvent } from '../types';

// Universal module bus access that works for both local and NPM modules
function getModuleBus(moduleId: string) {
    if (typeof window !== 'undefined' && (window as any).__aetherModuleApi) {
        return (window as any).__aetherModuleApi.useModuleBus(moduleId);
    }
    // Return a mock for development/testing
    return {
        emit: (event: string, data: any) => {
            console.log(`[${moduleId}] Emit:`, event, data);
        },
        on: () => () => {},
        off: () => {},
    };
}

// Get the module bus for this module
const { emit } = getModuleBus('hello-npm');

// Module state (shared across all instances)
const moduleState = {
    config: ref<HelloNpmConfig>({
        greeting: 'Hello from NPM!',
        showTimestamp: true,
        refreshInterval: 5000,
    }),
    messageHistory: ref<Array<{ message: string; timestamp: Date }>>([]),
    isActive: ref(false),
    // Auto-send state
    isAutoSending: ref(false),
    autoSendInterval: null as NodeJS.Timeout | null,
    autoSendCounter: ref(0),
};

export const useHelloNpm = () => {
    // Update configuration
    const updateConfig = (newConfig: Partial<HelloNpmConfig>) => {
        moduleState.config.value = {
            ...moduleState.config.value,
            ...newConfig,
        };
    };

    // Send a greeting message
    const sendGreeting = (customMessage?: string) => {
        const message = customMessage || moduleState.config.value.greeting;
        const timestamp = new Date();

        // Add to history
        moduleState.messageHistory.value.push({ message, timestamp });

        // Keep only last 10 messages
        if (moduleState.messageHistory.value.length > 10) {
            moduleState.messageHistory.value.shift();
        }

        // Emit event on the module bus
        emit('module:message', {
            source: 'hello-npm',
            moduleId: 'hello-npm',
            message,
            timestamp,
            type: 'greeting',
            data: {
                message,
                timestamp,
                type: 'greeting',
            },
        });

        console.log('[Hello NPM] Greeting sent:', message);

        return { message, timestamp };
    };

    // Clear message history
    const clearHistory = () => {
        moduleState.messageHistory.value = [];
    };

    // Computed properties
    const currentGreeting = computed(() => {
        const base = moduleState.config.value.greeting;
        if (moduleState.config.value.showTimestamp) {
            return `${base} (${new Date().toLocaleTimeString()})`;
        }
        return base;
    });

    const messageCount = computed(() => moduleState.messageHistory.value.length);

    // Auto-send functionality
    const startAutoSend = () => {
        // Stop any existing interval
        stopAutoSend();

        if (moduleState.config.value.refreshInterval <= 0) {
            console.warn(
                '[Hello NPM] Invalid refresh interval:',
                moduleState.config.value.refreshInterval
            );
            return;
        }

        // Send first message immediately
        moduleState.autoSendCounter.value++;
        const firstMessage = `${moduleState.config.value.greeting} (auto #${moduleState.autoSendCounter.value})`;
        sendGreeting(firstMessage);

        // Start interval
        moduleState.autoSendInterval = setInterval(() => {
            try {
                if (!moduleState.isAutoSending.value) {
                    stopAutoSend();
                    return;
                }

                moduleState.autoSendCounter.value++;
                const autoMessage = `${moduleState.config.value.greeting} (auto #${moduleState.autoSendCounter.value})`;
                sendGreeting(autoMessage);
            } catch (error) {
                console.error('[Hello NPM] Auto-send error:', error);
                stopAutoSend();
            }
        }, moduleState.config.value.refreshInterval);

        moduleState.isAutoSending.value = true;
        console.log(
            '[Hello NPM] Auto-send started with interval:',
            moduleState.config.value.refreshInterval
        );
    };

    const stopAutoSend = () => {
        if (moduleState.autoSendInterval) {
            clearInterval(moduleState.autoSendInterval);
            moduleState.autoSendInterval = null;
        }
        moduleState.isAutoSending.value = false;
        moduleState.autoSendCounter.value = 0;
        console.log('[Hello NPM] Auto-send stopped');
    };

    return {
        // State
        config: moduleState.config,
        messageHistory: moduleState.messageHistory,
        isActive: moduleState.isActive,
        isAutoSending: moduleState.isAutoSending,

        // Computed
        currentGreeting,
        messageCount,

        // Methods
        updateConfig,
        sendGreeting,
        clearHistory,
        startAutoSend,
        stopAutoSend,
    };
};
