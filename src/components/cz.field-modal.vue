<template>
  <div class="cz-field-modal">
    <!-- The consumer renders a landing-page-style summary in the default
         scoped slot. Slot props expose the resolved value at this scope,
         the AJV errors that fall under it, and an `openEdit` action that
         opens the modal for in-place editing. -->
    <slot
      name="summary"
      :value="value"
      :errors="errors"
      :errors-by-index="errorsByIndex"
      :has-errors="hasErrors"
      :open-edit="openEdit"
    />

    <v-dialog
      v-model="open"
      :max-width="maxWidth"
      scrollable
      content-class="cz-field-modal__content"
    >
      <v-card class="cz-field-modal__card">
        <v-card-title
          v-if="label"
          class="cz-field-modal__title text-subtitle-1 font-weight-medium d-flex align-center ga-2"
        >
          <span class="text-truncate">{{ label }}</span>
          <v-icon
            v-if="hasErrors"
            color="error"
            size="small"
            :title="`${errors.length} validation issue${errors.length === 1 ? '' : 's'}`"
          >
            mdi-alert-circle
          </v-icon>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            aria-label="Close"
            @click="open = false"
          />
        </v-card-title>
        <v-divider v-if="label" />
        <v-card-text class="cz-field-modal__body">
          <cz-field
            :scope="scope"
            :options="options"
            hide-label
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="cz-field-modal__actions">
          <v-spacer />
          <v-btn variant="flat" color="primary" @click="open = false"
            >Done</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  inject,
  provide,
  ref,
  type PropType,
} from 'vue';
import CzField from './cz.field.vue';

// Helper: convert a JsonForms scope string like
// "#/properties/creator/properties/affiliation" into the data-path
// segments ["creator", "affiliation"] (stripping the "properties" steps).
function scopeToPath(scope: string): string[] {
  return scope
    .replace(/^#\//, '')
    .split('/')
    .filter((seg) => seg !== 'properties' && seg !== '');
}

// Helper: convert a scope into the AJV instancePath prefix
// ("/creator", "/creator/affiliation", etc.) used by `errors[i].instancePath`.
function scopeToInstancePath(scope: string): string {
  return '/' + scopeToPath(scope).join('/');
}

function getAtPath(obj: any, path: string[]): any {
  let cur = obj;
  for (const seg of path) {
    if (cur == null) return undefined;
    cur = cur[seg];
  }
  return cur;
}

// Wraps a <cz-field> in a click-to-open <v-dialog>. The form's data and
// validation flow are unchanged — this component sits between the
// consumer's summary view and the underlying control, only deferring the
// control's mounting to when the modal opens.
//
// Slot props:
//   - value         : the current data at `scope`
//   - errors        : AJV errors with instancePath under this scope
//   - errorsByIndex : { [arrayIndex]: errors[] } for array scopes
//   - hasErrors     : boolean shorthand
//   - openEdit      : () => void, opens the modal
//
// The modal is lazy by default (Vuetify's v-dialog mounts content on
// first open), so heavy editors like map-backed coordinate pickers don't
// pay their cost until the user clicks in.
export default defineComponent({
  name: 'cz-field-modal',
  components: { CzField },
  props: {
    scope: { type: String, required: true },
    options: {
      type: Object as PropType<Record<string, any>>,
      default: undefined,
    },
    label: { type: String, default: undefined },
    maxWidth: { type: [Number, String], default: 900 },
  },
  setup(props) {
    const ctx = inject<any>('jsonforms', null);

    // Re-provide the JsonForms context so the cz-field inside the
    // v-dialog (which Vuetify teleports out of the normal DOM tree) sees
    // the same reactive store. Vue 3's Teleport is supposed to preserve
    // the component tree for inject, but Vuetify's overlay-based dialog
    // wraps content in a way that intermittently breaks inject across
    // the teleport boundary — without this re-provide the field renders
    // against an empty default store, which is why existing data
    // appears missing and required-field validations fire on open.
    if (ctx) provide('jsonforms', ctx);

    const open = ref(false);

    const value = computed(() => {
      const data = ctx?.core?.data;
      if (data == null) return undefined;
      return getAtPath(data, scopeToPath(props.scope));
    });

    const errors = computed(() => {
      const allErrors = ctx?.core?.errors ?? [];
      const prefix = scopeToInstancePath(props.scope);
      return allErrors.filter((e: any) => {
        const ip = (e?.instancePath as string | undefined) ?? '';
        // Match either the path itself or a descendant (with a / boundary
        // so "/creator" doesn't match "/creatorPolicy").
        return ip === prefix || ip.startsWith(prefix + '/');
      });
    });

    const errorsByIndex = computed(() => {
      const prefix = scopeToInstancePath(props.scope);
      const groups: Record<number, any[]> = {};
      for (const e of errors.value) {
        const ip = (e?.instancePath as string | undefined) ?? '';
        const rest = ip.startsWith(prefix) ? ip.slice(prefix.length) : '';
        const match = rest.match(/^\/(\d+)(\/|$)/);
        if (match) {
          const idx = Number(match[1]);
          (groups[idx] ||= []).push(e);
        }
      }
      return groups;
    });

    const hasErrors = computed(() => errors.value.length > 0);

    return {
      open,
      value,
      errors,
      errorsByIndex,
      hasErrors,
      openEdit: () => {
        open.value = true;
      },
    };
  },
});
</script>

<!-- Unscoped: v-dialog teleports this content to .v-overlay-container, so a
     scoped attribute selector would never match it. -->
<style lang="scss">
.v-overlay__content.cz-field-modal__content {
  // These hold whole sub-forms, so they need more room than Vuetify's
  // confirmation-dialog defaults.
  .cz-field-modal__title {
    padding: 1rem 1.25rem;
    min-height: 0;
  }

  .cz-field-modal__body {
    padding: 1.5rem 1.5rem 1.25rem;
  }

  .cz-field-modal__actions {
    padding: 0.75rem 1.25rem;
    min-height: 0;
  }
}
</style>
