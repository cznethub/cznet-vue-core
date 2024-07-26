<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :appliedOptions="appliedOptions"
  >
    <v-combobox
      :items="hints"
      @click="menu = true"
      @click:clear="hints = []"
      v-model="valueInternal"
      v-model:menu="menu"
      ref="searchInput"
      prepend-inner-icon="mdi-magnify"
      item-props
      item-title="label"
      item-value="value"
      rounded
      density="compact"
      clearable
      :loading="isFetchingHints"
      hide-no-data
      variant="solo"
      no-filter
    >
      <template #item="{ props, item }">
        <v-list-item
          v-bind="props"
          density="compact"
          @pointerdown="onHintSelected($event, item.raw)"
          @keydown.enter="onHintSelected($event, item.raw)"
        >
          <template #title>
            <v-list-item-title class="font-weight-regular">
              {{ item.raw.label }}
            </v-list-item-title>
          </template>
        </v-list-item>
      </template>
    </v-combobox>

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
          <v-row justify="center">
            <v-table
              class="array-container flex"
              v-bind="vuetifyProps('v-table')"
            >
              <thead v-if="control.schema.type === 'object'">
                <tr>
                  <!-- FIELDS TITLES -->
                  <th
                    v-for="(prop, index) in getValidColumnProps(control.schema)"
                    :key="`${control.path}-header-${index}`"
                    scope="col"
                  >
                    {{ title(prop) }}
                  </th>

                  <!-- CONTROLS -->
                  <th
                    v-if="control.enabled"
                    :class="
                      appliedOptions.showSortButtons
                        ? 'fixed-cell'
                        : 'fixed-cell-small'
                    "
                    scope="col"
                  ></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(element, index) in control.data"
                  :key="`${control.path}-${index}`"
                  :class="styles.arrayList.item"
                >
                  <!-- FIELDS RENDERERS -->
                  <td
                    v-for="propName in getValidColumnProps(control.schema)"
                    :key="
                      composePaths(
                        composePaths(control.path, `${index}`),
                        propName
                      )
                    "
                  >
                    <dispatch-renderer
                      :schema="control.schema"
                      :uischema="resolveUiSchema(propName)"
                      :path="composePaths(control.path, `${index}`)"
                      :enabled="control.enabled && !isRequired(element)"
                      :renderers="control.renderers"
                      :cells="control.cells"
                    />
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
          </v-row>
        </v-container>
        <v-container v-if="dataLength === 0" :class="styles.arrayList.noData">
          No data
        </v-container>
      </v-card-text>
    </v-card>
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
import { debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { fromEvent, from } from 'rxjs';

const typeaheadDebounceTime = 500;

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
    const options: Ref<{ label: string; value: any }[]> = ref([]);
    const hints: Ref<{ label: string; value: any }[]> = ref([]);
    const menu = ref(false);
    const isFetchingHints = ref(false);
    const valueInternal = ref('');
    const searchInput = ref(null);
    const isLoadingOptions = ref(true);

    return {
      ...control,
      suggestToDelete,
      fieldset,
      options,
      hints,
      menu,
      isFetchingHints,
      valueInternal,
      searchInput,
      isLoadingOptions,
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
  },
  created() {
    // @ts-ignore
    const requiredItems: string[] = this.control.schema.contains?.enum || [];

    requiredItems.map(item => {
      if (!this.control.data) {
        this.control.data = [];
      }
      // We must use isEqual to compare objects instead of Arra.includes
      const isIncluded = this.control.data.some((existingItem: any) =>
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

    this.loadOptions();
  },
  mounted() {
    // https://www.learnrxjs.io/learn-rxjs/recipes/type-ahead
    if (this.searchInput) {
      fromEvent(this.searchInput?.$el, 'input')
        .pipe(
          tap(() => {
            this.isFetchingHints = !!this.valueInternal;
            this.menu = true;
          }),
          debounceTime(typeaheadDebounceTime),
          map((e: any) => e.target.value),
          switchMap(() => from(this._onTypeahead()))
        )
        .subscribe(() => {
          this._handleTypeahead();
        });
    }
  },
  methods: {
    composePaths,
    createDefaultValue,
    addButtonClick() {
      this.addItem(
        this.control.path,
        createDefaultValue(this.control.schema, this.control.rootSchema)
      )();
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
    async loadOptions() {
      // Load options
      console.log(this.control);
      let vocabulary: any;
      const url =
        this.control.uischema?.options?.asyncAutocomplete.vocabularyUrl;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        vocabulary = await response.json();
        console.log(vocabulary);
      } catch (error: any) {
        console.error(error.message);
      }

      const path: string =
        this.control.uischema?.options?.asyncAutocomplete.items;
      vocabulary = this.deepValue(vocabulary, path);

      console.log(vocabulary);
      const labelPath = this.control.uischema?.options?.asyncAutocomplete.label;
      vocabulary.forEach((item: any) => {
        const label = this.deepValue(item, labelPath);

        this.options.push({
          label: label,
          value: label,
        });
      });

      console.log(this.options);
      this.isLoadingOptions = false;
    },
    onHintSelected(_event: PointerEvent, hint: { label: string; value: any }) {
      // TODO: duplicate check
      if (
        !this.control.data?.some(
          (item: { label: string; value: any }) => item.label === hint.label
        )
      ) {
        this.addItem(this.control.path, hint)();
      }
    },
    _handleTypeahead() {
      if (this.valueInternal) {
        this.isFetchingHints = false;
      }
    },
    async _onTypeahead() {
      if (!this.valueInternal?.trim?.()) {
        this.isFetchingHints = false;
        this.hints = [];
        return;
      }

      return new Promise((_resolve, _reject) => {
        setTimeout(() => {
          _resolve(true);
          this.hints = this.options; // TODO: filter using this.valueInternal
          // _reject(false);
        }, 500);
      });
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

// .array-container tbody tr td {
//   // border-bottom: none !important;
// }

.array-container tbody tr td .container {
  padding: 0;
  margin: 0;
}

:deep(.array-container .v-label) {
  background-color: transparent !important;
}
</style>
