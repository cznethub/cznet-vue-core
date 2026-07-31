<template>
  <div v-if="control.visible" v-bind="vuetifyProps('v-container')">
    <v-container>
      <v-row>
        <v-col sm="12" md="5">
          <v-row
            v-for="(element, index) in elements"
            :data-id="`vertical-${index}`"
            :key="`${control.path}-${index}`"
            no-gutters
            v-bind="vuetifyProps(`v-row[${index}]`)"
          >
            <v-col cols="12" :class="styles.verticalLayout.item">
              <dispatch-renderer
                :schema="control.schema"
                :uischema="element"
                :path="control.path"
                :enabled="control.enabled"
                :renderers="control.renderers"
                :cells="control.cells"
              />
            </v-col>
          </v-row>
        </v-col>
        <v-col sm="12" md="7">
          <div ref="mapEl" class="map-container elevation-2"></div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { ControlElement } from '@jsonforms/core';
import { defineComponent } from 'vue';
import {
  DispatchRenderer,
  rendererProps,
  RendererProps,
  useJsonFormsControlWithDetail,
} from '@jsonforms/vue';
import { useVuetifyControl } from '@/renderers/util/composition';
import { VContainer, VRow, VCol } from 'vuetify/components';
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
    VContainer,
    VRow,
    VCol,
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
      drawMode: false,
      isEventFromMap: false,
      initialized: false,
      changeTimeout: 0,
      ...useVuetifyControl(useJsonFormsControlWithDetail(props)),
    };
  },
  mounted() {
    this.initMap();
    if (this.hasData) {
      this.loadDrawing();
    }
  },
  watch: {
    // Redraw when the value changes from the form (not from a map edit, which
    // already reflects on the map — the flag breaks that feedback loop).
    'control.data': function () {
      if (this.isEventFromMap) {
        this.isEventFromMap = false;
      } else if (this.initialized) {
        this.loadDrawing();
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
      if (bounds) {
        this.map?.fitBounds(bounds, {
          maxZoom: this.mapType === 'point' ? pointZoom : maxZoom,
        });
      }
    },
    debouncedChange() {
      window.clearTimeout(this.changeTimeout);
      this.changeTimeout = window.setTimeout(() => {
        this.handleChange(this.control.path, this.control.data);
      }, 150);
    },

    // ---- load from data ----
    loadDrawing() {
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
          this.fit(this.drawnLayer as L.FeatureGroup);
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
      this.control.data[this.inputFields.north] = +latlng.lat.toFixed(4);
      this.control.data[this.inputFields.east] = +latlng.lng.toFixed(4);
      this.isEventFromMap = true;
      this.handleChange(this.control.path, this.control.data);
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
      if (this.isBoxSchemaOrgFormat) {
        this.control.data[this.inputFields.box] =
          `${f(ne.lat)} ${f(ne.lng)} ${f(sw.lat)} ${f(sw.lng)}`;
      } else {
        this.control.data[this.inputFields.northlimit] = f(ne.lat);
        this.control.data[this.inputFields.eastlimit] = f(ne.lng);
        this.control.data[this.inputFields.southlimit] = f(sw.lat);
        this.control.data[this.inputFields.westlimit] = f(sw.lng);
      }
      this.isEventFromMap = true;
      this.debouncedChange();
    },
    addBoxDrawControl() {
      const self = this;
      const DrawControl = L.Control.extend({
        onAdd() {
          const btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
          btn.style.cssText =
            'width:30px;height:30px;line-height:30px;text-align:center;cursor:pointer;background:#fff;font-size:18px;';
          btn.title = 'Draw a bounding box';
          btn.innerHTML = '▭';
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
      btn.style.background = this.drawMode ? '#e3f2fd' : '#fff';
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
      if (this.drawBtn) {
        this.drawBtn.style.background = '#fff';
      }
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
.map-container {
  width: 100%;
  min-height: 400px;
  height: 100%;
  border: 1px solid #ffffff;
  border-radius: 0.5rem;
}
</style>
