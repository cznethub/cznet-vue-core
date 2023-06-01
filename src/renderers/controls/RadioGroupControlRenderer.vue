<template>
  <div class="py-3">
    <fieldset class="cz-fieldset">
      <legend v-if="computedLabel" class="v-label v-label--active">
        {{ computedLabel }}
      </legend>

      <v-radio-group
        class="mt-0"
        :id="control.id + '-input'"
        :data-id="computedLabel.replaceAll(` `, ``)"
        :class="styles.control.input"
        :disabled="!control.enabled"
        :autofocus="appliedOptions.focus"
        :placeholder="appliedOptions.placeholder"
        :required="control.required"
        :value="control.data"
        hide-details="auto"
        persistent-hint
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
    </fieldset>
    <div v-if="description" class="text--secondary text-body-1 ml-2">
      {{ description }}
    </div>
    <div v-if="control.errors" class="ml-2 v-messages error--text">
      {{ control.errors }}
    </div>
  </div>
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

const controlRenderer = defineComponent({
  name: "radio-group-control-renderer",
  components: {
    VRadioGroup,
    VRadio,
    VLabel,
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
