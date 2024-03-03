<template>
  <div
    id="container"
    ref="container"
    style="
      position: relative;
      user-select: none;
      overflow: hidden;
      touch-action: none;
    "
  >
    <slot v-bind="{ selected: intersected }" />
  </div>
</template>

<script lang="ts">
/**
 *  Adapted from https://github.com/andi23rosca/drag-select-vue
 */

// import { onUnmounted } from 'vue';
import { Component, Vue, toNative, Prop, Watch } from 'vue-facing-decorator';

interface Point {
  x: number;
  y: number;
}

const getDimensions = (p1: Point, p2: Point) => ({
  width: Math.abs(p1.x - p2.x),
  height: Math.abs(p1.y - p2.y),
});
const collisionCheck = (node1: DOMRect, node2: DOMRect) =>
  node1.left < node2.left + node2.width &&
  node1.left + node1.width > node2.left &&
  node1.top < node2.top + node2.height &&
  node1.top + node1.height > node2.top;

@Component({
  components: {},
  name: 'cz-drag-select',
  emits: ['endDrag', 'change', 'startDrag'],
})
class CzDragSelect extends Vue {
  @Prop({ required: true }) attribute!: string;

  intersected: string[] = [];

  @Watch('intersected')
  onIntersected(val: string) {
    this.$emit('change', val);
  }

  clearSelected() {
    this.intersected = [];
  }

  mounted() {
    const container = this.$el;
    const self = this;

    let containerRect = container.getBoundingClientRect();

    const getCoords = (event: MouseEvent | Touch) => ({
      x: event.clientX - containerRect.left,
      y: event.clientY - containerRect.top,
    });

    let children: Element[];

    const box = document.createElement('div');
    box.setAttribute('data-drag-box-component', '');
    box.style.position = 'absolute';
    box.classList.add('primary', 'lighten-4');
    box.style.opacity = '0.4';
    box.style.borderRadius = '2px';

    let start: Point = { x: 0, y: 0 };
    let end: Point = { x: 0, y: 0 };

    function intersection() {
      const rect = box.getBoundingClientRect();
      const intersected = children
        .filter(c => collisionCheck(rect, c.getBoundingClientRect()))
        .map(c => c.getAttribute(self.attribute) as string);

      if (
        intersected.length !== self.intersected.length ||
        intersected.some(i => !self.intersected.includes(i))
      ) {
        self.intersected = intersected;
      }
    }

    const touchStart = (event: any) => {
      event.preventDefault();
      startDrag(event.touches[0]);
    };

    function touchMove(event: TouchEvent) {
      event.preventDefault();
      drag(event.touches[0]);
    }

    function startDrag(event: any) {
      containerRect = container.getBoundingClientRect();
      children = Array.from(container.querySelectorAll(`[${self.attribute}]`));
      start = getCoords(event);
      end = start;
      document.addEventListener('mousemove', drag, true);
      document.addEventListener('touchmove', touchMove);

      box.style.top = start.y + 'px';
      box.style.left = start.x + 'px';

      container.prepend(box);
      intersection();
      self.$emit('startDrag');
    }

    function drag(event: MouseEvent | Touch) {
      end = getCoords(event);
      const dimensions = getDimensions(start, end);

      if (end.x < start.x) {
        box.style.left = end.x + 'px';
      }
      if (end.y < start.y) {
        box.style.top = end.y + 'px';
      }
      box.style.width = dimensions.width + 'px';
      box.style.height = dimensions.height + 'px';

      intersection();
    }

    function endDrag(_event: MouseEvent | TouchEvent) {
      start = { x: 0, y: 0 };
      end = { x: 0, y: 0 };

      box.style.width = '0px';
      box.style.height = '0px';

      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', touchMove);
      box.remove();
      self.$emit('endDrag');
    }

    container.addEventListener('mousedown', startDrag, true);
    container.addEventListener('touchstart', touchStart);

    document.addEventListener('mouseup', endDrag, true);
    document.addEventListener('touchend', endDrag, true);
  }

  // onUnmounted() {
  //   const container = this.$el;
  //   container.removeEventListener('mousedown', startDrag);
  //   container.removeEventListener('touchstart', touchStart);
  //   document.removeEventListener('mouseup', endDrag);
  //   document.removeEventListener('touchend', endDrag);
  // }
}

export default toNative(CzDragSelect);
</script>

<style lang="scss"></style>
