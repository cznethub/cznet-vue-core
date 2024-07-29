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
      <template #actions="{ show }">
        <v-tooltip bottom transition="fade">
          <template #activator="{ props }">
            <v-btn
              icon="mdi-plus"
              variant="text"
              size="small"
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

      <v-card
        v-if="control.visible"
        :class="styles.arrayList.root"
        class="mt-5"
        elevation="0"
        v-bind="vuetifyProps('v-card')"
        outlined
      >
        <v-card-text class="pa-0">
          <v-container justify-space-around align-content-center>
            <v-table class="array-container" v-bind="vuetifyProps('v-table')">
              <tbody>
                <tr
                  v-for="(element, index) in control.data"
                  :key="`${control.path}-${index}`"
                  :class="styles.arrayList.item"
                >
                  <!-- OBJECT -->
                  <td>
                    <v-card class="my-4">
                      <v-card-text class="d-flex">
                        <div class="flex-grow-1">
                          <pre>{{ element }}</pre>
                        </div>
                      </v-card-text>
                    </v-card>
                  </td>

                  <!-- CONTROLS -->
                  <td
                    v-if="control.enabled"
                    :class="
                      appliedOptions.showSortButtons
                        ? 'fixed-cell'
                        : 'fixed-cell-small'
                    "
                  >
                    <div class="pt-5 fill-height">
                      <v-tooltip bottom>
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            v-if="appliedOptions.showSortButtons"
                            variant="text"
                            icon="mdi-arrow-up"
                            elevation="0"
                            size="small"
                            aria-label="Up"
                            :disabled="index <= 0 || !control.enabled"
                            :class="styles.arrayList.itemMoveUp"
                            @click.native="moveUpClick($event, index)"
                          ></v-btn>
                        </template>
                        Move Up
                      </v-tooltip>
                      <v-tooltip bottom>
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            v-if="appliedOptions.showSortButtons"
                            variant="text"
                            elevation="0"
                            size="small"
                            icon="mdi-arrow-down"
                            aria-label="Down"
                            :disabled="
                              index >= dataLength - 1 || !control.enabled
                            "
                            :class="styles.arrayList.itemMoveDown"
                            @click.native="moveDownClick($event, index)"
                          ></v-btn>
                        </template>
                        Move Down
                      </v-tooltip>
                      <v-tooltip bottom>
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            variant="text"
                            elevation="0"
                            aria-label="Remove"
                            icon="mdi-delete"
                            :class="styles.arrayList.itemDelete"
                            :disabled="
                              !control.enabled ||
                              isRequired(element) ||
                              (appliedOptions.restrict &&
                                arraySchema !== undefined &&
                                arraySchema.minItems !== undefined &&
                                dataLength <= arraySchema.minItems)
                            "
                            @click.native="removeItemsClick($event, [index])"
                          ></v-btn>
                        </template>
                        Remove
                      </v-tooltip>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-container>
        </v-card-text>
      </v-card>
    </cz-fieldset>

    <v-dialog max-width="1280" height="70vh" v-model="showAddDialog">
      <v-card class="fill-height d-flex flex-column">
        <v-card-title>Search</v-card-title>
        <v-card-text class="flex-grow-0">
          <v-text-field
            append-inner-icon="mdi-magnify"
            v-model.trim="valueInternal"
            :loading="isLoadingOptions"
            v-bind="vuetifyProps('v-text-field')"
            @click:append-inner="search"
            @keydown.enter="search"
            class="flex-shrink-1"
            hide-details
          ></v-text-field>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-text class="d-flex flex-column results-container">
          <v-data-iterator
            :items="options"
            :page="page"
            :items-per-page="itemsPerPage"
            show-select
            multiple
            :loading="isLoadingOptions"
            class="fill-height"
          >
            <template v-slot:default="{ items }">
              <v-row>
                <v-col
                  v-for="(item, i) in items"
                  :key="i"
                  cols="12"
                  sm="6"
                  xl="4"
                >
                  <v-card
                    class="fill-height bg-white"
                    @click="
                      !isValueIncluded(getOptionValue(item.raw))
                        ? (item.raw._isSelected = !item.raw._isSelected)
                        : null
                    "
                    :ripple="false"
                    :variant="
                      item.raw._isSelected ||
                      isValueIncluded(getOptionValue(item.raw))
                        ? 'outlined'
                        : 'elevated'
                    "
                    :color="
                      item.raw._isSelected ||
                      isValueIncluded(getOptionValue(item.raw))
                        ? 'primary'
                        : ''
                    "
                  >
                    <v-card-text class="d-flex">
                      <div class="flex-grow-1">
                        <template v-for="row of getOptionDisplay(item.raw)">
                          <div class="text-caption">{{ row.label }}</div>
                          <div class="text-body-1 mb-2">{{ row.value }}</div>
                        </template>
                      </div>
                      <div class="flex-shrink-0 ml-2">
                        <v-checkbox
                          v-if="isValueIncluded(getOptionValue(item.raw))"
                          :model-value="true"
                          disabled
                          color="primary"
                        ></v-checkbox>
                        <v-checkbox
                          v-else
                          :model-value="item.raw._isSelected"
                          color="primary"
                        ></v-checkbox>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </template>

            <template v-slot:loader>
              <v-row>
                <v-col
                  v-for="(_, k) in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]"
                  :key="k"
                  cols="12"
                  sm="6"
                  xl="4"
                >
                  <v-skeleton-loader
                    class="border"
                    type="article"
                  ></v-skeleton-loader>
                </v-col>
              </v-row>
            </template>

            <template #no-data>
              <div class="fill-height d-flex justify-center">
                <v-empty-state
                  v-if="hasLoadedOptions"
                  icon="mdi-magnify"
                  title="We couldn't find a match."
                  text="Try narrowing your search or adjusting your filters."
                ></v-empty-state>

                <v-empty-state
                  v-else
                  icon="mdi-magnify"
                  title="Search"
                  text="Use the input above to search."
                ></v-empty-state>
              </div>
            </template>
          </v-data-iterator>
        </v-card-text>
        <v-divider></v-divider>

        <v-card-text v-if="options.length" class="flex-grow-0">
          <v-pagination
            v-model="page"
            :length="Math.ceil(options.length / itemsPerPage)"
            rounded="circle"
          ></v-pagination>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text="Cancel" @click="showAddDialog = false"></v-btn>
          <v-btn
            @click="addSelected"
            color="primary"
            text="Add selected"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </control-wrapper>
</template>

<script lang="ts">
import {
  findUISchema,
  composePaths,
  createDefaultValue,
  ControlElement,
  JsonSchema,
  Resolve,
  VerticalLayout,
} from '@jsonforms/core';
import { startCase } from 'lodash-es';
import { defineComponent, ref, Ref } from 'vue';
import {
  DispatchCell,
  DispatchRenderer,
  rendererProps,
  useJsonFormsArrayControl,
  RendererProps,
  useJsonFormsControl,
} from '@jsonforms/vue';
import { useVuetifyArrayControl } from '@/renderers/util';
import {
  VCard,
  VCardTitle,
  VCardText,
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
  VTable,
} from 'vuetify/components';
import { isEqual } from 'lodash-es';
import { default as CzFieldset } from './components/cz.fieldset.vue';
import { default as ControlWrapper } from './ControlWrapper.vue';

export default defineComponent({
  name: 'array-control-renderer',
  components: {
    DispatchCell,
    DispatchRenderer,
    VCard,
    VCardTitle,
    VCardText,
    VAvatar,
    VRow,
    VCol,
    VToolbar,
    VToolbarTitle,
    VTooltip,
    VIcon,
    VBtn,
    VSpacer,
    VContainer,
    VTable,
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
    const suggestToDelete = ref<null | number>(null);
    const options: Ref<any[]> = ref([]);
    const menu = ref(false);
    const valueInternal = ref('');
    const isLoadingOptions = ref(false);
    const page = ref(1);
    const showAddDialog = ref(false);
    const itemsPerPage = ref(12);
    const hasLoadedOptions = ref(false);

    return {
      ...control,
      suggestToDelete,
      fieldset,
      options,
      menu,
      valueInternal,
      isLoadingOptions,
      page,
      showAddDialog,
      itemsPerPage,
      hasLoadedOptions,
    };
  },
  computed: {
    arraySchema(): JsonSchema | undefined {
      return Resolve.schema(
        this.control.rootSchema,
        this.control.uischema.scope,
        this.control.rootSchema
      );
    },
    dataLength(): number {
      return this.control.data ? this.control.data.length : 0;
    },
    noData(): boolean {
      return !this.control.data || this.control.data.length === 0;
    },
    maxItems() {
      // @ts-ignore
      return this.control.schema.maxItems || this.arraySchema?.maxItems;
    },
    selected() {
      return this.options.filter(o => !!o._isSelected);
    },
  },
  created() {
    // @ts-ignore
    const requiredItems: string[] = this.control.schema.contains?.enum || [];

    requiredItems.map(item => {
      if (!this.control.data) {
        this.control.data = [];
      }
      // We must use isEqual to compare objects instead of Arra.includes
      if (!this.isValueIncluded(item)) {
        this.addItem(this.control.path, item)();
      }
    });

    if (this.control.schema.default && !this.control.data) {
      this.control.schema.default.map((item: any) => {
        this.addItem(this.control.path, item)();
      });
    }
  },
  methods: {
    composePaths,
    createDefaultValue,
    addButtonClick() {
      this.showAddDialog = true;
    },
    addSelected() {
      this.showAddDialog = false;
      this.selected.forEach(item => {
        const value = this.getOptionValue(item);
        if (!this.isValueIncluded(value)) {
          this.addItem(this.control.path, value)();
        }
      });
    },
    isValueIncluded(value: any) {
      return this.control.data?.some((existingItem: any) =>
        isEqual(value, existingItem)
      );
    },
    moveUpClick(event: Event, toMove: number): void {
      event.stopPropagation();
      this.moveUp?.(this.control.path, toMove)();
    },
    moveDownClick(event: Event, toMove: number): void {
      event.stopPropagation();
      this.moveDown?.(this.control.path, toMove)();
    },
    removeItemsClick(event: MouseEvent, toDelete: number[]): void {
      event.stopPropagation();
      this.removeItems?.(this.control.path, toDelete)();
      if (this.control.data.length === 0) {
        this.handleChange(this.control.path, undefined);
        // @ts-ignore
        this.fieldset?.hide();
      }
    },
    getValidColumnProps(scopedSchema: JsonSchema) {
      if (
        scopedSchema.type === 'object' &&
        typeof scopedSchema.properties === 'object'
      ) {
        return Object.keys(scopedSchema.properties).filter(prop => {
          const resolvedUiSchema = this.resolveUiSchema(prop);
          const rule = resolvedUiSchema.rule?.effect;
          const condition = resolvedUiSchema.rule?.condition;

          if (condition) {
            // Detect if empty object
            const isEmptyCondition =
              Object.keys(condition).length === 0 &&
              condition.constructor === Object;

            return !(isEmptyCondition && rule === 'HIDE');
          }
          return true;
        });
      }
      // primitives
      return [''];
    },
    title(prop: string) {
      return this.control.schema.properties?.[prop]?.title ?? startCase(prop);
    },
    resolveUiSchema(propName: string) {
      // We expect controls using `useTableLayout` option to be primitive types or non-nested object type.
      // Non-nested objects are expected to have a simple VerticalLayout uischema.
      if (this.control.schema.type === 'object') {
        const foundUISchema = findUISchema(
          this.control.uischemas,
          this.control.schema,
          this.control.uischema.scope,
          this.control.path,
          undefined,
          this.control.uischema,
          this.control.rootSchema
        ) as VerticalLayout;

        const detailUISchema = foundUISchema.elements.find(
          // @ts-ignore
          el => el.scope === `#/properties/${propName}`
        );

        if (detailUISchema) {
          return detailUISchema;
        }
      }

      // Create the schema
      return this.control.schema.properties
        ? this.controlWithoutLabel(`#/properties/${propName}`)
        : this.controlWithLabel('#');
    },
    controlWithoutLabel(scope: string): ControlElement {
      return { type: 'Control', scope, label: false };
    },
    controlWithLabel(scope: string): ControlElement {
      return {
        scope,
        type: 'Control',
        label: this.control.schema.title
          ? `${this.control.schema.title}*`
          : false,
        // @ts-ignore
        description: this.control.schema.description || false,
      };
    },
    isRequired(item: any) {
      const count = this.control.data.filter((i: any) => {
        return isEqual(i, item);
      }).length;

      if (count > 1) {
        return false;
      }

      // @ts-ignore
      return this.control.schema.contains?.enum?.some(requiredItem =>
        isEqual(item, requiredItem)
      );
    },
    deepValue(object: any, path: string) {
      let value = object;
      path.split('.').forEach(p => {
        value = value[p];
      });
      return value;
    },
    async loadOptions(search: string) {
      if (!search) {
        return;
      }

      let vocabulary: any;
      let url =
        this.control.uischema?.options?.asyncAutocomplete.vocabulary.jsonUrl;
      if (search) {
        url = `${url}&q=${encodeURIComponent(search)}`;
      }
      this.isLoadingOptions = true;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        vocabulary = await response.json();
      } catch (error: any) {
        console.error(error.message);
        this.isLoadingOptions = false;
      }

      if (!vocabulary) {
        return;
      }

      const path: string =
        this.control.uischema?.options?.asyncAutocomplete.vocabulary.items;
      vocabulary = this.deepValue(vocabulary, path);

      this.options = vocabulary;

      this.isLoadingOptions = false;
      this.hasLoadedOptions = true;
    },
    getOptionDisplay(option: any): { label: string; value: string }[] {
      const display: { label: string; value: string }[] =
        this.control.uischema?.options?.asyncAutocomplete.vocabulary.display;
      return display.map(d => ({
        label: d.label,
        value: this.deepValue(option, d.value),
      }));
    },
    getOptionValue(option: any): { [key: string]: any } {
      const value: { [key: string]: any } = {
        ...this.control.uischema?.options?.asyncAutocomplete.vocabulary.value,
      };

      for (var prop in value) {
        if (Object.prototype.hasOwnProperty.call(value, prop)) {
          value[prop] = this.deepValue(option, value[prop]);
        }
      }

      return value;
    },
    async search() {
      await this.loadOptions(this.valueInternal);
      this.page = 1;
    },
  },
});
</script>

<style lang="scss" scoped>
:deep(table) {
  table-layout: fixed;
}

.fixed-cell {
  width: 150px;
  height: 50px;
  padding-left: 0 !important;
  padding-right: 0 !important;
  text-align: center;
}

.fixed-cell-small {
  width: 50px;
  height: 50px;
  padding-left: 0 !important;
  padding-right: 0 !important;
  text-align: center;
}

.results-container {
  height: 0;
  overflow-y: auto;
  padding: 4rem;
  background: #efefef;
}
</style>
