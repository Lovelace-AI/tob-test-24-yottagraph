// BEFORE: Traditional NPM Package Approach
// @your-org/event-sender/index.ts

import { defineFeatureModule } from '~/composables/useModuleRegistry'

export default defineFeatureModule({
  id: 'event-sender',
  name: 'Event Sender',
  // ... module definition
})

// User must manually register in 4 places! 😓

// ============================================

// AFTER: Nuxt Module Approach
// @your-org/event-sender-module/src/module.ts

import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@your-org/event-sender-module',
    configKey: 'eventSender'
  },
  
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    
    // This plugin auto-registers with your module system!
    addPlugin({
      src: resolve('./runtime/plugin.ts'),
      mode: 'client',
      order: 10 // After 01.module-registry.client.ts
    })
  }
})

// @your-org/event-sender-module/src/runtime/plugin.ts
import eventSenderModule from './module-definition'

export default defineNuxtPlugin(() => {
  const moduleRegistry = useModuleRegistry()
  
  // Auto-register when the app starts
  moduleRegistry.register(eventSenderModule)
})

// @your-org/event-sender-module/src/runtime/module-definition.ts
export default {
  id: 'event-sender',
  name: 'Event Sender',
  icon: 'mdi-send',
  description: 'Send events on the module bus',
  
  routes: [{
    path: '/event-sender',
    component: () => import('./pages/event-sender.vue')
  }],
  
  navigation: {
    title: 'Event Sender',
    order: 20
  }
}

// ============================================

// PUBLISHING (Same GitHub Registry!)

// package.json
{
  "name": "@your-org/event-sender-module",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/types.d.ts",
      "import": "./dist/module.mjs",
      "require": "./dist/module.cjs"
    }
  },
  "main": "./dist/module.cjs",
  "types": "./dist/types.d.ts",
  "files": ["dist"],
  
  // SAME GitHub registry as your npm packages!
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  
  "scripts": {
    "prepack": "nuxt-module-build build",
    "dev": "nuxi dev playground",
    "publish": "npm publish"
  },
  
  "dependencies": {
    "@nuxt/kit": "^3.9.0"
  },
  
  "devDependencies": {
    "@nuxt/module-builder": "^0.5.5",
    "nuxt": "^3.9.0"
  }
}

// ============================================

// USER'S EXPERIENCE

// Before: Edit 4 files + run script
// After: Just this! 

// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@your-org/event-sender-module'  // ✨ Magic happens
  ]
})

// That's literally it. The module:
// ✅ Auto-registers with your module registry
// ✅ Adds all routes
// ✅ Imports composables
// ✅ Adds to navigation
// ✅ Everything just works™
