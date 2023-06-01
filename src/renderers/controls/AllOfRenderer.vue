<template>
  <div v-if="control.visible">
    <fieldset
      class="cz-fieldset"
      :data-id="control.schema.title.replaceAll(` `, ``)"
    >
      <legend v-if="control.schema.title" class="v-label--active">
        {{ control.schema.title }}
      </legend>
      <template v-if="delegateUISchema">
        <dispatch-renderer
          :schema="subSchema"
          :uischema="delegateUISchema"
          :path="control.path"
          :enabled="control.enabled"
          :renderers="control.renderers"
          :cells="control.cells"
        />
      </template>
      <template v-else-if="allOfRenderInfos">
        <dispatch-renderer
          v-for="(allOfRenderInfo, allOfIndex) in allOfRenderInfos"
          :key="`${control.path}-${allOfIndex}`"
          :schema="allOfRenderInfo.schema"
          :uischema="allOfRenderInfo.uischema"
          :path="control.path"
          :enabled="control.enabled"
          :renderers="control.renderers"
          :cells="control.cells"
        />
      </template>
    </fieldset>
    <div
      v-if="control.description"
      class="text--secondary text-body-1 mt-2 px-2"
    >
      {{ control.description }}
    </div>
    <div v-if="cleanedErrors" class="px-2 v-messages error--text">
      <v-divider v-if="isFlat" class="mb-4"></v-divider>
      {{ cleanedErrors }}
    </div>
  </div>
</template>

<script lang="ts">
import {
  CombinatorSubSchemaRenderInfo,
  ControlElement,
  createCombinatorRenderInfos,
  findMatchingUISchema,
  isAllOfControl,
  JsonFormsRendererRegistryEntry,
  rankWith,
  UISchemaElement,
} from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  RendererProps,
  useJsonFormsAllOfControl,
} from "@jsonforms/vue2";
import { defineComponent } from "vue";
import { useVuetifyControl } from "@/renderers/util/composition";
import { VDivider } from "vuetify/lib";
import CzFieldset from "@/renderers/controls/components/CzFieldset.vue";

const controlRenderer = defineComponent({
  name: "all-of-renderer",
  components: {
    DispatchRenderer,
    VDivider,
    CzFieldset,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useVuetifyControl(useJsonFormsAllOfControl(props));
  },
  computed: {
    delegateUISchema(): UISchemaElement {
      return findMatchingUISchema(this.control.uischemas)(
        this.control.schema,
        this.control.uischema.scope,
        this.control.path
      );
    },
    allOfRenderInfos(): CombinatorSubSchemaRenderInfo[] {
      const result = createCombinatorRenderInfos(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.control.schema.allOf!,
        this.control.rootSchema,
        "allOf",
        this.control.uischema,
        this.control.path,
        this.control.uischemas
      );

      return result.filter((info) => info.uischema);
    },
    isFlat() {
      return this.control.uischema.options?.flat;
    },
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, isAllOfControl),
};
</script>
