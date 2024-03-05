<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :appliedOptions="appliedOptions"
  >
    <cz-fieldset
      v-if="control.visible"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :description="control.description"
      :hasToggle="noData"
      :enabled="!appliedOptions.isDisabled"
      :readonly="!control.enabled"
      :errors="control.errors"
      :title="control.schema.title"
      :computedLabel="computedLabel"
      @show="noData && control.enabled ? addButtonClick() : null"
      ref="fieldset"
    >
      <template v-if="control.enabled" v-slot:actions="{ show }">
        <v-tooltip bottom transition="fade">
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-plus"
              size="x-small"
              variant="text"
              color="primary"
              @click="
                addButtonClick();
                show();
              "
              :class="styles.arrayList.addButton"
              class="btn-add"
              :aria-label="`Add to ${control.label}`"
              v-bind="props"
              :disabled="
                !control.enabled ||
                appliedOptions.isDisabled ||
                (appliedOptions.restrict &&
                  maxItems !== undefined &&
                  control.data &&
                  control.data.length >= maxItems)
              "
            ></v-btn>
          </template>
          {{ `Add to ${control.label}` }}
        </v-tooltip>
      </template>

      <v-container v-if="!noData" justify-space-around align-content-center>
        <v-row justify="center">
          <v-expansion-panels focusable multiple flat>
            <v-expansion-panel
              v-for="(element, index) in control.data"
              :key="`${control.path}-${index}`"
              :class="styles.arrayList.item"
              v-model="panels"
            >
              <v-expansion-panel-title :class="styles.arrayList.itemHeader">
                <div
                  v-if="!hideAvatar"
                  align-self="center"
                  px-0
                  class="flex-grow-0"
                >
                  <v-chip aria-label="Index" color="primary">
                    <span class="primary--text text--lighten-5">
                      {{ index + 1 }}
                    </span>
                  </v-chip>
                </div>

                <div
                  v-if="appliedOptions.elementLabelProp"
                  :title="getItemLabel(element)"
                  align-self="center"
                  justify-self="start"
                  class="text-truncate flex-grow-1"
                >
                  {{ getItemLabel(element) }}
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
                        <template v-slot:activator="{ props }">
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
                        <template v-slot:activator="{ props }">
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
                      <template v-slot:activator="{ props }">
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
              <v-expansion-panel-text
                :class="styles.arrayList.itemContent"
                class="pa-0 pt-4"
              >
                <dispatch-renderer
                  :schema="control.schema"
                  :uischema="foundUISchema"
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

      <v-dialog
        v-if="
          !appliedOptions.isViewMode &&
          !appliedOptions.isReadOnly &&
          !appliedOptions.isDisabled
        "
        :model-value="suggestToDelete !== null"
        max-width="600"
        @keydown.esc="suggestToDelete = null"
        @click:outside="suggestToDelete = null"
      >
        <v-card>
          <v-card-title class="text-h5">
            Delete {{ childLabelForIndex(suggestToDelete) || 'element' }}?
          </v-card-title>

          <v-card-text>The element will be deleted.</v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn variant="text" @click="suggestToDelete = null">Cancel</v-btn>
            <v-btn
              variant="text"
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
  JsonFormsRendererRegistryEntry,
  ControlElement,
  rankWith,
  isObjectArrayWithNesting,
  composePaths,
  createDefaultValue,
  UISchemaElement,
  findUISchema,
  Resolve,
  JsonSchema,
  getControlPath,
  or,
  isObjectArrayControl,
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
} from 'vuetify/components';
import { ErrorObject } from 'ajv';
import { ref } from 'vue';
import { isEqual } from 'lodash-es';
import { default as CzFieldset } from '../controls/components/cz.fieldset.vue';
import { default as ControlWrapper } from '../controls/ControlWrapper.vue';

const controlRenderer = defineComponent({
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
    const panels: number[] = [];
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
    addButtonClick() {
      const combinatorSchema = this.isCombinatorSchema(this.control.schema);
      const defaultSchema = combinatorSchema
        ? this.control.schema[combinatorSchema]?.[0]
        : this.control.schema;

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
    getItemLabel(element: any) {
      if (!element) {
        return '';
      }
      // @ts-ignore
      if (Array.isArray(this.appliedOptions.elementLabelProp)) {
        // @ts-ignore
        return this.appliedOptions.elementLabelProp
          .map((prop: string) => element[prop])
          .join(' ');
      } else {
        // @ts-ignore
        return element[this.appliedOptions.elementLabelProp];
      }
    },
    onRemoveItem() {
      if (this.suggestToDelete !== null) {
        this.removeItemsClick([this.suggestToDelete]);
      }
      this.suggestToDelete = null;
    },
  },
});

export default controlRenderer;

const useArrayLayout = (uiSchema: UISchemaElement) => {
  return uiSchema.options?.useArrayLayout;
};

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(
    4,
    or(isObjectArrayControl, isObjectArrayWithNesting, useArrayLayout)
  ),
};
</script>

<style scoped>
.notranslate {
  transform: none !important;
}

.v-expansion-panel {
  border: thin solid rgba(0, 0, 0, 0.12);
}
</style>
