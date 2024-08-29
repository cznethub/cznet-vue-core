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
      :hasToggle="
        !appliedOptions.isViewMode &&
        !appliedOptions.isReadOnly &&
        !appliedOptions.isDisabled
      "
      :hasData="!noData"
      :enabled="!appliedOptions.isDisabled"
      :readonly="!control.enabled"
      :errors="control.errors"
      :title="control.schema.title"
      :computedLabel="computedLabel"
      @show="noData && control.enabled ? addButtonClick() : null"
      @hide="onHide"
      class="cz-fieldset"
      ref="fieldset"
    >
      <v-container v-if="!noData" justify-space-around align-content-center>
        <!-- OBJECT -->
        <div class="flex-grow-1">
          <template v-for="row of getDisplayElements()">
            <div v-if="row.value" class="mb-4">
              <v-label>{{ row.label }}</v-label>
              <v-divider class="my-1"></v-divider>
              <div v-if="row.isUrl" class="text-body-1 mb-2">
                <a :href="row.value" target="_blank">{{ row.value }}</a>
              </div>
              <div v-else class="text-body-1 mb-2">
                {{ row.value }}
              </div>
            </div>
          </template>
        </div>
      </v-container>
    </cz-fieldset>

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
            clearable
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
                    @click="selected = item.raw"
                    :ripple="false"
                    :variant="selected === item.raw ? 'outlined' : 'elevated'"
                    :color="selected === item.raw ? 'primary' : ''"
                  >
                    <v-card-text class="d-flex">
                      <div class="flex-grow-1" style="width: 0">
                        <template v-for="row of getOptionDisplay(item.raw)">
                          <template v-if="row.value">
                            <v-label>{{ row.label }}</v-label>
                            <div class="text-body-1 mb-4">
                              {{ row.value }}
                            </div>
                          </template>
                        </template>
                      </div>
                      <div class="ml-2 flex-shrink-0">
                        <v-radio
                          v-if="selected === item.raw"
                          :model-value="true"
                          disabled
                          color="primary"
                        ></v-radio>
                        <v-radio
                          v-else
                          :model-value="false"
                          color="primary"
                        ></v-radio>
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
import { ControlElement } from '@jsonforms/core';
import { defineComponent, ref, Ref } from 'vue';
import {
  DispatchCell,
  DispatchRenderer,
  rendererProps,
  RendererProps,
  useJsonFormsControlWithDetail,
} from '@jsonforms/vue';
import { useDefaults, useVuetifyControl } from '@/renderers/util';
import {
  VCard,
  VCardTitle,
  VCardText,
  VRow,
  VCol,
  VContainer,
  VTooltip,
  VIcon,
  VBtn,
  VAvatar,
  VSpacer,
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
    VTooltip,
    VIcon,
    VBtn,
    VSpacer,
    VContainer,
    CzFieldset,
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useVuetifyControl(useJsonFormsControlWithDetail(props));

    useDefaults(control);

    const fieldset = ref<InstanceType<typeof CzFieldset>>();
    const options: Ref<any[]> = ref([]);
    const menu = ref(false);
    const searchQ = ref('');
    const selected = ref();
    const isLoadingOptions = ref(false);
    const page = ref(1);
    const showAddDialog = ref(false);
    const itemsPerPage = ref(12);
    const hasLoadedOptions = ref(false);

    return {
      ...control,
      fieldset,
      options,
      menu,
      searchQ,
      isLoadingOptions,
      page,
      showAddDialog,
      itemsPerPage,
      hasLoadedOptions,
      selected,
    };
  },
  computed: {
    noData(): boolean {
      return !this.control.data;
    },
    display(): {
      [key: string]: { contents: string; hidden?: boolean; format?: string };
    } {
      return this.control.uischema?.options?.vocabulary.value;
    },
    hasDefaultOptions(): string | undefined {
      return this.control.uischema?.options?.vocabulary.default;
    },
    displayProps(): string[] {
      return Object.keys(this.display).filter(key => !this.display[key].hidden);
    },
    searchParam(): string | undefined {
      return this.control.uischema?.options?.vocabulary.queryParams?.search;
    },
    isFlat() {
      // @ts-ignore
      return this.control.schema.options?.flat;
    },
  },
  created() {
    if (this.hasDefaultOptions && !this.hasLoadedOptions) {
      this.loadDefaultOptions();
    }
  },
  methods: {
    onHide() {
      this.selected = null;
      this.handleChange(this.control.path, undefined);
    },
    getDisplayElements() {
      return this.displayProps.map(prop => {
        return {
          label:
            this.deepValue(
              this.control.schema.properties,
              prop.split('.').join('.properties.')
            )?.title || '',
          value: this.deepValue(this.control.data, prop),
          isUrl: this.display[prop]?.format === 'url',
        };
      });
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
      const value = this.getOptionValue(this.selected);
      this.handleChange(this.control.path, value);
    },
    isValueIncluded(value: any) {
      return this.control.data?.some((existingItem: any) =>
        isEqual(value, existingItem)
      );
    },
    /**
     * Receives an object and a path (using object notation) to one of its properties and
     * returns the value for that property.
     * @param object The object in which to look
     * @param path The path to the property in object notation. i.e 'foo.bar'
     * @param expand If true, will insert empty objects as it traverses if the property is undefined
     */
    deepValue(object: any, path: string, expand?: boolean) {
      let value = object;

      const paths = path.split('.');
      for (let i = 0; i < paths.length; i++) {
        const p = paths[i];
        if (expand && !value.hasOwnProperty(p)) {
          value[p] = {};
        }

        if (!value.hasOwnProperty(p)) {
          return;
        }
        value = value[p];
      }

      return value;
    },
    async _loadOptionsFromUrl(url: string) {
      let vocabulary: any;
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
    async loadDefaultOptions() {
      let url = this.control.uischema?.options?.vocabulary.default;
      this._loadOptionsFromUrl(url);
    },
    async loadOptions() {
      let url = this.control.uischema?.options?.vocabulary.jsonUrl;

      if (this.searchQ && this.searchParam) {
        url = `${url}&${this.searchParam}=${encodeURIComponent(this.searchQ)}`;
      }

      this._loadOptionsFromUrl(url);
    },
    getOptionDisplay(option: any): { label: string; value: string }[] {
      return this.displayProps.map(prop => {
        return {
          label:
            this.deepValue(
              this.control.schema.properties,
              prop.split('.').join('.properties.')
            )?.title || '',
          value: this.deepValue(option, this.display[prop].contents),
        };
      });
    },
    getOptionValue(option: any): { [key: string]: any } {
      if (!this.display) {
        return {};
      }

      const value: any = { ...this.display };

      for (let prop in this.display) {
        if (Object.prototype.hasOwnProperty.call(value, prop)) {
          // Properties can also use objet notation
          let target = value;
          const path = prop.split('.');
          if (path.length > 1) {
            // We need to point to the object that contains our property
            const targetPathStr = path.slice(0, path.length - 1).join('.');
            target = this.deepValue(value, targetPathStr, true);
          }

          const targetProp = prop.split('.').pop() || '';
          if (targetProp) {
            target[targetProp] = this.deepValue(option, value[prop].contents);
            if (path.length > 1) {
              delete value[prop];
            }
          }
        }
      }

      return value;
    },
    // async fetchElementDisplay(item: any) {
    //   const itemUrl: { url: string; params: string[] } =
    //     this.control.uischema?.options?.vocabulary.itemUrl;

    //   const params = itemUrl.params;
    //   let url = itemUrl.url;
    //   params.forEach(p => {
    //     url = sprintf(itemUrl.url || '', encodeURIComponent(item[p]));
    //   });

    //   let data;
    //   try {
    //     const response = await fetch(url);
    //     if (!response.ok) {
    //       throw new Error(`Response status: ${response.status}`);
    //     }

    //     data = await response.json();
    //   } catch (error: any) {
    //     console.error(error.message);
    //   }

    //   return this.getOptionDisplay(data);
    // },
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
        return this.appliedOptions.elementLabelProp
          .map((prop: string) => {
            return this.deepValue(
              element,
              prop.split('.').join('.properties.')
            );
          })
          .join(' ');
      } else {
        return this.deepValue(
          element,
          this.appliedOptions.elementLabelProp.split('.').join('.properties.')
        );
      }
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

.cz-fieldset {
  :deep(.v-field__field) {
    width: 0;
  }

  :deep(.v-expansion-panel-title__overlay) {
    display: none;
  }
}
</style>
