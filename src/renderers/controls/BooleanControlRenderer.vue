<template>
  <v-checkbox
    :id="control.id + '-input'"
    :class="styles.control.input"
    :label="computedLabel"
    :hint="control.description"
    :required="control.required"
    :error-messages="control.errors"
    :indeterminate="control.data === undefined"
    :input-value="control.data"
    :model-value="control.data"
    v-bind="vuetifyProps('v-checkbox')"
    @change="onChange"
    @focus="isFocused = true"
    @blur="isFocused = false"
  >
    <template v-slot:message>
      <div v-if="control.description" class="text-subtitle-1 text--secondary">
        {{ control.description }}
      </div>
      <div v-if="cleanedErrors" class="v-messages error--text">
        {{ cleanedErrors }}
      </div>
    </template>
  </v-checkbox>
</template>

<script lang="ts">
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  rankWith,
  isBooleanControl,
} from '@jsonforms/core';
import { defineComponent } from 'vue';
import {
  rendererProps,
  useJsonFormsControl,
  RendererProps,
} from '@jsonforms/vue';
import { useDefaults, useVuetifyControl } from '@/renderers/util/composition';
import { VCheckbox } from 'vuetify/components';

const controlRenderer = defineComponent({
  name: 'boolean-control-renderer',
  components: {
    VCheckbox,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useJsonFormsControl(props);
    useDefaults(control);
    return useVuetifyControl(control, newValue => newValue || false);
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(1, isBooleanControl),
};
</script>
