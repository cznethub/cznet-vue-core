<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-combobox
      v-if="suggestions !== undefined"
      :id="control.id + '-input'"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :class="styles.control.input"
      :readonly="!control.enabled"
      :placeholder="placeholder"
      :label="computedLabel"
      :hint="control.description"
      :required="control.required"
      :error-messages="control.errors"
      :clearable="control.enabled && !isReadOnly"
      :maxlength="
        appliedOptions.restrict ? control.schema.maxLength : undefined
      "
      :counter="
        control.schema.maxLength !== undefined
          ? control.schema.maxLength
          : undefined
      "
      :model-value="control.data"
      :items="suggestions"
      v-bind="vuetifyProps('v-combobox')"
      @update:model-value="onChange"
    >
      <template v-slot:message>
        <cz-field-messages
          :description="control.description"
          :errors="cleanedErrors"
        />
      </template>
    </v-combobox>

    <v-text-field
      v-else
      :id="control.id + '-input'"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :class="styles.control.input"
      :label="computedLabel"
      :hint="control.description"
      :required="control.required"
      :error-messages="control.errors"
      :model-value="control.data"
      :maxlength="
        appliedOptions.restrict ? control.schema.maxLength : undefined
      "
      :counter="
        control.schema.maxLength !== undefined
          ? control.schema.maxLength
          : undefined
      "
      :clearable="control.enabled && !isReadOnly"
      v-bind="vuetifyProps('v-text-field')"
      @update:model-value="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <template v-slot:message>
        <cz-field-messages
          :description="control.description"
          :errors="cleanedErrors"
        />
      </template>
    </v-text-field>
  </control-wrapper>
</template>

<script lang="ts">
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  rankWith,
  isStringControl,
} from '@jsonforms/core';
import { defineComponent } from 'vue';
import {
  rendererProps,
  useJsonFormsControl,
  RendererProps,
} from '@jsonforms/vue';
import { useDefaults, useVuetifyControl } from '@/renderers/util/composition';
import { isArray, every, isString } from 'lodash-es';
import { default as ControlWrapper } from './ControlWrapper.vue';
import { VTextField, VCombobox } from 'vuetify/components';
import czFieldMessages from '../components/cz.field-messages.vue';

const controlRenderer = defineComponent({
  name: 'string-control-renderer',
  props: {
    ...rendererProps<ControlElement>(),
  },
  components: {
    VTextField,
    VCombobox,
    ControlWrapper,
    czFieldMessages,
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useDefaults(useJsonFormsControl(props));
    return useVuetifyControl(control, value => value || undefined, 300);
  },
  created() {
    if (this.control.data && typeof this.control.data !== 'string') {
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
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isStringControl),
};
</script>

<style lang="scss" scoped></style>
