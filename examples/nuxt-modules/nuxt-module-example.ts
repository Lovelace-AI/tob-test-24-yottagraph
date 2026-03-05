import { defineNuxtModule, addPlugin, createResolver, addComponent } from '@nuxt/kit';
import { fileURLToPath } from 'url';

export interface ModuleOptions {
    prefix?: string;
    cdnUrl?: string;
}

export default defineNuxtModule<ModuleOptions>({
    meta: {
        name: 'aether-doom-module',
        configKey: 'aetherDoom',
        compatibility: {
            nuxt: '^3.0.0',
        },
    },

    defaults: {
        prefix: 'Doom',
        cdnUrl: undefined,
    },

    async setup(options, nuxt) {
        const resolver = createResolver(import.meta.url);

        // 1. Add runtime plugin (like your js-dos.client.ts)
        addPlugin({
            src: resolver.resolve('./runtime/plugin'),
            mode: 'client',
        });

        // 2. Auto-import composables
        nuxt.hook('imports:dirs', (dirs) => {
            dirs.push(resolver.resolve('./runtime/composables'));
        });

        // 3. Auto-register components
        await addComponent({
            name: `${options.prefix}Game`,
            filePath: resolver.resolve('./runtime/components/DoomGame.vue'),
        });

        // 4. Copy public assets during build
        nuxt.hook('nitro:config', (nitroConfig) => {
            // Copy doom assets to public
            nitroConfig.publicAssets = nitroConfig.publicAssets || [];
            nitroConfig.publicAssets.push({
                baseURL: '/doom',
                dir: resolver.resolve('./runtime/public/doom'),
            });
        });

        // 5. Add module-specific types
        nuxt.hook('prepare:types', (options) => {
            options.references.push({
                path: resolver.resolve('./runtime/types.d.ts'),
            });
        });

        // 6. Register module routes
        nuxt.hook('pages:extend', (pages) => {
            pages.push({
                name: 'doom',
                path: '/doom',
                file: resolver.resolve('./runtime/pages/doom.vue'),
            });
        });

        // 7. Add to module registry automatically
        nuxt.hook('app:mounted', () => {
            // Auto-register with your module system
        });
    },
});
