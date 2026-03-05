import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { resolve } from 'path';

export default defineConfig({
    plugins: [vue(), vuetify({ autoImport: true })],
    build: {
        lib: {
            entry: resolve(__dirname, 'index.ts'),
            name: 'HelloWorldModule',
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            // Externalize dependencies that shouldn't be bundled
            external: [
                'vue',
                'vuetify',
                '@nuxt/kit',
                /^~/, // Externalize aether imports (~/composables, etc.)
            ],
            output: {
                // Provide global variables for UMD build
                globals: {
                    vue: 'Vue',
                    vuetify: 'Vuetify',
                },
                // Preserve the module structure
                preserveModules: true,
                preserveModulesRoot: '.',
            },
        },
        // Generate sourcemaps for debugging
        sourcemap: true,

        // Minify for production
        minify: 'terser',

        // Output directory
        outDir: 'dist',
    },
    resolve: {
        alias: {
            // Map ~ to aether's root (will be resolved by the host app)
            '~': resolve(__dirname, '../../../'),
        },
    },
});
