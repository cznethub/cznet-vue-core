<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :isFocused="isFocused"
    :appliedOptions="appliedOptions"
  >
    <v-hover v-slot="{ hover }">
      <v-textarea
        :id="control.id + '-input'"
        :data-id="computedLabel.replaceAll(` `, ``)"
        @input="onChange"
        :maxlength="
          appliedOptions.restrict ? control.schema.maxLength : undefined
        "
        :counter="
          control.schema.maxLength !== undefined
            ? control.schema.maxLength
            : undefined
        "
        :error-messages="control.errors"
        :required="control.required"
        :hint="control.description"
        :value="control.data"
        :placeholder="placeholder"
        :label="computedLabel"
        :clearable="hover && !(!control.enabled || control.schema['readOnly'])"
        v-bind="vuetifyProps('v-textarea')"
      >
        <template v-slot:message>
          <div
            v-if="control.description"
            class="text-subtitle-1 text--secondary"
          >
            {{ control.description }}
          </div>
          <div v-if="cleanedErrors" class="v-messages error--text">
            {{ cleanedErrors }}
          </div>
        </template>
      </v-textarea>
    </v-hover>
  </control-wrapper>
</template>

<script lang="ts">
import {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  rankWith,
  isStringControl,
  isMultiLineControl,
  and,
} from "@jsonforms/core";
import { defineComponent } from "vue";
import {
  rendererProps,
  useJsonFormsControl,
  RendererProps,
} from "@jsonforms/vue2";
import { useDefaults, useVuetifyControl } from "@/renderers/util/composition";
import { VTextarea, VHover } from "vuetify/lib";
import { default as ControlWrapper } from "./ControlWrapper.vue";

const controlRenderer = defineComponent({
  name: "multi-string-control-renderer",
  components: { VTextarea, VHover, ControlWrapper },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const control = useJsonFormsControl(props);
    useDefaults(control);
    return useVuetifyControl(control, (value) => value || undefined, 300);
  },
  created() {
    // If a value was loaded, check if HTML needs to be stripped
    if (this.control.data && this.stripHTML) {
      this.handleChange(this.control.path, this.strip(this.control.data));
    }
  },
  computed: {
    stripHTML(): string {
      // @ts-ignore
      return !!this.control.schema.options?.stripHTML;
    },
  },
  methods: {
    strip(html: string) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return doc.body.textContent || "";
    },
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(4, and(isStringControl, isMultiLineControl)),
};
</script>
