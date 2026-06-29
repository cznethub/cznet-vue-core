<template>
  <div
    :class="{
      'text-medium-emphasis': item.isCutting || item.isDisabled,
      'bg-red-lighten-5': isInvalid,
    }"
    class="item-row cursor-pointer"
  >
    <v-icon
      v-if="isFolder(item)"
      class="item-icon"
      :disabled="item.isDisabled"
      :color="item.isCutting ? 'grey' : folderColor"
    >
      {{ isOpen ? 'mdi-folder-open' : 'mdi-folder' }}
    </v-icon>

    <v-icon
      v-else
      class="item-icon"
      :disabled="item.isDisabled"
      :color="item.isCutting || item.isDisabled ? 'grey' : fileColor"
    >
      {{ fileIcons[item.name.split('.').pop() || ''] || fileIcons['default'] }}
    </v-icon>

    <div class="item-name" :title="item.name">
      {{ item.name }}
    </div>

    <div class="item-meta">
      <span
        v-if="(item as IFile).file"
        class="text-caption text-medium-emphasis"
      >
        {{ prettyBytes((item as IFile).file?.size || 0) }}
      </span>

      <span
        v-else-if="(item as IFile).uploadedSize"
        class="text-caption text-medium-emphasis"
      >
        {{ prettyBytes((item as IFile).uploadedSize || 0) }}
      </span>

      <template v-if="!item.isRenaming">
        <v-icon
          v-if="item.isUploaded"
          class="text-disabled"
          title="uploaded"
          size="small"
        >
          mdi-cloud-check
        </v-icon>

        <slot name="warnings" />

        <v-btn
          v-if="canRetryUpload"
          color="info"
          @click="$emit('retry-upload')"
          :disabled="item.isDisabled"
          size="small"
          variant="outlined"
          depressed
        >
          <v-icon left class="mr-1">mdi-cloud-upload</v-icon>
          Retry
        </v-btn>

        <v-icon
          v-if="item.isDisabled"
          color="primary-lighten-2"
          icon="fa:fas fa-circle-notch fa-spin"
          size="small"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, toNative, Prop } from 'vue-facing-decorator';
import { IFolder, IFile } from '@/types';
import { FILE_ICONS } from '@/constants';
import { VRow, VCol, VIcon } from 'vuetify/components';
import prettyBytes from 'pretty-bytes';

@Component({
  name: 'cz-file-explorer-item',
  components: {
    VRow,
    VCol,
    VIcon,
  },
  directives: {},
  emits: ['retry-upload'],
})
class CzFileExplorerItem extends Vue {
  @Prop({ required: true }) item!: IFile | IFolder;
  @Prop({ default: 'primary-lighten-2' }) folderColor!: string;
  @Prop({ default: 'primary-lighten-3' }) fileColor!: string;
  @Prop() isOpen!: boolean;
  @Prop() canRetryUpload!: boolean;
  @Prop() isInvalid!: boolean;
  prettyBytes = prettyBytes;

  fileIcons = FILE_ICONS;

  isFolder(item: IFile | IFolder) {
    return item.hasOwnProperty('children');
  }
}

export default toNative(CzFileExplorerItem);
</script>

<style lang="scss" scoped>
// 3-column grid: leading icon | wrapping name | trailing meta cluster.
// Using grid (instead of the previous flex-wrap) keeps every row's three
// "lanes" aligned and prevents meta chips like the cloud-check from breaking
// off onto their own line, orphaned to the left, when the name wraps.
.item-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 0.5rem;
  padding: 0.375rem 0;
}

.item-icon {
  margin-top: 0.125rem; // optical alignment with the first line of text
}

.item-name {
  min-width: 0;
  // The previous styles clipped names with text-overflow: ellipsis. Let long
  // names wrap to multiple lines instead; break at any character so very
  // long unbroken strings (e.g. hash-based filenames) still fit.
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.35;
  padding-block: 0.0625rem; // visually center against the icon on one-line names
}

.item-meta {
  // All trailing metadata (size, upload-check, warnings, retry, spinner)
  // lives in one wrapper so it stays right-aligned as a cluster instead of
  // wrapping piece by piece into the name's column when names are long.
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem 0.625rem;
  padding-top: 0.125rem; // align with first line of text
  white-space: nowrap;
}
</style>
