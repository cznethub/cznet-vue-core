<template>
  <v-card
    elevation="0"
    variant="outlined"
    class="cz-group my-5"
    v-if="layout.visible"
    :data-id="generateId"
  >
    <v-card-title class="grey lighten-4">
      <div class="text-overline">
        {{ computedLabel }}
      </div>
      <div class="text-subtitle-1 text-medium-emphasis">
        {{ layout.uischema.description }}
      </div>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <div
        v-for="(element, index) in layout.uischema.elements"
        :data-id="`group-${index}`"
        :key="`${layout.path}-${index}`"
        :class="styles.group.item"
      >
        <dispatch-renderer
          :schema="layout.schema"
          :uischema="element"
          :path="layout.path"
          :enabled="layout.enabled"
          :renderers="layout.renderers"
          :cells="layout.cells"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {
  JsonFormsRendererRegistryEntry,
  Layout,
  rankWith,
  and,
  isLayout,
  uiTypeIs,
} from '@jsonforms/core';
import { defineComponent } from 'vue';
import {
  DispatchRenderer,
  rendererProps,
  RendererProps,
  useJsonFormsLayout,
} from '@jsonforms/vue';
import { useVuetifyLayout } from '@/renderers/util/composition';
import { VCard, VCardText, VCardTitle, VDivider } from 'vuetify/components';

const layoutRenderer = defineComponent({
  name: 'group-renderer',
  components: {
    DispatchRenderer,
    VCard,
    VCardText,
    VCardTitle,
    VDivider,
  },
  props: {
    ...rendererProps<Layout>(),
  },
  setup(props: RendererProps<Layout>) {
    return useVuetifyLayout(useJsonFormsLayout(props));
  },
  computed: {
    generateId(): string {
      // @ts-ignore
      return `group-${this.layout.uischema.label?.replaceAll(' ', '')}`;
    },
  },
});

export default layoutRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: layoutRenderer,
  tester: rankWith(3, and(isLayout, uiTypeIs('Group'))),
};
</script>

<style lang="scss" scoped>
.cz-group {
  border: thin solid #ababab;
}
</style>
