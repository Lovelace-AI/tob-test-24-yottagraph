import { defineFeatureModule } from '../../../composables/useModuleRegistry';
import HelloWorldPage from './pages/index.vue';
import HelloWorldWidget from './widgets/HelloWorldWidget.vue';

export default defineFeatureModule({
    id: 'hello-world',
    name: 'Hello World',
    icon: 'mdi-hand-wave',
    description: 'A simple example module demonstrating the module system',

    // Full page component for standalone mode
    standalone: HelloWorldPage,

    // Widget component for embedded mode
    widget: HelloWorldWidget,

    // Routes when running as standalone
    routes: [
        {
            path: '/',
            component: HelloWorldPage,
            meta: {
                title: 'Hello World Module',
            },
        },
    ],

    // Dependencies
    requires: ['useUserState', 'useModuleBus'],
    provides: ['useHelloWorld'],

    // Lifecycle hooks
    async onInstall() {
        console.log('Hello World module installed!');

        // Could initialize module state, register listeners, etc.
        const { useModuleBus } = await import('../../../composables/useModuleBus');
        const bus = useModuleBus('hello-world');
        bus.message.send('Module installed', { moduleId: 'hello-world' });
    },

    async onUninstall() {
        console.log('Hello World module uninstalled!');

        // Cleanup any resources, listeners, etc.
    },
});
