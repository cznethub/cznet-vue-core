<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-hover v-slot="{ hover }">
      <v-combobox
        v-if="suggestions !== undefined"
        :id="control.id + '-input'"
        :data-id="computedLabel.replaceAll(` `, ``)"
        :class="styles.control.input"
        :disabled="!control.enabled"
        :autofocus="appliedOptions.focus"
        :placeholder="placeholder"
        :label="computedLabel"
        :hint="control.description"
        :required="control.required"
        :error-messages="control.errors"
        :clearable="hover"
        :maxlength="
          appliedOptions.restrict ? control.schema.maxLength : undefined
        "
        :counter="
          control.schema.maxLength !== undefined
            ? control.schema.maxLength
            : undefined
        "
        :value="control.data"
        :items="suggestions"
        v-bind="vuetifyProps('v-combobox')"
        @input="onChange"
      >
        <template v-slot:message>
          <div
            v-if="control.description"
            class="text-subtitle-1 text--secondary"
          >
            {{ control.description }}
          </div>
          <div v-if="cleanedErrors" class="pa-2 v-messages error--text">
            {{ cleanedErrors }}
          </div>
        </template>
      </v-combobox>

      <v-text-field
        v-else
        :id="control.id + '-input'"
        :data-id="computedLabel.replaceAll(` `, ``)"
        :class="styles.control.input"
        :disabled="!control.enabled"
        :autofocus="appliedOptions.focus"
        :placeholder="placeholder"
        :label="computedLabel"
        :hint="control.description"
        :required="control.required"
        :error-messages="control.errors"
        :value="control.data"
        :maxlength="
          appliedOptions.restrict ? control.schema.maxLength : undefined
        "
        :counter="
          control.schema.maxLength !== undefined
            ? control.schema.maxLength
            : undefined
        "
        :clearable="hover"
        v-bind="vuetifyProps('v-text-field')"
        @input="onChange"
      >
        <template v-slot:message>
          <div
            v-if="control.description"
            class="text-subtitle-1 text--secondary"
          >
            {{ control.description }}
          </div>
          <div v-if="cleanedErrors" class="pa-2 v-messages error--text">
            {{ cleanedErrors }}
          </div>
        </template>
      </v-text-field>
    </v-hover>
  </control-wrapper>
</template>

<script lang="ts">
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  rankWith,
  isStringControl,
} from "@jsonforms/core";
import { defineComponent } from "vue";
import {
  rendererProps,
  useJsonFormsControl,
  RendererProps,
} from "@jsonforms/vue2";
import { useDefaults, useVuetifyControl } from "@/renderers/util/composition";
import isArray from "lodash/isArray";
import every from "lodash/every";
import isString from "lodash/isString";

import { default as ControlWrapper } from "./ControlWrapper.vue";

import { VTextField, VCombobox, VHover } from "vuetify/lib";

const controlRenderer = defineComponent({
  name: "string-control-renderer",
  props: {
    ...rendererProps<ControlElement>(),
  },
  components: {
    VTextField,
    VCombobox,
    VHover,
    ControlWrapper,
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useJsonFormsControl(props);
    useDefaults(control);

    return useVuetifyControl(control, (value) => value || undefined, 300);
  },
  created() {
    if (this.control.data && typeof this.control.data !== "string") {
      // Unsupported data type
      this.handleChange(this.control.path, undefined);
    }
  },
  computed: {
    suggestions(): string[] | undefined {
      const suggestions = this.control.uischema.options?.suggestions;
      if (
        suggestions === undefined ||
        !isArray(suggestions) ||
        !every(suggestions, isString)
      ) {
        // check for incorrect data
        return undefined;
      }
      return suggestions;
    },
    isReadOnly() {
      // @ts-ignore
      return this.control.schema.options?.readonly;
    },
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isStringControl),
};
</script>

<style lang="scss" scoped></style>
