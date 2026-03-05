# Private Nuxt Modules with GitHub Package Registry

## The Good News: Nuxt Modules = NPM Packages

Nuxt modules are just npm packages with a specific structure. You can use the SAME GitHub registry!

## Publishing Private Nuxt Modules

### 1. Package Configuration

```json
// package.json for your Nuxt module
{
    "name": "@your-org/aether-doom-module",
    "version": "1.0.0",
    "type": "module",
    "main": "./dist/module.mjs",
    "types": "./dist/types.d.ts",
    "files": ["dist"],

    // SAME GitHub registry configuration!
    "publishConfig": {
        "registry": "https://npm.pkg.github.com"
    },

    "scripts": {
        "prepack": "nuxt-module-build"
    },

    "devDependencies": {
        "@nuxt/module-builder": "latest"
    }
}
```

### 2. GitHub Actions for Auto-Publishing

```yaml
# .github/workflows/publish-module.yml
name: Publish Nuxt Module

on:
    push:
        tags:
            - 'v*'

jobs:
    publish:
        runs-on: ubuntu-latest
        permissions:
            contents: read
            packages: write

        steps:
            - uses: actions/checkout@v3

            - uses: actions/setup-node@v3
              with:
                  node-version: 18
                  registry-url: https://npm.pkg.github.com/

            - run: npm ci
            - run: npm run build
            - run: npm publish
              env:
                  NODE_AUTH_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

### 3. Using Private Nuxt Modules

```bash
# .npmrc in your Nuxt app
@your-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
    modules: [
        '@your-org/aether-event-sender',
        '@your-org/aether-doom-module',
        '@your-org/aether-entity-lookup',
    ],
});
```

## Nuxt Module Build Tool

Use the official `@nuxt/module-builder` for proper module packaging:

```bash
npm i -D @nuxt/module-builder
```

```typescript
// package.json
{
  "scripts": {
    "prepack": "nuxt-module-build",
    "dev": "nuxi dev playground",
    "dev:build": "nuxi build playground"
  }
}
```

## Module Development Workflow

### 1. Module Structure

```
@your-org/aether-feature-module/
├── src/
│   ├── module.ts          # Module definition
│   └── runtime/           # Runtime code
├── playground/            # Dev environment
│   ├── nuxt.config.ts
│   └── app.vue
├── package.json
└── README.md
```

### 2. Local Development

```bash
# Develop with hot reload
npm run dev

# Test the build
npm run dev:build
```

### 3. Link for Local Testing

```bash
# In module directory
npm link

# In your Nuxt app
npm link @your-org/aether-feature-module
```

## From 4 Places to 1 Place

### Current NPM Module Process:

1. ✏️ Import in `plugins/01.module-registry.client.ts`
2. ✏️ Register in the plugin
3. ✏️ Add to package.json
4. ✏️ Update types/imports
5. 📜 Run your helper script

### With Nuxt Modules:

1. ✏️ Add to `modules: []` in nuxt.config.ts
2. ✅ That's it!

## Private Distribution Options

### Option 1: GitHub Package Registry (Recommended)

- ✅ You're already using this!
- ✅ Same authentication
- ✅ Same workflow
- ✅ Scoped to your org

### Option 2: Private NPM Registry

- Verdaccio
- Sonatype Nexus
- JFrog Artifactory

### Option 3: Git URLs (Simple)

```json
{
    "dependencies": {
        "@your-org/module": "git+ssh://git@github.com:your-org/module.git#v1.0.0"
    }
}
```

### Option 4: Local/Monorepo

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
    modules: ['./modules/aether-doom', './modules/aether-events'],
});
```

## Security & Access Control

Same as your current npm packages:

- 🔒 Private to your organization
- 🔑 Token-based authentication
- 👥 Team access controls
- 📦 Scoped packages (@your-org/\*)

## Migration Script

Since you have a script for npm modules, here's what it could look like for Nuxt modules:

```bash
#!/bin/bash
# add-nuxt-module.sh

MODULE_NAME=$1

# Just add to nuxt.config.ts modules array
sed -i '' "s/modules: \[/modules: [\n    '$MODULE_NAME',/" nuxt.config.ts

echo "✅ Module $MODULE_NAME added!"
echo "🚀 Run 'npm install $MODULE_NAME' to complete"
```

Even simpler than before!
