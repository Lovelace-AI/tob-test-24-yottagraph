# Module Debug Panel

## Overview

The Module Debug Panel provides a comprehensive debugging interface for the Aether module system. It visualizes module registration, event flow, dependencies, and system state in real-time.

## Purpose

This is a **development tool** included to help developers:

- Understand the module system architecture
- Debug inter-module communication
- Visualize event flow between features
- Inspect module dependencies
- Monitor system performance

## Features

### Modules Tab

- List of all registered modules
- Module details (ID, routes, dependencies)
- Real-time status updates
- Module metadata inspection

### Event Flow Tab

- Visual representation of modules as nodes
- Animated event flow between modules
- Event history table
- Color-coded event types
- Real-time event monitoring

### Dependencies Tab

- Module dependency matrix
- "Requires" and "Provides" relationships
- Dependency chain visualization
- Circular dependency detection

### Console Tab

- Debug console output
- System state logging
- Test event broadcasting
- Manual debug actions

## Usage

### Accessing the Debug Panel

The debug panel appears in the sidebar when:

- Running in development mode (`NODE_ENV === 'development'`)
- OR manually enabled via `localStorage.setItem('aether-debug', 'true')`

### Visualizing Event Flow

1. Open the Event Flow tab
2. Send events from any feature (try Event Sender)
3. Watch animated lines show event propagation
4. See event details in the history table

### Inspecting Dependencies

1. Open the Dependencies tab
2. See which modules depend on each other
3. Identify unused provides/requires
4. Check for potential issues

### Using the Console

1. Open the Console tab
2. Click "Log Module State" to dump current state
3. Click "Test Event Broadcast" to send a test event
4. View real-time logs from all modules

## Configuration

The debug panel respects these settings:

- `maxEventHistory`: 100 events (prevents memory issues)
- `eventVisualizationDuration`: 3 seconds
- `autoRefresh`: Toggle real-time updates
- `refreshInterval`: 1 second update rate

## Performance Considerations

- Event visualization is throttled to prevent UI lag
- History is limited to prevent memory growth
- Auto-refresh can be disabled for better performance
- SVG animations use requestAnimationFrame

## Hiding in Production

The debug panel automatically hides in production builds. To ensure it's hidden:

```javascript
// The panel checks this condition:
process.env.NODE_ENV === 'development' || localStorage.getItem('aether-debug') === 'true';
```

To force-hide even in development:

```javascript
localStorage.setItem('aether-debug', 'false');
```

## Removing This Feature

To permanently remove the debug panel:

1. Remove the import and registration from `app.vue`
2. Delete the `features/module-debug` directory

However, consider keeping it during development as it's invaluable for debugging.

## Advanced Usage

### Programmatic Access

```typescript
// Enable debug mode
localStorage.setItem('aether-debug', 'true');

// Log custom debug info
console.log('[YourFeature] Debug info:', data);
```

### Custom Event Visualization

Events are color-coded by type. To add custom colors, modify the `getEventColor` function in the component.

## Tips

1. **Use During Development**: Keep the debug panel active while building features
2. **Monitor Performance**: Watch event rates to identify performance issues
3. **Test Communication**: Use with Event Sender/Receiver to test patterns
4. **Check Dependencies**: Ensure your features properly declare dependencies
5. **Debug Production Issues**: Enable temporarily via localStorage
