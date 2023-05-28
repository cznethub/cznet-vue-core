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
          // console.log(e.message, e.parentSchema?.isSelectedSchema);
          return !(
            e.parentSchema && e.parentSchema?.isSelectedSchema === false
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

  /** Find and return the properties array inside nested combinator schemas */
  private _getCombinatorSchemaProperties(schema: any) {
    const combinatorSchema = isCombinatorSchema(schema);

    if (!combinatorSchema) {
      return;
    }

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
