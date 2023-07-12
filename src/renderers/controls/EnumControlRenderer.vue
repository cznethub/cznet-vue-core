<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-hover v-slot="{ hover }">
      <v-select
        @change="onChange"
        @focus="isFocused = true"
        @blur="isFocused = false"
        :id="control.id + '-input'"
        :data-id="computedLabel.replaceAll(` `, ``)"
        :disabled="!control.enabled || control.schema.readOnly"
        :autofocus="appliedOptions.focus"
        :placeholder="appliedOptions.placeholder"
        :label="computedLabel"
        :hint="control.description"
        :required="control.required"
        :error-messages="control.errors"
        :clearable="hover && !control.schema.readOnly"
        :value="control.data"
        :items="control.options"
        :readonly="control.schema.readOnly"
        v-bind="vuetifyProps('v-select')"
        item-text="label"
        item-value="value"
      >
        <template v-slot:message>
          <div
            v-if="control.description"
            class="text-subtitle-1 text--secondary"
          >
            {{ control.description }}
          </div>
          <div v-if="cleanedErrors" class="v-messages error--text">
            {{ cleanedErrors }}
          </div>
        </template>
      </v-select>
    </v-hover>
  </control-wrapper>
</template>

<script lang="ts">
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  rankWith,
  isEnumControl,
} from "@jsonforms/core";
import { defineComponent } from "vue";
import {
  rendererProps,
  useJsonFormsEnumControl,
  RendererProps,
} from "@jsonforms/vue2";
import { useDefaults, useVuetifyControl } from "@/renderers/util/composition";
import { VSelect, VHover } from "vuetify/lib";
import { default as ControlWrapper } from "./ControlWrapper.vue";

const controlRenderer = defineComponent({
  name: "enum-control-renderer",
  components: {
    VSelect,
    VHover,
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useJsonFormsEnumControl(props);
    useDefaults(control);
    return useVuetifyControl(control, (value) => value || undefined);
  },
});

export default controlRenderer;
export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, isEnumControl),
};
</script>
