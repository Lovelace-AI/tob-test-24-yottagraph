import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

// Copy of FeatureModule interface to avoid circular dependencies
export interface FeatureModule {
    id: string;
    name: string;
    icon: string;
    description?: string;

    // Component modes
    standalone?: Component;
    widget?: Component;

    // Route definitions
    routes?: RouteRecordRaw[];

    // Navigation settings
    navigation?: {
        title?: string;
        order?: number;
        show?: () => boolean;
    };

    // Module dependencies
    requires?: string[];
    provides?: string[];

    // Module configuration
    config?: Record<string, any>;

    // Module lifecycle hooks
    setup?: () => void | Promise<void>;
    onInstall?: () => void | Promise<void>;
    onUninstall?: () => void | Promise<void>;
}

// Module-specific configuration
export interface HelloNpmConfig {
    greeting: string;
    showTimestamp: boolean;
    refreshInterval: number;
}

// Event types for this module
export interface HelloNpmEvent {
    type: 'greeting-sent' | 'config-changed';
    data: {
        message: string;
        timestamp?: Date;
        config?: Partial<HelloNpmConfig>;
    };
}
