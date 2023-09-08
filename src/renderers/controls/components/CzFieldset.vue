<template>
  <div class="my-5">
    <fieldset
      :class="{
        'cz-fieldset': !isFlat,
        'is-borderless': isFlat,
        'is-invalid': !!errors,
        'is-readonly': readonly,
        'is-disabled': !enabled,
        'is-expanded': isAdded || !hasToggle,
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

        <slot name="actions" :show="show" :hide="hide">
          <div v-if="hasToggle && enabled && !readonly">
            <v-tooltip v-if="!isAdded" bottom transition="fade">
              <template v-slot:activator="{ on: onTooltip }">
                <v-btn
                  icon
                  color="primary"
                  @click="show()"
                  :disabled="!enabled || readonly"
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
        <div class="pt-4">
          <slot></slot>
        </div>
      </template>
    </fieldset>

    <div v-if="description" class="text--secondary text-body-1 my-2 px-2">
      {{ description }}
    </div>

    <div v-if="cleanedErrors" class="my-2 px-2 v-messages error--text">
      {{ cleanedErrors }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { VBtn, VTooltip, VIcon } from "vuetify/lib";

export default defineComponent({
  name: "cz-fieldset",
  components: { VTooltip, VBtn, VIcon },
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
    hasData: {
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
    readonly: {
      type: Boolean,
    },
    errors: {
      type: String,
    },
  },
  created() {
    if (this.hasData) {
      this.isAdded = true;
    }
  },
  methods: {
    show() {
      if (this.enabled && !this.readonly && !this.isAdded) {
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

<style scoped lang="scss">
// https://stackoverflow.com/a/27660473/3288102
fieldset,
.cz-fieldset {
  min-width: 0;
}

.cz-fieldset {
  background-color: #fff;
  color: rgba(0, 0, 0, 0.87);
  border: thin solid rgba(0, 0, 0, 0.12);
  border-color: rgb(158, 158, 158);
  border-radius: 4px;
  padding: 1rem;
  position: relative;
  min-height: 2rem;

  &.is-readonly:not(.is-expanded) {
    background: rgba(0, 0, 0, 0.06);

    legend {
      background: transparent;
    }
  }

  &.is-invalid {
    & > legend,
    & > fieldset > legend {
      color: #ff5252;
    }
  }

  &.is-disabled legend {
    color: rgba(0, 0, 0, 0.38) !important;
  }

  &:hover {
    border-color: rgba(0, 0, 0, 0.6);
  }

  & > legend {
    font-size: 16px;
    letter-spacing: 0.0125em;
    word-break: break-all;
    color: rgba(0, 0, 0, 0.6);
    background: #fff;
    font-weight: normal;
    padding: 0 0.25rem;
    position: absolute;
    left: 0.5rem;
    top: 0.5rem;

    &.v-label--active {
      position: absolute;
      cursor: default;
      transform: translateY(-1.4rem) scale(1) !important;
    }

    &:not(.v-label--active) {
      width: calc(100% - 5rem);
      cursor: text;
    }
  }

  ::v-deep .btn-add {
    position: absolute;
    top: -0.2rem;
    right: 0;
    z-index: 1;
  }
}
</style>
