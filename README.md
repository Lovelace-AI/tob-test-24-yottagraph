# 🌎 Aether 2.0 - Modular Nuxt Framework

## TLDR - Getting started

Here's the minimum you need to get up and running!

1. **Create a template**

    You've already made it to [the Aether repo](https://github.com/Lovelace-AI/aether)! At the top right, click the green `Use this template` button.
    1. Create a new repository
    2. Make your personal account the owner (recommended because it will make the Vercel integration easier)
    3. Give it a name - whatever you like
    4. Set visibility to `Private`
    5. `Create repository`

2. **Clone the new repository**

    Additional git instructions are outside the scope of this readme. If you need help, ask a teammate.

3. **Open in Cursor**

    Aether is set up to integrate with the Cursor IDE.

4. **Initialize the repository**

    In the Cursor terminal, run `npm run init`. This will take you through a bunch of set up to get a minimal version of the app running locally.
    Ask a teammate for the auth0 client ID and secret.

5. **Develop your app**

    Write your `DESIGN.md` doc, create feature docs in `design/` to plan work, and use the Agent chat to implement and iterate.

6. **Deploy to Vercel**

    In the agent chat, type `/vercel_setup`. The Agent will walk you through connecting to Vercel and deploying so that other people can use your app.
    After you make changes and want to deploy them, type `/vercel_deploy` in the agent chat to update the deployment (or just push to main).

## Overview

**Build modular Nuxt applications with a powerful event-driven architecture.** Create reusable features that work like plugins - drop them into any Aether-enabled app and they just work.

<p align="center">
  <img src="https://img.shields.io/badge/Nuxt-3.x-00DC82?style=for-the-badge&logo=nuxt.js" />
  <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=for-the-badge&logo=vue.js" />
  <img src="https://img.shields.io/badge/Vuetify-3.x-1867C0?style=for-the-badge&logo=vuetify" />
  <img src="https://img.shields.io/badge/TypeScript-Latest-3178C6?style=for-the-badge&logo=typescript" />
</p>

## 🚀 What's New in Aether 2.0

Aether has evolved from a template into a **powerful modular framework** with enterprise-ready features:

### Core Architecture

- **🧩 Nuxt Feature Modules** - Build apps by combining self-contained features
- **📡 Event Bus Architecture** - Features communicate seamlessly without coupling
- **💾 Persistent State Management** - Navigation doesn't lose your work
- **🎯 AI-Optimized** - Perfect for development with Claude/Cursor
- **🔌 Hot-swappable Features** - Add/remove features without breaking anything

### Enterprise Features

- **🔐 Auth0 Integration** - Production-ready authentication out of the box
- **☁️ Firestore Preferences** - Cloud-synced user preferences with automatic namespacing
- **🖥️ Electron Support** - Build desktop apps with zero configuration

## 🎯 Who Is This For?

- **AI Developers** - Build faster with Claude/Cursor using our AI-optimized patterns
- **Product Teams** - Create modular apps where teams can work independently
- **Startups** - Ship features as npm packages, share between projects
- **Enterprise** - Maintain large codebases with clear feature boundaries

## ✨ Why Aether?

### The Problem

Traditional Nuxt apps become monoliths. Features get tangled together. Teams step on each other. Sharing code between projects is painful.

### The Solution

Aether makes every feature a **self-contained Nuxt module** that can be:

- 📦 **Packaged** - Publish features to npm
- 🔄 **Reused** - Share features between projects
- 🧪 **Tested** - Develop features in isolation
- 🚀 **Deployed** - Update features independently

Think of it like WordPress plugins or VS Code extensions, but for Nuxt applications.

## 💡 Key Concepts

### 🧩 Everything is a Nuxt Module

Each feature is a complete, self-contained module:

```
features/my-feature/
├── index.ts         # Module definition
├── pages/           # UI pages
├── components/      # Feature components
├── composables/     # Business logic
└── README.md        # Documentation
```

### 📡 Event-Driven Communication

Features talk through events, not imports:

```typescript
// Send events from one feature
emit('entity:selected', { id: 123, name: 'Boeing' });

// Listen in another feature
on('entity:selected', (data) => {
    console.log(`Selected: ${data.name}`);
});
```

### 💾 Persistent State

State survives navigation automatically:

```typescript
// In your module's setup()
const globalStore = reactive({
    selectedItems: [],
    userPreferences: {},
});

// State persists across page changes!
```

## 🚀 Quick Start (5 minutes)

### 1. Initialize Your Project

```bash
# Clone this repo
git clone https://github.com/Lovelace-AI/aether.git
cd aether

# Initialize your project and create DESIGN.md
npm run init
```

**🎯 IMPORTANT**: The `init` command creates a `DESIGN.md` file that records your project's vision and current state. This is a key step for AI-assisted development — agents read this first to understand what you're building.

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Visit http://localhost:3000 and click "Event Sender" in the sidebar to see a working module.

### 2. Create Your First Module

```bash
# Copy the template
cp -r templates/feature-template features/my-feature

# Start coding!
code features/my-feature/index.ts
```

Your module structure:

```
features/my-feature/
├── index.ts         # Module configuration
├── pages/           # Your UI pages
├── components/      # Your components
└── README.md        # Module docs
```

### 3. Register Your Module

Add to `app.vue`:

```typescript
// Import your module
import myFeature from './features/my-feature';

// Register it
moduleRegistry.register(myFeature);
```

That's it! Your module now appears in the navigation.

## 📋 Design Workflow

Aether uses a two-tier design doc approach:

- **`DESIGN.md`** — A record of the current state of your project: vision, architecture, modules, and implementation status. Agents read this first before any work. Keep it up to date, but don't use it for checklists or working plans.
- **Feature docs** (`design/*.md`) — Working documents where you and AI agents collaborate on implementing specific features. Create one per feature by copying `design/feature_template.md`. Use checklists, track open questions, and close them out when the work is done.

When you run `npm run init`, a `DESIGN.md` is created from a template. Update it with your project's specifics, then create feature docs as you start building.

## 🤖 AI Development Support

Aether is optimized for AI-assisted development:

- **`.cursor/rules/`** — Cursor rules either automatically included in every conversation, or included based on the description.
- **`DESIGN.md`** — Project vision and current state that AI reads first
- **`design/*.md`** — Feature docs for collaborative implementation planning
- **Feature examples** — Working code demonstrating best practices

This means you can work with Claude, Cursor, or other AI assistants and they'll automatically understand your project's patterns and write code that fits perfectly.

## 📖 Creating a Nuxt Module Step-by-Step

### Step 1: Define Your Module

Create `features/my-feature/index.ts`:

```typescript
export default defineFeatureModule({
    id: 'my-feature',
    name: 'My Feature',
    icon: 'mdi-star',

    // Add a page
    routes: [
        {
            path: '/my-feature',
            component: () => import('./pages/index.vue'),
        },
    ],

    // Add to navigation
    navigation: {
        title: 'My Feature',
        order: 10,
    },
});
```

### Step 2: Create Your Page

Create `features/my-feature/pages/index.vue`:

```vue
<template>
    <v-container>
        <FeatureHeader
            title="My Feature"
            subtitle="This is my first Nuxt module!"
            icon="mdi-star"
        />

        <v-card class="mt-4">
            <v-card-text>
                <v-btn @click="sendMessage"> Send Event </v-btn>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup>
    import { useModuleBus } from '@/composables/useModuleBus';

    const { emit } = useModuleBus('my-feature');

    const sendMessage = () => {
        emit('my-feature:hello', { message: 'Hello from my feature!' });
    };
</script>
```

### Step 3: Listen to Events (Optional)

To receive events from other modules:

```typescript
// In your module's index.ts
export default defineFeatureModule({
    id: 'my-feature',
    name: 'My Feature',

    setup() {
        const { on } = useModuleBus('my-feature');

        // Listen for events
        on('other-module:data', (data) => {
            console.log('Received:', data);
        });
    },
});
```

## 📦 Packaging Your Module for npm

### Step 1: Copy the npm Template

```bash
# Use our npm module template
cp -r examples/npm-modules/hello-npm my-npm-module
cd my-npm-module
```

### Step 2: Update Package Info

Edit `package.json`:

```json
{
    "name": "@yourorg/my-module",
    "version": "1.0.0",
    "description": "My awesome Aether Nuxt module"
}
```

### Step 3: Build and Publish

```bash
# Build your module
npm run build

# Publish to npm
npm publish
```

## 🔌 Using Published Modules

### Step 1: Install the Module

```bash
npm install @yourorg/my-module
```

### Step 2: Configure Module Loading

Create/edit `public/aether.modules.json`:

```json
{
    "modules": [
        {
            "name": "@yourorg/my-module",
            "enabled": true,
            "config": {
                // Optional module configuration
            }
        }
    ]
}
```

### Step 3: That's It!

The module loads automatically when your app starts. No manual registration needed for npm modules.

## 🏗️ Example Features Included

Aether comes with working examples:

### 🔄 Event Sender/Receiver

Shows the event bus pattern with persistent state:

- Send messages between features
- Auto-send mode continues across navigation
- Complete event history

### 🌍 Cesium Globe

3D visualization with state persistence:

- Draw points on the globe
- Entities persist across navigation
- Camera position preserved

### 🐛 Module Debug

Developer tools for the modular system:

- Real-time event monitoring
- Module registry visualization
- Performance metrics

## 🔐 Enterprise Features

### Authentication with Auth0

For the Auth0 flow to work you must set these environment variables:

| Variable                            | Description                                                        |
| ----------------------------------- | ------------------------------------------------------------------ |
| `NUXT_PUBLIC_AUTH0_ISSUER_BASE_URL` | Auth issuer (typically `https://auth.lovelace.ai`)                 |
| `NUXT_PUBLIC_AUTH0_CLIENT_ID`       | Auth0 application client ID                                        |
| `NUXT_PUBLIC_AUTH0_CLIENT_SECRET`   | Auth0 application client secret                                    |
| `NUXT_PUBLIC_AUTH0_AUDIENCE`        | API audience (typically `queryserver:api` for query server access) |
| `NUXT_PUBLIC_COOKIE_SECRET`         | Secret used to sign session cookies                                |
| `NUXT_PUBLIC_USER_NAME`             | Leave **empty** when using Auth0 (otherwise auth is bypassed)      |

**Local development:** Copy `.env.example` to `.env` and fill in the values. See `aether_vercel_demo/.env` for an example of a filled-out file (use your own credentials).

**Deployed environments:** Configure the same variables in your hosting platform (e.g. Vercel project settings, Electron build env).

With Auth0 configured, the access token is automatically included in API calls:

```typescript
const { getNEID, getNamedEntityReport } = useElementalService();
// Auth token is automatically included
const data = await getNEID({ entityName: 'Boeing', maxResults: 10 });
```

### Cloud Preferences

Built-in Firestore integration for persisting user settings:

```typescript
const { readDoc, listCollections } = usePrefsStore();
// Pref<T> class auto-syncs reactive values to Firestore
// See .cursor/rules/pref.mdc for usage patterns
```

### Desktop Apps with Electron

Build native apps with one command:

```bash
npm run electron:build:mac
```

## 📚 Documentation

- **[Quick Start](#quick-start-5-minutes)** - Get started in 5 minutes
- **[Example Modules](examples/)** - Learn from examples
- **[Pattern Templates](patterns/)** - Reusable code templates
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 🛠️ Common Issues

### Module Not Showing Up?

1. Check that it's registered in `app.vue`
2. Ensure it has a `navigation` property
3. Verify the module `id` is unique

### Events Not Being Received?

- Use unique, namespaced event names (e.g., `myfeature:action`)
- Check the Module Debug panel for event flow
- Ensure listeners are set up in module `setup()`

### npm Module Not Loading?

- Verify module name in `aether.modules.json`
- Check browser console for import errors
- Try `npm ls @yourorg/my-module`

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with amazing open source projects:

- [Nuxt 3](https://nuxt.com) - The intuitive Vue framework
- [Vuetify 3](https://vuetifyjs.com) - Material Design components
- [Vue 3](https://vuejs.org) - The progressive JavaScript framework

---

<p align="center">
  Made with ❤️ by the Lovelace AI team
</p>

<p align="center">
  <a href="https://github.com/Lovelace-AI/aether/issues">Report Bug</a>
  ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>
