<template>
  <cz-fieldset
    v-if="control.visible"
    :data-id="computedLabel.replaceAll(` `, ``)"
    :description="control.description"
    :hasToggle="hasToggle"
    :enabled="!appliedOptions.isDisabled && control.enabled"
    :readonly="!control.enabled"
    :errors="control.errors"
    :title="title"
    :computedLabel="computedLabel"
    :isFlat="isFlat"
    @hide="onHide"
  >
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
  </cz-fieldset>
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
import { default as CzFieldset } from "../controls/components/CzFieldset.vue";

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
  methods: {
    onHide() {
      this.handleChange(this.control.path, undefined);
    },
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
      return this.control.schema["options"]?.flat;
    },
    hasToggle() {
      return !this.control.required && !this.isFlat;
    },
    title(): string {
      return (
        // @ts-ignore
        this.control.schema?.options?.title || this.control.schema.title || ""
      );
    },
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, isAllOfControl),
};
</script>
