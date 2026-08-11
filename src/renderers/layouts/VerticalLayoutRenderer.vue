<template>
  <div
    v-if="layout.visible"
    class="cz-vertical-layout"
    :class="`${styles.verticalLayout.root}`"
  >
    <div
      v-for="(element, index) in layout.uischema.elements"
      :key="`${layout.path}-${index}`"
      :class="styles.verticalLayout.item"
      class="cz-vertical-layout__item"
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
  </div>
</template>

<script lang="ts">
import { Layout } from '@jsonforms/core';
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
  RendererProps,
} from '@jsonforms/vue';
import { useVuetifyLayout } from '@/renderers/util/composition';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'vertical-layout-renderer',
  components: {
    DispatchRenderer,
  },
  props: {
    ...rendererProps<Layout>(),
  },
  setup(props: RendererProps<Layout>) {
    return useVuetifyLayout(useJsonFormsLayout(props));
  },
});
</script>

<style scoped lang="scss">
.cz-vertical-layout {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;

  &__item {
    min-width: 0;
  }
}
</style>
