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
import { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
import { CzRenderers } from "@/renderers/renderer";
import { createAjv } from "@/renderers/validate/validate";
import { ErrorObject } from "ajv";

const customAjv = createAjv();
const renderers = [...CzRenderers];

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

  protected onChange(event: JsonFormsChangeEvent) {
    this.data = event.data;
    const errors =
      event.errors?.map((e: ErrorObject) => ({
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
        // For combinator renderers we must anotate the fitting schema in the renderer itself and then use it here to get the corresponding prop title
        const isCombinatorSchema = this._isCombinatorSchema(error.parentSchema);

        const propTitle = isCombinatorSchema
          ? this._getCombinatorSchemaProperties(error.parentSchema)?.[
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

  private _isCombinatorSchema(schema: any): string {
    return schema.anyOf
      ? "anyOf"
      : schema.allOf
      ? "allOf"
      : schema.oneOf
      ? "oneOf"
      : "";
  }

  /** Find and return the properties array inside nested combinator schemas */
  private _getCombinatorSchemaProperties(schema: any) {
    const isCombinatorSchema = this._isCombinatorSchema(schema);

    if (!isCombinatorSchema) {
      return;
    }

    const fittingSchema = schema[isCombinatorSchema]?.find(
      (s) => s.isFittingSchema
    );
    if (fittingSchema) {
      if (fittingSchema.properties) {
        return fittingSchema.properties;
      } else {
        return this._getCombinatorSchemaProperties(fittingSchema);
      }
    }
  }
}
</script>

<style lang="scss">
@import "../renderers/styles/renderers.scss";
</style>
