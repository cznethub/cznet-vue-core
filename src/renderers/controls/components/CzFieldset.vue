<template>
  <div class="my-4">
    <fieldset
      :class="{
        'cz-fieldset': !isFlat,
        'is-borderless': isFlat,
        'is-invalid': !!errors,
      }"
    >
      <template v-if="!isFlat">
        <legend
          v-if="computedLabel || title"
          @click="show()"
          :class="{ 'v-label--active': isAdded || !hasToggle }"
          class="v-label"
        >
          {{ computedLabel || title }}
        </legend>

        <slot name="actions" :show="show">
          <div v-if="hasToggle">
            <v-tooltip v-if="!isAdded" bottom transition="fade">
              <template v-slot:activator="{ on: onTooltip }">
                <v-btn
                  icon
                  color="primary"
                  @click="show()"
                  :disabled="!enabled"
                  class="btn-add"
                  :aria-label="`Add to ${title}`"
                  v-on="onTooltip"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </template>
              {{ `Add ${title}` }}
            </v-tooltip>

            <v-tooltip v-else bottom transition="fade">
              <template v-slot:activator="{ on: onTooltip }">
                <v-btn
                  icon
                  color="error"
                  @click="hide()"
                  :disabled="!enabled"
                  class="btn-add"
                  aria-label="Remove"
                  v-on="onTooltip"
                >
                  <v-icon>mdi-minus</v-icon>
                </v-btn>
              </template>
              Remove
            </v-tooltip>
          </div>
        </slot>
      </template>

      <template v-if="isAdded || !hasToggle">
        <slot></slot>
      </template>
    </fieldset>

    <div v-if="description" class="text--secondary text-body-1 my-2 pa-2">
      {{ description }}
    </div>

    <div v-if="cleanedErrors" class="my-2 pa-2 v-messages error--text">
      {{ cleanedErrors }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "cz-fieldset",
  components: {},
  setup() {
    const isAdded = ref(false);

    return {
      isAdded,
    };
  },
  props: {
    isFlat: {
      type: Boolean,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    computedLabel: {
      type: String,
    },
    hasToggle: {
      type: Boolean,
    },
    enabled: {
      type: Boolean,
    },
    errors: {
      type: String,
    },
  },
  methods: {
    show() {
      if (this.enabled && !this.isAdded) {
        this.isAdded = true;
        this.$emit("show");
      }
    },
    hide() {
      this.isAdded = false;
      this.$emit("hide");
    },
  },
  computed: {
    cleanedErrors() {
      return this.errors?.replaceAll(`is a required property`, ``).trim() || "";
    },
  },
});
</script>
