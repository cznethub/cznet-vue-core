<template>
  <div>
    <v-field v-bind="vFieldProps" :variant="isFlat ? 'plain' : 'outlined'">
      <!-- CONTENT -->
      <div v-if="isAdded || !hasToggle" class="pa-4">
        <slot></slot>
      </div>

      <!-- LABEL -->
      <template v-slot:label="{ label }">
        <div @click="show">{{ label }}</div>
      </template>

      <!-- ACTIONS -->
      <template v-slot:append-inner>
        <slot name="actions" :show="show" :hide="hide">
          <div v-if="hasToggle && enabled && !readonly">
            <v-tooltip v-if="!isAdded" transition="fade">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-plus"
                  variant="text"
                  color="primary"
                  @click="show()"
                  :disabled="!enabled || readonly"
                  size="small"
                  class="btn-add"
                  :aria-label="`Add to ${title}`"
                  v-bind="props"
                ></v-btn>
              </template>
              {{ `Add ${title}` }}
            </v-tooltip>

            <v-tooltip v-else transition="fade">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-minus"
                  variant="text"
                  color="error"
                  @click="hide()"
                  :disabled="!enabled"
                  size="small"
                  class="btn-add"
                  aria-label="Remove"
                  v-bind="props"
                ></v-btn>
              </template>
              Remove
            </v-tooltip>
          </div>
        </slot>
      </template>
    </v-field>

    <!-- MESSAGES -->
    <div class="v-messages">
      <cz-field-messages :description="description" :errors="cleanedErrors" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { VBtn, VTooltip, VIcon, VTextField, VField } from 'vuetify/components';
import CzFieldMessages from '../../components/cz.field-messages.vue';

export default defineComponent({
  name: 'cz-fieldset',
  components: { VTooltip, VBtn, VIcon, CzFieldMessages, VTextField, VField },
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
        this.$emit('show');
      }
    },
    hide() {
      this.isAdded = false;
      this.$emit('hide');
    },
  },
  computed: {
    cleanedErrors() {
      return this.errors?.replaceAll(`is a required property`, ``).trim() || '';
    },
    /** @see https://vuetifyjs.com/en/api/v-field/#props */
    vFieldProps() {
      return {
        label: this.computedLabel,
        active: this.isAdded,
        error: !!this.errors?.length,
        disabled: this.readonly || !this.enabled,
      };
    },
  },
});
</script>

<style scoped lang="scss">
.v-field {
  display: flex;

  :deep(.v-field__field) {
    display: block;
  }

  :deep(.v-field__append-inner) {
    align-items: start;
  }

  :deep(.v-label.v-field-label:not(.v-field-label--floating)) {
    pointer-events: auto;
    cursor: text;
    width: 100%;
  }
}
</style>
