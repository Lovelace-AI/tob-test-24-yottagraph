# Nuxt Modules for Aether - Executive Summary

## The Problem

Currently, adding a feature module requires editing **4 different files**:

1. `package.json` - Add dependency
2. `plugins/01.module-registry.client.ts` - Import module
3. `plugins/01.module-registry.client.ts` - Register module
4. `public/aether.modules.json` - Configure (for npm modules)

## The Solution: Nuxt Modules

With Nuxt modules, you only need **1 change**:

```typescript
// nuxt.config.ts
modules: ['@your-org/aether-doom']; // That's it!
```

## Key Benefits

### 1. Same Private Distribution ✅

- Use your existing GitHub Package Registry
- Same authentication and permissions
- Same `@your-org` scope
- No public exposure

### 2. Better Developer Experience 🚀

- Auto-registration with your module system
- Auto-import of composables
- Build-time optimizations
- Nuxt DevTools integration
- Hot module replacement

### 3. Handles Complex Cases 💪

- Asset copying (like Doom's WASM files)
- Global plugin injection (like js-dos)
- Route registration
- Configuration via nuxt.config.ts

## Quick Comparison

| Task           | Current Approach      | Nuxt Module         |
| -------------- | --------------------- | ------------------- |
| Add module     | Edit 4 files + script | Add 1 line          |
| Remove module  | Edit 4 files          | Remove 1 line       |
| Configure      | Edit JSON file        | nuxt.config options |
| Order matters? | Yes, manual           | Yes, automatic      |
| Assets         | Copy manually         | Handled by module   |
| Types          | Import manually       | Auto-generated      |

## Real Example: Doom Module

### Current (Complex Asset Handling):

- Copy files to `/public/doom/`
- Copy files to `/public/` (duplicates!)
- Add js-dos plugin manually
- Register in 4 places
- Hope paths are correct

### As Nuxt Module:

```typescript
// Just this:
modules: ['@your-org/aether-doom'];

// Module handles:
// ✅ Copying all assets
// ✅ Loading js-dos
// ✅ Registration
// ✅ Path configuration
```

## Implementation Path

### Phase 1: Proof of Concept (1 day)

1. Convert `event-sender` to Nuxt module
2. Publish to GitHub registry
3. Test in app
4. Both systems work together

### Phase 2: Complex Module (2-3 days)

1. Convert Doom to Nuxt module
2. Handle assets and plugins
3. Test thoroughly
4. Document patterns

### Phase 3: Full Migration (1 week)

1. Convert remaining modules
2. Update documentation
3. Deprecate old system
4. Simplify codebase

## No Breaking Changes

- Current modules keep working
- Gradual migration
- Both systems coexist
- Switch when ready

## Next Steps

1. Review examples in `/examples/` directory
2. Try converting one simple module
3. Test with your GitHub registry
4. Roll out to team

## Questions This Answers

- ✅ "Can we keep our private GitHub registry?" - Yes!
- ✅ "Will this break existing code?" - No!
- ✅ "Is this more complex?" - No, simpler!
- ✅ "Can we migrate gradually?" - Yes!
- ✅ "Will Doom's assets work?" - Yes, better!

## The Bottom Line

**From 4 manual steps to 1 automatic step**, while keeping everything else the same.

Worth exploring? Absolutely. 🚀
