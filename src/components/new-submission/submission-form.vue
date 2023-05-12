<template>
  <json-forms
    @change="onChange"
    :ajv="ajv"
    :data="data"
    :readonly="false"
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

const customAjv = createAjv();
const renderers = [...CzRenderers];

@Component({
  name: "submission-form",
  components: { JsonForms },
})
export default class SubmissionForm extends Vue {
  protected ajv = customAjv;
  @Prop() schema!: any;
  @Prop() uischema!: any;
  @Prop() schemaDefaults!: any;

  protected data: any = {};
  protected renderers: JsonFormsRendererRegistryEntry[] = renderers;

  protected onChange(event: JsonFormsChangeEvent) {
    this.data = event.data;
  }

  created() {
    this.data = this.schemaDefaults;
  }
}
</script>

<style lang="scss">
@import "../../renderers/styles/renderers.scss";
</style>
