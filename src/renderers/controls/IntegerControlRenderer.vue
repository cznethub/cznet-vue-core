<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-text-field
      type="number"
      @change.native="beforeChange($event)"
      :step="step"
      :id="control.id + '-input'"
      :class="styles.control.input"
      :placeholder="placeholder"
      :label="computedLabel"
      :hint="control.description"
      :required="control.required"
      :error-messages="control.errors"
      :model-value="control.data"
      :clearable="control.enabled && !isReadOnly"
      v-bind="vuetifyProps('v-text-field')"
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
  isIntegerControl,
} from '@jsonforms/core';
import { defineComponent } from 'vue';
import {
  rendererProps,
  useJsonFormsControl,
  RendererProps,
} from '@jsonforms/vue';
import { useVuetifyControl } from '@/renderers/util/composition';
import { VTextField } from 'vuetify/components';
import { default as ControlWrapper } from './ControlWrapper.vue';
import CzFieldMessages from '../components/cz.field-messages.vue';

const controlRenderer = defineComponent({
  name: 'integer-control-renderer',
  components: {
    VTextField,
    ControlWrapper,
    CzFieldMessages,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useVuetifyControl(useJsonFormsControl(props), value => {
      const val = parseInt(value, 10);
      return isNaN(val) ? undefined : val;
    });
  },
  computed: {
    step(): number {
      const options: any = this.appliedOptions;
      return options.step ?? 1;
    },
  },
  methods: {
    // If value changed to an empty string, we need to set the data to undefined in order to trigger validation error
    beforeChange(event) {
      if (event.target.value === null || event.target.value.trim() === '') {
        this.handleChange(this.control.path, undefined);
      } else {
        this.onChange(event.target.value);
      }
    },
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isIntegerControl),
};
</script>
