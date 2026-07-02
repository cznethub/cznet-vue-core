<template>
  <dispatch-renderer
    v-if="ready"
    :schema="schema"
    :uischema="controlUischema"
    :path="''"
    :enabled="true"
    :renderers="renderers"
    :cells="cells"
  />
</template>

<script lang="ts">
import { computed, defineComponent, inject, type PropType } from 'vue';
import { DispatchRenderer } from '@jsonforms/vue';

// `<cz-field scope="#/properties/name">` renders the same control that a
// uischema-driven `{ type: "Control", scope }` would, but the consumer can
// place it anywhere in their template. Must be a descendant of either a
// regular <cz-form> or <cz-form-composed> so the JsonForms context (schema,
// data, renderers, cells) is available via Vue's provide/inject.
//
// Props mirror the directives a uischema Control element would carry:
//   `hide-label`  → uischema.label = false (suppresses control's own label
//                   when the surrounding template already labels the field)
//   `label`       → uischema.label = string (override the schema-title label)
//   `options`     → uischema.options = {...} (forwarded as-is so per-field
//                   directives like `{ multi: true }`, array-editor `detail`
//                   layouts, `showSortButtons`, `collapsed`,
//                   `elementLabelProp`, embedded `MapLayout`, etc. survive
//                   the move from uischema-driven to slot-driven rendering)
export default defineComponent({
  name: 'cz-field',
  components: { DispatchRenderer },
  props: {
    scope: { type: String, required: true },
    hideLabel: { type: Boolean, default: false },
    label: { type: String, default: undefined },
    options: {
      type: Object as PropType<Record<string, any>>,
      default: undefined,
    },
  },
  setup(props) {
    const ctx = inject<any>('jsonforms', null);

    const ready = computed(() => !!ctx?.core?.schema);
    const schema = computed(() => ctx?.core?.schema);
    const renderers = computed(() => ctx?.renderers || []);
    const cells = computed(() => ctx?.cells || []);

    const controlUischema = computed(() => {
      const ui: Record<string, any> = {
        type: 'Control',
        scope: props.scope,
      };
      // JsonForms' computeLabel() returns '' when uischema.label is false,
      // which propagates to the underlying Vuetify input as label="" and
      // removes the floating-label slot entirely. `hide-label` wins over
      // any explicit `label` string for ergonomics — the consumer rarely
      // wants both.
      if (props.hideLabel) ui.label = false;
      else if (props.label !== undefined) ui.label = props.label;

      // Merge user-provided options with hide-label-driven defaults. When
      // the label is suppressed, also suppress the required-asterisk —
      // otherwise computeLabel returns a lone `*` and Vuetify floats that
      // asterisk in the top-left of the input with no field name beside
      // it. In the teleport/composed approach the consumer renders the
      // label themselves and is responsible for marking required-ness.
      const mergedOptions = { ...(props.options || {}) };
      if (props.hideLabel) {
        mergedOptions.hideRequiredAsterisk = true;
      }
      if (Object.keys(mergedOptions).length > 0) ui.options = mergedOptions;

      return ui;
    });

    return { ready, schema, renderers, cells, controlUischema };
  },
});
</script>
