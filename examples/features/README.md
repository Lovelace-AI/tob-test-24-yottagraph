# Aether Module Examples

This directory contains example modules demonstrating how to build modular UI features for the Aether framework.

## Available Examples

### 1. Hello World Module

**Location**: `./hello-world/`

A simple example demonstrating:

- Dual-mode operation (standalone app + embeddable widget)
- Module registration and lifecycle
- Inter-module communication
- Authentication integration

## Module Development Workflow

### 1. Create a New Module

```bash
# Copy the hello-world example as a starting point
cp -r hello-world my-new-module
cd my-new-module

# Update module metadata in index.ts
# Implement your functionality
```

### 2. Test Locally

```typescript
// In your Aether app, load the module directly
import myModule from './examples/modules/my-new-module';

const moduleRegistry = useModuleRegistry();
await moduleRegistry.register(myModule);
```

### 3. Build for Distribution

```bash
cd my-new-module
npm install
npm run build
```

### 4. Publish

```bash
# Publish to npm
npm publish

# Or publish to GitHub Packages
npm publish --registry https://npm.pkg.github.com
```

## Module Architecture

Each module should follow this structure:

```
module-name/
├── index.ts              # Module definition
├── package.json          # NPM package info
├── vite.config.ts        # Build configuration
├── README.md             # Module documentation
├── pages/                # Standalone pages
│   └── index.vue         # Main page
├── widgets/              # Embeddable widgets
│   └── ModuleWidget.vue  # Widget component
├── components/           # Shared components
│   └── SharedComponent.vue
├── composables/          # Module composables
│   └── useModuleLogic.ts
└── assets/               # Module assets
    └── styles.css
```

## Key Concepts

### 1. Dual-Mode Operation

Modules should work in two modes:

- **Standalone**: Full application with routing
- **Widget**: Embeddable component for composition

### 2. Module Registration

```typescript
export default defineFeatureModule({
    id: 'unique-module-id',
    name: 'Display Name',
    icon: 'mdi-icon-name',

    // Components
    standalone: StandalonePage,
    widget: WidgetComponent,

    // Dependencies
    requires: ['useUserState'],
    provides: ['useMyFeature'],
});
```

### 3. Communication

Modules communicate via the module bus:

```typescript
const bus = useModuleBus('my-module');

// Send events
bus.entity.select(entityId, entityType);
bus.filters.change({ keyword: 'search' });

// Listen to events
bus.entity.onSelected((data) => {
    console.log('Entity selected:', data);
});
```

### 4. State Management

- **Local State**: Use Vue's reactive system
- **Shared State**: Use the module bus or shared store
- **Persistent State**: Use Aether's preference system

## Best Practices

1. **Follow Aether Conventions**
    - Use Vuetify components
    - Respect the theme system
    - Handle authentication properly

2. **Module Independence**
    - Modules should be self-contained
    - Declare dependencies explicitly
    - Clean up resources on uninstall

3. **Performance**
    - Lazy load heavy components
    - Use dynamic imports for optional features
    - Minimize bundle size

4. **Documentation**
    - Document all props and events
    - Provide usage examples
    - Include screenshots/demos

## Testing Modules

### Unit Tests

```typescript
// my-module.test.ts
import { mount } from '@vue/test-utils';
import MyWidget from './widgets/MyWidget.vue';

describe('MyWidget', () => {
    it('renders correctly', () => {
        const wrapper = mount(MyWidget, {
            props: { title: 'Test' },
        });
        expect(wrapper.text()).toContain('Test');
    });
});
```

### Integration Tests

Test module registration and communication:

```typescript
// integration.test.ts
import { useModuleRegistry } from '~/composables/useModuleRegistry';
import myModule from './index';

test('module registers correctly', async () => {
    const registry = useModuleRegistry();
    await registry.register(myModule);

    expect(registry.isRegistered('my-module')).toBe(true);
});
```

## Advanced Topics

### Dynamic Module Loading

```typescript
// Load modules at runtime
async function loadModule(moduleUrl: string) {
    const moduleExports = await import(moduleUrl);
    const module = moduleExports.default;

    await moduleRegistry.register(module);
}
```

### Module Federation

For micro-frontend architectures:

```typescript
// webpack.config.js or vite.config.js
{
    plugins: [
        ModuleFederationPlugin({
            name: 'myModule',
            filename: 'remoteEntry.js',
            exposes: {
                './Module': './index.ts',
            },
        }),
    ];
}
```

### Module Marketplace

Future enhancement for discovering and installing modules:

```typescript
// Hypothetical marketplace API
const marketplace = useModuleMarketplace();
const available = await marketplace.search('maps');

for (const module of available) {
    console.log(`${module.name} - ${module.downloads} downloads`);
}
```

## Contributing

To contribute a new example module:

1. Create a new directory under `examples/modules/`
2. Follow the module structure outlined above
3. Include comprehensive documentation
4. Add your module to this README
5. Submit a pull request

## Resources

- [Aether Documentation](../../docs/MODULAR_UI_ARCHITECTURE.md)
- [Vue 3 Documentation](https://vuejs.org/)
- [Vuetify Documentation](https://vuetifyjs.com/)
- [Nuxt Modules](https://nuxt.com/modules)
