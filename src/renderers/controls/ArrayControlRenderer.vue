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
      <template v-slot:actions="{ show }">
        <v-tooltip bottom transition="fade">
          <template v-slot:activator="{ on: onTooltip }">
            <v-btn
              icon
              color="primary"
              @click="
                addButtonClick();
                show();
              "
              :class="styles.arrayList.addButton"
              class="btn-add"
              :aria-label="`Add to ${control.label}`"
              v-on="onTooltip"
              :disabled="
                !control.enabled ||
                (appliedOptions.restrict &&
                  maxItems !== undefined &&
                  control.data &&
                  control.data.length >= maxItems)
              "
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
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
            <v-row justify="center">
              <v-simple-table
                class="array-container flex"
                v-bind="vuetifyProps('v-simple-table')"
              >
                <thead v-if="control.schema.type === 'object'">
                  <tr>
                    <th
                      v-for="(prop, index) in getValidColumnProps(
                        control.schema
                      )"
                      :key="`${control.path}-header-${index}`"
                      scope="col"
                    >
                      {{ title(prop) }}
                    </th>
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
                    v-for="(_element, index) in control.data"
                    :key="`${control.path}-${index}`"
                    :class="styles.arrayList.item"
                  >
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
                        :enabled="control.enabled"
                        :renderers="control.renderers"
                        :cells="control.cells"
                      />
                    </td>
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
                          <template v-slot:activator="{ on: onTooltip }">
                            <v-btn
                              v-on="onTooltip"
                              v-if="appliedOptions.showSortButtons"
                              fab
                              text
                              elevation="0"
                              small
                              aria-label="Up"
                              :disabled="index <= 0 || !control.enabled"
                              :class="styles.arrayList.itemMoveUp"
                              @click.native="moveUpClick($event, index)"
                            >
                              <v-icon class="notranslate">mdi-arrow-up</v-icon>
                            </v-btn>
                          </template>
                          Move Up
                        </v-tooltip>
                        <v-tooltip bottom>
                          <template v-slot:activator="{ on: onTooltip }">
                            <v-btn
                              v-on="onTooltip"
                              v-if="appliedOptions.showSortButtons"
                              fab
                              text
                              elevation="0"
                              small
                              aria-label="Down"
                              :disabled="
                                index >= dataLength - 1 || !control.enabled
                              "
                              :class="styles.arrayList.itemMoveDown"
                              @click.native="moveDownClick($event, index)"
                            >
                              <v-icon class="notranslate"
                                >mdi-arrow-down</v-icon
                              >
                            </v-btn>
                          </template>
                          Move Down
                        </v-tooltip>
                        <v-tooltip bottom>
                          <template v-slot:activator="{ on: onTooltip }">
                            <v-btn
                              v-on="onTooltip"
                              fab
                              text
                              elevation="0"
                              small
                              aria-label="Remove"
                              :class="styles.arrayList.itemDelete"
                              :disabled="
                                !control.enabled ||
                                (appliedOptions.restrict &&
                                  arraySchema !== undefined &&
                                  arraySchema.minItems !== undefined &&
                                  dataLength <= arraySchema.minItems)
                              "
                              @click.native="removeItemsClick($event, [index])"
                            >
                              <v-icon class="notranslate">mdi-delete</v-icon>
                            </v-btn>
                          </template>
                          Remove
                        </v-tooltip>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-row>
          </v-container>
          <v-container v-if="dataLength === 0" :class="styles.arrayList.noData">
            No data
          </v-container>
        </v-card-text>
      </v-card>
    </cz-fieldset>
  </control-wrapper>
</template>

<script lang="ts">
import {
  isObjectArrayControl,
  isPrimitiveArrayControl,
  JsonFormsRendererRegistryEntry,
  or,
  rankWith,
  composePaths,
  createDefaultValue,
  ControlElement,
  JsonSchema,
  Resolve,
  and,
} from "@jsonforms/core";
import startCase from "lodash/startCase";
import { defineComponent, ref } from "vue";
import {
  DispatchCell,
  DispatchRenderer,
  rendererProps,
  useJsonFormsArrayControl,
  RendererProps,
  useJsonFormsControl,
} from "@jsonforms/vue2";
import { useVuetifyArrayControl } from "@/renderers/util";
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
  VSimpleTable,
} from "vuetify/lib";
import { default as CzFieldset } from "./components/CzFieldset.vue";
import { default as ControlWrapper } from "./ControlWrapper.vue";

const controlRenderer = defineComponent({
  name: "array-control-renderer",
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
    VSimpleTable,
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
    // indicate to our child renderers that we are increasing the "nested" level
    return { ...control, suggestToDelete, fieldset };
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
  methods: {
    composePaths,
    createDefaultValue,
    addButtonClick() {
      this.addItem(
        this.control.path,
        createDefaultValue(this.control.schema)
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
    removeItemsClick(event, toDelete: number[]): void {
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
        scopedSchema.type === "object" &&
        typeof scopedSchema.properties === "object"
      ) {
        return Object.keys(scopedSchema.properties).filter(
          (prop) => scopedSchema.properties![prop].type !== "array"
        );
      }
      // primitives
      return [""];
    },
    title(prop: string) {
      return this.control.schema.properties?.[prop]?.title ?? startCase(prop);
    },
    resolveUiSchema(propName: string) {
      return this.control.schema.properties
        ? this.controlWithoutLabel(`#/properties/${propName}`)
        : this.controlWithLabel("#");
    },
    controlWithoutLabel(scope: string): ControlElement {
      return { type: "Control", scope, label: false };
    },
    controlWithLabel(scope: string): ControlElement {
      return {
        scope,
        type: "Control",
        label: this.control.schema.title
          ? `${this.control.schema.title}*`
          : false,
        // @ts-ignore
        description: this.control.schema.description || false,
      };
    },
  },
});

const useTableLayout = (uiSchema) => {
  return uiSchema.options?.useTableLayout;
};

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(
    4,
    and(useTableLayout, or(isPrimitiveArrayControl, isObjectArrayControl))
  ),
};
</script>

<style lang="scss" scoped>
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

.array-container tbody tr td {
  // border-bottom: none !important;
}

.array-container tbody tr td .container {
  padding: 0;
  margin: 0;
}

::v-deep .array-container .v-label {
  background-color: transparent !important;
}
</style>
