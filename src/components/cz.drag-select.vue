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
  emits: ['endDrag', 'update:modelValue', 'startDrag'],
})
class CzDragSelect extends Vue {
  @Prop({ required: true }) attribute!: string;
  @Prop({ default: false }) disabled!: boolean;
  box: HTMLDivElement = document.createElement('div');
  start: Point = { x: 0, y: 0 };
  end: Point = { x: 0, y: 0 };
  children: Element[] = [];
  intersected: string[] = [];
  containerRect: DOMRect = new DOMRect();

  @Watch('intersected', { deep: true })
  onIntersected(val: string) {
    this.$emit('update:modelValue', val);
  }

  clearSelected() {
    this.intersected = [];
  }

  mounted() {
    this.box.setAttribute('data-drag-box-component', '');
    this.box.style.position = 'absolute';
    this.box.classList.add('bg-primary-lighten-4');
    this.box.style.opacity = '0.4';
    this.box.style.borderRadius = '2px';

    this.$el.addEventListener('mousedown', this.startDrag, true);
    this.$el.addEventListener('touchstart', this.touchStart);

    document.addEventListener('mouseup', this.endDrag, true);
    document.addEventListener('touchend', this.endDrag, true);
  }

  getCoordinates(event: MouseEvent | Touch) {
    this.containerRect = this.$el.getBoundingClientRect();

    return {
      x: event.clientX - this.containerRect.left,
      y: event.clientY - this.containerRect.top,
    };
  }

  intersection() {
    const rect = this.box.getBoundingClientRect();
    const intersected = this.children
      .filter(c => collisionCheck(rect, c.getBoundingClientRect()))
      .map(c => c.getAttribute(this.attribute) as string);

    if (
      intersected.length !== this.intersected.length ||
      intersected.some(i => !this.intersected.includes(i))
    ) {
      this.intersected = intersected;
    }
  }

  touchStart(event: any) {
    event.preventDefault();
    this.startDrag(event.touches[0]);
  }

  touchMove(event: TouchEvent) {
    event.preventDefault();
    this.drag(event.touches[0]);
  }

  startDrag(event: MouseEvent) {
    this.containerRect = this.$el.getBoundingClientRect();
    this.children = Array.from(
      this.$el.querySelectorAll(`[${this.attribute}]`)
    );
    this.start = this.getCoordinates(event);
    this.end = this.start;

    document.addEventListener('mousemove', this.drag);
    document.addEventListener('touchmove', this.touchMove);

    this.box.style.top = this.start.y + 'px';
    this.box.style.left = this.start.x + 'px';
    this.box.style.zIndex = '2';

    this.$el.prepend(this.box);

    this.intersection();
    this.$emit('startDrag');
  }

  drag(event: MouseEvent | Touch) {
    if (this.disabled) {
      return;
    }
    this.end = this.getCoordinates(event);
    const dimensions = getDimensions(this.start, this.end);

    if (this.end.x < this.start.x) {
      this.box.style.left = this.end.x + 'px';
    }
    if (this.end.y < this.start.y) {
      this.box.style.top = this.end.y + 'px';
    }
    this.box.style.width = dimensions.width + 'px';
    this.box.style.height = dimensions.height + 'px';

    this.intersection();

    // setTimeout(() => {
    //   debugger;
    // }, 1000);
  }

  endDrag(_event: MouseEvent | TouchEvent) {
    this.start = { x: 0, y: 0 };
    this.end = { x: 0, y: 0 };

    this.box.style.width = '0px';
    this.box.style.height = '0px';

    document.removeEventListener('mousemove', this.drag);
    document.removeEventListener('touchmove', this.touchMove);

    this.box.remove();
    this.$emit('endDrag');
  }

  unmounted() {
    this.$el.removeEventListener('mousedown', this.startDrag);
    this.$el.removeEventListener('touchstart', this.touchStart);
    document.removeEventListener('mouseup', this.endDrag);
    document.removeEventListener('touchend', this.endDrag);
  }
}

export default toNative(CzDragSelect);
</script>

<style lang="scss"></style>
