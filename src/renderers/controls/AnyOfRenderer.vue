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
      :description="desc"
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
        combinatorKeyword="anyOf"
      />

      <template v-if="!isDropDown">
        <v-tabs v-model="selectedIndex">
          <v-tab
            v-for="(anyOfRenderInfo, anyOfIndex) in anyOfRenderInfos"
            :key="`${control.path}-${anyOfIndex}`"
            @change="handleTabChange(anyOfIndex)"
            :disabled="
              (appliedOptions.isViewMode ||
                appliedOptions.isReadOnly ||
                appliedOptions.isDisabled) &&
              selectedIndex !== anyOfIndex
            "
          >
            {{ anyOfRenderInfo.uischema["label"] || anyOfRenderInfo.label }}
          </v-tab>
        </v-tabs>

        <v-tabs-items v-model="selectedIndex">
          <v-tab-item
            v-for="(anyOfRenderInfo, anyOfIndex) in anyOfRenderInfos"
            :key="`${control.path}-${anyOfIndex}`"
          >
            <dispatch-renderer
              v-if="selectedIndex === anyOfIndex"
              :schema="anyOfRenderInfo.schema"
              :uischema="anyOfRenderInfo.uischema"
              :path="control.path"
              :renderers="control.renderers"
              :cells="control.cells"
              :enabled="control.enabled"
            />
          </v-tab-item>
        </v-tabs-items>
      </template>

      <template v-else>
        <v-select
          @change="handleTabChange"
          :items="anyOfRenderInfos"
          :label="title"
          :hint="selectHint"
          :value="anyOfRenderInfos[selectedIndex]"
          :data-id="computedLabel.replaceAll(` `, ``)"
          :required="control.required"
          :error-messages="control.errors"
          :placeholder="appliedOptions.placeholder"
          :readonly="!control.enabled || control.schema['readOnly']"
          :disabled="appliedOptions.isDisabled"
          v-bind="vuetifyProps('v-select')"
          item-text="label"
          >{{ currentLabel }}</v-select
        >

        <dispatch-renderer
          v-if="selectedIndex >= 0 && anyOfRenderInfos[selectedIndex]"
          :key="selectedIndex"
          :schema="anyOfRenderInfos[selectedIndex].schema"
          :uischema="anyOfRenderInfos[selectedIndex].uischema"
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
  isAnyOfControl,
} from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  RendererProps,
  useJsonFormsAnyOfControl,
} from "@jsonforms/vue2";
import { defineComponent, ref } from "vue";
import {
  useVuetifyControl,
  useCombinatorChildErrors,
} from "@/renderers/util/composition";
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
  VTabsItems,
  VTabItem,
  VTooltip,
  VIcon,
  VSelect,
} from "vuetify/lib";
import CombinatorProperties from "../components/CombinatorProperties.vue";
import { default as CzFieldset } from "../controls/components/CzFieldset.vue";
import { default as ControlWrapper } from "./ControlWrapper.vue";

const controlRenderer = defineComponent({
  name: "any-of-renderer",
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
    VTabsItems,
    VTabItem,
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
    const input = useJsonFormsAnyOfControl(props);
    const tabData: { [key: number]: any } = {}; // Dictionary to store form state between tab changes
    const isAdded = ref(false);

    return {
      ...useVuetifyControl(input),
      ...useCombinatorChildErrors(input, "anyOf"),
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
    anyOfRenderInfos(): CombinatorSubSchemaRenderInfo[] {
      const result = createCombinatorRenderInfos(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.control.schema.anyOf!,
        this.control.rootSchema,
        "anyOf",
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

      return result.filter((info) => info.uischema);
    },
    hasToggle() {
      return !this.control.required && !this.isFlat;
    },
    isFlat() {
      return this.control.uischema["options"]?.flat;
    },
    isDropDown(): boolean {
      // @ts-ignore
      return this.control.uischema.options?.dropdown;
    },
    title(): string {
      return (
        // @ts-ignore
        this.control.uischema?.options?.title || this.control.schema.title || ""
      );
    },
    desc(): string {
      return (
        this.control.description ||
        // @ts-ignore
        this.control.uischema?.options?.description ||
        this.appliedOptions.description ||
        this.anyOfRenderInfos[this.selectedIndex].schema.description ||
        ""
      );
    },
    selectHint(): string {
      return this.control.uischema?.options?.description;
    },
    currentLabel(): string {
      return this.selectedIndex >= 0
        ? this.anyOfRenderInfos[this.selectedIndex].label
        : "";
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

      if (typeof nextIndexOrLabel === "number") {
        this.selectedIndex = nextIndexOrLabel;
      } else if (typeof nextIndexOrLabel === "string") {
        this.selectedIndex = this.anyOfRenderInfos.findIndex(
          (info: CombinatorSubSchemaRenderInfo) =>
            info.label === nextIndexOrLabel
        );
      }

      // If we had form data stored, restore it. Otherwise create default value.
      if (this.tabData[this.selectedIndex]) {
        this.handleChange(this.control.path, this.tabData[this.selectedIndex]);
      } else {
        const schema = this.anyOfRenderInfos[this.selectedIndex].schema;
        const val =
          schema.type === "array" || schema.type === "object"
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
  tester: rankWith(3, isAnyOfControl),
};
</script>
