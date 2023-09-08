<template>
  <cz-fieldset
    v-if="control.visible"
    :data-id="computedLabel.replaceAll(` `, ``)"
    :description="control.description"
    :hasToggle="false"
    :enabled="!appliedOptions.isDisabled"
    :readonly="!control.enabled"
    :errors="control.errors"
    :title="control.schema.title"
    :computedLabel="computedLabel"
  >
    <v-radio-group
      class="mt-0"
      :id="control.id + '-input'"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :class="styles.control.input"
      :required="control.required"
      :value="control.data"
      row
      v-bind="vuetifyProps('v-radio-group')"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <v-radio
        v-for="o in control.options"
        v-bind="vuetifyProps(`v-radio[${o.value}]`)"
        :key="o.value"
        :label="o.label"
        :value="o.value"
      ></v-radio>
    </v-radio-group>
  </cz-fieldset>
</template>

<script lang="ts">
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  rankWith,
  isEnumControl,
  optionIs,
  and,
} from "@jsonforms/core";
import {
  rendererProps,
  useJsonFormsEnumControl,
  RendererProps,
} from "@jsonforms/vue2";
import { VRadioGroup, VRadio, VLabel } from "vuetify/lib";

import { useVuetifyControl } from "@/renderers/util/composition";
import { defineComponent } from "vue";
import { default as CzFieldset } from "../controls/components/CzFieldset.vue";

const controlRenderer = defineComponent({
  name: "radio-group-control-renderer",
  components: {
    VRadioGroup,
    VRadio,
    VLabel,
    CzFieldset,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useVuetifyControl(useJsonFormsEnumControl(props));
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(20, and(isEnumControl, optionIs("format", "radio"))),
};
</script>
