<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-combobox
      v-model="tags"
      @update:model-value="onTagsChange"
      :label="computedLabel"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :hint="control.description"
      :delimiters="delimeters"
      :error-messages="control.errors"
      :menu-props="{ openOnClick: false }"
      small-chips
      multiple
      no-filter
      chips
      hide-details="auto"
      :id="control.id + '-input'"
      :class="styles.control.input"
      :placeholder="placeholder"
      :required="control.required"
      :clearable="control.enabled && !isReadOnly"
      closable-chips
      :items="suggestions"
      v-bind="vuetifyProps('v-combobox')"
      item-text="label"
      item-value="value"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <template v-slot:chip="{ item }">
        <v-chip
          :readonly="!control.enabled || isReadOnly"
          :disabled="appliedOptions.isDisabled"
          :closable="
            !(isRequired(item.value) || !control.enabled || isReadOnly)
          "
          @click:close="remove(item.value)"
          small
        >
          {{ item.value }}
        </v-chip>
      </template>

      <template v-slot:message>
        <cz-field-messages
          :description="control.description"
          :errors="cleanedErrors"
        />
      </template>
    </v-combobox>
  </control-wrapper>
</template>

<script lang="ts">
import {
  and,
  ControlElement,
  isPrimitiveArrayControl,
  JsonFormsRendererRegistryEntry,
  JsonSchema7,
  not,
  rankWith,
  UISchemaElement,
} from '@jsonforms/core';
import { defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { VHover, VCombobox, VChip } from 'vuetify/components';
import { useVuetifyControl } from '@/renderers/util/composition';
import { default as ControlWrapper } from '../controls/ControlWrapper.vue';
import { isArray, every, isString } from 'lodash-es';
import czFieldMessages from '../components/cz.field-messages.vue';

const controlRenderer = defineComponent({
  name: 'array-primitive-control-renderer',
  components: {
    VHover,
    VCombobox,
    VChip,
    ControlWrapper,
    czFieldMessages,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: any) {
    const tags: string[] = [];
    return {
      tags,
      ...useVuetifyControl(
        useJsonFormsControl(props),
        value => value || undefined
      ),
    };
  },
  created() {
    // If no initial value, load default. Otherwise, load the data
    if (!this.control.data) {
      if (this.control.schema.default) {
        this.tags = this.control.schema.default;
        this.onChange(this.tags);
      } else {
        this.onChange(undefined);
      }
    } else {
      this.tags = this.control.data;
      this.onChange(this.tags);
    }

    // @ts-ignore
    const requiredValues = this.control.schema.contains?.enum;

    if (requiredValues && this.control.data) {
      // We need to check if existing values are required values with different casing. And if so, use the casing specified in required values.
      const existingValues = this.control.data.filter(
        (val: string) =>
          !requiredValues.some(
            (requiredVal: string) =>
              requiredVal.toLowerCase().trim() === val.toLowerCase().trim()
          )
      );

      // TODO: add the missing requried value to the submission in the repository. For now autopopulated in our forms.
      this.tags = [...new Set([...requiredValues, ...existingValues])];
      this.onChange(this.tags);
    }
  },
  computed: {
    delimeters() {
      // @ts-ignore
      return this.control.schema.options?.delimeter === false
        ? undefined
        : [','];
    },
    suggestions(): string[] | undefined {
      // TODO: modify schema files to use options from uischema
      const suggestions = this.control.uischema.options?.suggestion;

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
  methods: {
    onTagsChange(tags: string[]) {
      this.tags = tags;
      // Prevent inserting duplicates and trim values
      this.tags = this.tags.filter(tag => !!tag.trim()).map(tag => tag.trim());

      // pre-process to remove duplicates of different casing
      this.tags = this.tags.reduce((acc, curr, _prev) => {
        if (!acc.some(tag => curr.toLowerCase() === tag.toLocaleLowerCase())) {
          acc.push(curr);
        }
        return acc;
      }, [] as string[]);

      this.tags = [...new Set(this.tags)];
      this.handleChange(this.control.path, this.tags);
    },
    remove(item: string) {
      this.tags.splice(this.tags.indexOf(item), 1);
      this.handleChange(this.control.path, this.tags);
    },
    isRequired(item: string) {
      const schema = this.control.schema as JsonSchema7;
      return schema.contains && schema.contains.enum?.includes(item);
    },
  },
});
export default controlRenderer;

const useArrayLayout = (uiSchema: UISchemaElement) => {
  return uiSchema.options?.useArrayLayout;
};

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(4, and(not(useArrayLayout), isPrimitiveArrayControl)),
};
</script>

<style lang="scss" scoped>
:deep(.v-input__append-inner) {
  display: none !important;
}
</style>
