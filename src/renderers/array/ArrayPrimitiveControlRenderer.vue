<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-combobox
      v-model="tags"
      @update:model-value="onTagsChange"
      :label="computedLabel"
      :data-id="computedLabel.replaceAll(` `, ``)"
      :hint="control.description"
      :delimiters="delimeters"
      :error-messages="control.errors"
      :menu-props="{ openOnClick: false }"
      small-chips
      multiple
      no-filter
      chips
      hide-details="auto"
      :id="control.id + '-input'"
      :class="styles.control.input"
      :placeholder="placeholder"
      :required="control.required"
      :clearable="control.enabled && !isReadOnly"
      closable-chips
      :items="suggestions"
      v-bind="vuetifyProps('v-combobox')"
      item-text="label"
      item-value="value"
      @update:focused="isFocused = $event"
      @blur="isFocused = false"
    >
      <template #chip="{ item }">
        <v-chip
          :readonly="!control.enabled || isReadOnly"
          :disabled="appliedOptions.isDisabled"
          :closable="
            !(isRequired(item.value) || !control.enabled || isReadOnly)
          "
          @click:close="removeTag(item.value)"
          size="small"
        >
          {{ item.value }}
        </v-chip>
      </template>

      <!-- Our own handler, not Vuetify's onClick, so clearing waits for confirmation. -->
      <template #clear>
        <v-icon tabindex="-1" @click="onClickClear" />
      </template>

      <template #message>
        <cz-field-messages
          :description="control.description"
          :errors="cleanedErrors"
        />
      </template>
    </v-combobox>

    <v-dialog
      :model-value="showClearConfirm"
      max-width="420"
      content-class="cz-confirm"
      @keydown.esc="cancelClear"
      @click:outside="cancelClear"
    >
      <v-card class="cz-confirm__card">
        <div class="d-flex ga-3 pa-5 pb-3">
          <v-avatar color="error" variant="tonal" size="40" class="flex-shrink-0">
            <v-icon size="20">mdi-trash-can-outline</v-icon>
          </v-avatar>
          <div class="min-w-0 align-self-center">
            <div class="text-subtitle-1 font-weight-medium">
              Remove all {{ tags.length }} entries?
            </div>
          </div>
        </div>

        <v-card-actions class="px-5 pb-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelClear">Cancel</v-btn>
          <v-btn variant="flat" color="error" @click="confirmClear">
            Remove all
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </control-wrapper>
</template>

<script lang="ts">
import { and, ControlElement, JsonSchema7 } from '@jsonforms/core';
import { defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import {
  VCombobox,
  VChip,
  VDialog,
  VCard,
  VCardActions,
  VBtn,
  VAvatar,
  VIcon,
  VSpacer,
} from 'vuetify/components';
import { useVuetifyControl } from '@/renderers/util/composition';
import { default as ControlWrapper } from '../controls/ControlWrapper.vue';
import { isArray, every, isString } from 'lodash-es';
import czFieldMessages from '../components/cz.field-messages.vue';
export default defineComponent({
  name: 'array-primitive-control-renderer',
  components: {
    VCombobox,
    VChip,
    VDialog,
    VCard,
    VCardActions,
    VBtn,
    VAvatar,
    VIcon,
    VSpacer,
    ControlWrapper,
    czFieldMessages,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  data() {
    return {
      showClearConfirm: false,
    };
  },
  setup(props: any) {
    const tags: string[] = [];
    return {
      tags,
      ...useVuetifyControl(
        useJsonFormsControl(props),
        value => value || undefined
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

    this.loadRequiredTags();
  },
  computed: {
    delimeters() {
      // @ts-ignore
      return this.control.schema.options?.delimeter === false
        ? undefined
        : [','];
    },
    suggestions(): string[] | undefined {
      // TODO: modify schema files to use options from uischema
      const suggestions = this.control.uischema.options?.suggestion;

      if (
        suggestions === undefined ||
        !isArray(suggestions) ||
        !every(suggestions, isString)
      ) {
        // check for incorrect data
        return undefined;
      }
      return suggestions;
    },
  },
  methods: {
    onTagsChange(tags: string[]) {
      this.tags = tags;
      // Prevent inserting duplicates and trim values
      this.tags = this.tags.filter(tag => !!tag.trim()).map(tag => tag.trim());

      // pre-process to remove duplicates of different casing
      this.tags = this.tags.reduce((acc, curr, _prev) => {
        if (!acc.some(tag => curr.toLowerCase() === tag.toLocaleLowerCase())) {
          acc.push(curr);
        }
        return acc;
      }, [] as string[]);

      this.tags = [...new Set(this.tags)];
      this.handleChange(this.control.path, this.tags);
    },
    onClickClear() {
      if (this.tags.length) {
        this.showClearConfirm = true;
      }
    },
    confirmClear() {
      this.showClearConfirm = false;
      this.tags = [];
      this.handleChange(this.control.path, this.tags);
      this.loadRequiredTags();
    },
    cancelClear() {
      this.showClearConfirm = false;
    },
    removeTag(item: string) {
      if (this.isRequired(item)) {
        return;
      }
      this.tags.splice(this.tags.indexOf(item), 1);
      this.handleChange(this.control.path, this.tags);
    },
    isRequired(item: string) {
      const schema = this.control.schema as JsonSchema7;
      return schema.contains && schema.contains.enum?.includes(item);
    },
    loadRequiredTags() {
      // @ts-ignore
      const requiredValues = this.control.schema.contains?.enum;

      if (requiredValues && this.control.data) {
        // We need to check if existing values are required values with different casing. And if so, use the casing specified in required values.
        const existingValues = this.control.data.filter(
          (val: string) =>
            !requiredValues.some(
              (requiredVal: string) =>
                requiredVal.toLowerCase().trim() === val.toLowerCase().trim()
            )
        );

        // TODO: add the missing requried value to the submission in the repository. For now autopopulated in our forms.
        this.tags = [...new Set([...requiredValues, ...existingValues])];
        this.onChange(this.tags);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
:deep(.v-input__append-inner) {
  display: none !important;
}
</style>
