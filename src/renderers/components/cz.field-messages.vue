<template>
  <div v-if="description" class="text-subtitle-1 text-medium-emphasis">
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
