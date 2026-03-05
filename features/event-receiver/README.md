# Event Receiver Example Feature

## Overview

This example feature demonstrates the **correct pattern** for receiving and handling events from the Aether event bus. It shows how to capture ALL events from app startup, not just when the UI is visible.

## Key Architecture Pattern

This feature uses **persistent event listening** - events are captured from app startup using the module's `setup()` method:

```typescript
// In index.ts
setup() {
  const { onAll } = useModuleBus('event-receiver-global');
  const globalStore = reactive({
    events: [],
    eventCounts: {},
    isListening: true,
    startTime: new Date()
  });

  // Capture ALL events from app startup
  onAll((eventType, eventData) => {
    const event = {
      id: `${Date.now()}-${Math.random()}`,
      type: eventType,
      data: eventData?.data || eventData,
      timestamp: new Date()
    };

    globalStore.events.unshift(event);
    globalStore.eventCounts[eventType] = (globalStore.eventCounts[eventType] || 0) + 1;

    // Keep only last 1000 events
    if (globalStore.events.length > 1000) {
      globalStore.events.pop();
    }
  });

  window.__eventReceiverGlobalStore = globalStore;
}
```

The Vue component simply displays this persistent store:

```typescript
// In pages/index.vue
const globalStore = (window as any).__eventReceiverGlobalStore;
const receivedEvents = computed(() => globalStore.events);
```

This ensures no events are missed, even if sent before the user opens the receiver UI.

## Purpose

This is an **example feature** included to demonstrate:

- How to implement persistent event listening from app startup
- How to handle events regardless of component lifecycle
- How to create reactive UIs that display accumulated events
- How to show notifications for incoming events
- How to filter and visualize inter-module communication

## Features

- Real-time event monitoring
- Event type filtering
- Expandable event details
- Event statistics (count, rate, types)
- Optional notifications for incoming events
- Event history with virtual scrolling

## Usage

### Basic Usage

1. Navigate to the Event Receiver feature in the sidebar
2. The receiver starts listening automatically
3. Send events from other features (like Event Sender)
4. Watch events appear in real-time

### Filtering Events

- Use the chip filters to show only specific event types
- Click chips to toggle filtering
- Multiple filters can be active simultaneously

### Event Details

- Click "Show Details" on any event to see full JSON data
- Events show source, timestamp, and message
- Color coding by event type for easy identification

## Using Event Listening in Your Features

```typescript
import { useModuleBus } from '~/composables/useModuleBus';

const { on, off } = useModuleBus();

// Listen for specific event
on('entity:selected', (data) => {
    console.log('Entity selected:', data);
});

// Listen for all events
on('*', (eventType, data) => {
    console.log(`Event ${eventType}:`, data);
});

// Clean up listeners on unmount
onUnmounted(() => {
    off('entity:selected');
    off('*');
});
```

## Event Patterns

The receiver demonstrates handling various event patterns:

- Namespaced events (`feature:action`)
- Wildcard listening (`*`)
- Event filtering and processing
- Performance considerations with high-frequency events

## Configuration

- **Listen for events**: Toggle to start/stop listening
- **Show notifications**: Toggle to enable/disable snackbar notifications
- **Max history**: Limited to 100 events to maintain performance

## Removing This Feature

This is an example feature. To remove it:

1. Remove the import and registration from `app.vue`
2. Delete the `features/event-receiver` directory

See [Removing Example Features](../../docs/legacy/REMOVING_EXAMPLE_FEATURES.md) for details.

## Learning from This Example

Key patterns to apply in your own features:

1. **Clean Up Listeners**: Always remove event listeners on unmount
2. **Filter Early**: Process only the events you need
3. **Handle High Frequency**: Consider throttling or debouncing
4. **Namespace Events**: Use clear, namespaced event names
5. **Document Events**: List which events your feature listens for
