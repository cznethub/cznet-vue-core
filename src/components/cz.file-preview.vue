<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    width="900"
    max-width="95vw"
    scrollable
  >
    <v-card v-if="item" class="cz-file-preview-card">
      <div class="cz-preview-header pa-4">
        <div class="d-flex align-center gap-2">
          <v-icon class="mr-2">{{ activeRenderer?.icon || 'mdi-file-outline' }}</v-icon>
          <div class="text-body-1 font-weight-medium text-truncate">{{ item.name }}</div>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="$emit('update:modelValue', false)"
          ></v-btn>
        </div>

        <!-- Metadata strip — shown for every renderer (text/markdown/image/pdf
             AND the fallback). Anything missing is silently skipped, so files
             without all fields still render cleanly. -->
        <div class="cz-preview-meta-strip d-flex flex-wrap align-center mt-2">
          <span v-if="prettyExtension" class="meta-chip">
            <v-icon size="14" class="mr-1">mdi-shape-outline</v-icon>
            {{ prettyExtension }}
          </span>
          <span v-if="(item as any).uploadedSize != null" class="meta-chip">
            <v-icon size="14" class="mr-1">mdi-weight</v-icon>
            {{ prettyBytes((item as any).uploadedSize) }}
          </span>
          <span v-if="(item as any).path" class="meta-chip meta-chip-path" :title="(item as any).path">
            <v-icon size="14" class="mr-1">mdi-folder-outline</v-icon>
            {{ (item as any).path }}
          </span>
          <span v-if="(item as any).lastModified" class="meta-chip">
            <v-icon size="14" class="mr-1">mdi-calendar-clock-outline</v-icon>
            {{ formatDate((item as any).lastModified) }}
          </span>
        </div>
      </div>

      <v-divider />

      <v-card-text class="pa-0">
        <div v-if="isLoading" class="d-flex flex-column align-center justify-center py-12">
          <v-progress-circular indeterminate color="primary" size="40" />
          <div class="mt-3 text-body-2 text-medium-emphasis">Loading preview…</div>
        </div>

        <v-alert
          v-else-if="errorMessage"
          type="error"
          variant="tonal"
          class="ma-4"
        >
          {{ errorMessage }}
        </v-alert>

        <component
          v-else-if="activeRenderer"
          :is="activeRenderer.component"
          :item="item"
          :content="content"
          :url="objectUrl"
        />

        <!-- Fallback details panel -->
        <div v-else class="pa-6">
          <div class="profile-section-label mb-3" style="font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(0,0,0,0.55);">
            File details
          </div>
          <v-table density="compact" class="cz-detail-table">
            <tbody>
              <tr>
                <th class="text-left text-medium-emphasis" style="width: 130px">Name</th>
                <td>{{ item.name }}</td>
              </tr>
              <tr v-if="prettyExtension">
                <th class="text-left text-medium-emphasis">Type</th>
                <td>{{ prettyExtension }}</td>
              </tr>
              <tr v-if="(item as any).uploadedSize != null">
                <th class="text-left text-medium-emphasis">Size</th>
                <td>{{ prettyBytes((item as any).uploadedSize) }}</td>
              </tr>
              <tr v-if="(item as any).path">
                <th class="text-left text-medium-emphasis">Path</th>
                <td class="text-truncate" style="max-width: 500px">
                  {{ (item as any).path }}
                </td>
              </tr>
              <tr v-if="(item as any).contentKey">
                <th class="text-left text-medium-emphasis">Object key</th>
                <td class="text-truncate" style="max-width: 500px">
                  {{ (item as any).contentKey }}
                </td>
              </tr>
            </tbody>
          </v-table>
          <div class="mt-4 text-body-2 text-medium-emphasis">
            No preview available for this file type. Download the file to view
            its contents.
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, toNative, Prop, Watch } from 'vue-facing-decorator';
import { defineComponent, h, markRaw } from 'vue';
import {
  VDialog,
  VCard,
  VCardTitle,
  VCardText,
  VDivider,
  VBtn,
  VIcon,
  VSpacer,
  VAlert,
  VProgressCircular,
  VTable,
} from 'vuetify/components';
import prettyBytes from 'pretty-bytes';
import markdownit from 'markdown-it';
import { IFile, IFolder } from '@/types';

/**
 * Shape of a renderer plugged into the file-preview registry.
 * `match` decides whether this renderer applies (by extension / mime / item shape).
 * `loader` describes how the dialog should fetch + hand off content: `text`
 * (passed as a string), `url` (object URL from a Blob), or `details-only`
 * (no content fetch — used by the fallback panel).
 * `component` is the Vue component instance that renders the content. It
 * receives `item`, `content` (string), and `url` (object URL) as props.
 */
export interface PreviewRenderer {
  name: string;
  icon?: string;
  match: (item: IFile | IFolder) => boolean;
  loader: 'text' | 'url' | 'details-only';
  component: any;
}

const lower = (s: string) => (s || '').toLowerCase();
const extOf = (item: IFile | IFolder): string => {
  const name = (item as any)?.name || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? lower(name.slice(dot + 1)) : '';
};

// Lazy singleton — instantiating markdownit is cheap but reusing it avoids
// re-parsing plugin config per preview.
let _md: any = null;
const getMd = () => {
  if (!_md) {
    _md = markdownit({
      linkify: true,
      typographer: true,
      breaks: true,
      html: true,
    });
  }
  return _md;
};

const MarkdownRenderer = markRaw(
  defineComponent({
    props: { content: { type: String, default: '' } },
    setup(props) {
      return () =>
        h('div', {
          class: 'cz-preview-markdown markdown-body pa-6',
          innerHTML: getMd().render(props.content || ''),
        });
    },
  }),
);

const TextRenderer = markRaw(
  defineComponent({
    props: { content: { type: String, default: '' } },
    setup(props) {
      return () =>
        h(
          'pre',
          {
            class: 'cz-preview-text pa-6',
            style:
              'white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.8125rem; margin: 0; max-height: 70vh; overflow: auto;',
          },
          props.content,
        );
    },
  }),
);

const ImageRenderer = markRaw(
  defineComponent({
    props: { url: { type: String, default: '' }, item: { type: Object, required: true } },
    setup(props) {
      return () =>
        h(
          'div',
          {
            class: 'd-flex justify-center align-center',
            style: 'background: #f6f6f6; padding: 16px; min-height: 40vh;',
          },
          h('img', {
            src: props.url,
            alt: props.item?.name || '',
            style: 'max-width: 100%; max-height: 70vh; object-fit: contain;',
          }),
        );
    },
  }),
);

const PdfRenderer = markRaw(
  defineComponent({
    props: { url: { type: String, default: '' } },
    setup(props) {
      return () =>
        h('iframe', {
          src: props.url,
          style: 'width: 100%; height: 70vh; border: 0;',
        });
    },
  }),
);

export const defaultRenderers: PreviewRenderer[] = [
  {
    name: 'markdown',
    icon: 'mdi-language-markdown',
    match: (i) => ['md', 'markdown', 'mdown'].includes(extOf(i)),
    loader: 'text',
    component: MarkdownRenderer,
  },
  {
    name: 'text',
    icon: 'mdi-file-document-outline',
    match: (i) =>
      [
        'txt', 'log', 'csv', 'tsv', 'json', 'yaml', 'yml', 'xml',
        'js', 'ts', 'py', 'r', 'sql', 'sh', 'css', 'scss', 'html',
      ].includes(extOf(i)),
    loader: 'text',
    component: TextRenderer,
  },
  {
    name: 'image',
    icon: 'mdi-image-outline',
    match: (i) => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(extOf(i)),
    loader: 'url',
    component: ImageRenderer,
  },
  {
    name: 'pdf',
    icon: 'mdi-file-pdf-box',
    match: (i) => extOf(i) === 'pdf',
    loader: 'url',
    component: PdfRenderer,
  },
];

@Component({
  name: 'cz-file-preview',
  components: {
    VDialog,
    VCard,
    VCardTitle,
    VCardText,
    VDivider,
    VBtn,
    VIcon,
    VSpacer,
    VAlert,
    VProgressCircular,
    VTable,
  },
  emits: ['update:modelValue'],
})
class CzFilePreview extends Vue {
  @Prop({ type: Boolean, default: false }) modelValue!: boolean;
  @Prop({ type: Object, default: null }) item!: IFile | IFolder | null;
  /**
   * Consumer-supplied fetcher. Receives the item to preview and returns a
   * `Blob` (preferred — works for both text and binary renderers) or a string
   * (treated as already-decoded text). Library owns the rest: blob URL
   * creation, text decoding, error handling, and cleanup.
   */
  @Prop({ type: Function, default: null }) loadFileContent!:
    | ((item: IFile | IFolder) => Promise<Blob | string>)
    | null;
  /**
   * Extra renderers, appended after the built-ins. The first matching renderer
   * wins, so the extension point lets consumers OVERRIDE built-ins (for a
   * fancier markdown renderer, etc.) by listing their renderer first via a
   * full custom array, OR add new format support by appending.
   */
  @Prop({ type: Array, default: () => [] }) extraRenderers!: PreviewRenderer[];

  isLoading = false;
  errorMessage = '';
  content = '';
  objectUrl = '';

  get renderers(): PreviewRenderer[] {
    return [...this.extraRenderers, ...defaultRenderers];
  }

  get activeRenderer(): PreviewRenderer | null {
    if (!this.item) return null;
    return this.renderers.find((r) => r.match(this.item!)) || null;
  }

  get prettyExtension(): string {
    if (!this.item) return '';
    const ext = extOf(this.item);
    return ext ? ext.toUpperCase() : '';
  }

  prettyBytes = prettyBytes;

  formatDate(value: any): string {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  @Watch('modelValue')
  @Watch('item')
  onItemChange() {
    this.resetState();
    if (this.modelValue && this.item) {
      this.loadContent();
    }
  }

  resetState() {
    this.errorMessage = '';
    this.content = '';
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = '';
    }
  }

  async loadContent() {
    const renderer = this.activeRenderer;
    if (!renderer) return; // details-only fallback, nothing to fetch
    if (renderer.loader === 'details-only') return;
    if (!this.loadFileContent) {
      this.errorMessage =
        'Preview is unavailable: this file explorer was not configured with a loader.';
      return;
    }

    this.isLoading = true;
    try {
      const result = await this.loadFileContent(this.item!);
      if (typeof result === 'string') {
        this.content = result;
      } else if (renderer.loader === 'text') {
        this.content = await result.text();
      } else {
        this.objectUrl = URL.createObjectURL(result);
      }
    } catch (e: any) {
      this.errorMessage = e?.message || 'Failed to load file preview.';
    } finally {
      this.isLoading = false;
    }
  }

  beforeUnmount() {
    this.resetState();
  }
}

export default toNative(CzFilePreview);
</script>

<style lang="scss" scoped>
.cz-file-preview-card {
  border-radius: 12px !important;
}

.cz-preview-header {
  background: #fafafa;
}

.cz-preview-meta-strip {
  gap: 0.5rem 1rem;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.meta-chip-path {
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cz-detail-table :deep(th),
.cz-detail-table :deep(td) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
}

// markdown-body styles in case the consumer hasn't loaded github-markdown-css.
// We don't want to ship the full stylesheet from here, but a minimal set keeps
// the preview readable out of the box.
.cz-preview-markdown {
  max-height: 70vh;
  overflow: auto;
  line-height: 1.55;
}
.cz-preview-markdown :deep(h1),
.cz-preview-markdown :deep(h2),
.cz-preview-markdown :deep(h3) {
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  font-weight: 600;
}
.cz-preview-markdown :deep(pre) {
  background: #f6f8fa;
  padding: 0.75rem;
  border-radius: 6px;
  overflow: auto;
}
.cz-preview-markdown :deep(code) {
  background: rgba(175, 184, 193, 0.2);
  padding: 0.15em 0.35em;
  border-radius: 3px;
  font-size: 0.875em;
}
.cz-preview-markdown :deep(a) {
  color: rgb(var(--v-theme-primary));
}
.cz-preview-markdown :deep(blockquote) {
  border-left: 3px solid #ddd;
  margin: 0.5em 0;
  padding: 0 1em;
  color: rgba(0, 0, 0, 0.6);
}
</style>
