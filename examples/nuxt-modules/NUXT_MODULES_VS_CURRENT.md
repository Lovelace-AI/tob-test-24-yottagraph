# Nuxt Modules vs Current Approach - The 4 Places Problem

## Current Approach: 4 Manual Steps 😫

When you add a new module today, you need to:

### 1. Add to package.json

```json
{
    "dependencies": {
        "@your-org/event-sender": "^1.0.0" // ✏️ Add here
    }
}
```

### 2. Import in plugin file

```typescript
// plugins/01.module-registry.client.ts
import eventSender from '~/features/event-sender'; // ✏️ Add import
// OR for npm:
import eventSender from '@your-org/event-sender'; // ✏️ Add import
```

### 3. Register in plugin

```typescript
// plugins/01.module-registry.client.ts
moduleRegistry.register(eventSender); // ✏️ Add registration
```

### 4. Configure NPM modules (if external)

```json
// public/aether.modules.json
{
    "modules": [
        {
            "name": "@your-org/event-sender", // ✏️ Add config
            "enabled": true
        }
    ]
}
```

### Plus: Remember the order matters!

```typescript
// Modules with setup() run in registration order
moduleRegistry.register(cesiumGlobe); // Must be first if others depend on it
moduleRegistry.register(eventSender); // Order matters!
```

## Nuxt Module Approach: 1 Step! 🚀

### Just add to nuxt.config.ts:

```typescript
export default defineNuxtConfig({
    modules: [
        '@your-org/cesium-globe', // ✅ Auto-registered first
        '@your-org/event-sender', // ✅ Auto-registered second
        '@your-org/event-receiver', // ✅ Order preserved
        '@your-org/doom', // ✅ That's it!
    ],
});
```

## What Happens Automatically:

1. **Install**: `npm install` reads from nuxt.config
2. **Import**: Module loader handles it
3. **Register**: Module's plugin auto-registers
4. **Configure**: Via nuxt.config options
5. **Order**: Preserved from modules array
6. **Types**: Auto-generated
7. **Dev Tools**: Shows in Nuxt DevTools

## Your Script Becomes Unnecessary!

### Current Script (probably does):

```bash
#!/bin/bash
MODULE_NAME=$1
NPM_NAME=$2

# Add to package.json
npm install $NPM_NAME

# Add import to plugin
sed -i '' "s/^export default/import $MODULE_NAME from '$NPM_NAME';\n\nexport default/" plugins/01.module-registry.client.ts

# Add registration
sed -i '' "s/moduleRegistry.register(doom);/moduleRegistry.register(doom);\n  moduleRegistry.register($MODULE_NAME);/" plugins/01.module-registry.client.ts

# Update aether.modules.json
jq ".modules += [{\"name\": \"$NPM_NAME\", \"enabled\": true}]" public/aether.modules.json

echo "Module $MODULE_NAME added in 4 places!"
```

### With Nuxt Modules:

```bash
#!/bin/bash
# Not needed - just add to modules array in nuxt.config.ts!
# Or if you really want a script:

MODULE_NAME=$1
echo "Add this to your nuxt.config.ts modules array:"
echo "  '$MODULE_NAME',"
```

## Real Example: Adding Event Sender

### Current Process:

1. `npm install @your-org/event-sender`
2. Edit `plugins/01.module-registry.client.ts`:
    ```typescript
    import eventSender from '@your-org/event-sender';
    // ...
    moduleRegistry.register(eventSender);
    ```
3. Edit `public/aether.modules.json`:
    ```json
    {
        "modules": [
            {
                "name": "@your-org/event-sender",
                "enabled": true
            }
        ]
    }
    ```
4. Restart dev server
5. Hope you didn't miss anything

### Nuxt Module Process:

1. Add to `nuxt.config.ts`:
    ```typescript
    modules: ['@your-org/event-sender'];
    ```
2. That's it. Seriously.

## Benefits Beyond Simplicity:

### Tree Shaking

- Current: All modules imported even if disabled
- Nuxt Modules: Only active modules are bundled

### Build Optimization

- Current: No build-time optimization
- Nuxt Modules: Optimized chunks, better caching

### Development Experience

- Current: Edit 4 files, restart, debug
- Nuxt Modules: HMR, DevTools integration

### Type Safety

- Current: Manual type imports
- Nuxt Modules: Auto-generated types

## Migration Path:

1. **Keep current system working**
2. **Add Nuxt module wrappers**
3. **Both work simultaneously**
4. **Gradually migrate**
5. **Remove old system**

No breaking changes, just better DX! 🎉
