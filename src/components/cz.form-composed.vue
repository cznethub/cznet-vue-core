<template>
  <json-forms
    :ajv="ajv"
    :data="modelValue"
    :readonly="isReadOnly || isViewMode || isDisabled"
    :renderers="renderers"
    :cells="cells"
    :config="config"
    :schema="schema"
    :uischema="composedUischema"
    :validationMode="
      isViewMode || isReadOnly ? 'NoValidation' : 'ValidateAndShow'
    "
    @change="onChange"
    class="cz-form cz-form-composed"
    :class="{
      'is-view-mode': isViewMode,
      'is-readonly': isReadOnly,
      'is-disabled': isDisabled,
    }"
  />
</template>

<script lang="ts">
import {
  defineComponent,
  nextTick,
  provide,
  useSlots,
  type PropType,
  type Slot,
} from 'vue';
import { JsonForms, type JsonFormsChangeEvent } from '@jsonforms/vue';
import { createAjv } from '@/validate/validate';
import { CzRenderers, extendedCzRenderers } from '@/renderers/renderer';
import type { Config } from '@/types';
import { defaultConfigs, processFormChange } from './cz.form-shared';

const renderers = Object.freeze([...CzRenderers]);
const ajv = createAjv();

// Slot-driven counterpart to <cz-form>. Same JsonForms infrastructure, same
// validation pipeline (via cz.form-shared), same readonly/view/disabled
// state semantics, same v-model + error event contract. The only thing
// that changes is *who* decides the layout: the consumer composes fields
// inside the default slot using <cz-field scope="..."> components.
// The flush styles target structures rendered DEEP inside ControlWrapper
// and the individual v-input controls. We can't reach them with scoped CSS
// (build-time scope attrs don't make it through provide/inject + render
// functions), so the override lives in an unscoped <style> block below.
export default defineComponent({
  name: 'cz-form-composed',
  components: { JsonForms },
  props: {
    schema: { type: Object, required: true },
    modelValue: { type: Object, default: () => ({}) },
    config: { type: Object as PropType<Config>, default: () => defaultConfigs },
  },
  emits: ['update:is-valid', 'update:errors', 'update:model-value'],
  setup(_, { slots: setupSlots }) {
    // Hand the consumer's default slot down to ComposedLayoutRenderer that
    // JsonForms instantiates when it walks our synthetic uischema. Using
    // provide/inject keeps the slot content inside the JsonForms render
    // tree, so descendant <cz-field>s receive the JsonForms context the
    // same way they would inside a uischema-driven layout.
    const defaultSlot =
      (useSlots() as Record<string, Slot>).default ??
      setupSlots.default ??
      null;
    provide('cz-form-composed-slot', defaultSlot);
  },
  computed: {
    ajv: () => ajv,
    renderers: () => renderers,
    cells: () => extendedCzRenderers,
    composedUischema: () => ({ type: 'CzComposedLayout' }),
    isViewMode(): boolean {
      return !!this.config?.isViewMode;
    },
    isReadOnly(): boolean {
      return !!this.config?.isReadOnly;
    },
    isDisabled(): boolean {
      return !!this.config?.isDisabled;
    },
  },
  methods: {
    onChange(event: JsonFormsChangeEvent) {
      // Same nextTick + change-handler chain as <cz-form>; defer error
      // emission until annotations finish so combinator-aware error
      // messages can resolve their _selectedSchemaIndex.
      nextTick(() => {
        processFormChange(event, (name, payload) =>
          this.$emit(name as any, payload)
        );
      });
    },
  },
});
</script>

<style lang="scss">
// Render <cz-field>s flush inside the consumer's template — strip the
// JsonForms-default control-wrapper margin and the empty hint row so an
// input sits right under its preceding section heading or column header.
// Errors still display (we only collapse the .v-input__details box when
// there are no messages to show).
//
// This block is intentionally NOT scoped: ControlWrapper's `my-5` div is
// rendered through DispatchRenderer (a deep descendant Vue can't see at
// compile time for scope-attr injection). The `.cz-form-composed` class on
// the json-forms host limits the impact to composed forms.
// `.cz-field-modal__content` is listed alongside the host class because
// v-dialog teleports its content outside the json-forms host.
.cz-form-composed,
.cz-field-modal__content {
  // ControlWrapper.vue: <div v-if="visible" class="my-5" ...>
  .my-5 {
    margin-top: 0 !important;
    margin-bottom: 0.5rem !important;
  }

  // Vuetify's input details row holds both errors and helper text. Don't
  // hide it outright — collapse it to zero when there are no messages and
  // let it grow naturally when errors render so validation feedback stays
  // visible.
  .v-input--horizontal .v-input__details {
    padding-top: 0;
    padding-bottom: 0;
    min-height: 0;
  }

  // Inside an array row the layouts own the rhythm (VerticalLayoutRenderer's
  // `row-gap`, HorizontalLayoutRenderer's grid gap), so zero the margin.
  .v-expansion-panel .my-5 {
    margin: 0 !important;
  }
}
</style>
