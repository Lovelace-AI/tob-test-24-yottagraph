# Hello World Module for Aether

This is an example module demonstrating how to create a modular UI feature for the Aether framework.

## Features

- **Dual-mode operation**: Works as both a standalone app and an embeddable widget
- **Module communication**: Uses the module bus to communicate with other modules
- **Authentication integration**: Accesses Aether's authentication state
- **Preference support**: Can store module-specific preferences

## Structure

```
hello-world/
├── index.ts              # Module definition and exports
├── package.json          # NPM package configuration
├── vite.config.ts        # Build configuration
├── pages/
│   └── index.vue         # Standalone page component
├── widgets/
│   └── HelloWorldWidget.vue  # Embeddable widget component
└── components/           # Shared components (if any)
```

## Usage

### As a Standalone App

When running standalone, the module provides a full-page experience:

```typescript
// In your Aether app
import helloWorldModule from '@aether/hello-world-module';

const moduleRegistry = useModuleRegistry();
await moduleRegistry.register(helloWorldModule);

// Module is now available at /modules/hello-world
```

### As an Embedded Widget

The module can also be embedded in other pages:

```vue
<template>
    <HelloWorldWidget title="Custom Title" :height="300" @message="handleMessage" />
</template>

<script setup>
    import { HelloWorldWidget } from '@aether/hello-world-module/widgets';

    function handleMessage(msg) {
        console.log('Widget sent message:', msg);
    }
</script>
```

## Building the Module

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Production Build

```bash
# Build for distribution
npm run build

# This creates:
# - dist/index.js (CommonJS)
# - dist/index.mjs (ES Module)
# - dist/index.d.ts (TypeScript types)
```

### Publishing

```bash
# Publish to npm registry
npm publish

# Or publish to GitHub Packages
npm publish --registry https://npm.pkg.github.com
```

## Module API

### Module Definition

```typescript
export default defineFeatureModule({
  id: 'hello-world',
  name: 'Hello World',
  icon: 'mdi-hand-wave',
  description: 'Example module',

  // Components
  standalone: HelloWorldPage,
  widget: HelloWorldWidget,

  // Routes (for standalone mode)
  routes: [...],

  // Dependencies
  requires: ['useUserState', 'useModuleBus'],
  provides: ['useHelloWorld'],

  // Lifecycle
  onInstall: async () => { ... },
  onUninstall: async () => { ... }
});
```

### Widget Props

```typescript
interface HelloWorldWidgetProps {
    title?: string;
    height?: string | number;
    width?: string | number;
    showActions?: boolean;
    initialMessage?: string;
}
```

### Events

- `@message`: Emitted when the widget sends a message
- `@expand`: Request to expand the widget to full view

## Inter-Module Communication

The module uses Aether's module bus for communication:

```typescript
// Send a message
const bus = useModuleBus('hello-world');
bus.message.send('Hello from my module!');

// Listen for messages
bus.on('module:message', (event) => {
    console.log(`Message from ${event.moduleId}: ${event.data.message}`);
});
```

## Best Practices

1. **Always provide both standalone and widget modes** when possible
2. **Use scoped styles** in widget mode to avoid conflicts
3. **Respect Aether's theme system** by using Vuetify components
4. **Handle authentication states** gracefully
5. **Clean up resources** in the onUninstall hook
6. **Document your module's API** clearly

## Creating Your Own Module

To create a new module based on this example:

1. Copy this directory structure
2. Update the module ID and metadata in `index.ts`
3. Implement your functionality in pages and widgets
4. Update `package.json` with your module details
5. Build and publish your module

## License

MIT
