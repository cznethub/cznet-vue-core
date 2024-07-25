<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-combobox
      v-disabled-icon-focus
      :id="control.id + '-input'"
      :class="styles.control.input"
      :placeholder="appliedOptions.placeholder"
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
      v-bind="vuetifyProps('v-combobox')"
      :items="items"
      :clearable="control.enabled && !isReadOnly"
      @update:model-value="onChange"
      @update:focused="isFocused = $event"
      @blur="isFocused = false"
    />
  </control-wrapper>
</template>

<script lang="ts">
import { ControlElement } from '@jsonforms/core';
import { defineComponent } from 'vue';
import {
  rendererProps,
  useJsonFormsControl,
  RendererProps,
} from '@jsonforms/vue';
import { useVuetifyControl } from '@/renderers/util/composition';
import { VCombobox } from 'vuetify/components';
import { default as ControlWrapper } from './ControlWrapper.vue';
import { DisabledIconFocus } from './directives';
import { findEnumSchema } from '../renderer';

export default defineComponent({
  name: 'anyof-string-or-enum-control-renderer',
  components: {
    VCombobox,
    ControlWrapper,
  },
  directives: {
    DisabledIconFocus,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useVuetifyControl(
      useJsonFormsControl(props),
      value => value || undefined
    );
  },
  computed: {
    items(): string[] {
      // made sure via the testers
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return findEnumSchema(this.control.schema.anyOf!)!.enum!;
    },
  },
});
</script>
