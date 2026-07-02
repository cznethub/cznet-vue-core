import type { ErrorObject } from 'ajv';
import type { JsonFormsChangeEvent } from '@jsonforms/vue';
import { isCombinatorSchema } from '@/renderers/util';
import type { Config } from '@/types';

/**
 * AJV error keywords filtered from the UI-facing error list because the
 * matching control already surfaces the underlying reason.
 * - additionalProperties: a property is present that the schema doesn't define
 * - allOf / anyOf / oneOf: a combinator-level mismatch (controls show the
 *   actual subschema failure)
 * - if: conditional-schema failures, surfaced by their child errors
 */
export const filteredErrorKeywords = [
  'additionalProperties',
  'allOf',
  'anyOf',
  'oneOf',
  'if',
];

export const defaultConfigs: Config = {
  restrict: true,
  trim: false,
  showUnfocusedDescription: false,
  hideRequiredAsterisk: false,
  collapseNewItems: false,
  breakHorizontal: false,
  initCollapsed: false,
  hideAvatar: false,
  hideArraySummaryValidation: false,
  vuetify: {
    commonAttrs: {
      density: 'compact',
      variant: 'outlined',
    },
  },
};

export function getErrorTitle(error: ErrorObject): string {
  if (error.instancePath) {
    return (
      (error.parentSchema as any)?.title ||
      (error.params as any).missingProperty
    );
  }
  let title =
    (error.parentSchema as any)?.properties?.[
      (error.params as any).missingProperty
    ]?.title ||
    (error.params as any).missingProperty ||
    '';
  title = title.replaceAll('_', ' ');
  return title.length ? title.charAt(0).toUpperCase() + title.slice(1) : title;
}

export function getErrorMessage(error: ErrorObject): string {
  if (error.keyword === 'required') {
    if (error.instancePath) {
      // Combinator renderers annotate _selectedSchemaIndex on the control so
      // we can pick the right anyOf branch when surfacing the field title.
      const combinatorSchema = isCombinatorSchema(error.parentSchema);
      const missing = (error.params as any).missingProperty;
      const propTitle = combinatorSchema
        ? (error.parentSchema as any)?.anyOf?.[
            (error as any)._selectedSchemaIndex
          ]?.[missing]?.title
        : (error.parentSchema as any)?.properties?.[missing]?.title;
      if (propTitle) {
        return `must have required property '${propTitle}'`;
      }
    } else {
      return 'is a required property';
    }
  } else if (error.keyword === 'type' && (error as any).data === undefined) {
    error.message = 'is a required property';
  }
  return error.message || '';
}

/**
 * Centralized JsonForms change handler. Filters out combinator-level errors,
 * maps the rest to UI-friendly { title, message } pairs, and emits the same
 * three update events that <cz-form> historically emitted, in the same order.
 *
 * Used by both <cz-form> and <cz-form-composed> so validation, error
 * reporting, and v-model semantics are guaranteed identical across the
 * uischema-driven and slot-driven entry points.
 */
export function processFormChange(
  event: JsonFormsChangeEvent,
  emit: (name: string, payload: unknown) => void
): void {
  const errors =
    event.errors
      ?.filter(
        (e: ErrorObject) =>
          !filteredErrorKeywords.includes(e.keyword) &&
          !filteredErrorKeywords.includes((e as any)._keyword)
      )
      .map((e: ErrorObject) => ({
        title: getErrorTitle(e),
        message: getErrorMessage(e),
      })) || [];

  emit('update:is-valid', !event.errors?.length);
  emit('update:errors', errors);
  emit('update:model-value', event.data);
}
