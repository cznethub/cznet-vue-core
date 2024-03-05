<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :appliedOptions="appliedOptions"
  >
    <cz-fieldset
      v-if="control.visible"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :description="control.description"
      :hasToggle="
        hasToggle &&
        !appliedOptions.isViewMode &&
        !appliedOptions.isReadOnly &&
        !appliedOptions.isDisabled
      "
      :hasData="hasData"
      :enabled="!appliedOptions.isDisabled"
      :readonly="!control.enabled || isReadOnly"
      :errors="control.errors"
      :title="control.schema.title"
      :computedLabel="computedLabel"
      :isFlat="isFlat"
      @hide="onHide"
      @show="onShow"
      class="pb-5"
    >
      <dispatch-renderer
        :visible="control.visible"
        :enabled="control.enabled"
        :schema="control.schema"
        :uischema="detailUiSchema"
        :path="control.path"
        :renderers="control.renderers"
        :cells="control.cells"
      />
    </cz-fieldset>
  </control-wrapper>
</template>

<script lang="ts">
import {
  ControlElement,
  createDefaultValue,
  findUISchema,
  Generate,
  isObjectControl,
  JsonFormsRendererRegistryEntry,
  rankWith,
  UISchemaElement,
} from '@jsonforms/core';
import {
  DispatchRenderer,
  rendererProps,
  RendererProps,
  useJsonFormsControlWithDetail,
} from '@jsonforms/vue';
import { cloneDeep } from 'lodash-es';
import { useNested, useVuetifyControl } from '@/renderers/util/composition';
import { defineComponent } from 'vue';
import { VBtn, VIcon, VTooltip } from 'vuetify/components';
import { default as CzFieldset } from '../controls/components/cz.fieldset.vue';
import { default as ControlWrapper } from './ControlWrapper.vue';

const controlRenderer = defineComponent({
  name: 'object-control-renderer',
  components: {
    DispatchRenderer,
    VBtn,
    VIcon,
    VTooltip,
    CzFieldset,
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useVuetifyControl(useJsonFormsControlWithDetail(props));
    const nested = useNested('object');
    return {
      ...control,
      input: control,
      nested,
    };
  },
  // @deprecated: all of our renderers can now handle objects with undefined property values
  // watch: {
  //   "control.data": function (newVal, _oldVal) {
  //     if (newVal) {
  //       const filteredObj = Object.fromEntries(
  //         Object.entries(newVal).filter(([_, value]) => value !== undefined) // strip out undefined properties
  //       );

  //       if (isEqual(filteredObj, {})) {
  //         this.handleChange(this.control.path, undefined);
  //       }
  //     }
  //   },
  // },
  created() {
    if (!this.control.data && !this.hasToggle) {
      const val = createDefaultValue(
        this.control.schema,
        this.control.rootSchema
      );
      this.handleChange(this.control.path, val);
    }
  },
  methods: {
    onHide() {
      this.handleChange(this.control.path, undefined);
    },
    onShow() {
      if (!this.control.data) {
        const defaultSchema = this.control.schema;
        const val = createDefaultValue(defaultSchema, this.control.rootSchema);
        this.handleChange(this.control.path, val);
      }
    },
  },
  computed: {
    detailUiSchema(): UISchemaElement {
      const uiSchemaGenerator = () => {
        const uiSchema = Generate.uiSchema(this.control.schema, 'Object');
        return uiSchema;
      };
      let result = findUISchema(
        this.control.uischemas,
        this.control.schema,
        this.control.uischema.scope,
        this.control.path,
        uiSchemaGenerator,
        this.control.uischema,
        this.control.rootSchema
      );
      if (this.nested.level > 0) {
        result = cloneDeep(result);
        result.options = {
          ...result.options,
          bare: true,
          alignLeft:
            this.nested.level >= 4 || this.nested.parentElement === 'array',
        };
      }
      return result;
    },
    hasToggle() {
      return !this.control.required && !this.isFlat;
    },
    isFlat() {
      return this.control.schema.options?.flat;
    },
    hasData(): boolean {
      return !!this.control.data;
    },
  },
});
export default controlRenderer;
export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isObjectControl),
};
</script>
