<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-hover v-slot="{ isHovering }">
      <v-textarea
        :id="control.id + '-input'"
        :data-id="computedLabel.replaceAll(` `, ``)"
        @input="onChange"
        :maxlength="
          appliedOptions.restrict ? control.schema.maxLength : undefined
        "
        :counter="
          control.schema.maxLength !== undefined
            ? control.schema.maxLength
            : undefined
        "
        :error-messages="control.errors"
        :required="control.required"
        :hint="control.description"
        :model-value="control.data"
        :placeholder="placeholder"
        :label="computedLabel"
        :clearable="control.enabled && !isReadOnly"
        v-bind="vuetifyProps('v-textarea')"
      >
        <template v-slot:message>
          <cz-field-messages
            :description="control.description"
            :errors="cleanedErrors"
          />
        </template>
      </v-textarea>
    </v-hover>
  </control-wrapper>
</template>

<script lang="ts">
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  rankWith,
  isStringControl,
  isMultiLineControl,
  and,
} from '@jsonforms/core';
import { defineComponent } from 'vue';
import {
  rendererProps,
  useJsonFormsControl,
  RendererProps,
} from '@jsonforms/vue';
import { useDefaults, useVuetifyControl } from '@/renderers/util/composition';
import { VTextarea, VHover } from 'vuetify/components';
import { default as ControlWrapper } from './ControlWrapper.vue';
import CzFieldMessages from '../components/cz.field-messages.vue';

const controlRenderer = defineComponent({
  name: 'multi-string-control-renderer',
  components: { VTextarea, VHover, ControlWrapper, CzFieldMessages },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useJsonFormsControl(props);
    useDefaults(control);
    return useVuetifyControl(control, value => value || undefined, 300);
  },
  created() {
    // If a value was loaded, check if HTML needs to be stripped
    if (this.control.data && this.stripHTML) {
      this.handleChange(this.control.path, this.strip(this.control.data));
    }
  },
  computed: {
    stripHTML(): string {
      // @ts-ignore
      return !!this.control.schema.options?.stripHTML;
    },
  },
  methods: {
    strip(html: string) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    },
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(4, and(isStringControl, isMultiLineControl)),
};
</script>
