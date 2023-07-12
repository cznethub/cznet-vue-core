<template>
  <v-text-field
    type="number"
    @change.native="beforeChange($event)"
    :step="step"
    :id="control.id + '-input'"
    :class="styles.control.input"
    :readonly="!control.enabled || control.schema['readOnly']"
    :disabled="appliedOptions.isDisabled"
    :autofocus="appliedOptions.focus"
    :placeholder="placeholder"
    :label="computedLabel"
    :hint="control.description"
    :required="control.required"
    :error-messages="control.errors"
    :value="control.data"
    v-bind="vuetifyProps('v-text-field')"
  >
    <template v-slot:message>
      <div v-if="control.description" class="text-subtitle-1 text--secondary">
        {{ control.description }}
      </div>
      <div v-if="cleanedErrors" class="v-messages error--text">
        {{ cleanedErrors }}
      </div>
    </template>
  </v-text-field>
</template>

<script lang="ts">
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  rankWith,
  isIntegerControl,
} from "@jsonforms/core";
import { defineComponent } from "vue";
import {
  rendererProps,
  useJsonFormsControl,
  RendererProps,
} from "@jsonforms/vue2";
import { useVuetifyControl } from "@/renderers/util/composition";
import { VTextField } from "vuetify/lib";

const controlRenderer = defineComponent({
  name: "integer-control-renderer",
  components: {
    VTextField,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useVuetifyControl(useJsonFormsControl(props), (value) => {
      const val = parseInt(value, 10);
      return isNaN(val) ? undefined : val;
    });
  },
  computed: {
    step(): number {
      const options: any = this.appliedOptions;
      return options.step ?? 1;
    },
  },
  methods: {
    // If value changed to an empty string, we need to set the data to undefined in order to trigger validation error
    beforeChange(event) {
      if (event.target.value === null || event.target.value.trim() === "") {
        this.handleChange(this.control.path, undefined);
      } else {
        this.onChange(event.target.value);
      }
    },
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isIntegerControl),
};
</script>
