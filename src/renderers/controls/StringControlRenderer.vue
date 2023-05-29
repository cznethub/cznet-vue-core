<template>
  <div>
    <v-combobox
      v-if="suggestions !== undefined"
      :id="control.id + '-input'"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :class="styles.control.input"
      :disabled="!control.enabled"
      :autofocus="appliedOptions.focus"
      :placeholder="placeholder"
      :label="computedLabel"
      :hint="description"
      persistent-hint
      :required="control.required"
      :error-messages="control.errors"
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
      hide-details="auto"
      hide-no-data
      v-bind="vuetifyProps('v-combobox')"
      @input="onChange"
      dense
      outlined
      class="py-3"
    >
      <template v-slot:message>
        <div v-if="description" class="text-subtitle-1 text--secondary">
          {{ description }}
        </div>
        <div v-if="cleanedErrors" class="ml-2 v-messages error--text">
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
      :hint="description"
      persistent-hint
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
      v-bind="vuetifyProps('v-text-field')"
      @input="onChange"
      class="py-3"
      dense
      outlined
    >
      <template v-slot:message>
        <div v-if="description" class="text-subtitle-1 text--secondary">
          {{ description }}
        </div>
        <div v-if="cleanedErrors" class="ml-2 v-messages error--text">
          {{ cleanedErrors }}
        </div>
      </template>
    </v-text-field>
  </div>
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

import { VTextField, VCombobox } from "vuetify/lib";

const controlRenderer = defineComponent({
  name: "string-control-renderer",
  props: {
    ...rendererProps<ControlElement>(),
  },
  components: {
    VTextField,
    VCombobox,
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
