<!--
  Standard feature page template.

  Every feature page must use FeatureHeader and this flexbox layout.
  See .cursor/rules/ui.mdc for the condensed reference.

  Key rules:
  - d-flex flex-column on the column container
  - flex-shrink-0 on fixed elements (header, toolbar)
  - flex-grow-1 overflow-y-auto on scrollable content
  - Never use calc(100vh - Xpx) -- let flexbox handle sizing
  - Never nest multiple scroll containers
-->
<template>
    <v-container fluid class="pa-0 fill-height">
        <v-row class="fill-height ma-0">
            <v-col cols="12" class="pa-4 d-flex flex-column" style="height: 100%; overflow: hidden">
                <!-- REQUIRED: FeatureHeader -->
                <FeatureHeader title="My Feature" icon="mdi-star" class="flex-shrink-0" />

                <!-- Fixed controls (optional) -->
                <v-card class="mb-4 flex-shrink-0">
                    <v-card-text>
                        <!-- toolbar / search / filters -->
                    </v-card-text>
                </v-card>

                <!-- Scrollable content area -->
                <div class="flex-grow-1 overflow-y-auto">
                    <v-card>
                        <v-card-text>
                            <!-- main content -->
                        </v-card-text>
                    </v-card>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
    // Your component logic here
</script>
