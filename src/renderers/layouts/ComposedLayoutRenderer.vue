<script lang="ts">
import { defineComponent, inject, type Slot } from 'vue';
import { rendererProps, type RendererProps } from '@jsonforms/vue';
import type { Layout } from '@jsonforms/core';

// Renders whatever the surrounding <cz-form-composed> passed in as its
// default slot. The form still owns schema + data + validation via the
// JsonForms context; we just hand the layout decisions back to the
// consumer template.
//
// JsonForms' DispatchRenderer passes the standard renderer props down
// (schema, uischema, path, renderers, cells, enabled, config, ...). Because
// this component's render returns a slot's VNode array (i.e. a fragment),
// Vue has nowhere to auto-attach those attrs and would emit a warning for
// each. Declaring the props explicitly absorbs them, and inheritAttrs:false
// silently drops any remaining DOM-attr fallthroughs (class, style, etc.)
// that have no single root to land on.
export default defineComponent({
  name: 'composed-layout-renderer',
  inheritAttrs: false,
  props: { ...rendererProps<Layout>() },
  setup(_props: RendererProps<Layout>) {
    const renderSlot = inject<Slot | null>('cz-form-composed-slot', null);
    // The consumer's whole template is evaluated inside this render effect,
    // so an exception in any one row (a nullish array entry, a bad index)
    // would otherwise abort the entire form's render rather than just that
    // row — which reads as "the page stopped responding".
    return () => {
      if (!renderSlot) return null;
      try {
        return renderSlot();
      } catch (e) {
        console.error('[cz-form-composed] slot render failed', e);
        return null;
      }
    };
  },
});
</script>
