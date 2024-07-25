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
      :model-value="control.data"
      inline
      v-bind="vuetifyProps('v-radio-group')"
      hide-details
      @update:model-value="onChange"
      @update:focused="isFocused = $event"
      @blur="isFocused = false"
    >
      <v-radio
        v-for="o in control.options"
        v-bind="vuetifyProps(`v-radio[${o.value}]`)"
        :key="o.value"
        :label="o.label"
        :value="o.value"
        class="mr-4"
      ></v-radio>
    </v-radio-group>
  </cz-fieldset>
</template>

<script lang="ts">
import { ControlElement } from '@jsonforms/core';
import {
  rendererProps,
  useJsonFormsEnumControl,
  RendererProps,
} from '@jsonforms/vue';
import { VRadioGroup, VRadio, VLabel } from 'vuetify/components';

import { useVuetifyControl, useDefaults } from '@/renderers/util/composition';
import { defineComponent } from 'vue';
import { default as CzFieldset } from '../controls/components/cz.fieldset.vue';

export default defineComponent({
  name: 'radio-group-control-renderer',
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
    return useDefaults(useVuetifyControl(useJsonFormsEnumControl(props)));
  },
});
</script>
