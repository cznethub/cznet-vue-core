<template>
  <div v-if="description" class="text-subtitle-1 message--text">
    {{ description }}
  </div>
  <div v-if="errors" class="error--text">
    {{ errors }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'cz-field-messages',
  components: {},
  props: {
    description: String,
    errors: String,
  },
});
</script>

<style scoped>
.error--text {
  color: rgb(var(--v-theme-error));
}

.message--text {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}
</style>
