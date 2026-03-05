/**
 * Module Registry Plugin
 *
 * This plugin ensures that all modules are registered before the app routes are resolved.
 * It supports both built-in modules and NPM modules loaded via configuration.
 *
 * The "01" prefix ensures this runs before other plugins.
 */

import { defineNuxtPlugin } from '#app';
import { useModuleRegistry, type FeatureModule } from '~/composables/useModuleRegistry';
import { useModuleLoader } from '~/composables/useModuleLoader';
import { initializeModuleApi } from '~/composables/useModuleApi';

// Import all built-in feature modules
import eventSender from '~/features/event-sender';
import eventReceiver from '~/features/event-receiver';
import moduleDebug from '~/features/module-debug';
import cesiumGlobe from '~/features/cesium-globe';
import entityLookup from '~/features/entity-lookup';

export default defineNuxtPlugin(async () => {
    // Initialize the module API first, before any modules load
    initializeModuleApi();
    console.log('[Module Registry Plugin] Module API initialized');

    // Get the module registry
    const moduleRegistry = useModuleRegistry();

    // Register all built-in modules immediately
    // This happens before routing, ensuring modules are available for direct navigation
    // Order matters: modules with setup() methods will run in registration order
    moduleRegistry.register(cesiumGlobe);
    moduleRegistry.register(eventSender);
    moduleRegistry.register(eventReceiver);
    moduleRegistry.register(moduleDebug);
    moduleRegistry.register(entityLookup);

    console.log(
        '[Module Registry Plugin] Registered built-in modules:',
        moduleRegistry.getAllModules().map((m: FeatureModule) => m.id)
    );

    // Load NPM modules if configured
    // This is non-blocking to avoid delaying app startup
    const moduleLoader = useModuleLoader({ autoLoad: false });

    // Load external modules asynchronously
    moduleLoader
        .loadAllModules()
        .then(() => {
            const npmModules = Array.from(moduleLoader.loadedModules.value.values());
            if (npmModules.length > 0) {
                console.log(
                    '[Module Registry Plugin] Loaded NPM modules:',
                    npmModules.map((m: FeatureModule) => m.id)
                );
            }
        })
        .catch((error) => {
            console.error('[Module Registry Plugin] Failed to load NPM modules:', error);
        });
});
