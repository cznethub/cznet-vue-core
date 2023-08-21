<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-hover v-slot="{ hover }">
      <v-combobox
        v-model="tags"
        @input="onTagsChange"
        :label="computedLabel"
        :data-id="computedLabel.replaceAll(` `, ``)"
        :hint="control.description"
        :delimiters="delimeters"
        :error-messages="control.errors"
        :menu-props="{ openOnClick: false }"
        small-chips
        multiple
        no-filter
        :id="control.id + '-input'"
        :class="styles.control.input"
        :readonly="!control.enabled || control.schema['readOnly']"
        :disabled="appliedOptions.isDisabled || !control.enabled"
        :autofocus="appliedOptions.focus"
        :placeholder="placeholder"
        :required="control.required"
        :clearable="hover && !(!control.enabled || control.schema['readOnly'])"
        :value="control.data"
        :items="control.options"
        v-bind="vuetifyProps('v-combobox')"
        item-text="label"
        item-value="value"
        @focus="isFocused = true"
        @blur="isFocused = false"
      >
        <template v-slot:selection="{ attrs, item }">
          <v-chip
            v-bind="attrs"
            :readonly="!control.enabled || control.schema['readOnly']"
            :disabled="appliedOptions.isDisabled || !control.enabled"
            :close="
              !(
                isRequired(item) ||
                !control.enabled ||
                control.schema['readOnly']
              )
            "
            small
            @click:close="remove(item)"
          >
            {{ item }}
          </v-chip>
        </template>
        <template v-slot:message>
          <div
            v-if="control.description"
            class="text-subtitle-1 text--secondary"
          >
            {{ control.description }}
          </div>
          <div v-if="cleanedErrors" class="v-messages error--text">
            {{ cleanedErrors }}
          </div>
        </template>
      </v-combobox>
    </v-hover>
  </control-wrapper>
</template>

<script lang="ts">
import {
  and,
  ControlElement,
  isPrimitiveArrayControl,
  JsonFormsRendererRegistryEntry,
  not,
  rankWith,
} from "@jsonforms/core";
import { defineComponent } from "vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue2";
import { VHover, VCombobox, VChip } from "vuetify/lib";
import { useVuetifyControl } from "@/renderers/util/composition";
import { default as ControlWrapper } from "../controls/ControlWrapper.vue";

const controlRenderer = defineComponent({
  name: "array-primitive-control-renderer",
  components: {
    VHover,
    VCombobox,
    VChip,
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: any) {
    const tags: string[] = [];

    return {
      tags,
      ...useVuetifyControl(
        useJsonFormsControl(props),
        (value) => value || undefined
      ),
    };
  },
  created() {
    // If no initial value, load default. Otherwise, load the data
    if (!this.control.data) {
      if (this.control.schema.default) {
        this.tags = this.control.schema.default;
        this.onChange(this.tags);
      } else {
        this.onChange(undefined);
      }
    } else {
      this.tags = this.control.data;
      this.onChange(this.tags);
    }

    // @ts-ignore
    const requiredValues = this.control.schema.contains?.enum;

    if (requiredValues && this.control.data) {
      // We need to check if existing values are required values with different casing. And if so, use the casing specified in required values.
      const existingValues = this.control.data.filter(
        (val) =>
          !requiredValues.some(
            (requiredVal) =>
              requiredVal.toLowerCase().trim() === val.toLowerCase().trim()
          )
      );
      // TODO: add the missing requried value to the submission in the repository. For now autopopulated in our forms.
      this.tags = [...new Set([...requiredValues, ...existingValues])];
      this.onChange(this.tags);
    }
  },
  computed: {
    delimeters() {
      // @ts-ignore
      return this.control.schema.options?.delimeter === false
        ? undefined
        : [","];
    },
  },
  methods: {
    onTagsChange() {
      // Prevent inserting duplicates and trim values
      this.tags = this.tags
        .filter((tag) => !!tag.trim())
        .map((tag) => tag.trim());
      this.tags = [...new Set(this.tags)];
      this.handleChange(this.control.path, this.tags);
    },
    remove(item: string) {
      this.tags.splice(this.tags.indexOf(item), 1);
      this.onTagsChange();
    },
    isRequired(item: string) {
      return (
        // @ts-ignore
        this.control.schema.contains &&
        // @ts-ignore
        this.control.schema.contains.enum.includes(item)
      );
    },
  },
});
export default controlRenderer;

const useArrayLayout = (uiSchema) => {
  return uiSchema.options?.useArrayLayout;
};

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(4, and(not(useArrayLayout), isPrimitiveArrayControl)),
};
</script>

<style lang="scss" scoped>
::v-deep .v-input__append-inner {
  display: none !important;
}
</style>
