<template>
  <!-- A CSS grid keyed to the CONTAINER's width, not the viewport's. The old
       `flex-column flex-md-row` split on the 960px viewport breakpoint, which
       has no relation to the space actually available — pairs stayed stacked
       in a wide dialog and were forced side-by-side in a 22rem sidebar. The
       grid also replaces v-row's -12px gutter margins, which bled out of the
       pa-0 container on both edges. -->
  <div
    v-if="layout.visible"
    :class="`cz-horizontal-layout ${styles.horizontalLayout.root}`"
  >
    <div
      v-for="(element, index) in elements"
      :data-id="`horizontal-${index}`"
      :key="`${layout.path}-${index}`"
      :class="styles.horizontalLayout.item"
      class="cz-horizontal-layout__item"
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
import { defineComponent } from 'vue';
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsLayout,
  RendererProps,
} from '@jsonforms/vue';
import { useVuetifyLayout } from '@/renderers/util/composition';
import { VContainer, VRow, VCol } from 'vuetify/components';
const layoutRenderer = defineComponent({
  name: 'horizontal-layout-renderer',
  components: {
    DispatchRenderer,
    VContainer,
    VRow,
    VCol,
  },
  props: {
    ...rendererProps<Layout>(),
  },
  setup(props: RendererProps<Layout>) {
    return useVuetifyLayout(useJsonFormsLayout(props));
  },
  computed: {
    elements() {
      // @ts-ignore
      return this.layout.uischema.elements;
    },
  },
});

export default layoutRenderer;
</script>

<style scoped lang="scss">
.cz-horizontal-layout {
  display: grid;
  // Fields drop to their own row once they'd be narrower than ~14rem,
  // measured against this container rather than the window.
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  column-gap: 1rem;
  align-items: start;

  &__item {
    min-width: 0; // let long values ellipsize instead of forcing overflow
  }
}
</style>
