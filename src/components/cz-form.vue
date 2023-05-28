<template>
  <json-forms
    @change="onChange"
    :ajv="ajv"
    :data="data"
    :readonly="isReadOnly"
    :renderers="Object.freeze(renderers)"
    :schema="schema"
    :uischema="uischema"
    validationMode="ValidateAndShow"
    ref="form"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { JsonForms, JsonFormsChangeEvent } from "@jsonforms/vue2";
import {
  JsonFormsRendererRegistryEntry,
  // JsonFormsI18nState,
} from "@jsonforms/core";
import { CzRenderers } from "@/renderers/renderer";
import { createAjv } from "@/renderers/validate/validate";
import { ErrorObject } from "ajv";
import { isCombinatorSchema } from "@/renderers/util";
import ajvErrors from "ajv-errors";
// import { createTranslator } from "@/renderers/i18n";

const customAjv = createAjv();
ajvErrors(customAjv);
const renderers = [...CzRenderers];

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

@Component({
  name: "cz-form",
  components: { JsonForms },
})
export default class CzForm extends Vue {
  protected ajv = customAjv;
  @Prop() schema!: any;
  @Prop() uischema!: any;
  @Prop() schemaDefaults!: any;
  @Prop() isReadOnly!: boolean;

  protected data: any = {};
  protected timesChanged = 0;
  protected renderers: JsonFormsRendererRegistryEntry[] = renderers;
  // protected i18n: JsonFormsI18nState = {
  //   locale: "en",
  //   translate: createTranslator("en", undefined),
  // } as JsonFormsI18nState;

  protected onChange(event: JsonFormsChangeEvent) {
    this.data = event.data;
    const errors =
      event.errors
        ?.filter((e: ErrorObject) => {
          return (
            !filteredErrorKeywords.includes(e.keyword) &&
            !filteredErrorKeywords.includes(e["_keyword"])
          );
        })
        .map((e: ErrorObject) => ({
          title: this._getErrorTitle(e),
          message: this._getErrorMessage(e),
        })) || [];

    this.$emit("update:errors", errors);
    this.$emit("update:data", event.data);
  }

  onCreate() {
    this.init();
  }

  protected init() {
    this.data = this.schemaDefaults || {};
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
        // For combinator renderers we must anotate the selected schema in the control itself and then use it here to get the corresponding prop title
        const combinatorSchema = isCombinatorSchema(error.parentSchema);

        const propTitle = combinatorSchema
          ? error.parentSchema?.anyOf[error["_selectedSchemaIndex"]]?.[
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
    }
    return error.message || "";
  }

  /** Find and return the properties array inside nested combinator schemas */
  private _getCombinatorSchemaProperties(schema: any) {
    const combinatorSchema = isCombinatorSchema(schema);

    if (!combinatorSchema) {
      return;
    }

    // TODO: Cannot use isSelectedSchema reliably because array items share the same schema object annotations
    const selectedSchema = schema[combinatorSchema]?.find(
      (s) => s.isSelectedSchema
    );

    return (
      selectedSchema?.properties ||
      this._getCombinatorSchemaProperties(selectedSchema)
    );
  }
}
</script>

<style lang="scss">
@import "../renderers/styles/renderers.scss";
</style>
