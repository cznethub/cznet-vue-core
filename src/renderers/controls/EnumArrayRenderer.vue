<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-select
      @update:model-value="beforeChange"
      :id="control.id + '-input'"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :class="styles.control.input"
      :label="computedLabel"
      :hint="control.description"
      :required="control.required"
      :error-messages="control.errors"
      :clearable="control.enabled && !isReadOnly"
      :model-value="control.data"
      :items="control.options"
      v-bind="vuetifyProps(`v-select`)"
      chips
      small-chips
      deletable-chips
      item-title="label"
      item-value="value"
      multiple
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
import {
  ControlElement,
  mapDispatchToMultiEnumProps,
  mapStateToMultiEnumControlProps,
  composePaths,
} from '@jsonforms/core';
import { VContainer, VRow, VCol, VSelect } from 'vuetify/components';
import {
  DispatchRenderer,
  rendererProps,
  RendererProps,
  useControl,
  ControlProps,
  useJsonFormsControl,
} from '@jsonforms/vue';
import { defineComponent } from 'vue';
import { useVuetifyBasicControl } from '@/renderers/util/composition';
import { default as ControlWrapper } from './ControlWrapper.vue';
import CzFieldMessages from '../components/cz.field-messages.vue';

//TODO: move into JsonForm Vue project under src/components/jsonFormsCompositions.ts
const useJsonFormsMultiEnumControl = (props: ControlProps) => {
  return useControl(
    props,
    mapStateToMultiEnumControlProps,
    mapDispatchToMultiEnumProps
  );
};

import { useVuetifyControl } from '@/renderers/util/composition';

export default defineComponent({
  name: 'enum-array-renderer',
  components: {
    DispatchRenderer,
    VContainer,
    VRow,
    VCol,
    VSelect,
    ControlWrapper,
    CzFieldMessages,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return {
      ...useVuetifyControl(
        useJsonFormsControl(props),
        value => value || undefined
      ), // Needed for handleChange and onChange function
      ...useVuetifyBasicControl(useJsonFormsMultiEnumControl(props)),
    };
  },
  methods: {
    dataHasEnum(value: any) {
      return !!this.control.data?.includes(value);
    },
    composePaths,
    // If value changed to an empty array, we need to set the data to undefined in order to trigger validation errors
    beforeChange(items: string[]) {
      if (!items.length) {
        this.handleChange(this.control.path, undefined);
      } else {
        this.onChange(items);
      }
    },
  },
});
</script>
