import { defineConfig } from 'orval';

export default defineConfig({
    elementalService: {
        input: {
            target: './query/api/specs/elemental-api-spec.json',
        },
        output: {
            mode: 'tags-split',
            target: './composables/generated/elemental-service',
            client: 'fetch',
            clean: true,
            prettier: true,
            tsconfig: './tsconfig.json',
            schemas: './composables/generated/elemental-service/model',
            override: {
                mutator: {
                    path: './utils/customFetch.ts',
                    name: 'customFetch',
                },
            },
        },
    },
});
