// https://nuxt.com/docs/api/configuration/nuxt-config

import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    writeFileSync,
} from 'node:fs';
import path from 'node:path';

// Deploy target: 'electron' for desktop app, 'vercel' for web deployment
// Set via DEPLOY_TARGET in .env or environment
const isElectron = process.env.DEPLOY_TARGET === 'electron';

// Read tenant config from broadchurch.yaml (committed by tenant-init) so the
// runtime config has correct defaults even when .env is missing or stale.
// Env vars (from .env or Vercel) still take precedence via Nuxt's override.
function readBroadchurchYaml() {
    const empty = { gatewayUrl: '', tenantOrgId: '', queryServerAddress: '' };
    try {
        if (!existsSync('broadchurch.yaml')) return empty;
        const yaml = readFileSync('broadchurch.yaml', 'utf-8');

        function sectionBlock(name: string): string {
            const re = new RegExp(`^${name}:\\s*$`, 'm');
            const idx = yaml.search(re);
            if (idx === -1) return '';
            const nl = yaml.indexOf('\n', idx);
            if (nl === -1) return '';
            const rest = yaml.slice(nl + 1);
            const end = rest.search(/^\S/m);
            return end === -1 ? rest : rest.slice(0, end);
        }

        function urlFrom(section: string): string {
            const m = sectionBlock(section).match(/url:\s*["']?(https?:\/\/[^\s"']+)/);
            return m ? m[1] : '';
        }

        function valueFrom(section: string, key: string): string {
            const m = sectionBlock(section).match(new RegExp(`${key}:\\s*["']?([^\\s"'#]+)`));
            return m ? m[1] : '';
        }

        return {
            gatewayUrl: urlFrom('gateway'),
            tenantOrgId: valueFrom('tenant', 'org_id'),
            queryServerAddress: urlFrom('query_server'),
        };
    } catch {
        return empty;
    }
}

const bcYaml = readBroadchurchYaml();

export default defineNuxtConfig({
    devtools: { enabled: false },

    devServer: {
        host: '0.0.0.0',
    },

    // SPA mode — client-side rendering for both Electron and Vercel
    ssr: false,

    app: {
        // Electron needs relative base URL for file:// protocol; web deployments use absolute
        baseURL: isElectron ? './' : '/',
        head: {
            link: [
                {
                    rel: 'stylesheet',
                    href: 'https://cesium.com/downloads/cesiumjs/releases/1.116/Build/Cesium/Widgets/widgets.css',
                },
            ],
            script: [
                {
                    src: 'https://cesium.com/downloads/cesiumjs/releases/1.116/Build/Cesium/Cesium.js',
                    defer: true,
                },
            ],
        },
    },

    router: {
        options: {
            // Hash mode is required for Electron's file:// protocol
            // Web deployments (Vercel) use standard history mode
            hashMode: isElectron,
        },
    },

    nitro: {
        // Vercel auto-sets the VERCEL env var during builds, which Nuxt detects to use
        // the 'vercel' preset automatically. This bundles server/api/ routes as serverless functions.
        preset: process.env.VERCEL ? 'vercel' : undefined,
        // Only override publicDir for non-Vercel builds (e.g. Electron).
        // The Vercel preset manages its own output paths (.vercel/output/static/).
        ...(!process.env.VERCEL && {
            output: {
                publicDir: '.output/public',
            },
        }),
    },

    modules: ['vuetify-nuxt-module'],

    // Remove utils/ from auto-import scanning. Nuxt scans composables/ and utils/
    // by default and `imports.dirs` only ADDS directories, it doesn't replace them.
    // The utils/ scan causes false-positive exports (function parameters like 'options'
    // get detected as named exports → SyntaxError → blank page at runtime).
    hooks: {
        'imports:dirs': (dirs: string[]) => {
            const idx = dirs.findIndex((d) => d.endsWith('/utils'));
            if (idx !== -1) dirs.splice(idx, 1);
        },
    },

    css: ['~/assets/fonts.css', '~/assets/brand-globals.css', '~/assets/theme-styles.css'],

    // Runtime configuration with sensible defaults
    // Nuxt automatically overrides these with environment variables following the pattern:
    // NUXT_PUBLIC_[KEY_NAME] for public config (e.g., NUXT_PUBLIC_APP_ID overrides appId)
    // See: https://nuxt.com/docs/guide/going-further/runtime-config
    runtimeConfig: {
        public: {
            // App Identity
            appId: '',
            appName: '',
            appShortName: 'Elemental',

            // Auth0 Configuration
            auth0Audience: '',
            auth0ClientId: '',
            auth0ClientSecret: '',
            auth0CookieName: 'llai-cookie',
            auth0IssuerBaseUrl: 'https://auth.lovelace.ai',
            cookieSecret: 'Our-cool-elemental-cookie-secret',

            // Server Configuration
            queryServerAddress: bcYaml.queryServerAddress,

            // Agent Gateway
            gatewayUrl: bcYaml.gatewayUrl,
            tenantOrgId: bcYaml.tenantOrgId,
            agents: '',

            // User Configuration
            userName: '',

            // App Configuration
            versionString: 'release_internal-dev',
            cesiumAccessToken: '',
        },
    },

    vite: {
        build: {
            target: 'esnext', //browsers can handle the latest ES features
        },
        define: {
            'process.env.NODE_DEBUG': JSON.stringify(''),
        },
        optimizeDeps: {
            include: ['vuetify'],
            esbuildOptions: {
                define: {
                    global: 'globalThis',
                },
            },
        },
        resolve: {
            dedupe: ['vue', 'vue-router', 'vuetify'],
            preserveSymlinks: true,
        },
    },

    compatibilityDate: '2025-08-25',
});
