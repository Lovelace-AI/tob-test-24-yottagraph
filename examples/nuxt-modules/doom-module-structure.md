# Doom as a Nuxt Module Structure

```
@aether/doom-module/
├── package.json
├── src/
│   ├── module.ts              # Main module definition
│   └── runtime/
│       ├── plugin.client.ts   # js-dos loader (auto-injected)
│       ├── components/
│       │   └── DoomGame.vue   # Auto-registered as <DoomGame />
│       ├── composables/
│       │   └── useDoom.ts     # Auto-imported
│       ├── pages/
│       │   └── doom.vue       # Auto-adds /doom route
│       ├── server/
│       │   └── api/           # Module API endpoints
│       └── public/
│           ├── doom/          # Game assets
│           └── js-dos/        # Library files
└── playground/                # Test Nuxt app
```

## Usage in nuxt.config.ts:

```typescript
export default defineNuxtConfig({
    modules: ['@aether/doom-module'],

    // Module options
    aetherDoom: {
        prefix: 'Doom', // Component prefix
        cdnUrl: 'https://...', // Optional CDN for assets
        enableDebug: true, // Module-specific options
    },
});
```

## What happens when installed:

1. **Build time:**
    - Copies all doom assets to public/
    - Registers components globally
    - Adds routes automatically
    - Injects plugins

2. **Runtime:**
    - js-dos loads automatically
    - Components available everywhere
    - Routes just work
    - Module registry integration

## Benefits for Aether features:

1. **Single npm install** - Everything just works
2. **No manual registration** - Module handles it
3. **Asset management** - Module handles public files
4. **Configuration** - Through nuxt.config.ts
5. **Better DX** - Auto-imports, types, DevTools
