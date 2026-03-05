# Feature Template

<!-- TODO: Replace with your feature name and description -->

## Overview

Brief description of what this feature does and its primary use case.

## Features

<!-- TODO: List the key features/capabilities -->

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Usage

### Basic Usage

```typescript
// How to use this feature in a Aether app
import featureTemplate from '@yourorg/feature-template';

const { register } = useModuleRegistry();
register(featureTemplate);
```

### Advanced Configuration

```typescript
// If your feature has configuration options
const config = {
    // Configuration options
};

register(featureTemplate, config);
```

## Dependencies

### Required Aether Features

<!-- TODO: List features this depends on -->

- `useElementalService` - For API calls (orval-generated client)
- `useCesiumViewer` - For map visualization (if applicable)

### Query Server APIs

<!-- TODO: Specify which APIs are used -->

- Single **Query Server** (via `useElementalService()`)
    - Entity search: `getNEID`, `getNamedEntityReport`
    - Sentiment: `getNamedEntitySentiment`
    - Other endpoints: `request(path, options)` for ad-hoc calls

### External Dependencies

<!-- TODO: List any npm packages required -->

- None

## Configuration

### Environment Variables

<!-- TODO: Document any required env vars -->

```env
# If your feature needs specific configuration
NUXT_PUBLIC_FEATURE_SETTING=value
```

### Feature Options

<!-- TODO: Document configuration options -->

```typescript
interface FeatureConfig {
    // Document your config interface
    refreshInterval?: number;
    defaultView?: 'grid' | 'list' | 'map';
}
```

## API Reference

### Composables

#### `useFeatureTemplate()`

<!-- TODO: Document your main composable -->

```typescript
const { data, loading, error, refresh } = useFeatureTemplate();
```

**Returns:**

- `data` - The feature's data
- `loading` - Loading state
- `error` - Error state
- `refresh()` - Function to refresh data

### Components

#### `<FeatureComponent />`

<!-- TODO: Document exported components -->

```vue
<FeatureComponent :prop1="value" @event="handler" />
```

**Props:**

- `prop1` - Description

**Events:**

- `event` - Emitted when...

## Examples

### Example 1: Basic Implementation

<!-- TODO: Provide real examples -->

```vue
<template>
    <div>
        <FeatureTemplate />
    </div>
</template>

<script setup>
    import { FeatureTemplate } from '@yourorg/feature-template';
</script>
```

### Example 2: With Configuration

```vue
<template>
    <div>
        <FeatureTemplate :config="config" />
    </div>
</template>

<script setup>
    const config = {
        refreshInterval: 5000,
    };
</script>
```

## Development

### Project Structure

```
feature-template/
├── index.ts           # Feature definition
├── pages/            # Feature pages
├── components/       # Vue components
├── composables/      # Business logic
├── types/           # TypeScript types
└── README.md        # This file
```

### Testing

<!-- TODO: Add testing instructions -->

### Building for Distribution

1. Copy feature to separate repository
2. Add `package.json`:

```json
{
    "name": "@yourorg/feature-template",
    "version": "1.0.0",
    "main": "index.ts",
    "peerDependencies": {
        "vue": "^3.0.0",
        "nuxt": "^3.0.0"
    }
}
```

3. Publish: `npm publish`

## Troubleshooting

### Common Issues

#### Issue 1: Feature not appearing in navigation

- Ensure the feature is registered in `app.vue`
- Check that navigation config is correct in `index.ts`

#### Issue 2: API calls failing

- Verify Query Server address in `.env`
- Check authentication is working

## Contributing

<!-- TODO: Add contribution guidelines if open source -->

## License

<!-- TODO: Add license information -->
