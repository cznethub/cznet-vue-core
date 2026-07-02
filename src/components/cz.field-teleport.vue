<template>
  <Teleport :to="selector" :disabled="!targetExists" defer>
    <cz-field :scope="scope" />
  </Teleport>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import CzField from './cz.field.vue';

// Same control as <cz-field> but moved into an external DOM target whose id
// is derived from the field's scope. Consumer template places one or more
// `<div id="cz-field-name" />` anchors anywhere on the page; the form mounts
// the matching control into them. Falls back to in-place render if no
// target is found (so the field never silently disappears).
//
// Vue 3.5+'s `defer` prop guarantees the target is searched after the parent
// finishes rendering, so the consumer can declare anchor + form in the same
// render pass.
export default defineComponent({
  name: 'cz-field-teleport',
  components: { CzField, Teleport: 'Teleport' as any },
  props: {
    scope: { type: String, required: true },
  },
  setup(props) {
    const selector = computed(
      () => `#cz-field-${props.scope.replace(/[^a-zA-Z0-9_-]/g, '-')}`
    );
    const targetExists = ref(false);

    const refreshTarget = () => {
      targetExists.value = !!document.querySelector(selector.value);
    };

    onMounted(refreshTarget);
    watch(selector, refreshTarget);

    return { selector, targetExists };
  },
});
</script>
