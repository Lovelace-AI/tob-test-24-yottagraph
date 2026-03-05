# Hello NPM - Aether Module Example

This is an example Aether module that demonstrates how to package features as standalone NPM modules.

## Features

- ✅ **NPM Packaging**: Can be published and installed via npm
- ✅ **Dual Mode**: Works as both standalone page and embeddable widget
- ✅ **TypeScript**: Full type safety and IDE support
- ✅ **Configuration**: Supports runtime configuration
- ✅ **Composables**: Exports reusable logic
- ✅ **Lifecycle Hooks**: Setup, install, and uninstall hooks

## Installation

```bash
npm install @aether-example/hello-npm
```

## Configuration

Add to your `aether.modules.json`:

```json
{
    "modules": [
        {
            "name": "@aether-example/hello-npm",
            "enabled": true,
            "config": {
                "greeting": "Custom greeting!",
                "showTimestamp": true,
                "refreshInterval": 5000
            }
        }
    ]
}
```

## Usage

### As a Widget

```vue
<template>
    <HelloWidget title="My Widget" :height="400" @message="onMessage" />
</template>

<script setup>
    import { HelloWidget } from '@aether-example/hello-npm';

    const onMessage = (data) => {
        console.log('Widget sent:', data);
    };
</script>
```

### Using the Composable

```typescript
import { useHelloNpm } from '@aether-example/hello-npm';

const { currentGreeting, sendGreeting, updateConfig } = useHelloNpm();

// Send a greeting
sendGreeting('Hello World!');

// Update configuration
updateConfig({ showTimestamp: false });
```

## Development

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd hello-npm

# Install dependencies
npm install
```

### Build

```bash
# Build for production
npm run build

# Watch mode for development
npm run dev
```

### Testing Locally

Use npm link for local development:

```bash
# In this module directory
npm link

# In your Aether app
npm link @aether-example/hello-npm
```

## Module Structure

```
hello-npm/
├── src/
│   ├── index.ts          # Module definition & exports
│   ├── types.ts          # TypeScript types
│   ├── pages/            # Standalone pages
│   ├── widgets/          # Embeddable widgets
│   └── composables/      # Reusable logic
├── dist/                 # Built output
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## API Reference

### Module Definition

```typescript
export default defineFeatureModule({
    id: 'hello-npm',
    name: 'Hello NPM',
    icon: 'mdi-npm',
    // ... module configuration
});
```

### Composable: useHelloNpm

```typescript
const {
  // State
  config: Ref<HelloNpmConfig>,
  messageHistory: Ref<Array<{ message: string; timestamp: Date }>>,

  // Computed
  currentGreeting: ComputedRef<string>,
  messageCount: ComputedRef<number>,

  // Methods
  updateConfig: (config: Partial<HelloNpmConfig>) => void,
  sendGreeting: (message?: string) => { message: string; timestamp: Date },
  clearHistory: () => void
} = useHelloNpm();
```

### Widget Props

```typescript
interface HelloWidgetProps {
    title?: string;
    icon?: string;
    height?: string | number;
    width?: string | number;
    showActions?: boolean;
    initialMessage?: string;
}
```

### Events

- `@message`: Emitted when a greeting is sent
- `@expand`: Request to expand widget to full view

## Publishing

1. Update version in `package.json`
2. Build the module: `npm run build`
3. Publish to NPM: `npm publish`

## License

MIT
