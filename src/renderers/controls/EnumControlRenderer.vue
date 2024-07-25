<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-select
      @update:model-value="onChange"
      @update:focused="isFocused = $event"
      @blur="isFocused = false"
      :id="control.id + '-input'"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :label="computedLabel"
      :hint="control.description"
      :required="control.required"
      :error-messages="control.errors"
      :clearable="control.enabled && !isReadOnly"
      :model-value="control.data"
      :items="control.options"
      v-bind="vuetifyProps('v-select')"
      item-title="label"
      item-value="value"
    >
      <template #message>
        <cz-field-messages
          :description="control.description"
          :errors="cleanedErrors"
        />
      </template>
    </v-select>
  </control-wrapper>
</template>

<script lang="ts">
import { ControlElement } from '@jsonforms/core';
import { defineComponent } from 'vue';
import {
  rendererProps,
  useJsonFormsEnumControl,
  RendererProps,
} from '@jsonforms/vue';
import { useDefaults, useVuetifyControl } from '@/renderers/util/composition';
import { VSelect } from 'vuetify/components';
import { default as ControlWrapper } from './ControlWrapper.vue';
import CzFieldMessages from '../components/cz.field-messages.vue';

export default defineComponent({
  name: 'enum-control-renderer',
  components: {
    VSelect,
    ControlWrapper,
    CzFieldMessages,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useJsonFormsEnumControl(props);
    useDefaults(control);
    return useVuetifyControl(control, value => value || undefined);
  },
});
</script>
