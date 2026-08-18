<template>
  <div v-if="control.visible" class="map-layout" v-bind="vuetifyProps('v-container')">
   <div class="map-layout__grid">
    <!-- Map first in source order: it leads when the panes stack. -->
    <div class="map-layout__map">
      <div ref="mapEl" class="map-container"></div>
      <div v-if="isEditable" class="map-layout__hint text-caption text-medium-emphasis">
        {{ hint }}
      </div>
    </div>

    <div class="map-layout__fields">
      <!-- The schema stores the box as one "north east south west" string;
           these four inputs parse it on read and re-join it on write. -->
      <div v-if="isBoxSchemaOrgFormat" class="bbox-grid">
        <v-text-field
          v-for="field in bboxFields"
          :key="field.key"
          :class="`bbox-grid__${field.key}`"
          :label="field.label"
          :model-value="boxFields[field.key]"
          :error-messages="bboxErrors[field.key]"
          :placeholder="field.placeholder"
          :disabled="!isEditable"
          type="number"
          suffix="°"
          density="compact"
          variant="outlined"
          hide-details="auto"
          @update:model-value="onBoxFieldInput(field.key, $event)"
        />
      </div>

      <div
        v-for="(element, index) in elements"
        :data-id="`vertical-${index}`"
        :key="`${control.path}-${index}`"
        :class="styles.verticalLayout.item"
      >
        <dispatch-renderer
          :schema="control.schema"
          :uischema="element"
          :path="control.path"
          :enabled="control.enabled"
          :renderers="control.renderers"
          :cells="control.cells"
        />
      </div>
    </div>
   </div>
  </div>
</template>

<script lang="ts">
import { ControlElement } from '@jsonforms/core';
import { defineComponent, ref } from 'vue';
import {
  DispatchRenderer,
  rendererProps,
  RendererProps,
  useJsonFormsControlWithDetail,
} from '@jsonforms/vue';
import { useVuetifyControl } from '@/renderers/util/composition';
import { VTextField } from 'vuetify/components';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet's default icon paths break when bundled; point them at the imports.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const pointZoom = 7;
const maxZoom = 18;
// Order matters: it is the order of the segments in the stored box string.
const bboxKeys = ['north', 'east', 'south', 'west'] as const;
type BboxKey = (typeof bboxKeys)[number];
const bboxFields: {
  key: BboxKey;
  label: string;
  placeholder: string;
  limit: number;
}[] = [
  { key: 'north', label: 'North', placeholder: '-90 to 90', limit: 90 },
  { key: 'west', label: 'West', placeholder: '-180 to 180', limit: 180 },
  { key: 'east', label: 'East', placeholder: '-180 to 180', limit: 180 },
  { key: 'south', label: 'South', placeholder: '-90 to 90', limit: 90 },
];
const boxStyle: L.PathOptions = {
  color: '#1976d2',
  weight: 2,
  fillColor: '#1976d2',
  fillOpacity: 0.25,
};

const layoutRenderer = defineComponent({
  name: 'map-layout-renderer',
  components: {
    DispatchRenderer,
    VTextField,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return {
      map: null as L.Map | null,
      drawnLayer: null as L.FeatureGroup | null,
      previewRect: null as L.Rectangle | null,
      boxStart: null as L.LatLng | null,
      drawBtn: null as HTMLElement | null,
      // A ref: the hint text below the map reads it.
      drawMode: ref(false),
      isEventFromMap: false,
      isEventFromBoxFields: false,
      initialized: false,
      changeTimeout: 0,
      resizeObserver: null as ResizeObserver | null,
      // Strings, so a half-typed value ("-", "12.") survives a keystroke.
      boxFields: ref<Record<BboxKey, string>>({
        north: '',
        east: '',
        south: '',
        west: '',
      }),
      bboxFields,
      ...useVuetifyControl(useJsonFormsControlWithDetail(props)),
    };
  },
  mounted() {
    this.initMap();
    this.syncBoxFields();
    if (this.hasData) {
      this.loadDrawing();
    }
    // Leaflet caches the container size at construction. Inside a v-dialog the
    // map mounts mid-transition, so that cached size is stale and clicks map
    // to the wrong lat/lng. Re-measure once the transition settles, and again
    // whenever the container resizes.
    this.$nextTick(() =>
      requestAnimationFrame(() => (this.map as L.Map | undefined)?.invalidateSize())
    );
    const el = this.$refs.mapEl as HTMLElement | undefined;
    if (el && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() =>
        (this.map as L.Map | undefined)?.invalidateSize()
      );
      this.resizeObserver.observe(el);
    }
  },
  unmounted() {
    this.resizeObserver?.disconnect();
  },
  watch: {
    // Redraw when the value changes from the form (not from a map edit, which
    // already reflects on the map — the flag breaks that feedback loop).
    'control.data': function () {
      if (this.isEventFromMap) {
        this.isEventFromMap = false;
      } else if (this.initialized) {
        // A box-field edit redraws the rectangle but must not re-zoom.
        this.loadDrawing(!this.isEventFromBoxFields);
      }
      // Don't write the parsed value back over what the user is typing.
      if (this.isEventFromBoxFields) {
        this.isEventFromBoxFields = false;
      } else {
        this.syncBoxFields();
      }
    },
  },
  computed: {
    elements() {
      // @ts-ignore
      return this.control.uischema.elements;
    },
    mapType(): 'point' | 'box' {
      return this.control.uischema.options?.map.type || 'point';
    },
    isBoxSchemaOrgFormat() {
      return (
        this.mapType === 'box' &&
        this.control.uischema.options?.map.format === 'GeoShape'
      );
    },
    isEditable(): boolean {
      return (
        !this.appliedOptions.isViewMode &&
        !this.appliedOptions.isReadOnly &&
        !this.appliedOptions.isDisabled
      );
    },
    inputFields(): { [key: string]: string } {
      const options = this.control.uischema.options?.map;
      return this.mapType === 'point'
        ? { east: options.east, north: options.north }
        : this.isBoxSchemaOrgFormat
          ? { box: options.box }
          : {
              northlimit: options.northlimit,
              eastlimit: options.eastlimit,
              southlimit: options.southlimit,
              westlimit: options.westlimit,
            };
    },
    hint(): string {
      if (this.mapType === 'point') {
        return 'Click the map to place a point, or drag the marker.';
      }
      return this.drawMode
        ? 'Drag on the map to draw the box.'
        : 'Use the box tool on the map, or type the extents below.';
    },
    bboxErrors(): Record<BboxKey, string[]> {
      const errors = { north: [], east: [], south: [], west: [] } as Record<
        BboxKey,
        string[]
      >;
      for (const field of bboxFields) {
        const raw = this.boxFields[field.key].trim();
        if (!raw) {
          continue;
        }
        const value = Number(raw);
        if (Number.isNaN(value)) {
          errors[field.key].push('Must be a number');
        } else if (Math.abs(value) > field.limit) {
          errors[field.key].push(`Must be between -${field.limit} and ${field.limit}`);
        }
      }
      const north = Number(this.boxFields.north);
      const south = Number(this.boxFields.south);
      if (!errors.north.length && !errors.south.length && north < south) {
        errors.north.push('Must be greater than or equal to South');
      }
      return errors;
    },
    hasData(): boolean {
      if (!this.control.data) {
        return false;
      }
      if (this.mapType === 'point') {
        return (
          !isNaN(this.control.data[this.inputFields.north]) &&
          !isNaN(this.control.data[this.inputFields.east])
        );
      }
      if (this.isBoxSchemaOrgFormat) {
        const boxStr = this.control.data[this.inputFields.box];
        if (!boxStr) {
          return false;
        }
        const segments: string[] = boxStr.trim().split(' ');
        return segments.length === 4 && segments.some(s => !isNaN(+s));
      }
      return (
        !isNaN(this.control.data[this.inputFields.northlimit]) &&
        !isNaN(this.control.data[this.inputFields.eastlimit]) &&
        !isNaN(this.control.data[this.inputFields.southlimit]) &&
        !isNaN(this.control.data[this.inputFields.westlimit])
      );
    },
  },
  methods: {
    initMap() {
      const el = this.$refs.mapEl as HTMLElement;
      if (!el) {
        return;
      }
      const map = L.map(el, { scrollWheelZoom: true }).setView(
        [39.8097343, -98.5556199],
        4
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom,
      }).addTo(map);
      map.attributionControl.setPrefix(
        '<a href="https://leafletjs.com/" target="_blank">Leaflet</a>'
      );
      this.drawnLayer = L.featureGroup().addTo(map);
      this.map = map;

      if (this.isEditable) {
        if (this.mapType === 'point') {
          map.on('click', (e: L.LeafletMouseEvent) => {
            this.drawMarker(e.latlng);
            this.updatePointData(e.latlng);
          });
        } else {
          this.addBoxDrawControl();
        }
      }
      this.initialized = true;
    },

    // ---- shared ----
    clearShapes() {
      this.drawnLayer?.clearLayers();
    },
    fit(layer: L.Layer & { getBounds?: () => L.LatLngBounds }) {
      const bounds = layer.getBounds?.();
      const map = this.map;
      if (!bounds || !map) {
        return;
      }
      if (this.mapType === 'point') {
        map.fitBounds(bounds, { maxZoom: pointZoom });
        return;
      }
      // A level back from the tightest fit, so the box has breathing room.
      const zoom = Math.max(map.getMinZoom(), map.getBoundsZoom(bounds) - 1);
      map.fitBounds(bounds, { maxZoom: Math.min(zoom, maxZoom) });
    },
    debouncedChange(next: Record<string, any>) {
      window.clearTimeout(this.changeTimeout);
      this.changeTimeout = window.setTimeout(() => {
        this.isEventFromBoxFields = true;
        this.handleChange(this.control.path, next);
      }, 300);
    },

    // ---- bounding box fields ----
    syncBoxFields() {
      if (!this.isBoxSchemaOrgFormat) {
        return;
      }
      const raw: string = this.control.data?.[this.inputFields.box] ?? '';
      const segments = raw.trim().split(/\s+/);
      bboxKeys.forEach((key, index) => {
        this.boxFields[key] = segments[index] ?? '';
      });
    },
    onBoxFieldInput(key: BboxKey, value: string) {
      this.boxFields[key] = value ?? '';
      const filled = bboxKeys.every(k => this.boxFields[k].trim() !== '');
      const valid = bboxFields.every(f => !this.bboxErrors[f.key].length);
      if (!filled || !valid) {
        return;
      }
      const box = bboxKeys.map(k => Number(this.boxFields[k])).join(' ');
      if (box === this.control.data?.[this.inputFields.box]) {
        return;
      }
      this.debouncedChange({
        ...(this.control.data ?? {}),
        [this.inputFields.box]: box,
      });
    },

    // ---- load from data ----
    loadDrawing(fitToBounds = true) {
      this.clearShapes();
      if (!this.hasData) {
        return;
      }
      if (this.mapType === 'point') {
        const latlng = L.latLng(
          this.control.data[this.inputFields.north],
          this.control.data[this.inputFields.east]
        );
        this.drawMarker(latlng);
        this.fit(this.drawnLayer as L.FeatureGroup);
      } else {
        const b = this.boundsFromData();
        if (b) {
          this.drawRectangle(b);
          if (fitToBounds) {
            this.fit(this.drawnLayer as L.FeatureGroup);
          }
        }
      }
    },
    boundsFromData(): L.LatLngBounds | null {
      let n, e, s, w;
      if (this.isBoxSchemaOrgFormat) {
        const seg = this.control.data[this.inputFields.box]
          .trim()
          .split(' ')
          .map((x: string) => +x);
        [n, e, s, w] = seg;
      } else {
        n = this.control.data[this.inputFields.northlimit];
        e = this.control.data[this.inputFields.eastlimit];
        s = this.control.data[this.inputFields.southlimit];
        w = this.control.data[this.inputFields.westlimit];
      }
      if ([n, e, s, w].some(v => isNaN(v))) {
        return null;
      }
      return L.latLngBounds([s, w], [n, e]);
    },

    // ---- point ----
    drawMarker(latlng: L.LatLng) {
      this.clearShapes();
      const marker = L.marker(latlng, { draggable: this.isEditable }).addTo(
        this.drawnLayer as L.FeatureGroup
      );
      if (this.isEditable) {
        marker.on('dragend', () => this.updatePointData(marker.getLatLng()));
      }
    },
    updatePointData(latlng: L.LatLng) {
      // Build a new object rather than mutating in place: control.data is
      // undefined until the combinator branch is materialised.
      const next = {
        ...(this.control.data ?? {}),
        [this.inputFields.north]: +latlng.lat.toFixed(4),
        [this.inputFields.east]: +latlng.lng.toFixed(4),
      };
      this.isEventFromMap = true;
      this.handleChange(this.control.path, next);
    },

    // ---- box ----
    drawRectangle(bounds: L.LatLngBounds) {
      this.clearShapes();
      L.rectangle(bounds, boxStyle).addTo(this.drawnLayer as L.FeatureGroup);
    },
    updateBoxData(bounds: L.LatLngBounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const f = (n: number) => +n.toFixed(4);
      const base = { ...(this.control.data ?? {}) };
      if (this.isBoxSchemaOrgFormat) {
        base[this.inputFields.box] =
          `${f(ne.lat)} ${f(ne.lng)} ${f(sw.lat)} ${f(sw.lng)}`;
      } else {
        base[this.inputFields.northlimit] = f(ne.lat);
        base[this.inputFields.eastlimit] = f(ne.lng);
        base[this.inputFields.southlimit] = f(sw.lat);
        base[this.inputFields.westlimit] = f(sw.lng);
      }
      this.isEventFromMap = true;
      this.handleChange(this.control.path, base);
    },
    addBoxDrawControl() {
      const self = this;
      const DrawControl = L.Control.extend({
        onAdd() {
          const btn = L.DomUtil.create(
            'a',
            'leaflet-bar leaflet-control map-draw-control'
          );
          btn.href = '#';
          btn.title = 'Draw a bounding box';
          btn.setAttribute('role', 'button');
          btn.innerHTML =
            '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
            '<path fill="currentColor" d="M4 6h16v12H4z" fill-opacity=".18"/>' +
            '<path fill="none" stroke="currentColor" stroke-width="2" d="M4 6h16v12H4z"/>' +
            '</svg>';
          L.DomEvent.on(btn, 'click', e => {
            L.DomEvent.stop(e);
            self.toggleDrawMode(btn);
          });
          return btn;
        },
      });
      this.map?.addControl(new DrawControl({ position: 'topleft' }));
    },
    toggleDrawMode(btn: HTMLElement) {
      this.drawMode = !this.drawMode;
      btn.classList.toggle('map-draw-control--active', this.drawMode);
      if (!this.map) {
        return;
      }
      if (this.drawMode) {
        this.map.dragging.disable();
        this.map.getContainer().style.cursor = 'crosshair';
        this.map.on('mousedown', this.onBoxStart, this);
        this.drawBtn = btn;
      } else {
        this.exitDrawMode();
      }
    },
    exitDrawMode() {
      this.drawMode = false;
      this.drawBtn?.classList.remove('map-draw-control--active');
      if (!this.map) {
        return;
      }
      this.map.dragging.enable();
      this.map.getContainer().style.cursor = '';
      this.map.off('mousedown', this.onBoxStart, this);
      this.map.off('mousemove', this.onBoxMove, this);
      this.map.off('mouseup', this.onBoxEnd, this);
    },
    onBoxStart(e: L.LeafletMouseEvent) {
      this.boxStart = e.latlng;
      this.map?.on('mousemove', this.onBoxMove, this);
      this.map?.on('mouseup', this.onBoxEnd, this);
    },
    onBoxMove(e: L.LeafletMouseEvent) {
      if (!this.boxStart || !this.map) {
        return;
      }
      const bounds = L.latLngBounds(this.boxStart, e.latlng);
      if (this.previewRect) {
        this.previewRect.setBounds(bounds);
      } else {
        this.previewRect = L.rectangle(bounds, boxStyle).addTo(this.map);
      }
    },
    onBoxEnd(e: L.LeafletMouseEvent) {
      if (this.previewRect && this.map) {
        this.map.removeLayer(this.previewRect);
        this.previewRect = null;
      }
      if (this.boxStart) {
        const bounds = L.latLngBounds(this.boxStart, e.latlng);
        this.drawRectangle(bounds);
        this.updateBoxData(bounds);
        this.boxStart = null;
      }
      this.exitDrawMode();
    },
  },
});

export default layoutRenderer;
</script>

<style lang="scss" scoped>
.map-layout {
  container-type: inline-size;

  &__grid {
    display: grid;
    gap: 1rem;
    grid-template-areas:
      'map'
      'fields';
  }

  &__map {
    grid-area: map;
    min-width: 0;
  }

  &__fields {
    grid-area: fields;
    min-width: 0;
  }

  &__hint {
    display: block;
    margin-top: 0.375rem;
  }
}

@container (min-width: 40rem) {
  .map-layout__grid {
    grid-template-columns: minmax(16rem, 20rem) 1fr;
    grid-template-areas: 'fields map';
    gap: 1.5rem;
  }
}

.bbox-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    'north north'
    'west east'
    'south south';
  gap: 0.75rem;
  align-items: start;

  &__north {
    grid-area: north;
  }
  &__west {
    grid-area: west;
  }
  &__east {
    grid-area: east;
  }
  &__south {
    grid-area: south;
  }
}

.map-container {
  width: 100%;
  height: 14rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

@container (min-width: 40rem) {
  .map-container {
    height: 18rem;
  }
}

:deep(.map-draw-control) {
  display: flex !important;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.7);
}

:deep(.map-draw-control--active) {
  background: #e3f2fd;
  color: #1976d2;
}
</style>
