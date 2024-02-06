<template>
  <json-forms
    @change="onChange"
    :ajv="ajv"
    :data="data"
    :readonly="isReadOnly || isViewMode || isDisabled"
    :renderers="Object.freeze(renderers)"
    :cells="cells"
    :config="config"
    :schema="schema"
    :uischema="uischema"
    :validationMode="
      isViewMode || isReadOnly ? 'NoValidation' : 'ValidateAndShow'
    "
    ref="form"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { JsonForms, JsonFormsChangeEvent } from "@jsonforms/vue2";
import { Config } from "@/types";
import {
  JsonFormsRendererRegistryEntry,
  // JsonFormsI18nState,
} from "@jsonforms/core";
import { ErrorObject } from "ajv";
import { isCombinatorSchema } from "@/renderers/util";

// import { createTranslator } from "@/renderers/i18n";
import { CzRenderers, extendedCzRenderers } from "@/renderers/renderer";

const renderers = [...CzRenderers];

import { createAjv } from "@/validate/validate";

const ajv = createAjv();

/**
 * The error-type of an AJV error is defined by its `keyword` property.
 * Certain errors are filtered because they don't fit to any rendered control.
 * All of them have in common that we don't want to show them in the UI
 * because controls will show the actual reason why they don't match their correponding sub schema.
 * - additionalProperties: Indicates that a property is present that is not defined in the schema.
 *      Jsonforms only allows to edit defined properties. These errors occur if an oneOf doesn't match.
 * - allOf: Indicates that not all of the allOf definitions match as a whole.
 * - anyOf: Indicates that an anyOf definition itself is not valid because none of its subschemas matches.
 * - oneOf: Indicates that an oneOf definition itself is not valid because not exactly one of its subschemas matches.
 */
const filteredErrorKeywords = [
  "additionalProperties",
  "allOf",
  "anyOf",
  "oneOf",
];

const defaultConfigs: Config = {
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
      dense: true,
      outlined: true,
    },
  },
};

@Component({
  name: "cz-form",
  components: { JsonForms },
})
export default class CzForm extends Vue {
  @Prop() schema!: any;
  @Prop() uischema!: any;
  /** The initial data. Can bind to it using `.sync` modifier */
  @Prop() data!: any;
  /** When `true`, sets the form to view mode. Validation is disabled, fields are readonly and empty fields are not rendered. */
  @Prop({ default: () => defaultConfigs }) config!: Config;

  timesChanged = 0;
  renderers: JsonFormsRendererRegistryEntry[] = renderers;
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
      const errors =
        event.errors
          ?.filter((e: ErrorObject) => {
            return (
              !filteredErrorKeywords.includes(e.keyword) &&
              // @ts-ignore
              !filteredErrorKeywords.includes(e["_keyword"])
            );
          })
          .map((e: ErrorObject) => ({
            title: this._getErrorTitle(e),
            message: this._getErrorMessage(e),
          })) || [];

      this.$emit("update:is-valid", !event.errors?.length);
      this.$emit("update:errors", errors);
      this.$emit("update:data", event.data);
    });
  }

  private _getErrorTitle(error: ErrorObject): string {
    if (error.instancePath) {
      return error.parentSchema?.title || error.params.missingProperty;
    }
    return (
      error.parentSchema?.properties?.[error.params.missingProperty]?.title ||
      error.params.missingProperty ||
      ""
    );
  }

  private _getErrorMessage(error: ErrorObject): string {
    if (error.keyword === "required") {
      if (error.instancePath) {
        // Error is in a nested object
        // For combinator renderers we must anotate `_selectedSchemaIndex` in the control itself and then use it here to get the corresponding prop title
        const combinatorSchema = isCombinatorSchema(error.parentSchema);

        const propTitle = combinatorSchema
          ? // @ts-ignore
            error.parentSchema?.anyOf[error["_selectedSchemaIndex"]]?.[
              error.params.missingProperty
            ]?.title
          : error.parentSchema?.properties?.[error.params.missingProperty]
              ?.title;

        if (propTitle) {
          return `must have required property '${propTitle}'`;
        }
      } else {
        return "is a required property";
      }
    } else if (error.keyword === "type" && error.data === undefined) {
      error.message = "is a required property";
    }
    return error.message || "";
  }
}
</script>

<style lang="scss">
@import "../renderers/styles/renderers.scss";
</style>
