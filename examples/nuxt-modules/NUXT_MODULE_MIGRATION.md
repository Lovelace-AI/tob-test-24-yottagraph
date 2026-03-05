# Migrating from NPM Packages to Nuxt Modules

## Current Approach Problems:

1. Manual registration in `plugins/01.module-registry.client.ts`
2. Users must know to import and register
3. No asset handling (like Doom's files)
4. No automatic route registration
5. No build-time optimizations

## Nuxt Module Benefits:

1. **Just add to modules array** - everything else is automatic
2. **Asset handling built-in** - copies files, serves from CDN, etc.
3. **Build optimization** - tree-shaking, chunking, etc.
4. **DevTools integration** - see your modules in Nuxt DevTools
5. **Runtime config** - users configure in nuxt.config.ts

## Migration Example:

### Before (NPM Package):

```typescript
// User must manually do all this:

// 1. Install
npm install @aether/event-sender

// 2. Register in plugin
import eventSender from '@aether/event-sender'
moduleRegistry.register(eventSender)

// 3. Import CSS if needed
import '@aether/event-sender/style.css'
```

### After (Nuxt Module):

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
    modules: ['@aether/event-sender'], // That's it!
});
```

## Gradual Migration Strategy:

### Phase 1: Dual Support

- Keep existing npm package structure
- Add module.ts that wraps it
- Both approaches work

### Phase 2: Enhanced Modules

- Add build optimizations
- Add asset handling
- Add DevTools support

### Phase 3: Module-Only

- Deprecate manual registration
- Full Nuxt module features
- Better DX

## Module Template Structure:

```
@aether/module-template/
├── package.json
├── src/
│   ├── module.ts          # Nuxt module definition
│   └── runtime/
│       ├── plugin.ts      # Auto-registration
│       ├── feature/       # Your existing feature code
│       │   ├── index.ts
│       │   ├── pages/
│       │   └── composables/
│       └── public/        # Static assets
└── playground/            # Dev environment
```

## For Complex Modules (like Doom):

```typescript
// module.ts
export default defineNuxtModule({
    setup(options, nuxt) {
        // Handle complex assets
        nuxt.hook('nitro:config', (config) => {
            // Copy WASM files
            // Set up CDN paths
            // Configure static serving
        });

        // Add global plugins (like js-dos)
        addPlugin({
            src: resolve('./runtime/js-dos-loader.ts'),
            mode: 'client',
            order: -1, // Load before feature
        });
    },
});
```

## Next Steps:

1. Create a module template
2. Convert one simple feature (event-sender)
3. Convert complex feature (doom)
4. Update documentation
5. Migrate all features
