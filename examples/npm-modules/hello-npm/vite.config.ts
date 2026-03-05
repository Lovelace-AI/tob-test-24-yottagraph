import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        vue(),
        // Don't auto-import Vuetify in library mode
        vuetify({ autoImport: false }),
        dts({
            insertTypesEntry: true,
            include: ['src/**/*.ts', 'src/**/*.vue'],
            beforeWriteFile: (filePath, content) => {
                // Clean up the generated types to remove internal paths
                const cleanContent = content
                    .replace(/from ['"]\.\.\/\.\.\/\.\.\//g, "from '")
                    .replace(/import\(['"]\.\.\/\.\.\/\.\.\//g, "import('");
                return { filePath, content: cleanContent };
            },
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'AetherHelloNpm',
            formats: ['es'],
            fileName: 'index',
        },
        rollupOptions: {
            external: [
                'vue',
                'vuetify/components',
                'vuetify/directives',
                '@mdi/font',
                // Exclude any imports from the parent app
                /^~\//,
                /^#/,
            ],
            output: {
                exports: 'named',
                globals: {
                    vue: 'Vue',
                    vuetify: 'Vuetify',
                },
                // Preserve the module structure
                preserveModules: false,
                // Include all assets in the output
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name === 'style.css') return 'style.css';
                    return assetInfo.name ?? '';
                },
            },
        },
        cssCodeSplit: false,
        sourcemap: true,
        minify: false, // Don't minify for better debugging
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
