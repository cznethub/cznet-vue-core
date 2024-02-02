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
import { Component, Watch, Prop, Vue } from "vue-property-decorator";
const getDimensions = (p1, p2) => ({
  width: Math.abs(p1.x - p2.x),
  height: Math.abs(p1.y - p2.y),
});
const collisionCheck = (node1, node2) =>
  node1.left < node2.left + node2.width &&
  node1.left + node1.width > node2.left &&
  node1.top < node2.top + node2.height &&
  node1.top + node1.height > node2.top;

@Component({
  components: {},
  name: "DragSelect",
})
export default class CzFileExplorer extends Vue {
  @Prop({ required: true }) attribute!: string;

  intersected: any[] = [];

  @Watch("intersected")
  onIntersected(val) {
    this.$emit("change", val);
  }

  clearSelected() {
    this.intersected = [];
  }

  mounted() {
    const container = this.$el;
    const self = this;

    let containerRect = container.getBoundingClientRect();

    const getCoords = (e) => ({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    });

    let children;

    const box = document.createElement("div");
    box.setAttribute("data-drag-box-component", "");
    box.style.position = "absolute";
    box.classList.add("primary", "lighten-4");
    box.style.opacity = "0.4";
    box.style.borderRadius = "2px";

    let start = { x: 0, y: 0 };
    let end = { x: 0, y: 0 };

    function intersection() {
      const rect = box.getBoundingClientRect();
      const intersected = children
        .filter((c) => collisionCheck(rect, c.getBoundingClientRect()))
        .map((c) => c.getAttribute(self.attribute));

      if (
        intersected.length !== self.intersected.length ||
        intersected.some((i) => !self.intersected.includes(i))
      ) {
        self.intersected = intersected;
      }
    }

    function touchStart(e) {
      e.preventDefault();
      startDrag(e.touches[0]);
    }
    function touchMove(e) {
      e.preventDefault();
      drag(e.touches[0]);
    }

    function startDrag(e) {
      containerRect = container.getBoundingClientRect();
      children = Array.from(container.querySelectorAll(`[${self.attribute}]`));
      start = getCoords(e);
      end = start;
      document.addEventListener("mousemove", drag);
      document.addEventListener("touchmove", touchMove);

      box.style.top = start.y + "px";
      box.style.left = start.x + "px";

      container.prepend(box);
      intersection();
      self.$emit("startDrag");
    }

    function drag(e) {
      end = getCoords(e);
      const dimensions = getDimensions(start, end);

      if (end.x < start.x) {
        box.style.left = end.x + "px";
      }
      if (end.y < start.y) {
        box.style.top = end.y + "px";
      }
      box.style.width = dimensions.width + "px";
      box.style.height = dimensions.height + "px";

      intersection();
    }

    function endDrag() {
      start = { x: 0, y: 0 };
      end = { x: 0, y: 0 };

      box.style.width = "0px";
      box.style.height = "0px";

      document.removeEventListener("mousemove", drag);
      document.removeEventListener("touchmove", touchMove);
      box.remove();
      self.$emit("endDrag");
    }

    container.addEventListener("mousedown", startDrag);
    container.addEventListener("touchstart", touchStart);

    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);

    this.$once("on:destroy", () => {
      container.removeEventListener("mousedown", startDrag);
      container.removeEventListener("touchstart", touchStart);
      document.removeEventListener("mouseup", endDrag);
      document.removeEventListener("touchend", endDrag);
    });
  }
}
</script>

<style lang="scss"></style>
