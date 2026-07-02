<template>
  <json-forms
    @change="onChange"
    :ajv="ajv"
    :data="modelValue"
    :readonly="isReadOnly || isViewMode || isDisabled"
    :renderers="renderers"
    :cells="cells"
    :config="config"
    :schema="schema"
    :uischema="uischema"
    :validationMode="
      isViewMode || isReadOnly ? 'NoValidation' : 'ValidateAndShow'
    "
    class="cz-form"
    :class="{
      'is-view-mode': isViewMode,
      'is-readonly': isReadOnly,
      'is-disabled': isDisabled,
    }"
    ref="form"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop, toNative } from 'vue-facing-decorator';
import { JsonForms, JsonFormsChangeEvent } from '@jsonforms/vue';
import { Config } from '@/types';
import { createAjv } from '@/validate/validate';
import { CzRenderers, extendedCzRenderers } from '@/renderers/renderer';
import { defaultConfigs, processFormChange } from './cz.form-shared';

// import { createTranslator } from "@/renderers/i18n";

const renderers = Object.freeze([...CzRenderers]);
const ajv = createAjv();

@Component({
  name: 'cz-form',
  components: { JsonForms },
  emits: ['update:is-valid', 'update:errors', 'update:model-value'],
})
class CzForm extends Vue {
  @Prop() schema!: any;
  @Prop() uischema!: any;
  /** The initial data. Can bind to it using `.sync` modifier */
  @Prop() modelValue!: any;
  /** When `true`, sets the form to view mode. Validation is disabled, fields are readonly and empty fields are not rendered. */
  @Prop({ default: () => defaultConfigs }) config!: Config;

  timesChanged = 0;
  renderers = renderers;
  // i18n: JsonFormsI18nState = {
  //   locale: "en",
  //   translate: createTranslator("en", undefined),
  // } as JsonFormsI18nState;

  get cells() {
    return extendedCzRenderers;
  }

  get ajv() {
    return ajv;
  }

  get isViewMode() {
    return !!this.config.isViewMode;
  }

  get isReadOnly() {
    return !!this.config.isReadOnly;
  }

  get isDisabled() {
    return !!this.config.isDisabled;
  }

  onChange(event: JsonFormsChangeEvent) {
    // Run on next tick to allow annotations to complete
    this.$nextTick(() => {
      processFormChange(event, (name, payload) =>
        this.$emit(name as any, payload)
      );
    });
  }
}

export default toNative(CzForm);
</script>

<style lang="scss">
@use '../renderers/styles/renderers.scss';
</style>
