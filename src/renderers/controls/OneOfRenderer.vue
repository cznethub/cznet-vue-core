<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <cz-fieldset
      v-if="control.visible"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :description="!!isDropDown ? '' : desc"
      :hasToggle="hasToggle"
      :hasData="!noData"
      :enabled="!appliedOptions.isDisabled"
      :readonly="!control.enabled"
      :errors="control.errors"
      :title="title"
      :computedLabel="computedLabel"
      :isFlat="isFlat"
      @hide="onHide"
    >
      <combinator-properties
        :schema="control.schema"
        :path="path"
        combinatorKeyword="oneOf"
      />

      <template v-if="!isDropDown">
        <v-tabs v-model="selectedIndex">
          <v-tab
            v-for="(oneOfRenderInfo, oneOfIndex) in oneOfRenderInfos"
            :key="`${control.path}-${oneOfIndex}`"
            :model-value="`${control.path}-${oneOfIndex}`"
            @change="handleTabChange(oneOfIndex)"
            :disabled="
              (appliedOptions.isViewMode ||
                appliedOptions.isReadOnly ||
                appliedOptions.isDisabled) &&
              selectedIndex !== oneOfIndex
            "
          >
            {{ oneOfRenderInfo.uischema['label'] || oneOfRenderInfo.label }}
          </v-tab>
        </v-tabs>

        <v-window v-model="selectedIndex">
          <v-window-item
            v-for="(oneOfRenderInfo, oneOfIndex) in oneOfRenderInfos"
            :key="`${control.path}-${oneOfIndex}`"
          >
            <dispatch-renderer
              v-if="selectedIndex === oneOfIndex"
              :schema="oneOfRenderInfo.schema"
              :uischema="oneOfRenderInfo.uischema"
              :path="control.path"
              :renderers="control.renderers"
              :cells="control.cells"
              :enabled="control.enabled"
            />
          </v-window-item>
        </v-window>
      </template>

      <template v-else>
        <v-select
          @update:model-value="handleTabChange"
          :items="oneOfRenderInfos"
          :label="title"
          :hint="selectHint"
          :model-value="oneOfRenderInfos[selectedIndex]"
          :data-id="computedLabel.replaceAll(` `, ``)"
          :required="control.required"
          :error-messages="control.errors"
          v-bind="vuetifyProps('v-select')"
          item-title="label"
        >
          {{ currentLabel }}
        </v-select>

        <dispatch-renderer
          v-if="selectedIndex >= 0 && oneOfRenderInfos[selectedIndex]"
          :key="selectedIndex"
          :schema="oneOfRenderInfos[selectedIndex].schema"
          :uischema="oneOfRenderInfos[selectedIndex].uischema"
          :path="control.path"
          :renderers="control.renderers"
          :cells="control.cells"
          :enabled="control.enabled"
        />
      </template>
    </cz-fieldset>
  </control-wrapper>
</template>

<script lang="ts">
import {
  ControlElement,
  createCombinatorRenderInfos,
  JsonFormsRendererRegistryEntry,
  rankWith,
  createDefaultValue,
  CombinatorSubSchemaRenderInfo,
  isOneOfControl,
} from '@jsonforms/core';
import {
  DispatchRenderer,
  rendererProps,
  RendererProps,
  useJsonFormsOneOfControl,
} from '@jsonforms/vue';
import { defineComponent, ref } from 'vue';
import {
  useVuetifyControl,
  useCombinatorChildErrors,
} from '@/renderers/util/composition';
import {
  VDialog,
  VCard,
  VCardTitle,
  VCardText,
  VCardActions,
  VSpacer,
  VBtn,
  VTabs,
  VTab,
  VTooltip,
  VIcon,
  VSelect,
} from 'vuetify/components';
import CombinatorProperties from '../components/CombinatorProperties.vue';
import { default as CzFieldset } from '../controls/components/cz.fieldset.vue';
import { default as ControlWrapper } from './ControlWrapper.vue';

const controlRenderer = defineComponent({
  name: 'one-of-renderer',
  components: {
    DispatchRenderer,
    CombinatorProperties,
    VDialog,
    VCard,
    VCardTitle,
    VCardText,
    VCardActions,
    VSpacer,
    VBtn,
    VTabs,
    VTab,
    VTooltip,
    VIcon,
    CzFieldset,
    ControlWrapper,
    VSelect,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const input = useJsonFormsOneOfControl(props);
    const tabData: { [key: number]: any } = {}; // Dictionary to store form state between tab changes
    const isAdded = ref(false);

    return {
      ...useVuetifyControl(input),
      ...useCombinatorChildErrors(input, 'oneOf'),
      isAdded,
      tabData,
    };
  },
  created() {
    if (this.control.data) {
      this.isAdded = true;
    }
  },
  mounted() {
    // indexOfFittingSchema is only populated after mounted hook
    this.selectedIndex = this.control.indexOfFittingSchema || 0;
  },
  computed: {
    oneOfRenderInfos(): CombinatorSubSchemaRenderInfo[] {
      const result = createCombinatorRenderInfos(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.control.schema.oneOf!,
        this.control.rootSchema,
        'oneOf',
        this.control.uischema,
        this.control.path,
        this.control.uischemas
      );

      result.map((i, index) => {
        i.uischema =
          // @ts-ignore: use detail uischema if specified
          i.schema.options?.detail || // Check schema
          this.control.uischema.options?.detail?.[index] || // Check ui-schema
          i.uischema;
      });

      return result.filter(info => info.uischema);
    },
    hasToggle() {
      return !this.control.required && !this.isFlat;
    },
    isFlat() {
      return this.control.uischema['options']?.flat;
    },
    isDropDown(): boolean {
      // @ts-ignore
      return this.control.uischema.options?.dropdown;
    },
    title(): string {
      return (
        // @ts-ignore
        this.control.uischema?.options?.title || this.control.schema.title || ''
      );
    },
    desc(): string {
      return (
        this.control.description ||
        // @ts-ignore
        this.control.uischema?.options?.description ||
        this.appliedOptions.description ||
        this.oneOfRenderInfos[this.selectedIndex].schema.description ||
        ''
      );
    },
    selectHint(): string {
      return this.control.uischema?.options?.description;
    },
    currentLabel(): string {
      return this.selectedIndex >= 0
        ? this.oneOfRenderInfos[this.selectedIndex].label
        : '';
    },
    noData(): boolean {
      return !this.control.data;
    },
  },
  methods: {
    handleTabChange(nextIndexOrLabel: number | string): void {
      if (!this.control.enabled) {
        return;
      }

      // Store form state before tab change.
      this.$set(this.tabData, this.selectedIndex, this.control.data);
      this.selectedIndex = -1;

      if (typeof nextIndexOrLabel === 'number') {
        this.selectedIndex = nextIndexOrLabel;
      } else if (typeof nextIndexOrLabel === 'string') {
        this.selectedIndex = this.oneOfRenderInfos.findIndex(
          (info: CombinatorSubSchemaRenderInfo) =>
            info.label === nextIndexOrLabel
        );
      }

      // If we had form data stored, restore it. Otherwise create default value.
      if (this.tabData[this.selectedIndex]) {
        this.handleChange(this.control.path, this.tabData[this.selectedIndex]);
      } else {
        const schema = this.oneOfRenderInfos[this.selectedIndex].schema;
        const val =
          schema.type === 'array' || schema.type === 'object'
            ? createDefaultValue(schema)
            : undefined;

        // Only create default values for objects and arrays.
        this.handleChange(this.control.path, val);
      }
    },
    showForm() {
      if (this.control.enabled) {
        this.isAdded = true;
      }
    },
    onHide() {
      this.handleChange(this.control.path, undefined);
    },
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, isOneOfControl),
};
</script>
