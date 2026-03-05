# Cesium Globe Module for Aether

A powerful 3D globe visualization module that brings Cesium's capabilities to the Aether framework.

## Features

- 🌍 **Interactive 3D Globe**: Full Cesium viewer with navigation controls
- 📍 **Entity Tracking**: Display and track entities on the globe
- 🎨 **Drawing Tools**: Add points, lines, and polygons
- 🔄 **Module Communication**: Integrates with other Aether modules
- 📱 **Dual Mode**: Works as both standalone app and embeddable widget

## Installation

### As a Aether Module

```typescript
import cesiumGlobeModule from '@aether/features/cesium-globe';
import { useModuleRegistry } from '~/composables/useModuleRegistry';

const registry = useModuleRegistry();
await registry.register(cesiumGlobeModule);
```

### Configuration

Set your Cesium Ion access token in `.env`:

```bash
NUXT_PUBLIC_CESIUM_ACCESS_TOKEN=your_token_here
```

> **Note**: If no token is provided, Cesium's default token works for localhost development only.

## Usage

### Standalone Mode

When registered, the module is available at `/modules/cesium-globe`:

```vue
<template>
    <NuxtLink to="/modules/cesium-globe"> Open 3D Globe </NuxtLink>
</template>
```

### Widget Mode

Embed the globe in your own pages:

```vue
<template>
    <CesiumGlobeWidget
        title="Entity Tracker"
        :height="400"
        :entities="trackedEntities"
        @click="handleGlobeClick"
        @expand="navigateTo('/modules/cesium-globe')"
    />
</template>

<script setup>
    import { CesiumGlobeWidget } from '@aether/features/cesium-globe';

    const trackedEntities = ref([
        {
            id: 'entity-1',
            name: 'Acme Corp HQ',
            longitude: -122.4194,
            latitude: 37.7749,
        },
    ]);

    function handleGlobeClick(position) {
        console.log('Globe clicked at:', position);
    }
</script>
```

### Direct Component Usage

For advanced use cases, use the CesiumViewer component directly:

```vue
<template>
    <CesiumViewer
        ref="viewer"
        @ready="onViewerReady"
        @click="onGlobeClick"
        :initial-view="{
            longitude: -74.006,
            latitude: 40.7128,
            height: 1000000,
        }"
    />
</template>

<script setup>
    import { CesiumViewer } from '@aether/features/cesium-globe';

    const viewer = ref();

    function onViewerReady(cesiumViewer) {
        // Add custom entities
        viewer.value.addEntity({
            name: 'New York',
            position: { longitude: -74.006, latitude: 40.7128 },
            point: { pixelSize: 10, color: 'red' },
        });
    }
</script>
```

## Module Communication

The Cesium Globe module integrates with Aether's module bus:

### Listening to Events

```typescript
// In another module
const bus = useModuleBus('my-module');

// Listen for globe clicks
bus.on('data:shared', (event) => {
    if (event.data.key === 'globe-click') {
        console.log('Globe clicked at:', event.data.value);
    }
});

// Listen for drawing mode changes
bus.on('data:shared', (event) => {
    if (event.data.key === 'drawing-mode') {
        console.log('Drawing mode:', event.data.value);
    }
});
```

### Sending Commands

```typescript
// Tell the globe to focus on an entity
bus.entity.select('entity-123', 'organization', {
    longitude: -122.4194,
    latitude: 37.7749,
});
```

## API Reference

### CesiumViewer Component

#### Props

| Prop            | Type      | Default                                            | Description                        |
| --------------- | --------- | -------------------------------------------------- | ---------------------------------- |
| `containerId`   | `string`  | `'cesiumContainer'`                                | Unique ID for the Cesium container |
| `initialView`   | `object`  | `{ longitude: 0, latitude: 20, height: 15000000 }` | Initial camera position            |
| `showAnimation` | `boolean` | `true`                                             | Show animation controls            |
| `showTimeline`  | `boolean` | `true`                                             | Show timeline controls             |
| `enableDrawing` | `boolean` | `false`                                            | Enable drawing tools               |

#### Events

| Event   | Payload                           | Description                        |
| ------- | --------------------------------- | ---------------------------------- |
| `ready` | `Cesium.Viewer`                   | Emitted when viewer is initialized |
| `click` | `{ longitude, latitude, height }` | Emitted on globe click             |
| `error` | `Error`                           | Emitted on initialization error    |

#### Methods

| Method          | Parameters                       | Description             |
| --------------- | -------------------------------- | ----------------------- |
| `flyTo`         | `(longitude, latitude, height?)` | Fly camera to location  |
| `addEntity`     | `(options)`                      | Add entity to the globe |
| `clearEntities` | `()`                             | Remove all entities     |

### CesiumGlobeWidget Component

#### Props

| Prop               | Type               | Default        | Description           |
| ------------------ | ------------------ | -------------- | --------------------- |
| `title`            | `string`           | `'Globe View'` | Widget title          |
| `height`           | `string \| number` | `300`          | Widget height         |
| `width`            | `string \| number` | `'100%'`       | Widget width          |
| `entities`         | `Array`            | `[]`           | Entities to display   |
| `initialLongitude` | `number`           | `0`            | Initial longitude     |
| `initialLatitude`  | `number`           | `20`           | Initial latitude      |
| `initialHeight`    | `number`           | `20000000`     | Initial camera height |

## Integration with Aether APIs

When combined with Aether's query server integration, use `useElementalService()` for API calls. The composable exposes typed methods (e.g. `getNEID`, `getNamedEntityReport`) and `request(path, options)` for ad-hoc endpoints. Display data on the globe by mapping positions from your API response into `viewer.addEntity()` with `position`, `point`, etc.

## Troubleshooting

### "WebGL not supported" Error

- Ensure hardware acceleration is enabled in your browser
- Try updating your graphics drivers
- Use a modern browser (Chrome, Firefox, Edge)

### Performance Issues

- Reduce entity count by clustering nearby points
- Use lower precision modes for large datasets
- Disable shadows and lighting for better performance

### Cesium Token Issues

- For production, always use your own Cesium Ion token
- Sign up at https://cesium.com/ion/tokens
- The default token only works on localhost

## Future Enhancements

- [ ] Clustering for large entity sets
- [ ] Time-based animation of entity movements
- [ ] Heatmap visualization
- [ ] 3D model support for entities
- [ ] Measurement tools
- [ ] Export screenshots/videos

## Contributing

To enhance this module:

1. Follow Aether's module development guidelines
2. Maintain compatibility with both standalone and widget modes
3. Use the module bus for all external communication
4. Document new features in this README

## License

Part of the Aether UI Framework
