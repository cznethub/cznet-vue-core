<template>
  <cz-fieldset
    v-if="control.visible"
    :data-id="computedLabel.replaceAll(` `, ``)"
    :description="desc"
    :hasToggle="hasToggle"
    :enabled="control.enabled"
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
          @change="handleTabChange(oneOfIndex)"
          :key="`${control.path}-${oneOfIndex}`"
          v-for="(oneOfRenderInfo, oneOfIndex) in oneOfRenderInfos"
        >
          {{ oneOfRenderInfo.label }}
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="selectedIndex">
        <v-tab-item
          v-for="(oneOfRenderInfo, oneOfIndex) in oneOfRenderInfos"
          :key="`${control.path}-${oneOfIndex}`"
          class="pt-8"
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
        </v-tab-item>
      </v-tabs-items>
    </template>

    <template v-else>
      <v-select
        @change="handleTabChange"
        :items="oneOfRenderInfos"
        :label="title"
        :value="oneOfRenderInfos[selectedIndex]"
        :data-id="computedLabel.replaceAll(` `, ``)"
        :required="control.required"
        :error-messages="control.errors"
        :placeholder="appliedOptions.placeholder"
        :disabled="!control.enabled"
        :readonly="control.schema['readOnly']"
        :hint="desc"
        v-bind="vuetifyProps('v-select')"
        item-text="label"
        >{{ currentLabel }}</v-select
      >

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
} from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  RendererProps,
  useJsonFormsOneOfControl,
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
} from "vuetify/lib";
import CombinatorProperties from "../components/CombinatorProperties.vue";
import { default as CzFieldset } from "../controls/components/CzFieldset.vue";

const controlRenderer = defineComponent({
  name: "one-of-renderer",
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
      ...useCombinatorChildErrors(input, "oneOf"),
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
        "oneOf",
        this.control.uischema,
        this.control.path,
        this.control.uischemas
      );
      return result.filter((info) => info.uischema);
    },
    hasToggle() {
      return !this.control.required && !this.isFlat;
    },
    isFlat() {
      return this.control.schema["options"]?.flat;
    },
    isDropDown(): boolean {
      // @ts-ignore
      return this.control.schema.options?.dropdown;
    },
    title(): string {
      return (
        // @ts-ignore
        this.control.schema?.options?.title || this.control.schema.title || ""
      );
    },
    desc(): string {
      return (
        this.control.description ||
        // @ts-ignore
        this.control.schema?.options?.description ||
        this.appliedOptions.description ||
        this.oneOfRenderInfos[this.selectedIndex].schema.description ||
        ""
      );
    },
    currentLabel(): string {
      return this.selectedIndex >= 0
        ? this.oneOfRenderInfos[this.selectedIndex].label
        : "";
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
  tester: rankWith(3, isOneOfControl),
};
</script>
