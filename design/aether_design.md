# Aether - Design Document

> **Important**: This is the design document for the Aether TEMPLATE. Only use it when make changes to the template - do not use it for apps created from that template.

> 📝 **Important**: This is a living document that captures the project's vision, decisions, and progress. AI agents and developers should keep this updated as the project evolves.

## Project Overview

**Created:** 2024  
**Type:** AI-Ready UI Template for Lovelace Applications  
**Framework:** Nuxt 3 + Vue 3 + Vuetify 3 + Electron

### Vision

Aether is a production-ready UI starter template designed to enable both human developers and AI agents to quickly build professional Lovelace AI applications. It combines enterprise-grade authentication, preferences management, and a modular architecture with comprehensive API documentation optimized for AI comprehension.

### Primary Goals

1. **AI-First Development**: Enable AI agents to understand and build features quickly
2. **Production Ready**: Include authentication, preferences, and deployment configs out of the box
3. **Modular Architecture**: Support pluggable feature modules that can be shared across projects
4. **Dual Platform**: Work seamlessly as both web and desktop (Electron) applications
5. **Beautiful UI**: Provide a professional, branded interface using Vuetify

### Target Users

- **AI Agents**: Claude, Cursor, and other AI assistants building applications
- **Product Managers**: Quickly prototype features without waiting for engineering
- **Developers**: Skip boilerplate and focus on building features
- **Non-Technical Users**: Use the template to create functional apps with AI assistance

## Technical Architecture

### Core Stack

- **Framework**: Nuxt 3 (configured as SPA)
- **UI Library**: Vuetify 3 (Material Design)
- **Language**: TypeScript
- **Desktop**: Electron
- **Authentication**: Auth0
- **Preferences**: Firebase Firestore
- **3D Globe**: Cesium
- **API Client**: Orval (OpenAPI → TypeScript)

### Key Features

- [x] Auth0 authentication with session management
- [x] Firebase preferences with real-time sync
- [x] Electron desktop app support
- [x] Query server configuration
- [x] Cesium globe integration
- [x] Lovelace Brand R2 theming (single dark theme)
- [x] Modular navigation panel
- [x] Generated TypeScript API clients

### Module System

The app supports pluggable feature modules:

```typescript
// features/entity-monitor/index.ts
export default defineFeatureModule({
  id: 'entity-monitor',
  name: 'Entity Monitor',
  icon: 'mdi-database-search',
  routes: [...],
  widgets: [...]
});
```

## Key Design Decisions

### Decision Log

| Date       | Decision                                 | Rationale                                                           | Impact                          |
| ---------- | ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------- |
| 2024-01    | Use Nuxt 3 in SPA mode                   | Better Electron compatibility, simpler deployment                   | No SSR features                 |
| 2024-01    | Vuetify for UI components                | Material Design consistency, comprehensive components               | Larger bundle size              |
| 2024-01    | Auth0 for authentication                 | Enterprise-grade, easy integration                                  | External dependency             |
| 2024-01    | Firebase for preferences                 | Real-time sync, scalable                                            | Requires Firebase project       |
| 2024-01    | Modular architecture                     | Enable feature sharing across projects                              | More complex initial setup      |
| 2024-01    | Merge Aether docs into Aether            | Combine Aether's AI-friendly docs with Aether's UI                  | Unified template                |
| 2024-11-17 | Import Aether's core documentation       | Enable AI agents to build apps using Aether framework               | Better AI comprehension         |
| 2024-11-17 | Shift from app types to modular features | Aether's modular architecture is more flexible than rigid app types | More composable applications    |
| 2024-11-17 | Add app-specific preference namespacing  | Prevent preference conflicts between apps built from template       | Isolated app data               |
| 2024-11-17 | Mandate Feature-First development        | All functionality built as modules from the start                   | Natural reusability             |
| 2026-02-21 | Replace multi-theme with Brand R2        | Company standardizing on unified branding; old themes unused        | Single dark theme, no switching |

## Implementation Progress

### Completed Features

- Authentication system with Auth0
- Preferences management with Firebase
- Electron desktop app support
- Cesium globe feature module
- Lovelace Brand R2 theming
- Modular navigation system
- Server status monitoring
- Settings dialog
- API client generation from OpenAPI specs
- Comprehensive API documentation (merged from Aether)
- DESIGN.md living documentation system
- AI-friendly README with quick start guide
- LLM integration guide for chat interfaces

### In Progress

- Interactive project initialization system (focusing on module selection rather than app types)
- Feature module examples and documentation

### Planned Features

- Additional feature modules (entity monitoring, news analysis)
- LLM integration composable
- Command system for AI agents
- Module marketplace/registry
- Enhanced Cesium drawing tools

### Known Issues & Limitations

- Cesium performance with large datasets (>10k entities)
- Settings dialog server configuration is read-only in web page mode (when built as an Electron app this config is read/write, using Electron storage integration)
- External npm modules require manual addition to Vite's optimizeDeps (use `npm run add-module`)

## API Integration

### Query Server API

The app connects to the Query Server (configured via `NUXT_PUBLIC_QUERY_SERVER_ADDRESS`; default `https://query.news.prod.g.lovelace.ai`). It provides:

- Entity search by name (`getNEID`)
- Entity reports and sentiment (`getNamedEntityReport`, `getNamedEntitySentiment`)
- Mentions, articles, graph, and AI endpoints via `useElementalService()`

### Authentication Flow

1. User authenticates via Auth0
2. Access token stored in secure cookies
3. API client automatically includes bearer token
4. Optional server-side validation

## UI/UX Patterns

### Layout Strategy

- Persistent app header with branding
- Collapsible side navigation
- Main content area with router views
- Floating action buttons for primary actions
- Responsive design for mobile/desktop

### Component Architecture

```
AppHeader.vue        - Main navigation bar
ModularSideNavPanel  - Extensible navigation
SettingsDialog       - User preferences
ServerStatus         - API connection status
```

### Theme System

- Lovelace Brand R2 -- single dark theme (see `branding/BRANDING.md`)
- Branding files are wholesale copies from `moongoose/ui/news-ui`; refresh via `/update_branding`
- `useCustomTheme` adapter re-exports `useNewsTheme` for backwards compatibility
- FK Grotesk typography with Inter/system-ui fallbacks

## Development Guidelines

### For AI Agents

1. **Read DESIGN.md first** to understand project context
2. **Update DESIGN.md** when you add, remove, or change the design or status of a module
3. **Use feature docs** in `design/` for implementation planning and checklists
4. **Use TypeScript** for all new code
5. **Follow Vuetify patterns** for UI components
6. **Test both web and Electron** versions

### Code Patterns

```vue
<!-- Component Structure -->
<template>
    <!-- Template first -->
</template>

<script setup lang="ts">
    // TypeScript with Composition API
    import { ref, computed } from 'vue';
</script>

<style scoped>
    /* Scoped styles last */
</style>
```

### API Usage

```typescript
// Use the orval-generated client (Auth token is automatic)
const { getNEID, getNamedEntityReport, request } = useElementalService();

const data = ref(null);
const loading = ref(false);

async function loadData() {
    loading.value = true;
    try {
        data.value = await getNEID({ entityName: '...', maxResults: 10 });
    } finally {
        loading.value = false;
    }
}
```

## Testing & Validation

### Test Scenarios

1. **Authentication Flow**: Login → API calls → Logout
2. **Preferences Sync**: Save a preference → Verify Firebase update
3. **Electron Features**: File access, window controls
4. **API Integration**: Query server endpoints
5. **Module Loading**: Dynamic feature registration

### Sample Data

- Company Name: `Boeing` (for sentiment analysis)
- Organization: `Acme Corp` (for entity monitoring)
- Test coordinates: `40.7128, -74.0060` (New York)

## Future Enhancements

### Potential Features

- Voice control integration
- Real-time collaboration
- Advanced data visualization
- Offline mode with sync
- Plugin marketplace

### Scalability Considerations

- Implement virtual scrolling for large lists
- Add pagination to API calls
- Use web workers for heavy computation
- Consider CDN for static assets

## Recent Changes

- 2026-02-21: Replaced multi-theme system with Lovelace Brand R2 (single dark theme). Branding files copied wholesale from moongoose/ui/news-ui with adapter pattern for backwards compatibility. Added `/update_branding` command and `.cursor/rules/branding.mdc`.
- 2026-02-21: Removed dead storedNewsWatchlist persistence code from SideNavPanel.vue and storedTheme pref from usePrefsStore.ts.
- 2024-12-20: Created learnings collection system to gather documentation improvements from distributed development
- 2024-12-20: Implemented hybrid AI guidance system with `.cursorrules` for critical rules and `cursor_guidance.md` for detailed patterns
- 2024-11-17: Completed Phase 1 of Aether documentation merge
- 2024-11-17: Enhanced README with AI-focused quick start guide
- 2024-11-17: Added comprehensive API documentation from Aether (API_GUIDE.md, API_QUICK_REFERENCE.md)
- 2024-11-17: Implemented DESIGN.md system for living project documentation
- 2024-11-17: Added LLM Integration guide for AI chat interfaces
- 2024-11-17: Created migration plan for remaining Aether features
- 2024-11-17: Updated .cursorrules with AI agent instructions from Aether
- 2024-11-17: Shifted paradigm from rigid app types to flexible modular features
- 2024-11-17: Added authentication documentation for Query Server API calls
- 2024-11-17: Implemented app-specific preference namespacing to prevent conflicts
- 2024-11-17: Created Feature-First development workflow and AI agent guidance
- 2024-11-17: Replaced legacy news sidepanel with modular navigation
- 2024-11-17: Added example features demonstrating event bus and module system
- 2024-11-17: Created module debug panel for system visualization
- 2024-11-17: Fixed duplicate app structure in index.vue and removed duplicate settings
- 2024-11-17: Fixed module visibility issue by using synchronous registration
- 2024-11-17: Fixed Vue Router warnings by using catch-all route for modules
- 2024-11-17: Fixed module navigation by updating watchdog middleware to allow registered module paths
- 2024-11-17: Fixed dynamic module imports showing as "[object Promise]" by using defineAsyncComponent
- 2024-11-17: Fixed event bus errors by implementing wildcard event listening and updating components
- 2024-11-17: Fixed event listeners being lost on navigation by using KeepAlive on module components
- 2024-12-20: Strengthened DESIGN.md pattern by making it explicit in cursor_guidance.md that AI agents must read and update it as primary source of truth
- 2024-12-20: Enhanced init-project.js to emphasize DESIGN.md as critical first step (similar to Aether's approach)
- 2024-12-20: Added DESIGN_DOCUMENT_GUIDE.md to help users write effective DESIGN.md files
- 2024-12-20: Fixed hardcoded npm module loading by making it generic with fallback logic
- 2024-12-20: Removed non-existent @aether-example/hello-npm from main template configuration
- 2024-12-20: Added LOCAL_NPM_MODULE_DEVELOPMENT.md guide for proper local module development workflow
- 2024-12-20: Added Prettier pre-commit hook setup with husky and lint-staged for automatic code formatting

---

_This document is maintained by AI agents and humans working on the project. It serves as the living memory of design decisions and implementation progress._
