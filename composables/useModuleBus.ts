import mitt from 'mitt';

/**
 * Module Event Bus for Inter-Feature Communication
 *
 * For comprehensive documentation and patterns, see:
 * - docs/EVENT_BUS_GUIDE.md - Complete guide with examples
 * - features/event-receiver/ - Working implementation example
 *
 * Key Pattern: For persistent event handling, use module setup() method,
 * not component lifecycle hooks. This ensures events are captured from app startup.
 */

export interface ModuleEvent<T = any> {
    moduleId: string;
    timestamp: number;
    data: T;
}

export interface ModuleEvents {
    'entity:selected': ModuleEvent<{ entityId: string; entityType: string; metadata?: any }>;
    'filter:changed': ModuleEvent<{ filters: Record<string, any> }>;
    'data:shared': ModuleEvent<{ key: string; value: any }>;
    'module:message': ModuleEvent<{ targetModuleId?: string; message: string; payload?: any }>;
    'state:synced': ModuleEvent<{ state: Record<string, any> }>;
    // Allow custom events with string keys
    [key: string]: ModuleEvent<any>;
}

// Create a global event bus instance
const globalBus = mitt<Record<string, any>>();

// Wildcard listener support - global setup
const allHandlers = new Set<(eventType: string, data: any) => void>();
const originalEmit = globalBus.emit.bind(globalBus);

// Override emit to notify all handlers
(globalBus as any).emit = (type: any, evt: any) => {
    // Call original emit
    originalEmit(type, evt);

    // Notify all wildcard handlers
    if (typeof type === 'string') {
        allHandlers.forEach((handler) => {
            try {
                handler(type, evt);
            } catch (err) {
                console.error('[ModuleBus] Error in wildcard handler:', err);
            }
        });
    }
};

export const useModuleBus = (moduleId?: string) => {
    // Helper to create event with module context
    const createEvent = <K extends keyof ModuleEvents>(
        data: ModuleEvents[K]['data']
    ): ModuleEvents[K] => {
        return {
            moduleId: moduleId || 'core',
            timestamp: Date.now(),
            data,
        } as ModuleEvents[K];
    };

    // Type-safe emit function
    const emit = <K extends keyof ModuleEvents>(
        event: K,
        data: K extends keyof Omit<ModuleEvents, string | number | symbol>
            ? ModuleEvents[K]['data']
            : any
    ) => {
        const eventData = createEvent(data);
        globalBus.emit(event as string, eventData);
    };

    // Type-safe on function with optional filtering
    const on = <K extends keyof ModuleEvents>(
        event: K,
        handler: (payload: ModuleEvents[K]) => void,
        options?: {
            fromModule?: string; // Only listen to events from specific module
            excludeSelf?: boolean; // Don't listen to own events
        }
    ) => {
        const wrappedHandler = (payload: ModuleEvents[K]) => {
            // Filter by source module if specified
            if (options?.fromModule && payload.moduleId !== options.fromModule) {
                return;
            }

            // Exclude self if specified
            if (options?.excludeSelf && payload.moduleId === moduleId) {
                return;
            }

            handler(payload);
        };

        globalBus.on(event as string, wrappedHandler);

        // Return unsubscribe function
        return () => globalBus.off(event as string, wrappedHandler);
    };

    // Convenience methods for common patterns
    const entity = {
        select: (entityId: string, entityType: string, metadata?: any) => {
            emit('entity:selected', { entityId, entityType, metadata });
        },

        onSelected: (
            handler: (data: { entityId: string; entityType: string; metadata?: any }) => void,
            options?: { fromModule?: string; excludeSelf?: boolean }
        ) => {
            return on('entity:selected', (event) => handler(event.data), options);
        },
    };

    const filters = {
        change: (filters: Record<string, any>) => {
            emit('filter:changed', { filters });
        },

        onChange: (
            handler: (filters: Record<string, any>) => void,
            options?: { fromModule?: string; excludeSelf?: boolean }
        ) => {
            return on('filter:changed', (event) => handler(event.data.filters), options);
        },
    };

    const message = {
        send: (message: string, payload?: any, targetModuleId?: string) => {
            emit('module:message', { targetModuleId, message, payload });
        },

        onReceive: (
            handler: (data: { message: string; payload?: any; fromModule: string }) => void,
            options?: { fromModule?: string }
        ) => {
            return on(
                'module:message',
                (event) => {
                    // Filter by target module if this module has an ID
                    if (event.data.targetModuleId && event.data.targetModuleId !== moduleId) {
                        return;
                    }

                    handler({
                        message: event.data.message,
                        payload: event.data.payload,
                        fromModule: event.moduleId,
                    });
                },
                options
            );
        },
    };

    // Wildcard listener support
    const onAll = (handler: (eventType: string, data: any) => void) => {
        allHandlers.add(handler);

        return () => {
            allHandlers.delete(handler);
        };
    };

    return {
        emit,
        on,
        off: globalBus.off,
        all: globalBus.all,
        onAll,

        // Convenience APIs
        entity,
        filters,
        message,
    };
};

// Export types for module developers
export type ModuleBus = ReturnType<typeof useModuleBus>;
