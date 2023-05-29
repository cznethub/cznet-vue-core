<template>
  <!-- TODO: split these renderers -->
  <v-hover v-slot="{ hover }">
    <v-autocomplete
      v-if="hasAutoComplete"
      @change="onChange"
      :id="control.id + '-input'"
      :class="styles.control.input"
      :disabled="!control.enabled"
      :autofocus="appliedOptions.focus"
      :placeholder="placeholder"
      :label="computedLabel"
      :hint="description"
      :required="control.required"
      :error-messages="control.errors"
      :clearable="hover"
      :value="control.data"
      :items="sortedOptions"
      item-text="label"
      item-value="value"
      persistent-hint
      class="py-3"
      hide-details="auto"
      outlined
      dense
    />

    <v-select
      v-else
      @change="onChange"
      :id="control.id + '-input'"
      :class="styles.control.input"
      :disabled="!control.enabled"
      :autofocus="appliedOptions.focus"
      :placeholder="placeholder"
      :label="computedLabel"
      :hint="description"
      :required="control.required"
      :error-messages="control.errors"
      :clearable="hover"
      :value="control.data"
      :items="customOptions"
      item-text="label"
      item-value="value"
      persistent-hint
      class="py-3"
      hide-details="auto"
      outlined
      dense
    />
  </v-hover>
</template>

<script lang="ts">
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  rankWith,
  isOneOfEnumControl,
  EnumOption,
} from "@jsonforms/core";
import { defineComponent } from "vue";
import {
  rendererProps,
  useJsonFormsOneOfEnumControl,
  RendererProps,
} from "@jsonforms/vue2";
import { useDefaults, useVuetifyControl } from "@/renderers/util/composition";
import { VSelect, VHover, VAutocomplete } from "vuetify/lib";

const controlRenderer = defineComponent({
  name: "oneof-enum-control-renderer",
  components: {
    VSelect,
    VHover,
    VAutocomplete,
  },
  directives: {},
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useJsonFormsOneOfEnumControl(props);
    useDefaults(control);
    return useVuetifyControl(control, (value) => value || undefined);
  },
  computed: {
    hasAutoComplete() {
      // @ts-ignore
      return this.control.schema.options?.hasAutoComplete;
    },
    sortedOptions() {
      // @ts-ignore
      return this.control.options.sort((a: EnumOption, b: EnumOption) => {
        return a.label < b.label ? -1 : 1;
      });
    },
    customOptions() {
      const schemaOptions = this.control.schema.oneOf;
      // @ts-ignore
      return this.control.options.map((option, index) => {
        return {
          ...option,
          // @ts-ignore
          header: schemaOptions[index].header,
          // @ts-ignore
          divider: schemaOptions[index].divider,
        };
      });
    },
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(5, isOneOfEnumControl),
};
</script>
