<template>
  <!-- TODO: split these renderers -->
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-hover v-slot="{ hover }">
      <v-autocomplete
        v-if="hasAutoComplete"
        @change="onChange"
        :id="control.id + '-input'"
        :class="styles.control.input"
        :placeholder="placeholder"
        :label="computedLabel"
        :hint="control.description"
        :required="control.required"
        :error-messages="control.errors"
        :clearable="hover && !(!control.enabled || control.schema['readOnly'])"
        :value="control.data"
        :items="sortedOptions"
        v-bind="vuetifyProps('v-autocomplete')"
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
      </v-autocomplete>

      <v-select
        v-else
        @change="onChange"
        :id="control.id + '-input'"
        :class="styles.control.input"
        :placeholder="placeholder"
        :label="computedLabel"
        :hint="control.description"
        :required="control.required"
        :error-messages="control.errors"
        :clearable="hover && !(!control.enabled || control.schema['readOnly'])"
        :value="control.data"
        :items="customOptions"
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
import { default as ControlWrapper } from "./ControlWrapper.vue";

const controlRenderer = defineComponent({
  name: "oneof-enum-control-renderer",
  components: {
    VSelect,
    VHover,
    VAutocomplete,
    ControlWrapper,
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
