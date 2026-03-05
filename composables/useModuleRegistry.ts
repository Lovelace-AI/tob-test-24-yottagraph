import { reactive, markRaw, type Component } from 'vue';

export interface RouteRecord {
    path: string;
    component?: Component | (() => Promise<Component>);
    name?: string;
    meta?: Record<string, any>;
    children?: RouteRecord[];
}

export interface FeatureModule {
    id: string;
    name: string;
    icon: string;
    description?: string;
    standalone?: Component;
    widget?: Component;
    routes?: RouteRecord[];
    navigation?: {
        title?: string;
        order?: number;
        show?: () => boolean;
    };
    requires?: string[];
    provides?: string[];
    config?: Record<string, any>;
    setup?: () => void | Promise<void>;
    onInstall?: () => void | Promise<void>;
    onUninstall?: () => void | Promise<void>;
}

export interface ModuleRegistry {
    modules: Map<string, FeatureModule>;
    register(module: FeatureModule): void;
    unregister(moduleId: string): Promise<void>;
    getModule(moduleId: string): FeatureModule | undefined;
    getAllModules(): FeatureModule[];
    isRegistered(moduleId: string): boolean;
}

let globalRegistry: ModuleRegistry | null = null;

export const useModuleRegistry = (): ModuleRegistry => {
    if (!globalRegistry) {
        const modules = reactive(new Map<string, FeatureModule>());
        globalRegistry = {
            modules,
            register(module: FeatureModule) {
                if (modules.has(module.id)) {
                    console.warn(`Module ${module.id} is already registered`);
                    return;
                }
                const moduleToStore: FeatureModule = {
                    ...module,
                    standalone: module.standalone ? markRaw(module.standalone) : undefined,
                    widget: module.widget ? markRaw(module.widget) : undefined,
                    routes: module.routes?.map((route) => ({
                        ...route,
                        component: route.component ? markRaw(route.component) : undefined,
                    })),
                };
                modules.set(module.id, moduleToStore);
                if (module.setup) module.setup();
                if (module.onInstall) module.onInstall();
                console.log(`[Module Registry] Registered module: ${module.id}`);
            },
            async unregister(moduleId: string) {
                const module = modules.get(moduleId);
                if (!module) {
                    console.warn(`Module ${moduleId} not found`);
                    return;
                }
                if (module.onUninstall) await module.onUninstall();
                modules.delete(moduleId);
                console.log(`Module ${moduleId} unregistered successfully`);
            },
            getModule(moduleId: string) {
                return modules.get(moduleId);
            },
            getAllModules() {
                return Array.from(modules.values());
            },
            isRegistered(moduleId: string) {
                return modules.has(moduleId);
            },
        };
    }
    return globalRegistry;
};

export const defineFeatureModule = (module: FeatureModule): FeatureModule => {
    return module;
};
