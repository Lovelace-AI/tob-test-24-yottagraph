# Nuxt Modules - Technical FAQ

## Architecture Questions

### Q: How do Nuxt modules work with our existing module registry?

**A:** Nuxt modules can auto-register with your existing system. The module includes a plugin that calls `moduleRegistry.register()` automatically:

```typescript
// Inside the Nuxt module
export default defineNuxtModule({
    setup() {
        addPlugin({
            src: './plugin.ts',
            mode: 'client',
        });
    },
});

// plugin.ts
export default defineNuxtPlugin(() => {
    const moduleRegistry = useModuleRegistry();
    moduleRegistry.register(featureDefinition);
});
```

### Q: Can modules still have routes, navigation, and lifecycle hooks?

**A:** Yes! The exact same feature definition works:

```typescript
// Same feature definition
const featureDefinition = {
    id: 'my-feature',
    name: 'My Feature',
    routes: [{ path: '/my-feature', component: () => import('./page.vue') }],
    navigation: { title: 'My Feature', order: 10 },
    setup() {
        /* runs at app startup */
    },
    onInstall() {
        /* runs when installed */
    },
};
```

### Q: What about module dependencies and load order?

**A:** Nuxt modules load in the order specified in the `modules` array:

```typescript
modules: [
    '@your-org/cesium-globe', // Loads first
    '@your-org/event-sender', // Can depend on cesium
    '@your-org/doom', // Loads last
];
```

## Migration Questions

### Q: Do we need to rewrite our existing modules?

**A:** No. You wrap existing code in a Nuxt module structure. The core feature code remains unchanged.

### Q: Can both systems work at the same time?

**A:** Yes! Modules can be registered both ways during migration:

```typescript
// Old way still works
import eventSender from '~/features/event-sender';
moduleRegistry.register(eventSender);

// New way works too
modules: ['@your-org/event-sender'];
```

### Q: What about our helper scripts?

**A:** They become unnecessary. Adding a module is now just editing one line in `nuxt.config.ts`.

## Package Management Questions

### Q: How do we publish to GitHub Package Registry?

**A:** Exactly the same way:

```json
{
    "name": "@your-org/my-module",
    "publishConfig": {
        "registry": "https://npm.pkg.github.com"
    }
}
```

```bash
npm publish
```

### Q: What about versioning?

**A:** Same semantic versioning. Nuxt modules are just npm packages:

```bash
npm install @your-org/my-module@^2.0.0
```

### Q: Can we have a monorepo for all modules?

**A:** Yes! Many organizations do this:

```
aether-modules/
├── modules/
│   ├── event-sender/
│   ├── doom/
│   └── entity-lookup/
└── package.json (workspaces)
```

## Technical Implementation Questions

### Q: How do we handle static assets (like Doom's WASM files)?

**A:** Nuxt modules can copy assets during build:

```typescript
export default defineNuxtModule({
    setup(options, nuxt) {
        nuxt.hook('nitro:config', (config) => {
            config.publicAssets.push({
                baseURL: '/doom',
                dir: resolver.resolve('./public/doom'),
            });
        });
    },
});
```

### Q: What about global plugins (like js-dos)?

**A:** Modules can inject plugins with specific load order:

```typescript
addPlugin({
    src: './js-dos-loader.ts',
    mode: 'client',
    order: -1, // Load before other plugins
});
```

### Q: How do we handle configuration?

**A:** Through `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
    modules: ['@your-org/weather'],

    // Module-specific config
    weather: {
        apiKey: process.env.WEATHER_API_KEY,
        refreshInterval: 30000,
    },
});
```

### Q: What about TypeScript types?

**A:** Nuxt modules can provide auto-imported types:

```typescript
// Module provides types
declare module '#app' {
    interface NuxtApp {
        $weather: WeatherService;
    }
}

// Auto-imported in your app!
const { $weather } = useNuxtApp();
```

## Performance Questions

### Q: Will this affect build times?

**A:** It should improve them:

- Better tree-shaking (unused modules not bundled)
- Optimized chunk splitting
- Parallel processing during build

### Q: What about runtime performance?

**A:** No change. The same code runs, just loaded differently.

### Q: Do all modules get loaded even if not used?

**A:** No. Only modules in the `modules` array are loaded. With current approach, all imports are bundled even if disabled.

## Debugging Questions

### Q: How do we debug module loading?

**A:** Nuxt DevTools shows:

- Loaded modules
- Load timing
- Module configuration
- Injected plugins

### Q: What if a module fails to load?

**A:** Clear error messages:

```
ERROR: Failed to load module '@your-org/weather'
       Module not found: @your-org/weather
```

## Edge Cases

### Q: Conditional module loading?

**A:** Supported:

```typescript
modules: [...(process.env.ENABLE_DOOM ? ['@your-org/doom'] : [])];
```

### Q: Local development of modules?

**A:** Use npm link or local paths:

```typescript
modules: ['../my-local-module', '@your-org/published-module'];
```

### Q: Module conflicts?

**A:** Modules are isolated. Each has its own scope.

---

**Still have questions?** The Nuxt team has excellent documentation at nuxt.com/docs/guide/going-further/modules
