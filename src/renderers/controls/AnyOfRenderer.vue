<template>
  <div v-if="control.visible" class="py-4">
    <fieldset
      :data-id="computedLabel.replaceAll(` `, ``)"
      :class="{
        'cz-fieldset': !isFlat,
        'is-borderless': isFlat,
      }"
    >
      <template v-if="!isFlat">
        <legend
          v-if="control.schema.title"
          @click="showForm()"
          :class="{ 'v-label--active': isAdded || !hasToggle }"
          class="v-label"
        >
          {{ computedLabel }}
        </legend>

        <div v-if="hasToggle">
          <v-tooltip v-if="!isAdded" bottom transition="fade">
            <template v-slot:activator="{ on: onTooltip }">
              <v-btn
                icon
                color="primary"
                @click="showForm()"
                :disabled="!control.enabled"
                :class="styles.arrayList.addButton"
                class="btn-add"
                :aria-label="`Add to ${control.schema.title}`"
                v-on="onTooltip"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
            {{ `Add ${control.schema.title}` }}
          </v-tooltip>

          <v-tooltip v-else bottom transition="fade">
            <template v-slot:activator="{ on: onTooltip }">
              <v-btn
                icon
                color="error"
                @click="removeForm()"
                :class="styles.arrayList.addButton"
                :disabled="!control.enabled"
                class="btn-add"
                aria-label="Remove"
                v-on="onTooltip"
              >
                <v-icon>mdi-minus</v-icon>
              </v-btn>
            </template>
            Remove
          </v-tooltip>
        </div>
      </template>

      <template v-if="isAdded || !hasToggle">
        <combinator-properties
          :schema="control.schema"
          :path="path"
          combinatorKeyword="anyOf"
        />

        <template v-if="!isDropDown">
          <v-tabs v-model="selectedIndex">
            <v-tab
              @change="handleTabChange(anyOfIndex)"
              :key="`${control.path}-${anyOfIndex}`"
              v-for="(anyOfRenderInfo, anyOfIndex) in anyOfRenderInfos"
            >
              {{ anyOfRenderInfo.label }}
            </v-tab>
          </v-tabs>

          <v-tabs-items v-model="selectedIndex">
            <v-tab-item
              v-for="(anyOfRenderInfo, anyOfIndex) in anyOfRenderInfos"
              :key="`${control.path}-${anyOfIndex}`"
              class="pt-8"
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
            :value="anyOfRenderInfos[selectedIndex]"
            :data-id="computedLabel.replaceAll(` `, ``)"
            :required="control.required"
            :error-messages="control.errors"
            :placeholder="appliedOptions.placeholder"
            :disabled="!control.enabled"
            :readonly="control.schema['readOnly']"
            :hint="desc"
            v-bind="vuetifyProps('v-select')"
            class="py-4"
            hide-details="auto"
            item-text="label"
            persistent-hint
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
      </template>
    </fieldset>

    <div v-if="desc" class="text--secondary text-body-1 mt-2 ml-2">
      {{ desc }}
    </div>
  </div>
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
} from "vuetify/lib";
import CombinatorProperties from "../components/CombinatorProperties.vue";

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
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const input = useJsonFormsAnyOfControl(props);
    const tabData: { [key: number]: any } = {}; // Dictionary to store form state between tab changes
    const selectedIndex = ref(0);

    const isAdded = ref(false);

    return {
      ...useVuetifyControl(input),
      ...useCombinatorChildErrors(input, "anyOf"),
      isAdded,
      selectedIndex,
      tabData,
    };
  },
  created() {
    if (this.control.data) {
      this.isAdded = true;
    }
  },
  mounted() {
    // TODO: find most fit schema if indexOfFittingSchema is undefined and data is not undefined
    // if (this.control.data && this.control.indexOfFittingSchema === undefined) {
    //   // ...
    // }

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
      return result.filter((info) => info.uischema);
    },
    hasToggle() {
      // @ts-ignore
      return !this.control.required && !this.isFlat;
    },
    isFlat() {
      return this.control.uischema.options?.flat;
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
        this.anyOfRenderInfos[this.selectedIndex].schema.description ||
        ""
      );
    },
    currentLabel(): string {
      return this.selectedIndex >= 0
        ? this.anyOfRenderInfos[this.selectedIndex].label
        : "";
    },
  },
  watch: {
    childErrors: {
      handler(_newErrors, _oldErrors) {
        this.annotateChildErrors(this);
      },
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
            ? createDefaultValue(schema) // TODO: won't add defaults
            : undefined;

        // Only create default values for objects and arrays.
        // TODO: handle change seems to merge this value with current data
        this.handleChange(this.control.path, val);
      }
    },
    showForm() {
      if (this.control.enabled) {
        this.isAdded = true;
      }
    },
    removeForm() {
      this.isAdded = false;
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
