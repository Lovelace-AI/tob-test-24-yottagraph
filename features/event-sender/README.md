# Event Sender Feature

## Overview

The Event Sender is an example feature that demonstrates how to send events on the Aether event bus for inter-module communication. It shows the CORRECT pattern for maintaining persistent state across navigation.

## Architecture Pattern

This feature demonstrates the proper way to maintain persistent event history:

1. **Global Store Pattern**: The feature creates a global reactive store in the `setup()` method that runs at app startup
2. **Persistent History**: Sent events are stored in this global store, which survives component unmount/remount
3. **Component as UI**: The Vue component is just a UI layer that interacts with the persistent store

## Key Components

### Module Definition (`index.ts`)

The module's `setup()` method creates a global reactive store:

```typescript
setup() {
  const globalStore = reactive({
    sentEvents: [],      // History of sent events
    eventCounts: {},     // Count per event type
    totalSent: 0,        // Total events sent
    startTime: new Date()
  });

  // Expose globally for component access
  (window as any).__eventSenderGlobalStore = globalStore;
}
```

### Component (`pages/index.vue`)

The component:

- Accesses the global store on mount
- Uses `computed()` to reactively display sent events
- Updates the global store when sending events
- Properly cleans up intervals on unmount

## Usage

1. Navigate to the Event Sender feature
2. Enter a message and select an event type
3. Click "Send Event" to broadcast
4. Navigate away and back - your event history persists!
5. Try auto-send mode for continuous events

## Event Types

- `demo:message` - General message events
- `demo:alert` - Alert-style events
- `demo:data-update` - Data update notifications
- `entity:selected` - Entity selection events
- `filter:changed` - Filter change events

## Best Practices

1. **Always use global stores** for data that needs to persist across navigation
2. **Clean up resources** (like intervals) in `onUnmounted`
3. **Use computed properties** to reactively access global store data
4. **Limit stored history** to prevent memory issues (default: 50 events)

## For AI Agents

When implementing features that need persistent state:

1. Create a global store in the module's `setup()` method
2. Never rely on component-local state for important data
3. Follow this pattern for consistent behavior across features
4. Document your state management approach clearly
