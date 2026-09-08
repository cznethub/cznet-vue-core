<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :appliedOptions="appliedOptions"
  >
    <!-- `hasToggle` is deliberately false: the empty state and the add
         affordance are rendered explicitly below instead. `isFlat` when
         unlabelled, so a titled dialog doesn't draw a border around nothing. -->
    <cz-fieldset
      v-if="control.visible"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :description="sectionDescription"
      :hasToggle="false"
      :isFlat="!computedLabel"
      :enabled="!appliedOptions.isDisabled"
      :readonly="!control.enabled"
      :errors="control.errors"
      :title="control.schema.title"
      :computedLabel="computedLabel"
      ref="fieldset"
    >
      <v-container v-if="!noData" fluid class="pa-0">
        <v-row justify="center" no-gutters>
          <v-expansion-panels multiple v-model="panels">
            <v-expansion-panel
              v-for="(element, index) in control.data"
              :class="styles.arrayList.item"
              :key="index"
            >
              <v-expansion-panel-title
                :class="styles.arrayList.itemHeader"
                class="text-body-2"
              >
                <div
                  v-if="!hideAvatar"
                  align-self="center"
                  px-0
                  class="flex-grow-0"
                >
                  <v-chip aria-label="Index" class="bg-primary">
                    <span class="primary--text text--lighten-5">
                      {{ index + 1 }}
                    </span>
                  </v-chip>
                </div>

                <div
                  v-if="appliedOptions.elementLabelProp"
                  :title="getItemLabel(element, index)"
                  align-self="center"
                  justify-self="start"
                  class="text-truncate flex-grow-1"
                >
                  {{ getItemLabel(element, index) }}
                </div>
                <v-spacer v-else />

                <template
                  v-if="
                    !appliedOptions.isViewMode && !appliedOptions.isReadOnly
                  "
                >
                  <template
                    v-if="
                      appliedOptions.showSortButtons &&
                      !appliedOptions.isDisabled
                    "
                  >
                    <div align-self="center" class="flex-grow-0 flex-shrink-0">
                      <v-tooltip bottom>
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            variant="text"
                            icon="mdi-arrow-up"
                            size="x-small"
                            class="v-expansion-panel-header__icon"
                            aria-label="Move up"
                            :disabled="index <= 0 || !control.enabled"
                            :class="styles.arrayList.itemMoveUp"
                            @click.native="moveUpClick($event, index)"
                          ></v-btn>
                        </template>
                        Move Up
                      </v-tooltip>
                    </div>
                    <div align-self="center" class="flex-grow-0 flex-shrink-0">
                      <v-tooltip bottom>
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon="mdi-arrow-down"
                            variant="text"
                            elevation="0"
                            size="x-small"
                            class="v-expansion-panel-header__icon"
                            aria-label="Move down"
                            :disabled="
                              index >= control.data.length - 1 ||
                              !control.enabled
                            "
                            :class="styles.arrayList.itemMoveDown"
                            @click.native="moveDownClick($event, index)"
                          ></v-btn>
                        </template>
                        Move down
                      </v-tooltip>
                    </div>
                  </template>

                  <div align-self="center" class="flex-grow-0 flex-shrink-0">
                    <v-tooltip bottom>
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          variant="text"
                          elevation="0"
                          icon="mdi-delete"
                          size="x-small"
                          class="v-expansion-panel-header__icon"
                          aria-label="Delete"
                          :class="styles.arrayList.itemDelete"
                          :disabled="
                            !isChildEnabled(index) ||
                            !control.enabled ||
                            (appliedOptions.restrict &&
                              arraySchema !== undefined &&
                              minItems !== undefined &&
                              control.data.length <= minItems)
                          "
                          @click.stop.native="suggestToDelete = index"
                        ></v-btn>
                      </template>
                      Delete
                    </v-tooltip>
                  </div>
                </template>
              </v-expansion-panel-title>
              <v-divider></v-divider>
              <v-expansion-panel-text
                :class="styles.arrayList.itemContent"
                class="pa-0"
              >
                <v-select
                  v-if="isCombinatorSchema(control.schema) && branchItems.length > 1"
                  class="mb-4"
                  :model-value="itemBranchIndex(element)"
                  @update:model-value="(b) => handleBranchChange(index, b)"
                  :items="branchItems"
                  item-title="title"
                  item-value="value"
                  label="Type"
                  :density="appliedOptions.vuetify?.commonAttrs?.density ?? 'compact'"
                  :variant="appliedOptions.vuetify?.commonAttrs?.variant ?? 'outlined'"
                  hide-details
                  :disabled="!control.enabled || !!appliedOptions.isDisabled"
                  :readonly="!control.enabled || !!appliedOptions.isViewMode || !!appliedOptions.isReadOnly"
                />
                <dispatch-renderer
                  :schema="itemSchema(element)"
                  :uischema="itemUISchema(element)"
                  :path="composePaths(control.path, `${index}`)"
                  :enabled="control.enabled"
                  :renderers="control.renderers"
                  :cells="control.cells"
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-row>
      </v-container>

      <div
        v-else
        class="text-body-2 text-medium-emphasis font-italic py-2"
      >
        {{ emptyLabel }}
      </div>

      <!-- Add affordance sits at the end of the list, where users look. -->
      <div
        v-if="
          control.enabled &&
          !appliedOptions.isViewMode &&
          !appliedOptions.isReadOnly &&
          !appliedOptions.isDisabled
        "
        :class="noData ? '' : 'mt-3'"
      >
        <v-btn
          variant="tonal"
          size="small"
          prepend-icon="mdi-plus"
          :class="styles.arrayList.addButton"
          :aria-label="addLabel"
          @click="addButtonClick()"
          :disabled="
            appliedOptions.restrict &&
            maxItems !== undefined &&
            control.data &&
            control.data.length >= maxItems
          "
          >{{ addLabel }}</v-btn
        >
      </div>

      <v-dialog
        v-if="
          !appliedOptions.isViewMode &&
          !appliedOptions.isReadOnly &&
          !appliedOptions.isDisabled
        "
        :model-value="suggestToDelete !== null"
        max-width="420"
        content-class="cz-confirm"
        @keydown.esc="suggestToDelete = null"
        @click:outside="suggestToDelete = null"
      >
        <v-card class="cz-confirm__card">
          <div class="d-flex ga-3 pa-5 pb-3">
            <v-avatar color="error" variant="tonal" size="40" class="flex-shrink-0">
              <v-icon size="20">mdi-trash-can-outline</v-icon>
            </v-avatar>
            <div class="min-w-0">
              <div class="text-subtitle-1 font-weight-medium">
                Delete {{ deleteTargetLabel }}?
              </div>
              <div class="text-body-2 text-medium-emphasis mt-1">
                This removes it from the form. Nothing is saved until you
                save the resource.
              </div>
            </div>
          </div>

          <v-card-actions class="px-5 pb-4 pt-0">
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="suggestToDelete = null">Cancel</v-btn>
            <v-btn
              variant="flat"
              color="error"
              ref="confirm"
              @click="onRemoveItem"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </cz-fieldset>
  </control-wrapper>
</template>

<script lang="ts">
import {
  ControlElement,
  composePaths,
  createDefaultValue,
  UISchemaElement,
  findUISchema,
  Resolve,
  JsonSchema,
  getControlPath,
} from '@jsonforms/core';
import { defineComponent } from 'vue';
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsArrayControl,
  RendererProps,
  useJsonFormsControl,
} from '@jsonforms/vue';
import {
  useNested,
  useVuetifyArrayControl,
} from '@/renderers/util/composition';
import {
  VCard,
  VCardActions,
  VCardTitle,
  VCardText,
  VDialog,
  VRow,
  VCol,
  VContainer,
  VToolbar,
  VToolbarTitle,
  VTooltip,
  VIcon,
  VBtn,
  VAvatar,
  VSpacer,
  VExpansionPanels,
  VExpansionPanel,
  VExpansionPanelTitle,
  VExpansionPanelText,
  VChip,
  VSelect,
} from 'vuetify/components';
import { ErrorObject } from 'ajv';
import { ref, Ref } from 'vue';
import { isEqual } from 'lodash-es';
import { default as CzFieldset } from '../controls/components/cz.fieldset.vue';
import { default as ControlWrapper } from '../controls/ControlWrapper.vue';

export default defineComponent({
  name: 'array-layout-renderer',
  components: {
    DispatchRenderer,
    VCard,
    VCardActions,
    VCardTitle,
    VCardText,
    VAvatar,
    VDialog,
    VRow,
    VCol,
    VToolbar,
    VToolbarTitle,
    VTooltip,
    VIcon,
    VBtn,
    VSpacer,
    VExpansionPanels,
    VExpansionPanel,
    VExpansionPanelTitle,
    VExpansionPanelText,
    VContainer,
    VChip,
    VSelect,
    CzFieldset,
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const { handleChange } = useJsonFormsControl(props);
    const control = {
      handleChange,
      ...useVuetifyArrayControl(useJsonFormsArrayControl(props)),
    };
    const fieldset = ref<InstanceType<typeof CzFieldset>>();
    const panels: Ref<number[]> = ref([]);
    const suggestToDelete = ref<null | number>(null);
    // indicate to our child renderers that we are increasing the "nested" level
    useNested('array');
    return { ...control, panels, suggestToDelete, fieldset };
  },
  created() {
    // @ts-ignore
    const requiredItems: string[] = this.control.schema.contains?.enum || [];

    requiredItems.map(item => {
      if (!this.control.data) {
        this.handleChange(this.control.path, undefined);
      }
      // We most use isEqual to compare objects instead of Arra.includes
      const isIncluded = this.control.data?.some((existingItem: any) =>
        isEqual(item, existingItem)
      );
      if (!isIncluded) {
        this.addItem(this.control.path, item)();
      }
    });

    if (this.control.schema.default && !this.control.data) {
      this.control.schema.default.map((item: any) => {
        this.addItem(this.control.path, item)();
      });
    }

    // Expand existing items
    if (this.control.data && !this.appliedOptions.collapsed) {
      this.panels = this.control.data.map((_item: any, index: number) => index);
    }
  },
  computed: {
    noData(): boolean {
      return !this.control.data || this.control.data.length === 0;
    },
    /**
     * Branch items for the inline type-switcher rendered for each array element
     * when the items schema is a combinator (anyOf/oneOf/allOf).
     * Labels are sourced from the nested detail map carried by the parent
     * uischema option (`options.detail.options.detail[i].options.label`).
     */
    branchItems(): { title: string; value: number }[] {
      const combinator = this.isCombinatorSchema(this.control.schema);
      if (!combinator) return [];
      // @ts-ignore
      const branches: any[] = this.control.schema[combinator] || [];
      // personOrOrgDetail lives at control.uischema.options.detail;
      // per-branch layouts at .options.detail.options.detail
      const detailMap = (this.control.uischema as any).options?.detail?.options?.detail;
      return branches.map((_: any, idx: number) => ({
        title:
          detailMap?.[idx]?.options?.label ??
          this.deref(branches[idx])?.title ??
          `Type ${idx + 1}`,
        value: idx,
      }));
    },
    foundUISchema(): UISchemaElement {
      return findUISchema(
        this.control.uischemas,
        this.control.schema,
        this.control.uischema.scope,
        this.control.path,
        undefined,
        this.control.uischema,
        this.control.rootSchema
      );
    },
    arraySchema(): JsonSchema | undefined {
      return Resolve.schema(
        this.control.rootSchema,
        this.control.uischema.scope,
        this.control.rootSchema
      );
    },
    // `hide-label` empties control.label, so fall back to the item noun.
    addLabel(): string {
      return `Add ${this.itemNoun}`;
    },
    /**
     * Let the uischema override the schema's `description`;
     * `description: false` hides it entirely.
     */
    sectionDescription(): string {
      // @ts-ignore
      const override = this.appliedOptions.description;
      if (override === false) return '';
      return override ?? this.control.description ?? '';
    },
    emptyLabel(): string {
      return `No ${this.itemNoun.toLowerCase()} added yet.`;
    },
    // Prefer the row's own label; `childLabelForIndex` falls back to the
    // first primitive property, which is usually `@type`.
    deleteTargetLabel(): string {
      if (this.suggestToDelete === null) return 'this item';
      const el = this.control.data?.[this.suggestToDelete];
      return (
        this.getItemLabel(el, this.suggestToDelete) ||
        this.childLabelForIndex(this.suggestToDelete) ||
        this.itemNoun
      );
    },
    itemNoun(): string {
      return (
        // Consumers can name the row explicitly; schema `title` is a type name.
        // @ts-ignore
        this.appliedOptions.itemNoun ||
        this.control.label ||
        // @ts-ignore
        this.control.schema?.title ||
        this.arraySchema?.title ||
        'item'
      );
    },
    hideAvatar(): boolean {
      // @ts-ignore
      return !!this.appliedOptions.hideAvatar;
    },
    maxItems() {
      // @ts-ignore
      return this.control.schema.maxItems || this.arraySchema?.maxItems;
    },
    minItems() {
      // @ts-ignore
      return this.control.schema.minItems || this.arraySchema?.minItems;
    },
  },
  methods: {
    composePaths,
    createDefaultValue,
    /**
     * Return the combinator branch index that best fits `element`.
     * Uses the `@type` discriminator; falls back to 0.
     */
    itemBranchIndex(element: any): number {
      const combinator = this.isCombinatorSchema(this.control.schema);
      if (!combinator) return 0;
      // @ts-ignore
      const branches: any[] = ((this.control.schema as any)[combinator] || []).map((b: any) => this.deref(b));
      const discriminator = element?.['@type'];
      if (!discriminator) return 0;
      const idx = branches.findIndex((b: any) => {
        const t = b?.properties?.['@type'];
        return (
          t &&
          (t.const === discriminator ||
            (Array.isArray(t.enum) && t.enum.includes(discriminator)))
        );
      });
      return idx >= 0 ? idx : 0;
    },
    /**
     * Return the uischema to use for a given array element.
     * For combinator items, looks up the per-branch layout from the nested
     * detail map (`options.detail.options.detail[branchIndex]`); falls back
     * to `foundUISchema` for non-combinator arrays.
     */
    itemUISchema(element: any): UISchemaElement {
      const combinator = this.isCombinatorSchema(this.control.schema);
      if (!combinator) return this.foundUISchema;
      const branchIndex = this.itemBranchIndex(element);
      const detailMap = (this.control.uischema as any).options?.detail?.options?.detail;
      if (detailMap != null && detailMap[branchIndex] != null) {
        return detailMap[branchIndex];
      }
      return this.foundUISchema;
    },
    /**
     * Switch an array item to a different combinator branch.
     * Creates a fresh default value for the chosen branch (preserving the
     * `@type` discriminator) and replaces the item at `itemIndex`.
     */
    handleBranchChange(itemIndex: number, newBranchIndex: number): void {
      const combinator = this.isCombinatorSchema(this.control.schema);
      if (!combinator || !this.control.enabled) return;
      // @ts-ignore
      const branches: any[] = (this.control.schema as any)[combinator] || [];
      const defaultSchema = this.deref(branches[newBranchIndex]);
      const newDefault = createDefaultValue(defaultSchema, this.control.rootSchema);
      this.handleChange(
        composePaths(this.control.path, `${itemIndex}`),
        newDefault
      );
    },
    /**
     * Resolve a `$ref`, returning the original node when it can't be resolved.
     */
    deref(schema: any): any {
      if (!schema?.$ref) return schema;
      return (
        Resolve.schema(
          this.control.rootSchema,
          schema.$ref,
          this.control.rootSchema
        ) ?? schema
      );
    },
    /**
     * JsonForms' schemaMatches only resolves a child scope when the schema has
     * type `object`, which a raw combinator (`{ anyOf: [...] }`) lacks. Dispatch
     * against the concrete branch instead, picked by the `@type` discriminator.
     */
    itemSchema(element: any): JsonSchema {
      const combinator = this.isCombinatorSchema(this.control.schema);
      if (!combinator) return this.control.schema;

      // @ts-ignore
      const branches = (this.control.schema[combinator] || []).map((b: any) =>
        this.deref(b)
      );
      if (!branches.length) return this.control.schema;

      const discriminator = element?.['@type'];
      const match =
        discriminator &&
        branches.find((b: any) => {
          const t = b?.properties?.['@type'];
          return (
            t &&
            (t.const === discriminator ||
              (Array.isArray(t.enum) && t.enum.includes(discriminator)))
          );
        });

      return match || branches[0];
    },
    addButtonClick() {
      const combinatorSchema = this.isCombinatorSchema(this.control.schema);
      const branchSchema = combinatorSchema
        ? // @ts-ignore
          this.control.schema[combinatorSchema]?.[0]
        : this.control.schema;

      // Combinator branches arrive as unresolved `$ref`s, so `type` is
      // undefined and the object/array check below would fall through to
      // `undefined` — pushing a hole into the array instead of a new item.
      // Combinator branches arrive as unresolved `$ref`s, so `type` is
      // undefined and the object/array check below would fall through to
      // `undefined` — pushing a hole into the array instead of a new item.
      const defaultSchema = this.deref(branchSchema);

      /**
       * For combinator schemas, only create default values for objects and arrays.
       * For primitive types we use `undefined` which will correctly trigger validation
       */
      const val =
        !combinatorSchema || ['object', 'array'].includes(defaultSchema.type)
          ? createDefaultValue(defaultSchema, this.control.rootSchema)
          : undefined;

      this.addItem(this.control.path, val)();

      // @ts-ignore
      if (!this.appliedOptions.collapseNewItems && this.control.data?.length) {
        this.panels.push(this.control.data.length - 1);
      }
    },
    moveUpClick(event: Event, toMove: number): void {
      event.stopPropagation();
      this.moveUp?.(this.control.path, toMove)();
    },
    moveDownClick(event: Event, toMove: number): void {
      event.stopPropagation();
      this.moveDown?.(this.control.path, toMove)();
    },
    removeItemsClick(toDelete: number[]): void {
      this.removeItems?.(this.control.path, toDelete)();
      if (this.control.data.length === 0) {
        this.handleChange(this.control.path, undefined);
        // @ts-ignore
        this.fieldset?.hide();
      }
    },
    childErrors(index: number): ErrorObject[] {
      return this.control.childErrors.filter(e => {
        const errorDataPath = getControlPath(e);
        return errorDataPath.startsWith(
          this.composePaths(this.control.path, `${index}`)
        );
      });
    },
    getItemLabel(element: any, index = 0) {
      const props = Array.isArray(this.appliedOptions.elementLabelProp)
        ? this.appliedOptions.elementLabelProp
        : [this.appliedOptions.elementLabelProp];

      const label = props
        .map((prop: string) => element?.[prop])
        .filter(Boolean)
        .join(' ')
        .trim();

      // A freshly added row has nothing to label it with; without a fallback
      // its header is blank except for the action icons.
      return label || `${this.itemNoun} ${index + 1}`;
    },
    onRemoveItem() {
      if (this.suggestToDelete !== null) {
        this.removeItemsClick([this.suggestToDelete]);
      }
      this.suggestToDelete = null;
    },
  },
});
</script>

<style scoped>
.notranslate {
  transform: none !important;
}

/* Vuetify already renders the panel group as a bordered surface; the extra
   rule stacked a third border inside the fieldset's outlined v-field. */

/* Vuetify's default wrapper padding is 8px 24px 16px, which is lopsided
   against our field grid. Even inset instead — zero (the previous value)
   left inputs touching the panel border. */
:deep(.v-expansion-panel-text__wrapper) {
  padding: 1.25rem 1.25rem 1.5rem;
}

/* Give the row header the same horizontal inset as the body so the title and
   the fields beneath it line up. */
:deep(.v-expansion-panel-title) {
  padding-inline: 1.25rem;
}
</style>
