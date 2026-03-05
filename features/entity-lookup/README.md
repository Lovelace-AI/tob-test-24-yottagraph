# Entity Lookup Feature

This feature allows users to search for Named Entity IDs (NEIDs) by entity name using the News API.

**This is an exemplar feature** that demonstrates best practices for the Aether template repository.

## Overview

The Entity Lookup feature uses the orval-generated client via `useElementalService`:

- Searching for entities by name (e.g., "Elon Musk", "Boeing", "Microsoft")
- Displaying the resulting NEIDs with their associated names
- Allowing users to copy NEIDs to clipboard
- Providing quick access to view full entity reports

## Usage

1. Navigate to the Entity Lookup page from the sidebar
2. Enter an entity name in the search field
3. Press Enter or click the search icon
4. View the results showing NEIDs and entity names
5. Click the copy button to copy a NEID
6. Click the document icon to view the full entity report

## API Endpoints Used

- `GET /entities/lookup` - Search for NEIDs by entity name
    - Parameters:
        - `entityName`: The name to search for
        - `maxResults`: Maximum number of results to return
        - `includeNames`: Whether to include entity names in response
- `GET /reports/{neid}` - Get full report for a specific NEID

## Technical Implementation

This feature demonstrates best practices for building Aether features:

### 1. API Integration

- Using the `useElementalService` composable (orval-generated client)
- Type-safe API calls with generated types from orval
- No dependency on brittle wrapper methods
- Direct use of API endpoints as defined in the spec

### 2. Error Handling

- Consistent error handling with `apiErrorHandler` utility
- User-friendly error messages
- Both inline alerts and snackbar notifications

### 3. User Feedback

- Loading states during API calls
- Success notifications for actions (copy to clipboard)
- Error notifications for failures
- Empty states with clear messaging

### 4. Type Safety

- Proper TypeScript types throughout (no `any` types)
- Imported types from generated API client
- Type-safe API responses

### 5. UI Patterns

- Follows Aether UI conventions (FeatureHeader, Vuetify components)
- Responsive layout with proper spacing
- Interactive elements with tooltips
- Modal dialogs for detailed views

### 6. Code Organization

- Clear separation of concerns
- Well-documented code with examples
- Reusable patterns that can be copied to other features

## Example Code

```typescript
import { useElementalService } from '~/composables/useElementalService';
import type { GetNEIDResponse, GetNEIDParams } from '~/composables/useElementalService';

const { getNEID, getNamedEntityReport } = useElementalService();

const params: GetNEIDParams = {
    entityName: 'Elon Musk',
    maxResults: 10,
    includeNames: true,
};

const results = await query<GetNEIDResponse>('/entities/lookup', {
    query: params,
});
```

## Dependencies

- `useElementalService` - For making authenticated API calls (generated from OpenAPI spec)
- `useNotification` - For user feedback via snackbars
- `apiErrorHandler` - For consistent error handling
- Generated types from orval for type safety

## Related Documentation

- [Query Server Usage Guide](../../docs/QUERY_SERVER_USAGE_GUIDE.md)
- [API Endpoint Discovery Guide](../../docs/API_ENDPOINT_DISCOVERY.md)
- [Query Server Proxy Pattern](../../docs/QUERY_SERVER_PROXY_PATTERN.md)
