<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-hover v-slot="{ isHovering }">
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
        <template v-slot:message>
          <cz-field-messages
            :description="control.description"
            :errors="cleanedErrors"
          />
        </template>
      </v-select>
    </v-hover>
  </control-wrapper>
</template>

<script lang="ts">
import {
  and,
  ControlElement,
  hasType,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  mapDispatchToMultiEnumProps,
  mapStateToMultiEnumControlProps,
  rankWith,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
  composePaths,
} from '@jsonforms/core';
import { VContainer, VRow, VCol, VSelect, VHover } from 'vuetify/components';
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

const controlRenderer = defineComponent({
  name: 'enum-array-renderer',
  components: {
    DispatchRenderer,
    VContainer,
    VRow,
    VCol,
    VSelect,
    VHover,
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

export default controlRenderer;

const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema: JsonSchema): boolean =>
  schema.type === 'string' && schema.enum !== undefined;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(
    5,
    and(
      uiTypeIs('Control'),
      and(
        schemaMatches(
          schema =>
            hasType(schema, 'array') &&
            !Array.isArray(schema.items) &&
            schema.uniqueItems === true
        ),
        schemaSubPathMatches('items', schema => {
          return hasOneOfItems(schema) || hasEnumItems(schema);
        })
      )
    )
  ),
};
</script>
