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
      <template #actions>
        <v-tooltip bottom transition="fade">
          <template #activator="{ props }">
            <v-btn
              icon="mdi-plus"
              variant="elevated"
              size="small"
              border="solid thin"
              @click="addButtonClick"
              :class="styles.arrayList.addButton"
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

      <v-container v-if="!noData" justify-space-around align-content-center>
        <v-row justify="center">
          <v-expansion-panels focusable multiple>
            <v-expansion-panel
              v-for="(element, index) in control.data"
              :class="styles.arrayList.item"
            >
              <v-expansion-panel-title :class="styles.arrayList.itemHeader">
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
                class="pa-0"
              >
                <!-- OBJECT -->
                <div class="flex-grow-1">
                  <template v-for="row of getDisplayElements(index)">
                    <div class="text-caption">{{ row.label }}</div>
                    <div class="text-body-1 mb-2">{{ row.value }}</div>
                  </template>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-row>
      </v-container>
    </cz-fieldset>

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

    <v-dialog
      max-width="1280"
      height="70vh"
      v-model="showAddDialog"
      @update:model-value="$event ? null : closeDialog()"
    >
      <v-card class="fill-height d-flex flex-column">
        <v-card-title>Search</v-card-title>
        <v-card-text v-if="searchParam" class="flex-grow-0">
          <v-text-field
            append-inner-icon="mdi-magnify"
            v-model.trim="searchQ"
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
          <v-btn text="Cancel" @click="closeDialog"></v-btn>
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
import { ControlElement, JsonSchema, Resolve } from '@jsonforms/core';
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
import { sprintf } from 'sprintf-js';

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
    const searchQ = ref('');
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
      searchQ,
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
    hideAvatar(): boolean {
      // @ts-ignore
      return !!this.appliedOptions.hideAvatar;
    },
    dataLength(): number {
      return this.control.data ? this.control.data.length : 0;
    },
    noData(): boolean {
      return !this.control.data || this.control.data.length === 0;
    },
    minItems() {
      // @ts-ignore
      return this.control.schema.minItems || this.arraySchema?.minItems;
    },
    maxItems() {
      // @ts-ignore
      return this.control.schema.maxItems || this.arraySchema?.maxItems;
    },
    selected() {
      return this.options.filter(o => !!o._isSelected);
    },
    display(): { [key: string]: { contents: string; hidden?: boolean } } {
      return this.control.uischema?.options?.vocabulary.value;
    },
    displayProps(): string[] {
      return Object.keys(this.display).filter(key => !this.display[key].hidden);
    },
    searchParam(): string | undefined {
      return this.control.uischema?.options?.vocabulary.queryParams?.search;
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
    getDisplayElements(index: number) {
      return this.displayProps.map(prop => ({
        label: this.control.schema.properties?.[prop].title,
        value: this.control.data[index][prop],
      }));
    },
    addButtonClick() {
      this.showAddDialog = true;
      // Load options
      if (!this.hasLoadedOptions && !this.searchParam) {
        this.loadOptions();
      }
    },
    closeDialog() {
      this.showAddDialog = false;
      if (!this.control.data?.length) {
        // @ts-ignore
        this.fieldset?.hide();
      }
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
    removeItemsClick(toDelete: number[]): void {
      this.removeItems?.(this.control.path, toDelete)();
      if (this.control.data.length === 0) {
        this.handleChange(this.control.path, undefined);
        // @ts-ignore
        this.fieldset?.hide();
      }
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
      let vocabulary: any;
      let url = this.control.uischema?.options?.vocabulary.jsonUrl;

      if (this.searchQ && this.searchParam) {
        url = `${url}&${this.searchParam}=${encodeURIComponent(this.searchQ)}`;
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

      const path: string = this.control.uischema?.options?.vocabulary.items;
      vocabulary = this.deepValue(vocabulary, path);

      this.options = vocabulary;

      this.isLoadingOptions = false;
      this.hasLoadedOptions = true;
    },
    getOptionDisplay(option: any): { label: string; value: string }[] {
      return this.displayProps.map(prop => ({
        label: this.control.schema.properties?.[prop].title || '',
        value: this.deepValue(option, this.display[prop].contents),
      }));
    },
    getOptionValue(option: any): { [key: string]: any } {
      if (!this.display) {
        return {};
      }

      const value: { [key: string]: { contents: string; hidden?: boolean } } = {
        ...this.display,
      };

      for (var prop in value) {
        if (Object.prototype.hasOwnProperty.call(value, prop)) {
          value[prop] = this.deepValue(option, value[prop].contents);
        }
      }

      return value;
    },
    async fetchElementDisplay(item: any) {
      const itemUrl: { url: string; params: string[] } =
        this.control.uischema?.options?.vocabulary.itemUrl;

      const params = itemUrl.params;
      let url = itemUrl.url;
      params.forEach(p => {
        url = sprintf(itemUrl.url || '', encodeURIComponent(item[p]));
      });

      let data;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        data = await response.json();
      } catch (error: any) {
        console.error(error.message);
      }

      return this.getOptionDisplay(data);
    },
    async search() {
      await this.loadOptions();
      this.page = 1;
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
</script>

<style lang="scss" scoped>
.results-container {
  height: 0;
  overflow-y: auto;
  padding: 4rem;
  background: #efefef;
}
</style>
